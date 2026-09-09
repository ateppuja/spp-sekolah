"use client";

import React, { useState, useEffect } from "react";
import { BottomNav } from "@/components/parent/BottomNav";
import { ToastProvider } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import Link from "next/link";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});

    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.unreadCount !== undefined) setUnreadCount(data.data.unreadCount);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-8">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/parent" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white p-0.5 border border-lime-300 flex items-center justify-center shrink-0 shadow-sm" style={{ width: 40, height: 40 }}>
              <img
                src="/logo.png"
                alt="White Bee Logo"
                width={36}
                height={36}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-base font-black text-slate-900 tracking-tight leading-tight">
                White Bee
              </div>
              <div className="text-[10px] text-lime-700 font-extrabold uppercase tracking-wide">
                School of Life
              </div>
            </div>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-xl transition"
              >
                Ke Admin
              </Link>
            )}

            <Link
              href="/parent/notifications"
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </Link>

            <Link
              href="/parent/profile"
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition"
            >
              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs border border-sky-200">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "OT"}
              </div>
              <span className="hidden md:inline-block text-xs font-bold text-slate-800">
                {user?.name || "Orang Tua"}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </ToastProvider>
  );
}
