"use client";

import React, { useState, useEffect } from "react";
import {
  Banknote,
  Search,
  Filter,
  Plus,
  Printer,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Download,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah, formatDateIndo, getPaymentMethodLabel } from "@/lib/formatters";
import Link from "next/link";

export default function AdminPaymentsPage() {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "SUCCESS" | "FAILED">("ALL");

  // Modal: Catat Bayar Kasir
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedBillId, setSelectedBillId] = useState("");
  const [selectedInstallmentId, setSelectedInstallmentId] = useState("");
  const [payAmount, setPayAmount] = useState(500000);
  const [payMethod, setPayMethod] = useState("CASH");
  const [refNumber, setRefNumber] = useState("");
  const [payNotes, setPayNotes] = useState("");

  // Modal: Bukti Transfer Preview
  const [previewPayment, setPreviewPayment] = useState<any>(null);

  // Modal: Reject Payment
  const [rejectPayment, setRejectPayment] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (methodFilter) params.append("method", methodFilter);
      if (statusFilter) {
        params.append("status", statusFilter);
      } else if (activeTab !== "ALL") {
        params.append("status", activeTab);
      }

      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      const data = await res.json();
      if (data.success) setPayments(data.data);
    } catch (e) {
      showToast("Gagal memuat log pembayaran", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchMasters = async () => {
    try {
      const [resS, resB] = await Promise.all([
        fetch("/api/admin/students"),
        fetch("/api/admin/bills?status=UNPAID,PARTIAL"),
      ]);
      const dataS = await resS.json();
      const dataB = await resB.json();

      if (dataS.success) setStudents(dataS.data);
      if (dataB.success) setBills(dataB.data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [search, methodFilter, statusFilter, activeTab]);

  // Handle student selection in modal to filter bills
  const studentBills = bills.filter(
    (b) => b.studentId === selectedStudentId && b.remainingAmount > 0
  );
  const activeBill = studentBills.find((b) => b.id === selectedBillId);
  const activeInstallments = activeBill?.installments?.filter((i: any) => i.remainingAmount > 0) || [];

  const handleBillSelect = (billId: string) => {
    setSelectedBillId(billId);
    setSelectedInstallmentId("");
    const b = studentBills.find((x) => x.id === billId);
    if (b) {
      if (b.allowInstallment && b.installments?.length > 0) {
        const nextInst = b.installments.find((i: any) => i.remainingAmount > 0);
        if (nextInst) {
          setSelectedInstallmentId(nextInst.id);
          setPayAmount(nextInst.remainingAmount);
          return;
        }
      }
      setPayAmount(b.remainingAmount);
    }
  };

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillId || !selectedStudentId) {
      showToast("Pilih siswa dan tagihan terlebih dahulu", "error");
      return;
    }

    try {
      const res = await fetch("/api/admin/manual-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId: selectedBillId,
          installmentId: selectedInstallmentId || null,
          studentId: selectedStudentId,
          amount: payAmount,
          paymentMethod: payMethod,
          referenceNumber: refNumber || undefined,
          notes: payNotes || "Pencatatan kasir Tata Usaha",
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("Pembayaran berhasil dicatat & kuitansi terbit!", "success");
        setIsManualOpen(false);
        fetchPayments();
        fetchMasters();
      } else {
        showToast(data.message || "Gagal mencatat pembayaran", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem", "error");
    }
  };

  // Verify / Approve Payment
  const handleApprove = async (paymentId: string) => {
    setProcessingAction(true);
    try {
      const res = await fetch("/api/admin/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          action: "APPROVE",
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("Pembayaran berhasil diverifikasi & ditandai Lunas! 🎉", "success");
        setPreviewPayment(null);
        fetchPayments();
        fetchMasters();
      } else {
        showToast(data.message || "Gagal memverifikasi pembayaran", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setProcessingAction(false);
    }
  };

  // Reject Payment
  const handleReject = async () => {
    if (!rejectPayment) return;
    setProcessingAction(true);
    try {
      const res = await fetch("/api/admin/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: rejectPayment.id,
          action: "REJECT",
          rejectionReason: rejectionReason || "Bukti transfer tidak valid atau dana belum masuk.",
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("Pembayaran telah ditolak. Notifikasi terkirim ke orang tua.", "info");
        setRejectPayment(null);
        setPreviewPayment(null);
        setRejectionReason("");
        fetchPayments();
      } else {
        showToast(data.message || "Gagal menolak pembayaran", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setProcessingAction(false);
    }
  };

  const pendingCount = payments.filter((p) => p.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Log & Verifikasi Pembayaran</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verifikasi bukti transfer manual orang tua siswa dan pencatatan loket kasir / Tata Usaha.
          </p>
        </div>

        <button
          onClick={() => {
            if (students.length > 0) setSelectedStudentId(students[0].id);
            setIsManualOpen(true);
          }}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-600/20 cursor-pointer"
        >
          <Banknote className="w-4 h-4" />
          Catat Bayar Kasir
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl max-w-xl">
        <button
          onClick={() => {
            setActiveTab("ALL");
            setStatusFilter("");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "ALL"
              ? "bg-white text-sky-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Semua Transaksi
        </button>
        <button
          onClick={() => {
            setActiveTab("PENDING");
            setStatusFilter("PENDING");
          }}
          className={`relative px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "PENDING"
              ? "bg-amber-500 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>Menunggu Verifikasi</span>
          {pendingCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === "PENDING" ? "bg-white text-amber-600" : "bg-amber-500 text-white"
              }`}
            >
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("SUCCESS");
            setStatusFilter("SUCCESS");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "SUCCESS"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Lunas / Sukses
        </button>
        <button
          onClick={() => {
            setActiveTab("FAILED");
            setStatusFilter("FAILED");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "FAILED"
              ? "bg-rose-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Ditolak / Gagal
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari no. transaksi, referensi, nama siswa, pengirim..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white"
          />
        </div>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none"
        >
          <option value="">Semua Metode</option>
          <option value="BANK_TRANSFER">Transfer Manual Bank</option>
          <option value="CASH">Tunai (Kasir TU)</option>
          <option value="QRIS">QRIS</option>
          <option value="VA_BCA">BCA VA</option>
          <option value="VA_MANDIRI">Mandiri VA</option>
          <option value="VA_BRI">BRI VA</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">No. Transaksi</th>
                <th className="px-6 py-3.5">Nama Siswa</th>
                <th className="px-6 py-3.5">Tagihan & Termin</th>
                <th className="px-6 py-3.5">Pengirim & Metode</th>
                <th className="px-6 py-3.5 text-right">Nominal</th>
                <th className="px-6 py-3.5 text-center">Bukti Transfer</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    Memuat data pembayaran...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    Tidak ada transaksi pembayaran yang ditemukan.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {p.paymentNumber}
                      <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                        {formatDateIndo(p.paidAt || p.createdAt, true)}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{p.student?.fullName}</div>
                      <div className="text-xs text-slate-500">
                        NIS: {p.student?.nis} • {p.student?.class?.name}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{p.bill?.title}</div>
                      {p.installment && (
                        <span className="inline-block text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold mt-0.5">
                          Cicilan Ke-{p.installment.installmentNumber}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800 block">
                        {getPaymentMethodLabel(p.paymentMethod)}
                      </span>
                      {p.bankSender && (
                        <span className="text-xs text-sky-700 font-medium block">
                          Dari: {p.bankSender}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right font-black text-slate-900">
                      {formatRupiah(p.amount)}
                    </td>

                    {/* Bukti Transfer Column */}
                    <td className="px-6 py-4 text-center">
                      {p.proofUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewPayment(p)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1.5 rounded-lg border border-sky-200 transition cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Lihat Bukti
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <Badge status={p.status} />
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 text-right">
                      {p.status === "PENDING" ? (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            disabled={processingAction}
                            onClick={() => handleApprove(p.id)}
                            title="Setujui dan verifikasi pembayaran lunas"
                            className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Setujui
                          </button>
                          <button
                            type="button"
                            disabled={processingAction}
                            onClick={() => {
                              setRejectPayment(p);
                              setRejectionReason("");
                            }}
                            title="Tolak pembayaran"
                            className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200 transition cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Tolak
                          </button>
                        </div>
                      ) : p.status === "SUCCESS" ? (
                        <Link
                          href={`/parent/receipt/${p.id}`}
                          target="_blank"
                          title="Cetak Kuitansi Resmi"
                          className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-2.5 py-1.5 rounded-lg border border-sky-200 shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Kwitansi
                        </Link>
                      ) : (
                        <span className="text-xs text-rose-500 font-medium">Ditolak</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: PREVIEW BUKTI TRANSFER */}
      <Modal
        isOpen={!!previewPayment}
        onClose={() => setPreviewPayment(null)}
        title="Pratinjau Bukti Pembayaran"
        subtitle={previewPayment ? `Transaksi ${previewPayment.paymentNumber}` : ""}
        maxWidth="2xl"
      >
        {previewPayment && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Siswa</span>
                <span className="font-bold text-slate-900">
                  {previewPayment.student?.fullName} ({previewPayment.student?.class?.name})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Tagihan</span>
                <span className="font-bold text-slate-900">{previewPayment.bill?.title}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Rekening Pengirim</span>
                <span className="font-bold text-sky-700">{previewPayment.bankSender || "Tidak dicantumkan"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Nominal</span>
                <span className="font-black text-emerald-600 text-base">
                  {formatRupiah(previewPayment.amount)}
                </span>
              </div>
              {previewPayment.notes && (
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Catatan Pengirim</span>
                  <span className="text-slate-700 italic">{previewPayment.notes}</span>
                </div>
              )}
            </div>

            {/* Proof Image */}
            <div className="p-2 bg-slate-900/5 rounded-2xl border border-slate-200 flex items-center justify-center min-h-[250px] max-h-[450px] overflow-auto">
              <img
                src={previewPayment.proofUrl}
                alt="Bukti Transfer"
                className="max-h-[420px] w-auto object-contain rounded-xl shadow-xs"
              />
            </div>

            {/* Quick Actions if PENDING */}
            {previewPayment.status === "PENDING" && (
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  disabled={processingAction}
                  onClick={() => {
                    setRejectPayment(previewPayment);
                    setPreviewPayment(null);
                  }}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 transition cursor-pointer text-xs"
                >
                  Tolak Bukti Transfer
                </button>

                <button
                  type="button"
                  disabled={processingAction}
                  onClick={() => handleApprove(previewPayment.id)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Verifikasi & Setujui Lunas
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL: TOLAK PEMBAYARAN */}
      <Modal
        isOpen={!!rejectPayment}
        onClose={() => setRejectPayment(null)}
        title="Tolak Pembayaran"
        subtitle={rejectPayment ? `Transaksi ${rejectPayment.paymentNumber}` : ""}
        maxWidth="md"
      >
        {rejectPayment && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <p className="font-bold">Apakah Anda yakin ingin menolak pembayaran ini?</p>
              <p className="mt-1 text-[11px] text-rose-700">
                Status tagihan akan tetap Belum Lunas dan sistem akan mengirimkan notifikasi ke orang tua siswa.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Alasan Penolakan</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Nominal tidak sesuai dengan mutasi bank, foto struk buram, dll."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRejectPayment(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={processingAction}
                onClick={handleReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {processingAction ? "Memproses..." : "Ya, Tolak Pembayaran"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: CATAT PEMBAYARAN KASIR (LOKET TU) */}
      <Modal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        title="Catat Pembayaran Kasir (Loket TU)"
        subtitle="Entri pembayaran tunai atau transfer manual langsung di sekolah"
        maxWidth="xl"
      >
        <form onSubmit={handleManualPayment} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pilih Siswa *</label>
            <select
              required
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                setSelectedBillId("");
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            >
              <option value="">Pilih Siswa...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} — NIS: {s.nis} ({s.class?.name || "Kelas"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Pilih Tagihan Aktif *</label>
            <select
              required
              value={selectedBillId}
              onChange={(e) => handleBillSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            >
              <option value="">Pilih Tagihan...</option>
              {studentBills.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} (Sisa: {formatRupiah(b.remainingAmount)})
                </option>
              ))}
            </select>
          </div>

          {activeBill && activeBill.allowInstallment && activeBill.installments?.length > 0 && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pilih Termin Cicilan</label>
              <select
                value={selectedInstallmentId}
                onChange={(e) => {
                  setSelectedInstallmentId(e.target.value);
                  const inst = activeBill.installments.find((i: any) => i.id === e.target.value);
                  if (inst) setPayAmount(inst.remainingAmount);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              >
                <option value="">Bayar Bebas / Keseluruhan</option>
                {activeInstallments.map((inst: any) => (
                  <option key={inst.id} value={inst.id}>
                    Cicilan Ke-{inst.installmentNumber} (Sisa: {formatRupiah(inst.remainingAmount)}) - JT:{" "}
                    {formatDateIndo(inst.dueDate)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nominal Pembayaran (Rp) *</label>
              <input
                type="number"
                required
                min={1000}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Metode Bayar *</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              >
                <option value="CASH">Tunai / Loket TU</option>
                <option value="BANK_TRANSFER">Transfer Bank Manual</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">No. Referensi / Bukti Setor</label>
            <input
              type="text"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              placeholder="Contoh: KWT-001 / Slip Bank 98124"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan</label>
            <input
              type="text"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="Catatan petugas TU..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsManualOpen(false)}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              Simpan & Terbitkan Kwitansi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
