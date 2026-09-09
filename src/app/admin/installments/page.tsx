"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Search, Filter, AlertTriangle, CheckCircle, Clock, Banknote, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah, formatDateIndo } from "@/lib/formatters";

export default function AdminInstallmentsPage() {
  const { showToast } = useToast();
  const [billsWithInstallments, setBillsWithInstallments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState("");
  const [classes, setClasses] = useState<any[]>([]);

  // Manual payment modal for installment
  const [isManualPayOpen, setIsManualPayOpen] = useState(false);
  const [activeInstallment, setActiveInstallment] = useState<any>(null);
  const [activeBill, setActiveBill] = useState<any>(null);
  const [payMethod, setPayMethod] = useState("CASH");
  const [refNumber, setRefNumber] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (classFilter) params.append("classId", classFilter);

      const [resI, resC] = await Promise.all([
        fetch(`/api/admin/installments?${params.toString()}`),
        fetch("/api/admin/classes"),
      ]);
      const dataI = await resI.json();
      const dataC = await resC.json();

      if (dataI.success) setBillsWithInstallments(dataI.data);
      if (dataC.success) setClasses(dataC.data);
    } catch (e) {
      showToast("Gagal memuat data cicilan", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classFilter]);

  const handleRecordInstallmentPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstallment || !activeBill) return;

    try {
      const res = await fetch("/api/admin/manual-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId: activeBill.id,
          installmentId: activeInstallment.id,
          studentId: activeBill.studentId,
          amount: activeInstallment.remainingAmount,
          paymentMethod: payMethod,
          referenceNumber: refNumber || undefined,
          notes: payNotes || `Pembayaran cicilan ke-${activeInstallment.installmentNumber} kasir`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("Pembayaran cicilan berhasil dicatat!", "success");
        setIsManualPayOpen(false);
        fetchData();
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Cicilan</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitoring progress cicilan aktif siswa dan termin jatuh tempo yang diatur Admin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium shadow-xs"
          >
            <option value="">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Kelas {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="flex items-center gap-3 bg-sky-50 text-sky-900 p-4 rounded-2xl border border-sky-200 shadow-xs">
        <ShieldAlert className="w-6 h-6 text-sky-600 shrink-0" />
        <div className="text-xs">
          <strong>Peraturan Cicilan:</strong> Skema cicilan sepenuhnya diatur oleh Admin Sekolah. Orang tua siswa hanya dapat mengikuti skema yang telah terbit dan tidak dapat merubah nominal atau jadwal termin sendiri.
        </div>
      </div>

      {/* List of Bills with Installments */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            Memuat daftar cicilan...
          </div>
        ) : billsWithInstallments.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            Tidak ada tagihan dengan skema cicilan yang aktif saat ini.
          </div>
        ) : (
          billsWithInstallments.map((bill) => {
            const student = bill.student;
            const installments = bill.installments || [];
            const isCompleted = bill.remainingAmount === 0;

            return (
              <div
                key={bill.id}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4"
              >
                {/* Card Header: Student & Progress */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 text-base">
                          {student?.fullName}
                        </h3>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                          {student?.class?.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        NIS: {student?.nis} • Tagihan: <strong>{bill.title}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="text-left sm:text-right flex sm:flex-col justify-between items-center sm:items-end">
                    <div className="text-xs text-slate-500">
                      Total: <strong className="text-slate-900">{formatRupiah(bill.totalAmount)}</strong>
                    </div>
                    <div className="text-xs font-bold text-slate-700 mt-0.5">
                      Sudah Bayar: <span className="text-emerald-600">{formatRupiah(bill.paidAmount)}</span> •
                      Sisa: <span className="text-rose-600">{formatRupiah(bill.remainingAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <ProgressBar
                  current={bill.paidAmount}
                  total={bill.totalAmount}
                  label="Progress Pelunasan Cicilan"
                  size="md"
                />

                {/* Terms Breakdown Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {installments.map((inst: any) => {
                    const isPaid = inst.remainingAmount === 0;
                    const isOverdue =
                      !isPaid && new Date(inst.dueDate).getTime() < new Date().getTime();

                    return (
                      <div
                        key={inst.id}
                        className={`p-3.5 rounded-xl border transition ${
                          isPaid
                            ? "bg-slate-50 border-slate-200"
                            : isOverdue
                            ? "bg-rose-50/70 border-rose-200"
                            : "bg-white border-slate-200 shadow-xs"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-slate-800">
                            Cicilan Ke-{inst.installmentNumber}
                          </span>
                          <Badge
                            status={isPaid ? "PAID" : isOverdue ? "OVERDUE" : "UNPAID"}
                          />
                        </div>

                        <div className="text-sm font-black text-slate-900 mb-1">
                          {formatRupiah(inst.amount)}
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center justify-between">
                          <span>Jatuh tempo:</span>
                          <span className="font-semibold text-slate-700">
                            {formatDateIndo(inst.dueDate)}
                          </span>
                        </div>

                        {/* Action for unpaid terms: Record manual payment */}
                        {!isPaid && (
                          <button
                            onClick={() => {
                              setActiveBill(bill);
                              setActiveInstallment(inst);
                              setPayMethod("CASH");
                              setRefNumber("");
                              setPayNotes("");
                              setIsManualPayOpen(true);
                            }}
                            className="w-full mt-3 flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            Catat Bayar Termin Ini
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Catat Bayar Cicilan Kasir */}
      <Modal
        isOpen={isManualPayOpen}
        onClose={() => setIsManualPayOpen(false)}
        title="Catat Pembayaran Cicilan"
        subtitle={`Siswa: ${activeBill?.student?.fullName} — Cicilan Ke-${activeInstallment?.installmentNumber}`}
      >
        <form onSubmit={handleRecordInstallmentPayment} className="space-y-4 text-xs sm:text-sm">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Nominal Termin:</span>
              <strong className="text-slate-900 font-bold">{formatRupiah(activeInstallment?.amount)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sisa Tagihan Termin:</span>
              <strong className="text-rose-600 font-extrabold">
                {formatRupiah(activeInstallment?.remainingAmount)}
              </strong>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran *</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            >
              <option value="CASH">Tunai (Kasir TU Sekolah)</option>
              <option value="BANK_TRANSFER">Transfer Bank Manual</option>
              <option value="VA_BCA">BCA Virtual Account</option>
              <option value="VA_MANDIRI">Mandiri Virtual Account</option>
              <option value="QRIS">QRIS</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nomor Referensi / Bukti Setor</label>
            <input
              type="text"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              placeholder="Contoh: KSR-20260710-01"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="Catatan kasir..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsManualPayOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
            >
              Konfirmasi & Cetak Kwitansi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
