"use client";

import React, { useState, useEffect } from "react";
import { Receipt, Clock, CheckCircle2, CreditCard, ArrowRight, Eye, ChevronRight } from "lucide-react";
import { StudentSwitcher } from "@/components/parent/StudentSwitcher";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah, formatDateIndo } from "@/lib/formatters";
import { InstallmentTimeline } from "@/components/parent/InstallmentTimeline";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ParentBillsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [bills, setBills] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"unpaid" | "paid">("unpaid");
  const [loading, setLoading] = useState(true);

  // Selected bill detail modal
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/parent/students");
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setStudents(data.data);
        setSelectedStudentId(data.data[0].id);
        fetchBills(data.data[0].id, activeTab);
      }
    } catch (e) {
      showToast("Gagal memuat data siswa", "error");
    }
  };

  const fetchBills = async (studentId: string, tab: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/parent/bills?studentId=${studentId}&status=${tab}`);
      const data = await res.json();
      if (data.success) {
        setBills(data.data);
      }
    } catch (e) {
      showToast("Gagal memuat daftar tagihan", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id);
    fetchBills(id, activeTab);
  };

  const handleTabChange = (tab: "unpaid" | "paid") => {
    setActiveTab(tab);
    if (selectedStudentId) {
      fetchBills(selectedStudentId, tab);
    }
  };

  const openBillDetail = async (billId: string) => {
    try {
      const res = await fetch(`/api/parent/bills/${billId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedBill(data.data);
        setIsDetailOpen(true);
      }
    } catch (e) {
      showToast("Gagal memuat rincian tagihan", "error");
    }
  };

  const handlePayInstallment = (installment: any) => {
    if (!selectedBill) return;
    router.push(`/parent/checkout?billId=${selectedBill.id}&installmentId=${installment.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Student Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Tagihan Biaya Sekolah
          </h1>
          <p className="text-xs text-slate-500">
            Daftar seluruh tagihan SPP, iuran, dan rincian termin cicilan resmi.
          </p>
        </div>

        {students.length > 0 && (
          <StudentSwitcher
            students={students}
            selectedStudentId={selectedStudentId}
            onSelect={handleStudentChange}
          />
        )}
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-200/70 rounded-2xl max-w-md">
        <button
          onClick={() => handleTabChange("unpaid")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "unpaid"
              ? "bg-white text-sky-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Tagihan Belum Lunas
        </button>
        <button
          onClick={() => handleTabChange("paid")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "paid"
              ? "bg-white text-sky-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Riwayat Tagihan Lunas
        </button>
      </div>

      {/* Bills Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            Memuat tagihan...
          </div>
        ) : bills.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            {activeTab === "unpaid"
              ? "Tidak ada tagihan yang belum lunas. Semua pembayaran telah selesai!"
              : "Belum ada riwayat tagihan yang lunas."}
          </div>
        ) : (
          bills.map((bill) => {
            const hasInstallments = bill.allowInstallment && bill.installments?.length > 0;
            const nextUnpaidInstallment = hasInstallments
              ? bill.installments.find((i: any) => i.remainingAmount > 0)
              : null;

            return (
              <div
                key={bill.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-sky-300 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-base">{bill.title}</h3>
                      <Badge status={bill.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Jenis: {bill.billType?.name} • No. Tagihan:{" "}
                      <span className="font-mono font-bold text-slate-700">{bill.billNumber}</span>
                    </p>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Jatuh Tempo: {formatDateIndo(bill.dueDate)}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      {bill.remainingAmount === 0 ? "Total Terbayar" : "Sisa Tagihan"}
                    </span>
                    <span
                      className={`text-lg font-black ${
                        bill.remainingAmount === 0 ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {formatRupiah(bill.remainingAmount === 0 ? bill.totalAmount : bill.remainingAmount)}
                    </span>
                  </div>
                </div>

                {/* If has installments, show quick term preview */}
                {hasInstallments && (
                  <div className="p-3 bg-sky-50/70 border border-sky-200/70 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-sky-600" />
                      <span className="font-bold text-sky-900">
                        {bill.installments.length} Termin Cicilan Ditetapkan
                      </span>
                    </div>
                    {nextUnpaidInstallment && (
                      <span className="text-sky-700 font-semibold">
                        Termin aktif: Cicilan Ke-{nextUnpaidInstallment.installmentNumber} (
                        {formatRupiah(nextUnpaidInstallment.remainingAmount)})
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => openBillDetail(bill.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-sky-600 bg-slate-50 hover:bg-sky-50 px-3 py-2 rounded-xl transition border border-slate-200"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Lihat Rincian & Jadwal Cicilan
                  </button>

                  {bill.remainingAmount > 0 && (
                    <Link
                      href={
                        nextUnpaidInstallment
                          ? `/parent/checkout?billId=${bill.id}&installmentId=${nextUnpaidInstallment.id}`
                          : `/parent/checkout?billId=${bill.id}`
                      }
                      className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-sky-600/20 transition cursor-pointer"
                    >
                      Bayar Sekarang
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Detail Tagihan with Installment Timeline */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedBill?.title || "Detail Tagihan"}
        subtitle={`Nomor: ${selectedBill?.billNumber}`}
        maxWidth="2xl"
      >
        {selectedBill && (
          <div className="space-y-6 text-xs sm:text-sm">
            {/* Financial Overview */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-slate-400 block text-[10px]">Total Tagihan</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {formatRupiah(selectedBill.totalAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Sudah Dibayar</span>
                <span className="font-extrabold text-emerald-600 text-sm">
                  {formatRupiah(selectedBill.paidAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Sisa Tagihan</span>
                <span className="font-extrabold text-rose-600 text-sm">
                  {formatRupiah(selectedBill.remainingAmount)}
                </span>
              </div>
            </div>

            {/* Installments Timeline */}
            {selectedBill.allowInstallment && selectedBill.installments?.length > 0 ? (
              <div>
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-sky-600" />
                  Jadwal & Status Cicilan Resmi Sekolah:
                </h4>
                <InstallmentTimeline
                  billId={selectedBill.id}
                  installments={selectedBill.installments}
                  onPayClick={handlePayInstallment}
                  showPayButton={true}
                />
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Pembayaran:</span>
                  <Badge status={selectedBill.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jatuh Tempo:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDateIndo(selectedBill.dueDate)}
                  </span>
                </div>
                {selectedBill.notes && (
                  <p className="text-slate-600 pt-2 border-t border-slate-200 text-xs">
                    Keterangan: {selectedBill.notes}
                  </p>
                )}
              </div>
            )}

            {/* If fully paid, show receipts */}
            {selectedBill.payments?.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Bukti Pembayaran Tersedia:</h4>
                <div className="space-y-2">
                  {selectedBill.payments.map((p: any) => (
                    <div
                      key={p.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-900">{p.paymentNumber}</span>
                        <div className="text-slate-500">
                          {p.paymentMethod} • {formatDateIndo(p.paidAt || p.createdAt, true)}
                        </div>
                      </div>
                      <Link
                        href={`/parent/receipt/${p.id}`}
                        className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200"
                      >
                        Buka Kwitansi
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
