"use client";

import React, { useState, useEffect } from "react";
import { Banknote, Search, Filter, Plus, Printer, FileText, CheckCircle, Eye } from "lucide-react";
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

  // Modal: Catat Bayar
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedBillId, setSelectedBillId] = useState("");
  const [selectedInstallmentId, setSelectedInstallmentId] = useState("");
  const [payAmount, setPayAmount] = useState(500000);
  const [payMethod, setPayMethod] = useState("CASH");
  const [refNumber, setRefNumber] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (methodFilter) params.append("method", methodFilter);
      if (statusFilter) params.append("status", statusFilter);

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
  }, [search, methodFilter, statusFilter]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Log Pembayaran</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Riwayat seluruh transaksi masuk dan pencatatan pembayaran loket kasir / Tata Usaha.
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

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari no. transaksi, referensi, nama siswa..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white"
          />
        </div>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none"
        >
          <option value="">Semua Metode</option>
          <option value="CASH">Tunai (Kasir TU)</option>
          <option value="QRIS">QRIS</option>
          <option value="VA_BCA">BCA VA</option>
          <option value="VA_BNI">BNI VA</option>
          <option value="VA_BRI">BRI VA</option>
          <option value="VA_MANDIRI">Mandiri VA</option>
          <option value="BANK_TRANSFER">Transfer Manual</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none"
        >
          <option value="">Semua Status</option>
          <option value="SUCCESS">Berhasil / Lunas</option>
          <option value="PENDING">Menunggu</option>
          <option value="FAILED">Gagal</option>
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
                <th className="px-6 py-3.5">Metode</th>
                <th className="px-6 py-3.5 text-right">Nominal</th>
                <th className="px-6 py-3.5">Waktu Bayar</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Kwitansi</th>
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
                      {p.referenceNumber && (
                        <div className="text-[10px] text-slate-400 font-normal">Ref: {p.referenceNumber}</div>
                      )}
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
                        <span className="inline-block text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
                          Cicilan Ke-{p.installment.installmentNumber}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">
                        {getPaymentMethodLabel(p.paymentMethod)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-slate-900">
                      {formatRupiah(p.amount)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDateIndo(p.paidAt || p.createdAt, true)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge status={p.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status === "SUCCESS" && (
                        <Link
                          href={`/parent/receipt/${p.id}`}
                          target="_blank"
                          title="Cetak Kuitansi Resmi"
                          className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-2.5 py-1.5 rounded-lg border border-sky-200 shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Kwitansi
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Catat Pembayaran Kasir */}
      <Modal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        title="Catat Pembayaran Kasir (Loket TU)"
        subtitle="Entri pembayaran tunai atau transfer manual siswa"
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
                  {b.title} — Sisa: {formatRupiah(b.remainingAmount)}
                </option>
              ))}
            </select>
          </div>

          {activeInstallments.length > 0 && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pilih Termin Cicilan</label>
              <select
                value={selectedInstallmentId}
                onChange={(e) => {
                  setSelectedInstallmentId(e.target.value);
                  const inst = activeInstallments.find((i: any) => i.id === e.target.value);
                  if (inst) setPayAmount(inst.remainingAmount);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              >
                {activeInstallments.map((inst: any) => (
                  <option key={inst.id} value={inst.id}>
                    Cicilan Ke-{inst.installmentNumber} — {formatRupiah(inst.remainingAmount)} (Jatuh tempo: {formatDateIndo(inst.dueDate)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nominal Bayar (Rp) *</label>
              <input
                type="number"
                required
                min={1000}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Metode Penerimaan *</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              >
                <option value="CASH">Tunai (Kasir TU)</option>
                <option value="BANK_TRANSFER">Transfer Bank Manual</option>
                <option value="VA_BCA">BCA Virtual Account</option>
                <option value="VA_MANDIRI">Mandiri Virtual Account</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">No. Bukti / Referensi Kasir</label>
            <input
              type="text"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              placeholder="Contoh: KSR-20260710-09"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsManualOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
            >
              Simpan Transaksi & Cetak Kuitansi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
