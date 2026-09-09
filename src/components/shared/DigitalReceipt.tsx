"use client";

import React from "react";
import { Printer, CheckCircle, ArrowLeft, ShieldCheck, School } from "lucide-react";
import { formatRupiah, formatDateIndo, getPaymentMethodLabel } from "@/lib/formatters";
import Link from "next/link";

interface DigitalReceiptProps {
  payment: any;
  school: any;
  backUrl?: string;
}

export function DigitalReceipt({ payment, school, backUrl }: DigitalReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const student = payment?.student;
  const bill = payment?.bill;
  const installment = payment?.installment;

  return (
    <div className="max-w-2xl mx-auto my-6 px-4">
      {/* Top Action Bar */}
      <div className="no-print flex items-center justify-between mb-4">
        {backUrl ? (
          <Link
            href={backUrl}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
        ) : (
          <div />
        )}
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Cetak / Simpan PDF
        </button>
      </div>

      {/* Main Printable Receipt Card */}
      <div className="print-receipt-container bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden p-6 sm:p-8 relative">
        {/* Watermark */}
        <div className="absolute right-6 top-24 opacity-5 pointer-events-none">
          <School className="w-72 h-72 text-slate-900" />
        </div>

        {/* Header / Kop Surat */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white p-1 border border-lime-300 flex items-center justify-center shrink-0 shadow-sm">
              <img
                src="/logo.png"
                alt="White Bee School Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {school?.schoolName || "WHITE BEE SCHOOL OF LIFE"}
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                NPSN: {school?.schoolNpsn || "20104567"} • {school?.schoolAddress || "Jl. Taman White Bee No. 12, Jakarta"}
              </p>
              <p className="text-xs text-slate-500">
                Telp: {school?.schoolPhone || "021-78901234"} | Email: {school?.schoolEmail || "info@whitebee.sch.id"}
              </p>
            </div>
          </div>
        </div>

        {/* Title & Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <div>
            <span className="text-xs font-bold tracking-widest text-sky-700 uppercase bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
              BUKTI PEMBAYARAN RESMI
            </span>
            <div className="text-xs text-slate-500 mt-1">
              Nomor: <span className="font-mono font-bold text-slate-900">{payment.paymentNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-1 rounded-full text-xs font-bold shadow-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            LUNAS / BERHASIL
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200/80 mb-6 text-sm">
          <div>
            <span className="text-xs text-slate-500 block">Nama Siswa</span>
            <span className="font-bold text-slate-900 text-base">{student?.fullName}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">NIS / NISN</span>
            <span className="font-semibold text-slate-800">
              {student?.nis} {student?.nisn ? `/ ${student.nisn}` : ""}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Kelas</span>
            <span className="font-semibold text-slate-800">{student?.class?.name || "-"}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Tanggal & Waktu Pembayaran</span>
            <span className="font-semibold text-slate-800">
              {formatDateIndo(payment.paidAt || payment.createdAt, true)} WIB
            </span>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/90 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Deskripsi Tagihan</th>
                <th className="px-4 py-3 text-center">Keterangan / Termin</th>
                <th className="px-4 py-3 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              <tr>
                <td className="px-4 py-3.5 font-medium text-slate-900">
                  {bill?.title || "Pembayaran Biaya Sekolah"}
                  <span className="block text-xs text-slate-500 font-normal">
                    Jenis: {bill?.billType?.name || "SPP"}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center text-xs text-slate-600">
                  {installment ? (
                    <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-medium">
                      Cicilan Ke-{installment.installmentNumber}
                    </span>
                  ) : (
                    "Pembayaran Penuh"
                  )}
                </td>
                <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                  {formatRupiah(payment.amount)}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-50/80 border-t border-slate-200 font-semibold text-slate-900">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-right text-xs uppercase text-slate-600">
                  Total Dibayar:
                </td>
                <td className="px-4 py-3 text-right text-base font-extrabold text-sky-700">
                  {formatRupiah(payment.amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment Details & Security Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 mb-8 border-b border-slate-100 pb-6">
          <div>
            <p>
              <span className="text-slate-400">Metode Pembayaran:</span>{" "}
              <strong className="text-slate-800">{getPaymentMethodLabel(payment.paymentMethod)}</strong>
            </p>
            {payment.referenceNumber && (
              <p className="mt-1">
                <span className="text-slate-400">No. Referensi:</span>{" "}
                <strong className="text-slate-800 font-mono">{payment.referenceNumber}</strong>
              </p>
            )}
            {payment.recordedBy && (
              <p className="mt-1">
                <span className="text-slate-400">Dicatat oleh Petugas:</span>{" "}
                <strong className="text-slate-800">{payment.recordedBy.name}</strong>
              </p>
            )}
          </div>
          <div className="flex items-start gap-2 bg-emerald-50 text-emerald-900 p-3 rounded-lg border border-emerald-200/70">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-tight">
              Dokumen ini sah dan diterbitkan secara digital oleh Sistem SPP Sekolah. Bukti ini tidak memerlukan tanda tangan basah fisik.
            </p>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 text-center text-xs text-slate-800 pt-2">
          <div>
            <p className="text-slate-500 mb-12">Wali / Pembayar,</p>
            <p className="font-bold underline text-slate-900">
              {payment.student?.parentStudents?.[0]?.parent?.user?.name || "Orang Tua Siswa"}
            </p>
          </div>
          <div>
            <p className="text-slate-500 mb-12">
              Jakarta, {formatDateIndo(payment.paidAt || payment.createdAt)}
              <br />
              Bendahara Sekolah,
            </p>
            <p className="font-bold underline text-slate-900">
              {school?.treasurerName || "Siti Rahmawati, S.E"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
