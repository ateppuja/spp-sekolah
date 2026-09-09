"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Search, Filter, Printer, Phone, Calendar, School } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah, formatDateIndo, calculateDaysOverdue } from "@/lib/formatters";

export default function AdminArrearsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchArrears = async () => {
    try {
      const params = new URLSearchParams();
      if (classFilter) params.append("classId", classFilter);

      const [resA, resC] = await Promise.all([
        fetch(`/api/admin/arrears?${params.toString()}`),
        fetch("/api/admin/classes"),
      ]);
      const dataA = await resA.json();
      const dataC = await resC.json();

      if (dataA.success) setData(dataA.data);
      if (dataC.success) setClasses(dataC.data);
    } catch (e) {
      showToast("Gagal memuat data tunggakan", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArrears();
  }, [classFilter]);

  const handlePrint = () => {
    window.print();
  };

  const arrearsList = data?.arrearsList || [];
  const totalArrears = data?.totalArrearsAmount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Daftar Tunggakan</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Daftar siswa dengan tagihan atau termin cicilan yang telah melewati batas jatuh tempo.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium shadow-xs"
          >
            <option value="">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Kelas {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Rekap Tunggakan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
        <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              Total Nominal Tunggakan
            </span>
            <div className="text-2xl font-black text-rose-700 mt-1">
              {formatRupiah(totalArrears)}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-200/60 text-rose-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Jumlah Tagihan Terlambat
            </span>
            <div className="text-2xl font-black text-amber-800 mt-1">
              {arrearsList.length} <span className="text-sm font-medium">Tagihan</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-200/60 text-amber-800 flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Printable Arrears Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden print-receipt-container">
        {/* Printable Header */}
        <div className="hidden print-only p-6 border-b-2 border-slate-900 mb-4">
          <h2 className="text-xl font-black uppercase text-slate-900">
            LAPORAN DAFTAR TUNGGAKAN SISWA
          </h2>
          <p className="text-xs text-slate-600">
            Dicetak pada: {formatDateIndo(new Date(), true)} WIB
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">NIS & Nama Siswa</th>
                <th className="px-6 py-3.5">Kelas</th>
                <th className="px-6 py-3.5">Nama Tagihan</th>
                <th className="px-6 py-3.5">Jatuh Tempo</th>
                <th className="px-6 py-3.5 text-center">Terlambat</th>
                <th className="px-6 py-3.5 text-right">Nominal Tunggakan</th>
                <th className="px-6 py-3.5 no-print">Kontak Orang Tua</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Memuat data tunggakan...
                  </td>
                </tr>
              ) : arrearsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-emerald-600 font-bold">
                    Alhamdulillah! Tidak ada tunggakan pembayaran yang tercatat.
                  </td>
                </tr>
              ) : (
                arrearsList.map((b: any) => {
                  const daysLate = calculateDaysOverdue(b.dueDate);
                  const parent = b.student?.parentStudents?.[0]?.parent?.user;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{b.student?.fullName}</div>
                        <div className="text-xs font-mono text-slate-500">NIS: {b.student?.nis}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {b.student?.class?.name || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{b.title}</div>
                        <div className="text-xs text-slate-500">{b.billType?.name}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                        {formatDateIndo(b.dueDate)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          {daysLate > 0 ? `${daysLate} Hari` : "Jatuh Tempo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-rose-600 text-sm">
                        {formatRupiah(b.remainingAmount)}
                      </td>
                      <td className="px-6 py-4 no-print text-xs">
                        {parent ? (
                          <div>
                            <div className="font-semibold text-slate-800">{parent.name}</div>
                            {parent.phone && (
                              <a
                                href={`https://wa.me/${parent.phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold"
                              >
                                <Phone className="w-3 h-3" />
                                {parent.phone}
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum terhubung</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
