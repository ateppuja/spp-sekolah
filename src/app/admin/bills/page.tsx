"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  Search,
  Plus,
  Filter,
  Eye,
  Trash2,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Split,
  Layers,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah, formatDateIndo } from "@/lib/formatters";
import { InstallmentTimeline } from "@/components/parent/InstallmentTimeline";

export default function AdminBillsPage() {
  const { showToast } = useToast();
  const [bills, setBills] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [billTypes, setBillTypes] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);

  // Form State
  const [targetType, setTargetType] = useState<"SINGLE" | "CLASS" | "ALL">("SINGLE");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedBillTypeId, setSelectedBillTypeId] = useState("");
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState<number>(500000);
  const [dueDate, setDueDate] = useState("2026-07-10");
  const [notes, setNotes] = useState("");

  // Installment configuration state
  const [allowInstallment, setAllowInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(3);
  const [installmentList, setInstallmentList] = useState<
    Array<{ installmentNumber: number; amount: number; dueDate: string; notes: string }>
  >([]);

  const fetchBills = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (classFilter) params.append("classId", classFilter);
      if (typeFilter) params.append("billTypeId", typeFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/admin/bills?${params.toString()}`);
      const data = await res.json();
      if (data.success) setBills(data.data);
    } catch (e) {
      showToast("Gagal memuat tagihan", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchMasters = async () => {
    try {
      const [resS, resC, resBT, resAY] = await Promise.all([
        fetch("/api/admin/students"),
        fetch("/api/admin/classes"),
        fetch("/api/admin/bill-types"),
        fetch("/api/admin/academic-years"),
      ]);
      const dataS = await resS.json();
      const dataC = await resC.json();
      const dataBT = await resBT.json();
      const dataAY = await resAY.json();

      if (dataS.success) setStudents(dataS.data);
      if (dataC.success) setClasses(dataC.data);
      if (dataBT.success) setBillTypes(dataBT.data);
      if (dataAY.success) {
        setAcademicYears(dataAY.data);
        const currentYear = dataAY.data.find((y: any) => y.isCurrent) || dataAY.data[0];
        if (currentYear) setSelectedAcademicYearId(currentYear.id);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  useEffect(() => {
    fetchBills();
  }, [search, classFilter, typeFilter, statusFilter]);

  // Handle bill type change to prefill defaults
  const handleBillTypeChange = (btId: string) => {
    setSelectedBillTypeId(btId);
    const bt = billTypes.find((b) => b.id === btId);
    if (bt) {
      if (bt.defaultAmount > 0) setTotalAmount(bt.defaultAmount);
      setTitle(bt.name);
      if (bt.isInstallmentAllowed) {
        setAllowInstallment(true);
        generateEqualInstallments(bt.defaultAmount || totalAmount, 3);
      } else {
        setAllowInstallment(false);
      }
    }
  };

  // Helper to split installments equally
  const generateEqualInstallments = (total: number, count: number) => {
    const list = [];
    const baseAmount = Math.floor(total / count);
    const remainder = total - baseAmount * count;

    for (let i = 1; i <= count; i++) {
      // Add remainder to the first installment
      const amount = i === 1 ? baseAmount + remainder : baseAmount;
      // Calculate future due dates (e.g. +1 month each)
      const d = new Date(dueDate || new Date());
      d.setMonth(d.getMonth() + (i - 1));
      const dateStr = d.toISOString().split("T")[0];

      list.push({
        installmentNumber: i,
        amount,
        dueDate: dateStr,
        notes: `Cicilan Ke-${i}`,
      });
    }
    setInstallmentList(list);
  };

  const handleInstallmentCountChange = (count: number) => {
    setInstallmentCount(count);
    generateEqualInstallments(totalAmount, count);
  };

  const handleInstallmentItemChange = (index: number, field: string, value: any) => {
    const updated = [...installmentList];
    updated[index] = { ...updated[index], [field]: value };
    setInstallmentList(updated);
  };

  const calculateInstallmentSum = () => {
    return installmentList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();

    if (allowInstallment) {
      const sum = calculateInstallmentSum();
      if (sum !== totalAmount) {
        showToast(
          `Total cicilan (${formatRupiah(sum)}) harus sama persis dengan total tagihan (${formatRupiah(
            totalAmount
          )})!`,
          "warning"
        );
        return;
      }
    }

    try {
      const payload: any = {
        targetType,
        studentId: selectedStudentId,
        classId: selectedClassId,
        billTypeId: selectedBillTypeId,
        academicYearId: selectedAcademicYearId,
        title,
        totalAmount,
        dueDate,
        allowInstallment,
        notes,
        installments: allowInstallment ? installmentList : undefined,
      };

      const res = await fetch("/api/admin/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Tagihan berhasil diterbitkan!", "success");
        setIsCreateOpen(false);
        fetchBills();
      } else {
        showToast(data.message || "Gagal membuat tagihan", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem", "error");
    }
  };

  const openDetail = async (b: any) => {
    try {
      const res = await fetch(`/api/admin/bills/${b.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedBill(data.data);
        setIsDetailOpen(true);
      }
    } catch (e) {
      showToast("Gagal memuat rincian tagihan", "error");
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tagihan ini?")) return;
    try {
      const res = await fetch(`/api/admin/bills/${billId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Tagihan berhasil dihapus.", "success");
        setIsDetailOpen(false);
        fetchBills();
      } else {
        showToast(data.message || "Gagal menghapus tagihan", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Tagihan</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Buat tagihan SPP & iuran sekolah (per siswa, per kelas, atau masal) dengan skema cicilan resmi.
          </p>
        </div>

        <button
          onClick={() => {
            if (billTypes.length > 0) handleBillTypeChange(billTypes[0].id);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-sky-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Buat Tagihan Baru
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama tagihan, no tagihan, atau siswa..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white"
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none"
        >
          <option value="">Semua Kelas</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none"
        >
          <option value="">Semua Jenis</option>
          {billTypes.map((bt) => (
            <option key={bt.id} value={bt.id}>
              {bt.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none"
        >
          <option value="">Semua Status</option>
          <option value="UNPAID">Belum Bayar</option>
          <option value="PARTIAL">Cicilan Berjalan</option>
          <option value="PAID">Lunas</option>
          <option value="OVERDUE">Terlambat</option>
        </select>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">No. Tagihan</th>
                <th className="px-6 py-3.5">Nama Siswa & Kelas</th>
                <th className="px-6 py-3.5">Judul Tagihan</th>
                <th className="px-6 py-3.5 text-right">Total Tagihan</th>
                <th className="px-6 py-3.5 text-right">Sisa Piutang</th>
                <th className="px-6 py-3.5">Jatuh Tempo</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    Memuat tagihan...
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    Belum ada data tagihan yang sesuai.
                  </td>
                </tr>
              ) : (
                bills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{b.billNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{b.student?.fullName}</div>
                      <div className="text-xs text-slate-500">
                        NIS: {b.student?.nis} • Kelas {b.student?.class?.name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{b.title}</div>
                      {b.allowInstallment && (
                        <div className="text-[11px] text-sky-700 font-bold flex items-center gap-1 mt-0.5">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{b.installments?.length || 0} Termin Cicilan</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {formatRupiah(b.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-rose-600">
                      {formatRupiah(b.remainingAmount)}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      {formatDateIndo(b.dueDate)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge status={b.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openDetail(b)}
                        className="inline-flex items-center gap-1 p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Buat Tagihan Baru */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Buat Tagihan Baru"
        subtitle="Terbitkan tagihan baru untuk siswa atau seluruh rombel kelas"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateBill} className="space-y-4 text-xs sm:text-sm">
          {/* Target Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Penerima Tagihan *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetType("SINGLE")}
                className={`py-2 px-3 rounded-xl font-bold border transition text-center ${
                  targetType === "SINGLE"
                    ? "bg-sky-50 text-sky-700 border-sky-300"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Satu Siswa
              </button>
              <button
                type="button"
                onClick={() => setTargetType("CLASS")}
                className={`py-2 px-3 rounded-xl font-bold border transition text-center ${
                  targetType === "CLASS"
                    ? "bg-sky-50 text-sky-700 border-sky-300"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Satu Kelas (Rombel)
              </button>
              <button
                type="button"
                onClick={() => setTargetType("ALL")}
                className={`py-2 px-3 rounded-xl font-bold border transition text-center ${
                  targetType === "ALL"
                    ? "bg-sky-50 text-sky-700 border-sky-300"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Semua Siswa Aktif
              </button>
            </div>
          </div>

          {/* Conditional Target Input */}
          {targetType === "SINGLE" && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pilih Siswa *</label>
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              >
                <option value="">Pilih Siswa...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} — NIS: {s.nis} ({s.class?.name || "Kelas"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetType === "CLASS" && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pilih Kelas *</label>
              <select
                required
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              >
                <option value="">Pilih Kelas...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name} ({c._count?.students || 0} Siswa)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Type & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jenis Tagihan *</label>
              <select
                required
                value={selectedBillTypeId}
                onChange={(e) => handleBillTypeChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              >
                <option value="">Pilih Jenis...</option>
                {billTypes.map((bt) => (
                  <option key={bt.id} value={bt.id}>
                    {bt.name} {bt.isInstallmentAllowed ? "(Bisa Dicicil)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran *</label>
              <select
                required
                value={selectedAcademicYearId}
                onChange={(e) => setSelectedAcademicYearId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              >
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>
                    {ay.name} ({ay.semester}) {ay.isCurrent ? "★ Aktif" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title, Nominal, Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block font-bold text-slate-700 mb-1">Judul Tagihan *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: SPP Bulan Juli 2026"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Nominal (Rp) *</label>
              <input
                type="number"
                required
                min={1000}
                value={totalAmount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTotalAmount(val);
                  if (allowInstallment) generateEqualInstallments(val, installmentCount);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jatuh Tempo Tagihan *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (allowInstallment) generateEqualInstallments(totalAmount, installmentCount);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* FITUR CICILAN ADMIN SECTION (SANGAT PENTING)            */}
          {/* ======================================================== */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between bg-sky-50/70 p-3.5 rounded-2xl border border-sky-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Apakah tagihan dapat dicicil?
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Cicilan sepenuhnya diatur oleh Admin. Orang tua hanya membayar sesuai skema ini.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowInstallment}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAllowInstallment(checked);
                    if (checked && installmentList.length === 0) {
                      generateEqualInstallments(totalAmount, 3);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>

            {/* Installment configuration sub-form */}
            {allowInstallment && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-slate-700 text-xs">Jumlah Termin Cicilan:</label>
                    <select
                      value={installmentCount}
                      onChange={(e) => handleInstallmentCountChange(Number(e.target.value))}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-sky-700 focus:outline-none"
                    >
                      <option value={2}>2 Termin</option>
                      <option value={3}>3 Termin</option>
                      <option value={4}>4 Termin</option>
                      <option value={5}>5 Termin</option>
                      <option value={6}>6 Termin</option>
                      <option value={10}>10 Termin</option>
                      <option value={12}>12 Termin</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => generateEqualInstallments(totalAmount, installmentCount)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-white border border-sky-300 px-3 py-1.5 rounded-lg hover:bg-sky-50 shadow-xs"
                  >
                    <Split className="w-3.5 h-3.5" />
                    Bagi Rata Otomatis
                  </button>
                </div>

                {/* Installments Table Editor */}
                <div className="space-y-2.5">
                  {installmentList.map((inst, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      <div className="sm:col-span-3 font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-extrabold flex items-center justify-center">
                          {inst.installmentNumber}
                        </span>
                        <span>Cicilan Ke-{inst.installmentNumber}</span>
                      </div>

                      <div className="sm:col-span-4">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                            Rp
                          </span>
                          <input
                            type="number"
                            required
                            min={1}
                            value={inst.amount}
                            onChange={(e) =>
                              handleInstallmentItemChange(idx, "amount", Number(e.target.value))
                            }
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-5">
                        <input
                          type="date"
                          required
                          value={inst.dueDate}
                          onChange={(e) =>
                            handleInstallmentItemChange(idx, "dueDate", e.target.value)
                          }
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Validation Summary */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500">Total Tagihan: </span>
                    <strong className="text-slate-900">{formatRupiah(totalAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Akumulasi Cicilan: </span>
                    <strong
                      className={
                        calculateInstallmentSum() === totalAmount ? "text-emerald-600 font-extrabold" : "text-rose-600 font-extrabold"
                      }
                    >
                      {formatRupiah(calculateInstallmentSum())}
                    </strong>
                    {calculateInstallmentSum() === totalAmount ? (
                      <span className="ml-2 text-emerald-600 font-bold">✓ Sesuai</span>
                    ) : (
                      <span className="ml-2 text-rose-600 font-bold">
                        ✗ Selisih: {formatRupiah(Math.abs(totalAmount - calculateInstallmentSum()))}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan jika diperlukan..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md shadow-sky-600/20"
            >
              Terbitkan Tagihan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Detail Tagihan */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Rincian Tagihan & Cicilan"
        subtitle={selectedBill?.billNumber}
        maxWidth="2xl"
      >
        {selectedBill && (
          <div className="space-y-6 text-xs sm:text-sm">
            {/* Summary Banner */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Siswa</span>
                <span className="font-bold text-slate-900">{selectedBill.student?.fullName}</span>
                <span className="text-slate-500 block text-[10px]">
                  Kelas: {selectedBill.student?.class?.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Tagihan</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {formatRupiah(selectedBill.totalAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Sisa Piutang</span>
                <span className="font-extrabold text-rose-600 text-sm">
                  {formatRupiah(selectedBill.remainingAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Status</span>
                <Badge status={selectedBill.status} />
              </div>
            </div>

            {/* Installments Breakdown */}
            {selectedBill.allowInstallment && (
              <div>
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-sky-600" />
                  Skema Cicilan Resmi Admin:
                </h4>
                <InstallmentTimeline
                  billId={selectedBill.id}
                  installments={selectedBill.installments || []}
                  showPayButton={false}
                />
              </div>
            )}

            {/* Payment Transactions Log */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Riwayat Pembayaran Masuk:</h4>
              <div className="space-y-2">
                {selectedBill.payments?.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">Belum ada transaksi pembayaran masuk.</p>
                ) : (
                  selectedBill.payments?.map((p: any) => (
                    <div
                      key={p.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-900">{p.paymentNumber}</span>
                        <div className="text-slate-500">
                          {p.paymentMethod} • {formatDateIndo(p.paidAt || p.createdAt, true)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-600">{formatRupiah(p.amount)}</span>
                        <Badge status={p.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDeleteBill(selectedBill.id)}
                className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Tagihan
              </button>

              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
