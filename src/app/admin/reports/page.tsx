"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  GraduationCap,
  Banknote,
  School,
  TrendingUp,
} from "lucide-react";
import { formatRupiah, formatDateIndo, getPaymentMethodLabel } from "@/lib/formatters";
import { useToast } from "@/components/ui/Toast";

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const [reportType, setReportType] = useState("daily"); // "daily" | "class" | "bill_type" | "student"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [classId, setClassId] = useState("");
  const [billTypeId, setBillTypeId] = useState("");

  const [classes, setClasses] = useState<any[]>([]);
  const [billTypes, setBillTypes] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMasters = async () => {
    try {
      const [resC, resBT] = await Promise.all([
        fetch("/api/admin/classes"),
        fetch("/api/admin/bill-types"),
      ]);
      const dataC = await resC.json();
      const dataBT = await resBT.json();
      if (dataC.success) setClasses(dataC.data);
      if (dataBT.success) setBillTypes(dataBT.data);
    } catch (e) {}
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("type", reportType);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (classId) params.append("classId", classId);
      if (billTypeId) params.append("billTypeId", billTypeId);

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      }
    } catch (e) {
      showToast("Gagal memuat laporan", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [reportType, startDate, endDate, classId, billTypeId]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data?.payments || data.payments.length === 0) {
      showToast("Tidak ada data untuk diekspor", "warning");
      return;
    }

    const headers = ["No Transaksi", "NIS", "Nama Siswa", "Kelas", "Tagihan", "Termin", "Metode", "Nominal (Rp)", "Tanggal Bayar"];
    const rows = data.payments.map((p: any) => [
      `"${p.paymentNumber}"`,
      `"${p.student?.nis}"`,
      `"${p.student?.fullName}"`,
      `"${p.student?.class?.name || '-'}"`,
      `"${p.bill?.title}"`,
      p.installment ? `"Cicilan Ke-${p.installment.installmentNumber}"` : '"Lunas"',
      `"${p.paymentMethod}"`,
      p.amount,
      `"${formatDateIndo(p.paidAt || p.createdAt, true)}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Pembayaran_SPP_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("File CSV berhasil diunduh!", "success");
  };

  const summary = data?.summary || { totalIncome: 0, transactionCount: 0 };
  const payments = data?.payments || [];
  const breakdown = data?.breakdown || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Laporan Keuangan</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Rekapitulasi penerimaan kas pembayaran SPP & iuran sekolah dengan filter dan ekspor CSV/Cetak.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Ekspor CSV (Excel)
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Filter Tabs & Selectors */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 no-print">
        {/* Report Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
          <button
            onClick={() => setReportType("daily")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              reportType === "daily"
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Rincian Transaksi Masuk
          </button>
          <button
            onClick={() => setReportType("class")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              reportType === "class"
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Rekap per Kelas
          </button>
          <button
            onClick={() => setReportType("bill_type")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              reportType === "bill_type"
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Rekap per Pos Biaya
          </button>
          <button
            onClick={() => setReportType("student")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              reportType === "student"
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Rekap per Siswa
          </button>
        </div>

        {/* Date & Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-600 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-600 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-600 mb-1">Filter Kelas</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            >
              <option value="">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-600 mb-1">Jenis Tagihan</label>
            <select
              value={billTypeId}
              onChange={(e) => setBillTypeId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            >
              <option value="">Semua Jenis</option>
              {billTypes.map((bt) => (
                <option key={bt.id} value={bt.id}>
                  {bt.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
        <div className="bg-sky-50 border border-sky-200 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
              Total Penerimaan Sesuai Filter
            </span>
            <div className="text-2xl font-black text-sky-900 mt-1">
              {formatRupiah(summary.totalIncome)}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-md shadow-sky-600/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Jumlah Transaksi Masuk
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {summary.transactionCount} <span className="text-sm font-medium">Transaksi</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
            <Banknote className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Report Table (Printable) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden print-receipt-container">
        {/* Printable Letterhead */}
        <div className="hidden print-only p-6 border-b-2 border-slate-900 mb-4">
          <h2 className="text-xl font-black uppercase text-slate-900">
            LAPORAN PENERIMAAN KAS SPP & BIAYA PENDIDIKAN
          </h2>
          <p className="text-xs text-slate-600">
            Periode: {startDate ? formatDateIndo(startDate) : "Awal"} s/d {endDate ? formatDateIndo(endDate) : "Sekarang"} • Dicetak: {formatDateIndo(new Date(), true)} WIB
          </p>
        </div>

        {/* Grouped Breakdown Tables */}
        {reportType === "class" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Nama Kelas</th>
                  <th className="px-6 py-3.5 text-center">Jumlah Transaksi</th>
                  <th className="px-6 py-3.5 text-right">Total Penerimaan (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {breakdown.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">{row.className}</td>
                    <td className="px-6 py-4 text-center">{row.count} Transaksi</td>
                    <td className="px-6 py-4 text-right font-extrabold text-sky-700">
                      {formatRupiah(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === "bill_type" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Pos / Jenis Tagihan</th>
                  <th className="px-6 py-3.5 text-center">Jumlah Transaksi</th>
                  <th className="px-6 py-3.5 text-right">Total Penerimaan (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {breakdown.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">{row.typeName}</td>
                    <td className="px-6 py-4 text-center">{row.count} Transaksi</td>
                    <td className="px-6 py-4 text-right font-extrabold text-sky-700">
                      {formatRupiah(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === "student" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Nama Siswa</th>
                  <th className="px-6 py-3.5">NIS</th>
                  <th className="px-6 py-3.5">Kelas</th>
                  <th className="px-6 py-3.5 text-center">Frekuensi Bayar</th>
                  <th className="px-6 py-3.5 text-right">Total Bayar (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {breakdown.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">{row.studentName}</td>
                    <td className="px-6 py-4 font-mono">{row.nis}</td>
                    <td className="px-6 py-4">{row.className}</td>
                    <td className="px-6 py-4 text-center">{row.count}x</td>
                    <td className="px-6 py-4 text-right font-extrabold text-sky-700">
                      {formatRupiah(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === "daily" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">No. Transaksi</th>
                  <th className="px-6 py-3.5">Nama Siswa & Kelas</th>
                  <th className="px-6 py-3.5">Pos Tagihan</th>
                  <th className="px-6 py-3.5">Metode</th>
                  <th className="px-6 py-3.5">Tanggal Bayar</th>
                  <th className="px-6 py-3.5 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      Tidak ada transaksi pembayaran yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {p.paymentNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{p.student?.fullName}</div>
                        <div className="text-xs text-slate-500">
                          {p.student?.nis} • {p.student?.class?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {p.bill?.title}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {getPaymentMethodLabel(p.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatDateIndo(p.paidAt || p.createdAt, true)}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">
                        {formatRupiah(p.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-right uppercase text-xs">
                    Total Keseluruhan Penerimaan:
                  </td>
                  <td className="px-6 py-4 text-right text-base font-extrabold text-sky-700">
                    {formatRupiah(summary.totalIncome)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
