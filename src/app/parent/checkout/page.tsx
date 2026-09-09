"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CreditCard,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Clock,
  AlertTriangle,
  ArrowLeft,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  HelpCircle,
  FileCheck,
} from "lucide-react";
import { formatRupiah, formatDateIndo } from "@/lib/formatters";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

const SCHOOL_ACCOUNTS = [
  {
    bankName: "Bank Central Asia (BCA)",
    accountNumber: "777-123-4567",
    accountHolder: "White Bee School of Life",
    badge: "BCA",
    badgeColor: "bg-blue-600 text-white",
  },
  {
    bankName: "Bank Mandiri",
    accountNumber: "130-00-9876543-2",
    accountHolder: "Yayasan White Bee School",
    badge: "Mandiri",
    badgeColor: "bg-amber-600 text-white",
  },
  {
    bankName: "Bank Rakyat Indonesia (BRI)",
    accountNumber: "0012-01-001234-50-8",
    accountHolder: "White Bee School of Life",
    badge: "BRI",
    badgeColor: "bg-blue-700 text-white",
  },
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const billId = searchParams.get("billId");
  const installmentId = searchParams.get("installmentId");

  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [bankSender, setBankSender] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // Result state
  const [submittedPayment, setSubmittedPayment] = useState<any>(null);

  useEffect(() => {
    if (!billId) {
      router.push("/parent/bills");
      return;
    }

    fetch(`/api/parent/bills/${billId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBill(data.data);
        } else {
          showToast(data.message || "Tagihan tidak ditemukan", "error");
          router.push("/parent/bills");
        }
        setLoading(false);
      })
      .catch(() => {
        showToast("Gagal memuat rincian checkout", "error");
        setLoading(false);
      });
  }, [billId, router]);

  if (loading || !bill) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-sky-400/30 border-t-sky-400 rounded-full animate-spin mx-auto mb-3" />
        Menyiapkan formulir pembayaran...
      </div>
    );
  }

  // Calculate target payment amount & installment info
  let targetAmount = bill.remainingAmount;
  let targetInstallment = null;

  if (installmentId && bill.installments) {
    targetInstallment = bill.installments.find((i: any) => i.id === installmentId);
    if (targetInstallment) targetAmount = targetInstallment.remainingAmount;
  } else if (bill.allowInstallment && bill.installments?.length > 0) {
    const nextUnpaid = bill.installments.find((i: any) => i.remainingAmount > 0);
    if (nextUnpaid) {
      targetInstallment = nextUnpaid;
      targetAmount = nextUnpaid.remainingAmount;
    }
  }

  // Check if there is already a pending payment for this bill/installment
  const existingPendingPayment = bill.payments?.find(
    (p: any) =>
      p.status === "PENDING" &&
      (!targetInstallment || p.installmentId === targetInstallment.id)
  );

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} berhasil disalin!`, "info");
  };

  // Image compressor to ensure fast upload & smooth database storage
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Harap pilih file gambar (JPG, PNG, WEBP)", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("Ukuran file maksimal 10 MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize if width > 1200px to optimize size
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to base64 jpeg
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setProofImage(dataUrl);
        showToast("Bukti transfer berhasil dipilih!", "success");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProofImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bankSender.trim()) {
      showToast("Silakan isi nama bank dan nama pemilik rekening pengirim", "error");
      return;
    }

    if (!proofImage) {
      showToast("Harap unggah foto bukti transfer", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId: bill.id,
          installmentId: targetInstallment?.id || null,
          paymentMethod: "BANK_TRANSFER",
          proofImage,
          bankSender,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedPayment(data.data.payment);
        showToast("Bukti pembayaran berhasil dikirim! Menunggu verifikasi admin.", "success");
      } else {
        showToast(data.message || "Gagal mengunggah bukti pembayaran", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem saat mengirim data", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS / CONFIRMATION SCREEN
  if (submittedPayment) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-lg text-center space-y-5 animate-in fade-in">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3.5 py-1 rounded-full uppercase tracking-wider">
              Menunggu Verifikasi Admin
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              Bukti Pembayaran Berhasil Dikirim!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Terima kasih! Bukti transfer Anda telah masuk ke sistem dan akan segera diverifikasi oleh tim Tata Usaha / Keuangan sekolah.
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2.5">
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Nomor Transaksi:</span>
              <span className="font-mono font-bold text-slate-900">{submittedPayment.paymentNumber}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Tagihan:</span>
              <span className="font-bold text-slate-800 text-right">{bill.title}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Siswa:</span>
              <span className="font-bold text-slate-800">{bill.student?.fullName} ({bill.student?.class?.name})</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Rekening Pengirim:</span>
              <span className="font-bold text-slate-800">{submittedPayment.bankSender}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Nominal Ditransfer:</span>
              <span className="text-base font-black text-sky-700">{formatRupiah(submittedPayment.amount)}</span>
            </div>
          </div>

          {/* Proof Preview */}
          {proofImage && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2">
              <span className="text-[11px] font-bold text-slate-600 block">Bukti Transfer yang Diunggah:</span>
              <img
                src={proofImage}
                alt="Bukti Transfer"
                className="max-h-56 mx-auto rounded-xl object-contain border border-slate-200 shadow-xs"
              />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/parent/payments"
              className="flex-1 py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs text-center shadow-md shadow-sky-600/20 transition"
            >
              Lihat Riwayat Pembayaran
            </Link>
            <Link
              href="/parent/bills"
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs text-center transition"
            >
              Kembali ke Daftar Tagihan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/parent/bills"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Daftar Tagihan
      </Link>

      {/* Notice if already pending */}
      {existingPendingPayment && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-extrabold">Transaksi Sedang Menunggu Verifikasi</div>
            <p className="text-amber-800">
              Anda sebelumnya telah mengunggah bukti transfer untuk tagihan ini (No: <strong>{existingPendingPayment.paymentNumber}</strong>). Tim Tata Usaha sedang memeriksa pembayaran Anda.
            </p>
            <Link
              href="/parent/payments"
              className="inline-block mt-1 font-bold text-amber-900 underline hover:text-amber-700"
            >
              Cek Status di Riwayat Pembayaran &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Bill & Student Summary Card */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] text-sky-700 font-extrabold uppercase bg-sky-50 px-2 py-0.5 rounded-md">
              Rincian Pembayaran
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-1">{bill.title}</h2>
            <p className="text-xs text-slate-500">
              Siswa: <strong>{bill.student?.fullName}</strong> • NIS {bill.student?.nis} • Kelas {bill.student?.class?.name}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Bayar</span>
            <span className="text-xl font-black text-sky-700">{formatRupiah(targetAmount)}</span>
          </div>
        </div>

        {targetInstallment && (
          <div className="flex items-center justify-between text-xs bg-sky-50 text-sky-900 p-3.5 rounded-2xl border border-sky-200">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-sky-600" />
              <span className="font-bold">
                Pembayaran Termin: Cicilan Ke-{targetInstallment.installmentNumber} dari {bill.installments?.length}
              </span>
            </div>
            <span className="font-semibold">
              Jatuh Tempo: {formatDateIndo(targetInstallment.dueDate)}
            </span>
          </div>
        )}
      </div>

      {/* Step 1: School Bank Accounts List */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Transfer ke Rekening Resmi Sekolah</h3>
            <p className="text-xs text-slate-500">Silakan transfer nominal pas ke salah satu rekening bank berikut:</p>
          </div>
        </div>

        <div className="space-y-3">
          {SCHOOL_ACCOUNTS.map((acc, index) => (
            <div
              key={index}
              className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 hover:border-sky-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${acc.badgeColor}`}>
                    {acc.badge}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{acc.bankName}</span>
                </div>
                <div className="font-mono text-base font-black text-slate-900 tracking-wider">
                  {acc.accountNumber}
                </div>
                <div className="text-[11px] text-slate-500">
                  a.n. <strong className="text-slate-700">{acc.accountHolder}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(acc.accountNumber.replace(/-/g, ""), acc.badge)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-sky-50 text-sky-700 font-bold text-xs rounded-xl border border-slate-200 hover:border-sky-200 shadow-2xs transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Salin No. Rekening
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Nominal yang harus ditransfer:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-emerald-900">{formatRupiah(targetAmount)}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(String(targetAmount), "Nominal")}
              className="text-[10px] font-bold bg-white text-emerald-700 px-2 py-1 rounded-md border border-emerald-300 hover:bg-emerald-100"
            >
              Salin
            </button>
          </div>
        </div>
      </div>

      {/* Step 2: Upload Proof Form */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Upload Bukti Transfer & Konfirmasi</h3>
            <p className="text-xs text-slate-500">Unggah foto struk ATM, bukti transfer m-banking, atau internet banking.</p>
          </div>
        </div>

        <form onSubmit={handleSubmitProof} className="space-y-4">
          {/* Bank Sender Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Bank & Nama Pemilik Rekening Pengirim <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={bankSender}
              onChange={(e) => setBankSender(e.target.value)}
              placeholder="Contoh: BCA - Budi Santoso / Mandiri - Siti Rahma"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Sebutkan nama bank dan nama pemilik rekening yang digunakan saat mentransfer.
            </span>
          </div>

          {/* File Upload Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Foto Bukti Transfer (Struk / Screenshot) <span className="text-rose-500">*</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {!proofImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-sky-500 bg-slate-50/70 hover:bg-sky-50/50 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-sky-600">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-sky-700 hover:underline">
                    Klik untuk memilih file foto
                  </span>
                  <span className="text-xs text-slate-500"> atau ambil dari galeri</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Format gambar JPG, PNG, WEBP (Maks 10 MB)
                </p>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    Bukti transfer siap dikirim
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus / Ganti
                  </button>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 max-h-64 flex items-center justify-center">
                  <img
                    src={proofImage}
                    alt="Pratinjau Bukti Transfer"
                    className="max-h-64 object-contain rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Catatan Tambahan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Transfer via m-BCA jam 10:15 WIB"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !proofImage || !bankSender.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl shadow-lg shadow-sky-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm mt-4"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Kirim Bukti Pembayaran ({formatRupiah(targetAmount)})
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Memuat formulir checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
