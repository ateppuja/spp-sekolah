"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, ArrowRight, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Email atau kata sandi tidak sesuai.");
        setLoading(false);
        return;
      }

      router.push(data.redirectUrl || "/");
      router.refresh();
    } catch (err: any) {
      setError("Gagal terhubung ke server. Silakan coba lagi.");
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100/10 overflow-hidden">
        {/* Top Header Card with WhiteBee Logo */}
        <div className="bg-gradient-to-r from-lime-600 via-emerald-600 to-lime-700 text-white p-8 text-center relative">
          <div className="w-24 h-24 rounded-2xl bg-white p-1.5 flex items-center justify-center mx-auto mb-3 shadow-xl ring-4 ring-white/30" style={{ width: 96, height: 96 }}>
            <img
              src="/logo.png"
              alt="White Bee School of Life Logo"
              width={88}
              height={88}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">
            White Bee
          </h1>
          <div className="text-xs font-bold text-lime-100 tracking-wider uppercase">
            School of Life
          </div>
          <p className="text-[11px] text-lime-200 mt-1 font-medium">
            Sistem Pembayaran SPP & Iuran Sekolah
          </p>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sekolah.id atau orangtua@gmail.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-lime-600 hover:bg-lime-700 text-white font-black rounded-xl shadow-lg shadow-lime-600/30 transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2.5">
              <ShieldCheck className="w-4 h-4 text-lime-600" />
              <span>PILIH AKUN DEMO CEPAT:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemo("admin@sekolah.id", "admin123")}
                className="p-2.5 rounded-xl border border-lime-200 bg-lime-50 text-lime-900 font-bold hover:bg-lime-100 transition text-left"
              >
                <div className="text-[10px] text-lime-700 uppercase font-extrabold">Role 1</div>
                Admin Sekolah
              </button>
              <button
                type="button"
                onClick={() => fillDemo("orangtua1@gmail.com", "ortu123")}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 font-bold hover:bg-emerald-100 transition text-left"
              >
                <div className="text-[10px] text-emerald-700 uppercase font-extrabold">Role 2 (2 Anak)</div>
                Orang Tua 1
              </button>
              <button
                type="button"
                onClick={() => fillDemo("orangtua2@gmail.com", "ortu123")}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium hover:bg-slate-100 transition text-left"
              >
                <div className="text-[10px] text-slate-500 uppercase font-extrabold">Role 2</div>
                Orang Tua 2
              </button>
              <button
                type="button"
                onClick={() => fillDemo("orangtua3@gmail.com", "ortu123")}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium hover:bg-slate-100 transition text-left"
              >
                <div className="text-[10px] text-slate-500 uppercase font-extrabold">Role 2 (2 Anak)</div>
                Orang Tua 3
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
