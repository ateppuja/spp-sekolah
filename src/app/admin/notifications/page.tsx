"use client";

import React, { useState, useEffect } from "react";
import { Bell, Send, CheckCircle2, AlertCircle, Info, Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDateIndo } from "@/lib/formatters";

export default function AdminNotificationsPage() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    targetRole: "PARENT",
    linkUrl: "/parent/bills",
  });

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      const data = await res.json();
      if (data.success) setNotifications(data.data);
    } catch (e) {
      showToast("Gagal memuat notifikasi", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Notifikasi berhasil disiarkan!", "success");
        setIsBroadcastOpen(false);
        setFormData({ title: "", message: "", targetRole: "PARENT", linkUrl: "/parent/bills" });
        fetchNotifications();
      } else {
        showToast(data.message || "Gagal menyiarkan", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pusat Notifikasi</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitoring pengiriman notifikasi sistem ke akun orang tua dan kirim pengumuman massal.
          </p>
        </div>

        <button
          onClick={() => setIsBroadcastOpen(true)}
          className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-sky-600/20 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          Kirim Pengumuman / Broadcast
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Memuat log notifikasi...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Belum ada riwayat notifikasi.</div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  n.type === "PAYMENT_SUCCESS"
                    ? "bg-emerald-100 text-emerald-700"
                    : n.type === "DUE_REMINDER"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-sky-100 text-sky-700"
                }`}
              >
                <Bell className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                  <span className="text-[11px] text-slate-400">
                    {formatDateIndo(n.createdAt, true)} WIB
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                  <span>
                    Penerima: <strong>{n.user?.name || "Pengguna"}</strong> ({n.user?.role})
                  </span>
                  <span>•</span>
                  <span>Status: {n.isRead ? "Dibaca" : "Belum Dibaca"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Broadcast */}
      <Modal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        title="Kirim Notifikasi / Broadcast"
        subtitle="Siarkan pengingat atau info pembayaran ke seluruh orang tua"
      >
        <form onSubmit={handleBroadcast} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Penerima *</label>
            <select
              value={formData.targetRole}
              onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            >
              <option value="PARENT">Seluruh Orang Tua / Wali Siswa</option>
              <option value="ADMIN">Semua Admin</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Judul Notifikasi *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Pengingat Batas Akhir Pembayaran SPP"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Isi Pesan Notifikasi *</label>
            <textarea
              required
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Tuliskan pesan yang akan diterima orang tua..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBroadcastOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md shadow-sky-600/20"
            >
              Kirim Notifikasi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
