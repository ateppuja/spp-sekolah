import React from "react";
import { getStatusBadgeInfo } from "@/lib/formatters";

interface BadgeProps {
  status?: string;
  label?: string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
}

export function Badge({ status, label, variant, size = "sm" }: BadgeProps) {
  if (status) {
    const info = getStatusBadgeInfo(status);
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${
          size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
        } ${info.className}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            status.toUpperCase() === "PAID" || status.toUpperCase() === "SUCCESS"
              ? "bg-emerald-500"
              : status.toUpperCase() === "PARTIAL"
              ? "bg-blue-500"
              : status.toUpperCase() === "OVERDUE" || status.toUpperCase() === "FAILED"
              ? "bg-rose-500"
              : status.toUpperCase() === "PENDING"
              ? "bg-amber-500"
              : "bg-slate-400"
          }`}
        />
        {label || info.label}
      </span>
    );
  }

  const variantStyles = {
    success: "bg-emerald-100 text-emerald-800 border-emerald-300",
    warning: "bg-amber-100 text-amber-800 border-amber-300",
    danger: "bg-rose-100 text-rose-800 border-rose-300",
    info: "bg-sky-100 text-sky-800 border-sky-300",
    neutral: "bg-slate-100 text-slate-800 border-slate-300",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
      } ${variantStyles[variant || "neutral"]}`}
    >
      {label}
    </span>
  );
}
