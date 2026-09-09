"use client";

import React, { useState, useEffect, use } from "react";
import { DigitalReceipt } from "@/components/shared/DigitalReceipt";
import { useToast } from "@/components/ui/Toast";

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/payments/${id}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData.data);
        } else {
          showToast(resData.message || "Gagal memuat kuitansi", "error");
        }
        setLoading(false);
      })
      .catch(() => {
        showToast("Terjadi kesalahan sistem", "error");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-sky-400/30 border-t-sky-400 rounded-full animate-spin mx-auto mb-3" />
        Memuat Bukti Pembayaran Resmi...
      </div>
    );
  }

  if (!data?.payment) {
    return (
      <div className="p-12 text-center text-slate-400">
        Bukti pembayaran tidak ditemukan atau telah dihapus.
      </div>
    );
  }

  return (
    <DigitalReceipt
      payment={data.payment}
      school={data.school}
      backUrl="/parent/payments"
    />
  );
}
