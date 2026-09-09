"use client";

import React, { useState, useEffect } from "react";
import { History, Search, ShieldCheck, Eye, ArrowRight, UserCheck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDateIndo } from "@/lib/formatters";

export default function AdminAuditLogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/admin/audit-logs");
      const data = await res.json();
      if (data.success) setLogs(data.data);
    } catch (e) {
      showToast("Gagal memuat audit log", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const openLogDetail = (log: any) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE_BILL":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">Buat Tagihan</span>;
      case "UPDATE_BILL":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Ubah Tagihan</span>;
      case "DELETE_BILL":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Hapus Tagihan</span>;
      case "CREATE_INSTALLMENT":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">Buat Cicilan</span>;
      case "MANUAL_PAYMENT":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Bayar Kasir</span>;
      case "PAYMENT_SUCCESS":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Bayar Sukses</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Audit Trail & Log Aktivitas</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Rekaman jejak keamanan untuk setiap mutasi tagihan, cicilan, dan transaksi keuangan sekolah.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Waktu</th>
                <th className="px-6 py-3.5">Admin / Pengguna</th>
                <th className="px-6 py-3.5">Aksi / Operasi</th>
                <th className="px-6 py-3.5">Entitas</th>
                <th className="px-6 py-3.5 text-right">Rincian Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Memuat log aktivitas...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Belum ada riwayat audit log.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDateIndo(log.createdAt, true)} WIB
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{log.user?.name || "Sistem Otomatis"}</div>
                      <div className="text-[11px] text-slate-400">{log.user?.email || "system@gateway"}</div>
                    </td>
                    <td className="px-6 py-4">{getActionBadge(log.action)}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-slate-700">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openLogDetail(log)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-2.5 py-1.5 rounded-lg border border-sky-200 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Lihat Perubahan (JSON)
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View JSON Diff */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detail Perubahan Audit Log"
        subtitle={`Aksi: ${selectedLog?.action} • Waktu: ${formatDateIndo(selectedLog?.createdAt, true)} WIB`}
        maxWidth="2xl"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Eksekutor</span>
                <span className="font-bold text-slate-900">{selectedLog.user?.name || "System"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Target Entitas</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedLog.entityType} ({selectedLog.entityId || "Multi"})
                </span>
              </div>
            </div>

            {selectedLog.beforeData && (
              <div>
                <label className="block font-bold text-rose-700 mb-1">
                  Data Sebelum Perubahan (Before):
                </label>
                <pre className="p-3 bg-rose-50 border border-rose-200 rounded-xl overflow-x-auto text-[11px] font-mono text-rose-900">
                  {JSON.stringify(JSON.parse(selectedLog.beforeData), null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.afterData && (
              <div>
                <label className="block font-bold text-emerald-700 mb-1">
                  Data Setelah Perubahan (After):
                </label>
                <pre className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl overflow-x-auto text-[11px] font-mono text-emerald-900">
                  {JSON.stringify(JSON.parse(selectedLog.afterData), null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
