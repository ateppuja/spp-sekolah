"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Plus, CheckCircle, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export default function AcademicYearsPage() {
  const { showToast } = useToast();
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "2026/2027",
    semester: "GANJIL",
    isCurrent: false,
    startDate: "",
    endDate: "",
  });

  const fetchYears = async () => {
    try {
      const res = await fetch("/api/admin/academic-years");
      const data = await res.json();
      if (data.success) setYears(data.data);
    } catch (e) {
      showToast("Gagal memuat tahun ajaran", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/academic-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Tahun ajaran berhasil ditambahkan!", "success");
        setIsAddOpen(false);
        fetchYears();
      } else {
        showToast(data.message || "Gagal membuat tahun ajaran", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (y: any) => {
    setSelectedYear(y);
    setFormData({
      name: y.name,
      semester: y.semester,
      isCurrent: !!y.isCurrent,
      startDate: y.startDate ? y.startDate.split("T")[0] : "",
      endDate: y.endDate ? y.endDate.split("T")[0] : "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYear) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/academic-years", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedYear.id,
          ...formData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Tahun ajaran berhasil diperbarui!", "success");
        setIsEditOpen(false);
        setSelectedYear(null);
        fetchYears();
      } else {
        showToast(data.message || "Gagal memperbarui tahun ajaran", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (y: any) => {
    setSelectedYear(y);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedYear) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/academic-years?id=${selectedYear.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Tahun ajaran berhasil dihapus", "success");
        setIsDeleteOpen(false);
        setSelectedYear(null);
        fetchYears();
      } else {
        showToast(data.message || "Gagal menghapus tahun ajaran", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tahun Ajaran</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manajemen periode akademik dan semester aktif sekolah.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              name: "2026/2027",
              semester: "GANJIL",
              isCurrent: false,
              startDate: "",
              endDate: "",
            });
            setIsAddOpen(true);
          }}
          className="inline-flex items-center gap-1.5 bg-lime-600 hover:bg-lime-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-lime-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Tahun Ajaran
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-slate-400">Memuat data...</div>
        ) : years.map((y) => (
          <div
            key={y.id}
            className={`bg-white p-6 rounded-2xl border transition shadow-xs flex flex-col justify-between ${
              y.isCurrent ? "border-lime-500 ring-2 ring-lime-200" : "border-slate-200/80"
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                      y.isCurrent ? "bg-lime-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">T.A {y.name}</h3>
                    <p className="text-xs font-semibold text-lime-700">
                      Semester {y.semester === "GANJIL" ? "Ganjil (1)" : "Genap (2)"}
                    </p>
                  </div>
                </div>

                {y.isCurrent ? (
                  <span className="inline-flex items-center gap-1 bg-lime-100 text-lime-800 text-xs font-bold px-3 py-1 rounded-full border border-lime-300">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Sedang Aktif
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Arsip / Nonaktif</span>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Siswa</span>
                  <span className="font-extrabold text-slate-800">{y._count?.students || 0}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Kelas</span>
                  <span className="font-extrabold text-slate-800">{y._count?.classes || 0}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Tagihan</span>
                  <span className="font-extrabold text-slate-800">{y._count?.bills || 0}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(y)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                Ubah
              </button>
              <button
                onClick={() => handleOpenDelete(y)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah Tahun Ajaran */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Tambah Tahun Ajaran"
        subtitle="Buat periode tahun ajaran baru"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: 2026/2027"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-lime-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Semester *</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-lime-500"
              >
                <option value="GANJIL">Ganjil</option>
                <option value="GENAP">Genap</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isCurrent"
              checked={formData.isCurrent}
              onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
              className="w-4 h-4 text-lime-600 rounded"
            />
            <label htmlFor="isCurrent" className="font-bold text-slate-800 cursor-pointer">
              Tetapkan sebagai Tahun Ajaran Aktif Saat Ini
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-xl shadow-md shadow-lime-600/20 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Menyimpan..." : "Simpan Tahun Ajaran"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Tahun Ajaran */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Ubah Tahun Ajaran"
        subtitle={`Mengedit periode ${selectedYear?.name || ""}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: 2026/2027"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-lime-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Semester *</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-lime-500"
              >
                <option value="GANJIL">Ganjil</option>
                <option value="GENAP">Genap</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="editIsCurrent"
              checked={formData.isCurrent}
              onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
              className="w-4 h-4 text-lime-600 rounded"
            />
            <label htmlFor="editIsCurrent" className="font-bold text-slate-800 cursor-pointer">
              Tetapkan sebagai Tahun Ajaran Aktif Saat Ini
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-xl shadow-md shadow-lime-600/20 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Hapus Tahun Ajaran */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Hapus Tahun Ajaran"
        subtitle="Konfirmasi penghapusan periode akademik"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          {(selectedYear?._count?.students > 0 ||
            selectedYear?._count?.classes > 0 ||
            selectedYear?._count?.bills > 0) ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Tidak dapat menghapus tahun ajaran ini</p>
                <p className="text-xs text-amber-700 mt-1">
                  Tahun ajaran <strong>{selectedYear?.name} ({selectedYear?.semester})</strong> masih memiliki keterkaitan dengan{" "}
                  <strong>{selectedYear?._count?.classes} kelas</strong>,{" "}
                  <strong>{selectedYear?._count?.students} siswa</strong>, dan{" "}
                  <strong>{selectedYear?._count?.bills} data tagihan</strong>. Data tahun ajaran tidak boleh dihapus demi menjaga riwayat transaksi dan arsip keuangan.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Apakah Anda yakin ingin menghapus tahun ajaran ini?</p>
                <p className="text-xs text-rose-700 mt-1">
                  Tahun ajaran <strong>{selectedYear?.name} ({selectedYear?.semester})</strong> akan dihapus permanen dari sistem.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              {(selectedYear?._count?.students > 0 ||
                selectedYear?._count?.classes > 0 ||
                selectedYear?._count?.bills > 0)
                ? "Tutup"
                : "Batal"}
            </button>
            {!(selectedYear?._count?.students > 0 ||
              selectedYear?._count?.classes > 0 ||
              selectedYear?._count?.bills > 0) && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Menghapus..." : "Ya, Hapus Tahun Ajaran"}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
