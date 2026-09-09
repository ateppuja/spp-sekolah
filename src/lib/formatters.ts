/**
 * Format an integer number to Indonesian Rupiah currency format.
 * Example: 1500000 -> "Rp 1.500.000"
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "Rp 0";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a Date or date string to Indonesian localized format.
 * Example: "2026-07-10" -> "10 Juli 2026"
 */
export function formatDateIndo(
  date: string | Date | null | undefined,
  includeTime: boolean = false
): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  };

  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
    options.hour12 = false;
  }

  return new Intl.DateTimeFormat("id-ID", options).format(d);
}

/**
 * Format short date (e.g. 10 Jul 2026)
 */
export function formatShortDateIndo(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(d);
}

/**
 * Calculate days overdue from dueDate until today
 */
export function calculateDaysOverdue(dueDate: string | Date): number {
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const now = new Date();
  
  // Set both to midnight Asia/Jakarta
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = nowMidnight.getTime() - dueMidnight.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Status Label and badge styling helper
 */
export function getStatusBadgeInfo(status: string): {
  label: string;
  className: string;
  bgClass: string;
  textClass: string;
} {
  switch (status?.toUpperCase()) {
    case "PAID":
    case "SUCCESS":
    case "LUNAS":
    case "BERHASIL":
      return {
        label: "Lunas",
        className: "bg-emerald-100 text-emerald-800 border-emerald-300",
        bgClass: "bg-emerald-50 text-emerald-700",
        textClass: "text-emerald-600",
      };
    case "PARTIAL":
    case "CICILAN_BERJALAN":
      return {
        label: "Cicilan Berjalan",
        className: "bg-blue-100 text-blue-800 border-blue-300",
        bgClass: "bg-blue-50 text-blue-700",
        textClass: "text-blue-600",
      };
    case "PENDING":
    case "MENUNGGU_PEMBAYARAN":
      return {
        label: "Menunggu Pembayaran",
        className: "bg-amber-100 text-amber-800 border-amber-300",
        bgClass: "bg-amber-50 text-amber-700",
        textClass: "text-amber-600",
      };
    case "OVERDUE":
    case "TERLAMBAT":
      return {
        label: "Terlambat",
        className: "bg-rose-100 text-rose-800 border-rose-300",
        bgClass: "bg-rose-50 text-rose-700",
        textClass: "text-rose-600",
      };
    case "FAILED":
    case "GAGAL":
      return {
        label: "Gagal",
        className: "bg-rose-100 text-rose-800 border-rose-300",
        bgClass: "bg-rose-50 text-rose-700",
        textClass: "text-rose-600",
      };
    case "EXPIRED":
    case "KEDALUWARSA":
      return {
        label: "Kedaluwarsa",
        className: "bg-gray-100 text-gray-800 border-gray-300",
        bgClass: "bg-gray-50 text-gray-700",
        textClass: "text-gray-600",
      };
    case "CANCELLED":
    case "DIBATALKAN":
      return {
        label: "Dibatalkan",
        className: "bg-gray-100 text-gray-800 border-gray-300",
        bgClass: "bg-gray-50 text-gray-700",
        textClass: "text-gray-600",
      };
    case "UNPAID":
    case "BELUM_BAYAR":
    default:
      return {
        label: "Belum Bayar",
        className: "bg-slate-100 text-slate-800 border-slate-300",
        bgClass: "bg-slate-50 text-slate-700",
        textClass: "text-slate-600",
      };
  }
}

/**
 * Payment method label helper
 */
export function getPaymentMethodLabel(method: string): string {
  switch (method?.toUpperCase()) {
    case "QRIS":
      return "QRIS (Semua E-Wallet / Bank)";
    case "VA_BCA":
      return "BCA Virtual Account";
    case "VA_BNI":
      return "BNI Virtual Account";
    case "VA_BRI":
      return "BRI Virtual Account";
    case "VA_MANDIRI":
      return "Mandiri Virtual Account";
    case "BANK_TRANSFER":
      return "Transfer Bank Manual";
    case "CASH":
      return "Tunai / Kasir Sekolah";
    default:
      return method || "Lainnya";
  }
}
