import React from "react";

interface ProgressBarProps {
  current: number;
  total: number;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function ProgressBar({
  current,
  total,
  showText = true,
  size = "md",
  label,
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.min(100, Math.max(0, Math.round((current / total) * 100))) : 0;

  const heightClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  let colorClass = "bg-sky-500";
  if (percentage >= 100) {
    colorClass = "bg-emerald-500";
  } else if (percentage >= 50) {
    colorClass = "bg-sky-500";
  } else if (percentage > 0) {
    colorClass = "bg-amber-500";
  } else {
    colorClass = "bg-slate-300";
  }

  return (
    <div className="w-full">
      {showText && (
        <div className="flex justify-between items-center text-xs font-medium text-slate-600 mb-1.5">
          <span>{label || "Progress Pembayaran"}</span>
          <span className="font-semibold text-slate-900">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-200/80 rounded-full overflow-hidden ${heightClasses[size]}`}>
        <div
          className={`h-full ${colorClass} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
