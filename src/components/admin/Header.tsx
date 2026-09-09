"use client";

import React, { useState, useEffect } from "react";
import { Menu, Bell, User, LogOut, ExternalLink, School } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface HeaderProps {
  onMenuClick: () => void;
  user?: any;
}

export function Header({ onMenuClick, user }: HeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [schoolName, setSchoolName] = useState("White Bee School of Life");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.schoolName) setSchoolName(data.data.schoolName);
      })
      .catch(() => {});

    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.unreadCount !== undefined) setUnreadCount(data.data.unreadCount);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-600 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden sm:flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white p-0.5 border border-lime-200 shadow-xs" style={{ width: 32, height: 32 }}>
            <img
              src="/logo.png"
              alt="White Bee Logo"
              width={28}
              height={28}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-sm font-extrabold text-slate-800 tracking-tight">{schoolName}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick link to Parent View for testing */}
        <Link
          href="/parent"
          className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Lihat Portal Ortu
        </Link>

        {/* Notifications Icon */}
        <Link
          href="/admin/notifications"
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </Link>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs border border-sky-200">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="hidden md:block text-left text-xs">
              <div className="font-bold text-slate-800 leading-tight">{user?.name || "Admin TU"}</div>
              <div className="text-slate-500">Administrator</div>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{user?.name || "Admin Sekolah"}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || "admin@sekolah.id"}</p>
              </div>

              <Link
                href="/admin/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
              >
                <User className="w-4 h-4 text-slate-400" />
                Pengaturan Sekolah
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium text-left"
              >
                <LogOut className="w-4 h-4" />
                Keluar (Logout)
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
