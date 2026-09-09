"use client";

import React from "react";
import { CheckCircle2, Circle, Clock, ArrowRight, ShieldAlert } from "lucide-react";
import { formatRupiah, formatDateIndo } from "@/lib/formatters";
import Link from "next/link";

interface Installment {
  id: string;
  installmentNumber: number;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string | Date;
  status: string;
  notes?: string;
}

interface InstallmentTimelineProps {
  billId: string;
  installments: Installment[];
  onPayClick?: (installment: Installment) => void;
  showPayButton?: boolean;
}

export function InstallmentTimeline({
  billId,
  installments,
  onPayClick,
  showPayButton = true,
}: InstallmentTimelineProps) {
  if (!installments || installments.length === 0) {
    return (
      <div className="text-xs text-slate-500 italic py-2">
        Tagihan ini tidak menggunakan skema cicilan.
      </div>
    );
  }

  // Find the first unpaid installment (the active term)
  const firstUnpaidIndex = installments.findIndex((i) => i.remainingAmount > 0);

  return (
    <div className="space-y-4">
      {/* Notice about admin control */}
      <div className="flex items-center gap-2 text-[11px] bg-sky-50 text-sky-800 p-2.5 rounded-xl border border-sky-200/80">
        <ShieldAlert className="w-4 h-4 text-sky-600 shrink-0" />
        <span>Skema & nominal cicilan ini telah resmi ditetapkan oleh pihak Admin Sekolah.</span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {installments.map((inst, idx) => {
          const isPaid = inst.remainingAmount === 0;
          const isCurrentPayable = idx === firstUnpaidIndex;
          const isOverdue =
            !isPaid && new Date(inst.dueDate).getTime() < new Date().getTime();

          return (
            <div key={inst.id} className="relative group">
              {/* Timeline Dot */}
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                  isPaid
                    ? "bg-emerald-500 text-white"
                    : isCurrentPayable
                    ? isOverdue
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-sky-600 text-white"
                    : "bg-slate-300 text-slate-600"
                }`}
              >
                {isPaid ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[10px] font-bold">{inst.installmentNumber}</span>
                )}
              </div>

              {/* Installment Card Content */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isPaid
                    ? "bg-slate-50 border-slate-200 opacity-80"
                    : isCurrentPayable
                    ? "bg-white border-sky-300 shadow-md ring-1 ring-sky-100"
                    : "bg-white border-slate-200 opacity-90"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        Cicilan Ke-{inst.installmentNumber}
                      </h4>
                      {isPaid ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Lunas ✓
                        </span>
                      ) : isOverdue ? (
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                          Jatuh Tempo Terlewat
                        </span>
                      ) : isCurrentPayable ? (
                        <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
                          Siap Dibayar
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                          Menunggu Termin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Jatuh Tempo: <strong>{formatDateIndo(inst.dueDate)}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-extrabold text-slate-900">
                      {formatRupiah(inst.amount)}
                    </div>
                    {isPaid ? (
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        Dibayar Penuh
                      </span>
                    ) : inst.paidAmount > 0 ? (
                      <span className="text-[10px] text-amber-600 font-semibold">
                        Sisa: {formatRupiah(inst.remainingAmount)}
                      </span>
                    ) : null}
                  </div>
                </div>

                {inst.notes && (
                  <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    Catatan: {inst.notes}
                  </p>
                )}

                {/* Quick Pay Button on Active Term */}
                {showPayButton && !isPaid && isCurrentPayable && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-600">
                      Termin aktif yang harus dibayar sekarang
                    </span>
                    {onPayClick ? (
                      <button
                        onClick={() => onPayClick(inst)}
                        className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition shadow-sm"
                      >
                        Bayar Cicilan Ini
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <Link
                        href={`/parent/checkout?billId=${billId}&installmentId=${inst.id}`}
                        className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition shadow-sm"
                      >
                        Bayar Sekarang
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
