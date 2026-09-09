"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Receipt,
  Banknote,
  AlertTriangle,
  UserX,
  ArrowUpRight,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";
import { formatRupiah, formatDateIndo } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-72 bg-slate-200 rounded-2xl lg:col-span-2" />
          <div className="h-72 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentPayments = data?.recentPayments || [];
  const chartMonths = data?.chartMonths || [];
  const categoryStats = data?.categoryStats || [];

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Admin</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Ringkasan status keuangan, tagihan, dan operasional pembayaran SPP sekolah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/bills"
            className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition shadow-md shadow-sky-600/20"
          >
            <Plus className="w-4 h-4" />
            Buat Tagihan Baru
          </Link>
          <Link
            href="/admin/payments"
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition shadow-sm"
          >
            <Banknote className="w-4 h-4 text-emerald-600" />
            Catat Bayar Kasir
          </Link>
        </div>
      </div>

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Siswa */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Siswa</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{stats.totalStudents || 0}</span>
            <span className="text-xs text-slate-500 ml-1.5">Siswa Aktif</span>
          </div>
        </div>

        {/* Total Tagihan Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tagihan Bulan Ini</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900 truncate">
              {formatRupiah(stats.totalBillsThisMonth)}
            </div>
            <span className="text-[11px] text-slate-500">Diterbitkan bulan ini</span>
          </div>
        </div>

        {/* Pembayaran Diterima */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Penerimaan Kas</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-emerald-600 truncate">
              {formatRupiah(stats.totalPaymentsThisMonth)}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">Bulan Berjalan</span>
          </div>
        </div>

        {/* Piutang / Tunggakan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Piutang</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-rose-600 truncate">
              {formatRupiah(stats.totalReceivables)}
            </div>
            <span className="text-[11px] text-rose-600 font-medium">Belum Terbayar</span>
          </div>
        </div>

        {/* Siswa Belum Bayar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Siswa Nunggak</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-600">{stats.studentsUnpaidCount || 0}</span>
            <span className="text-xs text-slate-500 ml-1.5">Siswa</span>
          </div>
        </div>
      </div>

      {/* Monthly Chart and Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Bar Chart representation */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Arus Kas Pembayaran (6 Bulan Terakhir)
              </h3>
              <p className="text-xs text-slate-500">Perbandingan tagihan diterbitkan vs uang masuk</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-sky-500" />
                <span>Penerimaan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-300" />
                <span>Tagihan</span>
              </div>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-2 sm:gap-6 pt-4">
            {chartMonths.map((m: any, idx: number) => {
              const maxVal = Math.max(...chartMonths.map((x: any) => Math.max(x.income, x.billed, 1000000)));
              const incomeHeight = Math.max(6, Math.round((m.income / maxVal) * 180));
              const billedHeight = Math.max(6, Math.round((m.billed / maxVal) * 180));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-48">
                    {/* Billed bar */}
                    <div
                      title={`Tagihan: ${formatRupiah(m.billed)}`}
                      className="w-3 sm:w-6 bg-slate-200 rounded-t-md transition-all hover:bg-slate-300"
                      style={{ height: `${billedHeight}px` }}
                    />
                    {/* Income bar */}
                    <div
                      title={`Penerimaan: ${formatRupiah(m.income)}`}
                      className="w-3 sm:w-6 bg-sky-500 rounded-t-md transition-all hover:bg-sky-600 shadow-sm"
                      style={{ height: `${incomeHeight}px` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Kategori Tagihan</h3>
              <p className="text-xs text-slate-500">Realisasi per pos biaya</p>
            </div>
          </div>

          <div className="space-y-4">
            {categoryStats.map((cat: any, idx: number) => {
              const percent = cat.total > 0 ? Math.round((cat.paid / cat.total) * 100) : 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">{cat.name}</span>
                    <span className="text-slate-500 font-medium">
                      {formatRupiah(cat.paid)} / {formatRupiah(cat.total)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        percent >= 100 ? "bg-emerald-500" : percent > 50 ? "bg-sky-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Transaksi Pembayaran Terbaru</h3>
            <p className="text-xs text-slate-500">Log pembayaran masuk dari siswa dan orang tua</p>
          </div>
          <Link
            href="/admin/payments"
            className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700"
          >
            Lihat Semua
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">No. Transaksi</th>
                <th className="px-6 py-3.5">Nama Siswa</th>
                <th className="px-6 py-3.5">Tagihan / Termin</th>
                <th className="px-6 py-3.5">Metode</th>
                <th className="px-6 py-3.5 text-right">Nominal</th>
                <th className="px-6 py-3.5">Tanggal</th>
                <th className="px-6 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Belum ada riwayat transaksi pembayaran.
                  </td>
                </tr>
              ) : (
                recentPayments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {p.paymentNumber}
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
                        <div className="text-xs text-sky-700 font-semibold">
                          Cicilan Ke-{p.installment.installmentNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700">{p.paymentMethod}</span>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
