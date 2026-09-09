"use client";

import React, { useState, useEffect } from "react";
import { History, Printer, CheckCircle, Search } from "lucide-react";
import { StudentSwitcher } from "@/components/parent/StudentSwitcher";
import { formatRupiah, formatDateIndo, getPaymentMethodLabel } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

export default function ParentPaymentsPage() {
  const { showToast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
            Riwayat Pembayaran
          </h1>
          <p className="text-xs text-slate-500">
            Daftar transaksi pembayaran yang telah berhasil beserta bukti kuitansi digital.
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
            Memuat riwayat...
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            Belum ada riwayat transaksi pembayaran berhasil untuk siswa ini.
          </div>
        ) : (
          payments.map((p) => (
            <div
              key={p.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-sky-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
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
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span className="text-base sm:text-lg font-black text-emerald-600">
                  {formatRupiah(p.amount)}
                </span>

                <Link
                  href={`/parent/receipt/${p.id}`}
                  className="inline-flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Lihat Kwitansi
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
