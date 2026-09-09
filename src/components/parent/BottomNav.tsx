"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, History, Bell, User } from "lucide-react";

const navItems = [
  { name: "Beranda", href: "/parent", icon: Home, exact: true },
  { name: "Tagihan", href: "/parent/bills", icon: Receipt },
  { name: "Riwayat", href: "/parent/payments", icon: History },
  { name: "Notifikasi", href: "/parent/notifications", icon: Bell },
  { name: "Profil", href: "/parent/profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 md:hidden pb-safe">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive ? "text-sky-600 font-bold" : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-2"}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-sky-600" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
