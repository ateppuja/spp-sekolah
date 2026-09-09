"use client";

import React, { useState, useEffect } from "react";
import { Bell, CheckCheck, ExternalLink, Calendar, CheckCircle2 } from "lucide-react";
import { formatDateIndo } from "@/lib/formatters";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

export default function ParentNotificationsPage() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications || []);
      }
    } catch (e) {
      showToast("Gagal memuat notifikasi", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Semua notifikasi ditandai telah dibaca", "success");
        fetchNotifications();
      }
    } catch (e) {
      showToast("Gagal memperbarui notifikasi", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kotak Masuk Notifikasi
          </h1>
          <p className="text-xs text-slate-500">
            Pemberitahuan tagihan baru, batas jatuh tempo, dan konfirmasi pembayaran.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200"
          >
            <CheckCheck className="w-4 h-4" />
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Memuat notifikasi...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs">Tidak ada notifikasi baru saat ini.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex items-start gap-4 transition ${
                n.isRead ? "bg-white" : "bg-sky-50/40"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  n.type === "PAYMENT_SUCCESS"
                    ? "bg-emerald-100 text-emerald-700"
                    : n.type === "DUE_REMINDER"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-sky-100 text-sky-700"
                }`}
              >
                {n.type === "PAYMENT_SUCCESS" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {formatDateIndo(n.createdAt, true)} WIB
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>

                {n.linkUrl && (
                  <div className="pt-1.5">
                    <Link
                      href={n.linkUrl}
                      className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700"
                    >
                      Buka Rincian
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
