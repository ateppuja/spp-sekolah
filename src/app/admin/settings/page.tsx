"use client";

import React, { useState, useEffect } from "react";
import { Settings, Save, School, ShieldCheck, CreditCard } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    schoolName: "",
    schoolNpsn: "",
    schoolAddress: "",
    schoolPhone: "",
    schoolEmail: "",
    principalName: "",
    treasurerName: "",
    paymentGatewayMode: "MOCK",
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          const s = data.data;
          setFormData({
            schoolName: s.schoolName || "",
            schoolNpsn: s.schoolNpsn || "",
            schoolAddress: s.schoolAddress || "",
            schoolPhone: s.schoolPhone || "",
            schoolEmail: s.schoolEmail || "",
            principalName: s.principalName || "",
            treasurerName: s.treasurerName || "",
            paymentGatewayMode: s.paymentGatewayConfig ? JSON.parse(s.paymentGatewayConfig).mode || "MOCK" : "MOCK",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          paymentGatewayConfig: { mode: formData.paymentGatewayMode, enabled: true },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Pengaturan sekolah berhasil disimpan!", "success");
      } else {
        showToast(data.message || "Gagal menyimpan", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Memuat pengaturan...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pengaturan Sekolah</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Atur profil institusi sekolah, identitas kop surat kuitansi resmi, dan konfigurasi pembayaran.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Sekolah */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
            <School className="w-5 h-5 text-sky-600" />
            <span>Identitas Resmi Sekolah & Kop Kuitansi</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Sekolah *</label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor Pokok Sekolah Nasional (NPSN) *</label>
              <input
                type="text"
                required
                value={formData.schoolNpsn}
                onChange={(e) => setFormData({ ...formData, schoolNpsn: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-xs sm:text-sm">Alamat Lengkap Sekolah *</label>
            <textarea
              rows={2}
              required
              value={formData.schoolAddress}
              onChange={(e) => setFormData({ ...formData, schoolAddress: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 mb-1">No. Telepon Sekolah</label>
              <input
                type="text"
                value={formData.schoolPhone}
                onChange={(e) => setFormData({ ...formData, schoolPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Resmi Sekolah</label>
              <input
                type="email"
                value={formData.schoolEmail}
                onChange={(e) => setFormData({ ...formData, schoolEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Pejabat Penandatangan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Pejabat Penandatangan Kuitansi Digital</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Kepala Sekolah</label>
              <input
                type="text"
                value={formData.principalName}
                onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Bendahara Sekolah</label>
              <input
                type="text"
                value={formData.treasurerName}
                onChange={(e) => setFormData({ ...formData, treasurerName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Payment Gateway Mode */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
            <CreditCard className="w-5 h-5 text-purple-600" />
            <span>Mode Integrasi Payment Gateway</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <label
              className={`p-4 rounded-xl border cursor-pointer transition ${
                formData.paymentGatewayMode === "MOCK"
                  ? "bg-sky-50 border-sky-400 ring-2 ring-sky-100"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <input
                type="radio"
                name="pgMode"
                value="MOCK"
                checked={formData.paymentGatewayMode === "MOCK"}
                onChange={() => setFormData({ ...formData, paymentGatewayMode: "MOCK" })}
                className="sr-only"
              />
              <div className="font-bold text-slate-900">Sandbox Simulator (Mock)</div>
              <p className="text-slate-500 mt-1 text-[11px]">
                Uji coba alur pembayaran QRIS / VA langsung tanpa gateway sungguhan.
              </p>
            </label>

            <label
              className={`p-4 rounded-xl border cursor-pointer transition ${
                formData.paymentGatewayMode === "MIDTRANS"
                  ? "bg-sky-50 border-sky-400 ring-2 ring-sky-100"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <input
                type="radio"
                name="pgMode"
                value="MIDTRANS"
                checked={formData.paymentGatewayMode === "MIDTRANS"}
                onChange={() => setFormData({ ...formData, paymentGatewayMode: "MIDTRANS" })}
                className="sr-only"
              />
              <div className="font-bold text-slate-900">Midtrans Gateway</div>
              <p className="text-slate-500 mt-1 text-[11px]">
                Integrasi Snap API Midtrans untuk QRIS, GoPay, dan Bank VA resmi.
              </p>
            </label>

            <label
              className={`p-4 rounded-xl border cursor-pointer transition ${
                formData.paymentGatewayMode === "XENDIT"
                  ? "bg-sky-50 border-sky-400 ring-2 ring-sky-100"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <input
                type="radio"
                name="pgMode"
                value="XENDIT"
                checked={formData.paymentGatewayMode === "XENDIT"}
                onChange={() => setFormData({ ...formData, paymentGatewayMode: "XENDIT" })}
                className="sr-only"
              />
              <div className="font-bold text-slate-900">Xendit Invoice</div>
              <p className="text-slate-500 mt-1 text-[11px]">
                Integrasi Xendit Payment Links & Virtual Accounts otomatis.
              </p>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-600/30 transition disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan Perubahan Pengaturan"}
          </button>
        </div>
      </form>
    </div>
  );
}
