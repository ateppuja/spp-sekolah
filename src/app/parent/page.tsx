"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  CreditCard,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  History,
  Sparkles,
} from "lucide-react";
import { StudentSwitcher } from "@/components/parent/StudentSwitcher";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { formatRupiah, formatDateIndo } from "@/lib/formatters";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

export default function ParentHomePage() {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async (studentId?: string) => {
    try {
      const url = studentId ? `/api/parent/dashboard?studentId=${studentId}` : "/api/parent/dashboard";
      const res = await fetch(url);
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
        if (resData.data.selectedStudent) {
          setSelectedStudentId(resData.data.selectedStudent.id);
        }
      }
    } catch (e) {
      showToast("Gagal memuat dashboard anak", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    fetchDashboard(id);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-2xl w-2/3" />
        <div className="h-44 bg-slate-200 rounded-3xl" />
        <div className="h-60 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  const students = data?.students || [];
  const selectedStudent = data?.selectedStudent;
  const stats = data?.stats || { totalBilled: 0, totalPaid: 0, totalRemaining: 0, progressPercent: 100 };
  const upcomingBills = data?.upcomingBills || [];
  const recentTransactions = data?.recentTransactions || [];

  return (
    <div className="space-y-6">
      {/* Top Student Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Selamat Datang! 👋
          </h1>
          <p className="text-xs text-slate-500">
            Pantau rincian biaya pendidikan dan status pembayaran anak Anda.
          </p>
        </div>

        {students.length > 0 && (
          <StudentSwitcher
            students={students}
            selectedStudentId={selectedStudentId}
            onSelect={handleSelectStudent}
          />
        )}
      </div>

      {/* Main Student Progress Card */}
      <div className="bg-gradient-to-br from-sky-800 via-sky-900 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-sky-900/20 relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-sky-300">
              Ringkasan Kewajiban Pembayaran
            </span>
            <span className="text-[11px] bg-white/10 backdrop-blur-md px-3 py-1 rounded-full font-bold border border-white/20">
              {selectedStudent?.class?.name || "Siswa"}
            </span>
          </div>

          <div>
            <div className="text-xs text-sky-200">Sisa Tagihan Belum Terbayar:</div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
              {formatRupiah(stats.totalRemaining)}
            </div>
          </div>

          {/* Progress Bar & Subtitle */}
          <div className="pt-2">
            <ProgressBar
              current={stats.totalPaid}
              total={stats.totalBilled}
              size="md"
              showText={false}
            />
            <div className="flex justify-between items-center text-xs text-sky-200 mt-2 font-medium">
              <span>
                {formatRupiah(stats.totalPaid)} dari {formatRupiah(stats.totalBilled)} telah dibayar
              </span>
              <span className="font-extrabold text-white">{stats.progressPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tagihan Jatuh Tempo Terdekat & Quick Bayar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Tagihan Terdekat & Cicilan Berikutnya
          </h2>
          <Link
            href="/parent/bills"
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            Lihat Semua
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingBills.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center space-y-2 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Semua Tagihan Sudah Lunas! 🎉</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tidak ada tagihan atau cicilan aktif yang perlu dibayar untuk {selectedStudent?.fullName} saat ini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBills.map((b: any) => {
              const payUrl = b.nextInstallment
                ? `/parent/checkout?billId=${b.id}&installmentId=${b.nextInstallment.id}`
                : `/parent/checkout?billId=${b.id}`;
              const amountToPay = b.nextInstallment ? b.nextInstallment.remainingAmount : b.remainingAmount;

              return (
                <div
                  key={b.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-sky-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">{b.title}</h3>
                      <Badge status={b.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                      <span>Jenis: {b.billType}</span>
                      <span>•</span>
                      <span className="text-slate-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Jatuh Tempo: <strong>{formatDateIndo(b.dueDate)}</strong>
                      </span>
                    </div>

                    {b.nextInstallment && (
                      <div className="text-xs text-sky-700 font-bold bg-sky-50 px-2.5 py-1 rounded-lg inline-block mt-1">
                        Termin Aktif: Cicilan Ke-{b.nextInstallment.installmentNumber}
                      </div>
                    )}
                  </div>

                  {/* Nominal & Bayar Sekarang Button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        {b.nextInstallment ? "Nominal Cicilan" : "Sisa Tagihan"}
                      </span>
                      <span className="text-base sm:text-lg font-black text-slate-900">
                        {formatRupiah(amountToPay)}
                      </span>
                    </div>

                    <Link
                      href={payUrl}
                      className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-sky-600/20 transition cursor-pointer"
                    >
                      Bayar Sekarang
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Riwayat Pembayaran Terakhir */}
      {recentTransactions.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Riwayat Pembayaran Terakhir
            </h2>
            <Link
              href="/parent/payments"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              Semua Riwayat
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {recentTransactions.map((tx: any) => (
              <div
                key={tx.id}
                className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">
                    {tx.bill?.title}
                    {tx.installment && (
                      <span className="ml-1.5 text-[11px] text-sky-700 font-semibold">
                        (Cicilan Ke-{tx.installment.installmentNumber})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {formatDateIndo(tx.paidAt || tx.createdAt, true)} WIB • {tx.paymentMethod}
                  </div>
                </div>

                <div className="text-right flex items-center gap-3">
                  <span className="font-black text-emerald-600 text-xs sm:text-sm">
                    {formatRupiah(tx.amount)}
                  </span>
                  <Link
                    href={`/parent/receipt/${tx.id}`}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-2.5 py-1.5 rounded-lg border border-sky-200"
                  >
                    Kwitansi
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
