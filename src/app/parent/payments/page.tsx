"use client";

import React, { useState, useEffect } from "react";
import { History, Printer, CheckCircle2, Clock, Eye, AlertCircle } from "lucide-react";
import { StudentSwitcher } from "@/components/parent/StudentSwitcher";
import { formatRupiah, formatDateIndo, getPaymentMethodLabel } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

export default function ParentPaymentsPage() {
  const { showToast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewProof, setPreviewProof] = useState<any>(null);

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/parent/students");
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setStudents(data.data);
        setSelectedStudentId(data.data[0].id);
        fetchPayments(data.data[0].id);
      }
    } catch (e) {
      showToast("Gagal memuat data", "error");
    }
  };

  const fetchPayments = async (studentId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/parent/payments?studentId=${studentId}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.data);
      }
    } catch (e) {
      showToast("Gagal memuat riwayat transaksi", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id);
    fetchPayments(id);
  };

  return (
    <div className="space-y-6">
      {/* Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Riwayat Pembayaran & Bukti Transfer
          </h1>
          <p className="text-xs text-slate-500">
            Daftar transaksi pembayaran, status verifikasi bukti transfer, dan kuitansi digital resmi.
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

      {/* Payment List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            Memuat riwayat transaksi...
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            Belum ada riwayat transaksi pembayaran untuk siswa ini.
          </div>
        ) : (
          payments.map((p) => (
            <div
              key={p.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-sky-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-500">{p.paymentNumber}</span>
                  <Badge status={p.status} />
                </div>

                <h3 className="font-extrabold text-slate-900 text-base">{p.bill?.title}</h3>

                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{getPaymentMethodLabel(p.paymentMethod)}</span>
                  <span>•</span>
                  <span>{formatDateIndo(p.paidAt || p.createdAt, true)} WIB</span>
                  {p.installment && (
                    <>
                      <span>•</span>
                      <span className="text-sky-700 font-bold">
                        Cicilan Ke-{p.installment.installmentNumber}
                      </span>
                    </>
                  )}
                  {p.bankSender && (
                    <>
                      <span>•</span>
                      <span className="text-slate-600">Pengirim: {p.bankSender}</span>
                    </>
                  )}
                </div>

                {p.status === "PENDING" && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 w-fit">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Bukti transfer sedang diverifikasi oleh bagian Tata Usaha</span>
                  </div>
                )}

                {p.status === "FAILED" && p.notes && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 w-fit">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Catatan: {p.notes}</span>
                  </div>
                )}
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span className="text-base sm:text-lg font-black text-slate-900">
                  {formatRupiah(p.amount)}
                </span>

                <div className="flex items-center gap-2">
                  {p.proofUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewProof(p)}
                      className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Lihat Bukti
                    </button>
                  )}

                  {p.status === "SUCCESS" && (
                    <Link
                      href={`/parent/receipt/${p.id}`}
                      className="inline-flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-xs px-3.5 py-1.5 rounded-xl transition shadow-2xs cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Kwitansi
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: PREVIEW BUKTI TRANSFER ORANG TUA */}
      <Modal
        isOpen={!!previewProof}
        onClose={() => setPreviewProof(null)}
        title="Bukti Transfer yang Diunggah"
        subtitle={previewProof ? `Nomor Transaksi: ${previewProof.paymentNumber}` : ""}
        maxWidth="lg"
      >
        {previewProof && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Tagihan:</span>
                <span className="font-bold text-slate-900">{previewProof.bill?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal:</span>
                <span className="font-bold text-emerald-600">{formatRupiah(previewProof.amount)}</span>
              </div>
              {previewProof.bankSender && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Rekening Pengirim:</span>
                  <span className="font-bold text-sky-700">{previewProof.bankSender}</span>
                </div>
              )}
            </div>

            <div className="p-2 bg-slate-900/5 rounded-xl border border-slate-200 flex items-center justify-center max-h-[400px] overflow-auto">
              <img
                src={previewProof.proofUrl}
                alt="Bukti Transfer"
                className="max-h-[380px] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
