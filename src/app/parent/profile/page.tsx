"use client";

import React, { useState, useEffect } from "react";
import { User, Phone, Mail, MapPin, GraduationCap, ShieldCheck, LogOut, School } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function ParentProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfile(data.user);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Memuat profil...</div>;
  }

  const linkedStudents = profile?.parentProfile?.parentStudents?.map((ps: any) => ps.student) || [];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Profil Akun & Data Anak
        </h1>
        <p className="text-xs text-slate-500">
          Informasi identitas orang tua/wali dan data siswa yang terhubung dengan akun ini.
        </p>
      </div>

      {/* Parent Profile Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-sky-600/20">
            {profile?.name ? profile.name.slice(0, 2).toUpperCase() : "OT"}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">{profile?.name}</h2>
            <p className="text-xs text-sky-700 font-bold bg-sky-50 px-2.5 py-0.5 rounded-full inline-block border border-sky-200 mt-1">
              Akun Orang Tua / Wali Terverifikasi
            </p>
          </div>
        </div>

        <div className="space-y-2.5 text-xs sm:text-sm">
          <div className="flex items-center gap-3 text-slate-600">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{profile?.email}</span>
          </div>

          <div className="flex items-center gap-3 text-slate-600">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{profile?.phone || "Belum ada nomor HP terdaftar"}</span>
          </div>

          {profile?.parentProfile?.address && (
            <div className="flex items-start gap-3 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>{profile.parentProfile.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Linked Children Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <GraduationCap className="w-5 h-5 text-sky-600" />
            <span>Siswa Terhubung ({linkedStudents.length} Anak)</span>
          </div>
        </div>

        <div className="space-y-3">
          {linkedStudents.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Belum ada siswa yang ditautkan ke akun ini.</p>
          ) : (
            linkedStudents.map((s: any) => (
              <div
                key={s.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{s.fullName}</h4>
                  <div className="text-xs text-slate-500 mt-0.5">
                    NIS: <strong className="text-slate-700">{s.nis}</strong> • Kelas:{" "}
                    <strong className="text-sky-700">{s.class?.name || "-"}</strong>
                  </div>
                </div>

                <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-300">
                  {s.status === "ACTIVE" ? "Aktif" : s.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Security & System Info */}
      <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200/80 text-xs text-sky-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Sistem Pembayaran SPP Sekolah SPP-Ku menjamin keamanan data transaksi dan tagihan dengan enkripsi transaksi dan alokasi saldo presisi.
        </p>
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-2xl border border-rose-200 transition cursor-pointer text-xs sm:text-sm"
      >
        <LogOut className="w-4 h-4" />
        Keluar dari Akun (Logout)
      </button>
    </div>
  );
}
