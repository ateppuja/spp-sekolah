"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  Receipt,
  CreditCard,
  Banknote,
  AlertTriangle,
  FileSpreadsheet,
  Bell,
  Settings,
  History,
  School,
  X,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Data Siswa", href: "/admin/students", icon: Users },
  { name: "Kelas", href: "/admin/classes", icon: GraduationCap },
  { name: "Tahun Ajaran", href: "/admin/academic-years", icon: Calendar },
  { name: "Tagihan", href: "/admin/bills", icon: Receipt },
  { name: "Cicilan", href: "/admin/installments", icon: CreditCard, highlight: true },
  { name: "Pembayaran", href: "/admin/payments", icon: Banknote },
  { name: "Tunggakan", href: "/admin/arrears", icon: AlertTriangle },
  { name: "Laporan", href: "/admin/reports", icon: FileSpreadsheet },
  { name: "Notifikasi", href: "/admin/notifications", icon: Bell },
  { name: "Audit Log", href: "/admin/audit-logs", icon: History },
  { name: "Pengaturan", href: "/admin/settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-slate-800 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md ring-2 ring-lime-400/30" style={{ width: 44, height: 44 }}>
              <img
                src="/logo.png"
                alt="White Bee Logo"
                width={40}
                height={40}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="font-black text-sm tracking-tight text-white leading-tight truncate">
                White Bee
              </div>
              <div className="text-[10px] text-lime-400 font-bold tracking-wide uppercase truncate">
                School of Life
              </div>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose()}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? "text-white" : item.highlight ? "text-amber-400" : "text-slate-400"
                  }`}
                />
                <span className="flex-1">{item.name}</span>
                {item.highlight && !isActive && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-semibold">
                    Admin
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center justify-between font-medium">
            <span>Sistem SPP v1.0</span>
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
