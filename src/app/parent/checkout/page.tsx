"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CreditCard,
  QrCode,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { formatRupiah, formatDateIndo, getPaymentMethodLabel } from "@/lib/formatters";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const billId = searchParams.get("billId");
  const installmentId = searchParams.get("installmentId");

  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("QRIS");

  // Step state: "SELECT_METHOD" -> "PAYMENT_IN_PROGRESS" -> "SUCCESS"
  const [step, setStep] = useState<"SELECT_METHOD" | "PAYMENT_IN_PROGRESS">("SELECT_METHOD");
  const [transactionData, setTransactionData] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

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
        Menyiapkan pembayaran...
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

  const handleCreatePayment = async () => {
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId: bill.id,
          installmentId: targetInstallment?.id || null,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTransactionData(data.data);
        setStep("PAYMENT_IN_PROGRESS");
        showToast("Instruksi pembayaran berhasil dibuat!", "success");
      } else {
        showToast(data.message || "Gagal membuat transaksi", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem", "error");
    }
  };

  const handleSimulatePayment = async (statusToSimulate: "SUCCESS" | "FAILED" = "SUCCESS") => {
    if (!transactionData?.payment?.id) return;
    setSimulating(true);

    try {
      const res = await fetch("/api/payments/sandbox-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: transactionData.payment.id,
          status: statusToSimulate,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (statusToSimulate === "SUCCESS") {
          showToast("Pembayaran Berhasil Diverifikasi! 🎉", "success");
          router.push(`/parent/receipt/${transactionData.payment.id}`);
        } else {
          showToast("Simulasi: Pembayaran ditandai Gagal.", "warning");
          setStep("SELECT_METHOD");
        }
      } else {
        showToast(data.message || "Simulasi gagal", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setSimulating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Disalin ke clipboard!", "info");
  };

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

      {/* Bill & Student Summary Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] text-sky-700 font-extrabold uppercase bg-sky-50 px-2 py-0.5 rounded-md">
              Rincian Pembayaran
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-1">{bill.title}</h2>
            <p className="text-xs text-slate-500">
              Siswa: <strong>{bill.student?.fullName}</strong> • Kelas {bill.student?.class?.name}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Bayar</span>
            <span className="text-xl font-black text-sky-700">{formatRupiah(targetAmount)}</span>
          </div>
        </div>

        {targetInstallment && (
          <div className="flex items-center justify-between text-xs bg-sky-50 text-sky-900 p-3 rounded-xl border border-sky-200">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-sky-600" />
              <span className="font-bold">
                Membayar: Cicilan Ke-{targetInstallment.installmentNumber} dari{" "}
                {bill.installments?.length}
              </span>
            </div>
            <span className="font-semibold">
              Jatuh Tempo: {formatDateIndo(targetInstallment.dueDate)}
            </span>
          </div>
        )}
      </div>

      {/* STEP 1: Select Payment Method */}
      {step === "SELECT_METHOD" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Pilih Metode Pembayaran</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tersedia pembayaran otomatis via QRIS dan Virtual Account Bank terkemuka.
            </p>
          </div>

          {/* Payment Options Grid */}
          <div className="space-y-2.5">
            {/* QRIS */}
            <label
              className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                paymentMethod === "QRIS"
                  ? "bg-sky-50/80 border-sky-500 ring-2 ring-sky-200"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="pm"
                  value="QRIS"
                  checked={paymentMethod === "QRIS"}
                  onChange={() => setPaymentMethod("QRIS")}
                  className="sr-only"
                />
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-sky-600 shadow-xs">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">QRIS (Semua E-Wallet & M-Banking)</div>
                  <div className="text-[11px] text-slate-500">GoPay, OVO, DANA, ShopeePay, LinkAja, BCA, dll.</div>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                Instan ⚡
              </span>
            </label>

            {/* BCA Virtual Account */}
            <label
              className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                paymentMethod === "VA_BCA"
                  ? "bg-sky-50/80 border-sky-500 ring-2 ring-sky-200"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="pm"
                  value="VA_BCA"
                  checked={paymentMethod === "VA_BCA"}
                  onChange={() => setPaymentMethod("VA_BCA")}
                  className="sr-only"
                />
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-blue-700 shadow-xs">
                  BCA
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">BCA Virtual Account</div>
                  <div className="text-[11px] text-slate-500">Verifikasi otomatis 24 Jam</div>
                </div>
              </div>
            </label>

            {/* Mandiri Virtual Account */}
            <label
              className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                paymentMethod === "VA_MANDIRI"
                  ? "bg-sky-50/80 border-sky-500 ring-2 ring-sky-200"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="pm"
                  value="VA_MANDIRI"
                  checked={paymentMethod === "VA_MANDIRI"}
                  onChange={() => setPaymentMethod("VA_MANDIRI")}
                  className="sr-only"
                />
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-amber-700 shadow-xs">
                  MDR
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Mandiri Virtual Account (Livin')</div>
                  <div className="text-[11px] text-slate-500">Verifikasi otomatis Livin' by Mandiri</div>
                </div>
              </div>
            </label>

            {/* BRI Virtual Account */}
            <label
              className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                paymentMethod === "VA_BRI"
                  ? "bg-sky-50/80 border-sky-500 ring-2 ring-sky-200"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="pm"
                  value="VA_BRI"
                  checked={paymentMethod === "VA_BRI"}
                  onChange={() => setPaymentMethod("VA_BRI")}
                  className="sr-only"
                />
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-blue-600 shadow-xs">
                  BRI
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">BRI Virtual Account (BRIVA)</div>
                  <div className="text-[11px] text-slate-500">Verifikasi otomatis BRImo</div>
                </div>
              </div>
            </label>

            {/* Transfer Manual */}
            <label
              className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                paymentMethod === "BANK_TRANSFER"
                  ? "bg-sky-50/80 border-sky-500 ring-2 ring-sky-200"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="pm"
                  value="BANK_TRANSFER"
                  checked={paymentMethod === "BANK_TRANSFER"}
                  onChange={() => setPaymentMethod("BANK_TRANSFER")}
                  className="sr-only"
                />
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Transfer Bank Rekening Sekolah</div>
                  <div className="text-[11px] text-slate-500">Rekening Yayasan / Sekolah</div>
                </div>
              </div>
            </label>
          </div>

          <button
            onClick={handleCreatePayment}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl shadow-lg shadow-sky-600/30 transition cursor-pointer text-sm"
          >
            Lanjut ke Pembayaran ({formatRupiah(targetAmount)})
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: Payment in Progress (Mock Gateway / QRIS / VA screen) */}
      {step === "PAYMENT_IN_PROGRESS" && transactionData && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-lg space-y-6 animate-in fade-in">
          {/* Header Code */}
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              Menunggu Pembayaran
            </span>
            <div className="text-xs text-slate-500 mt-2">Nomor Transaksi:</div>
            <div className="font-mono font-black text-slate-900 text-lg">
              {transactionData.payment?.paymentNumber}
            </div>
          </div>

          {/* QR Code or VA Box */}
          {transactionData.details?.qrCodeUrl ? (
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                {/* QR Code Image */}
                <img
                  src={transactionData.details.qrCodeUrl}
                  alt="QRIS Code"
                  className="w-56 h-56 object-contain rounded-lg"
                />
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-slate-800">Pindai Kode QRIS di atas</span>
                <p className="text-[11px] text-slate-500">Mendukung GoPay, OVO, DANA, ShopeePay, BCA, BRImo, dll.</p>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs text-slate-500 font-medium">
                {transactionData.details?.bankName || "Nomor Rekening / Virtual Account:"}
              </div>
              <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="font-mono text-lg font-black text-sky-900 tracking-wider">
                  {transactionData.details?.virtualAccountNumber}
                </span>
                <button
                  onClick={() => copyToClipboard(transactionData.details?.virtualAccountNumber)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-2.5 py-1.5 rounded-lg border border-sky-200"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Salin
                </button>
              </div>
            </div>
          )}

          {/* Amount to pay reminder */}
          <div className="flex items-center justify-between p-4 bg-sky-50 rounded-2xl border border-sky-200 text-xs">
            <span className="text-slate-600 font-medium">Total yang harus dibayar:</span>
            <span className="text-lg font-black text-sky-900">{formatRupiah(targetAmount)}</span>
          </div>

          {/* Instructions */}
          {transactionData.details?.instructions && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Petunjuk Pembayaran:
              </h4>
              <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {transactionData.details.instructions.map((inst: string, idx: number) => (
                  <li key={idx} className="leading-relaxed">
                    {inst}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* ======================================================== */}
          {/* SANDBOX PAYMENT SIMULATOR BUTTON (SANGAT BERGUNA)        */}
          {/* ======================================================== */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-emerald-800">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                SIMULATOR SANDBOX GATEWAY
              </div>
              <p className="text-[11px] text-emerald-700">
                Klik tombol di bawah untuk menyimulasikan pembayaran berhasil tanpa transaksi nyata.
              </p>
            </div>

            <button
              onClick={() => handleSimulatePayment("SUCCESS")}
              disabled={simulating}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-60 cursor-pointer text-sm"
            >
              {simulating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Simulasikan Bayar Berhasil (Sandbox)
                </>
              )}
            </button>

            <button
              onClick={() => setStep("SELECT_METHOD")}
              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Pilih Metode Lain / Batalkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Memuat transaksi...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
