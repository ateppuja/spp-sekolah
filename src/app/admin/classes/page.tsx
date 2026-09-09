"use client";

import React, { useState, useEffect, useMemo } from "react";
import { GraduationCap, Plus, Users, Pencil, Trash2, Search, AlertTriangle, Filter } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

const PRESET_GRADES = [
  "10", "11", "12",
  "7", "8", "9",
  "1", "2", "3", "4", "5", "6",
  "TK B", "TK A", "KB", "Playgroup"
];

function formatGradeLabel(grade: string | number) {
  if (!grade) return "-";
  const str = String(grade).trim();
  if (/^\d+$/.test(str)) {
    return `Tingkat ${str}`;
  }
  return str;
}

export default function ClassesPage() {
  const { showToast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("ALL");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selected class for Edit/Delete
  const [selectedClass, setSelectedClass] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    major: "MIPA",
    academicYearId: "",
  });
  const [gradeType, setGradeType] = useState("10");
  const [customGrade, setCustomGrade] = useState("");

  const fetchData = async () => {
    try {
      const [resC, resAY] = await Promise.all([
        fetch("/api/admin/classes"),
        fetch("/api/admin/academic-years"),
      ]);
      const dataC = await resC.json();
      const dataAY = await resAY.json();

      if (dataC.success) setClasses(dataC.data);
      if (dataAY.success) setAcademicYears(dataAY.data);
    } catch (e) {
      showToast("Gagal memuat data kelas", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      major: "",
      academicYearId: academicYears.find((y) => y.isCurrent)?.id || academicYears[0]?.id || "",
    });
    setGradeType("10");
    setCustomGrade("");
    setIsAddOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalGrade = gradeType === "CUSTOM" ? customGrade.trim() : gradeType;

    if (!finalGrade) {
      showToast("Tingkat kelas wajib diisi", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          grade: finalGrade,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Kelas berhasil dibuat!", "success");
        setIsAddOpen(false);
        fetchData();
      } else {
        showToast(data.message || "Gagal membuat kelas", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (c: any) => {
    setSelectedClass(c);
    setFormData({
      name: c.name,
      major: c.major || "",
      academicYearId: c.academicYearId || "",
    });

    const isPreset = PRESET_GRADES.includes(String(c.grade));
    if (isPreset) {
      setGradeType(String(c.grade));
      setCustomGrade("");
    } else {
      setGradeType("CUSTOM");
      setCustomGrade(String(c.grade || ""));
    }
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    const finalGrade = gradeType === "CUSTOM" ? customGrade.trim() : gradeType;

    if (!finalGrade) {
      showToast("Tingkat kelas wajib diisi", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/classes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedClass.id,
          ...formData,
          grade: finalGrade,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Data kelas berhasil diperbarui!", "success");
        setIsEditOpen(false);
        setSelectedClass(null);
        fetchData();
      } else {
        showToast(data.message || "Gagal memperbarui kelas", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (c: any) => {
    setSelectedClass(c);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedClass) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/classes?id=${selectedClass.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Kelas berhasil dihapus", "success");
        setIsDeleteOpen(false);
        setSelectedClass(null);
        fetchData();
      } else {
        showToast(data.message || "Gagal menghapus kelas", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Dynamic filter options based on classes present
  const availableFilterGrades = useMemo(() => {
    const list: string[] = [];
    classes.forEach((c) => {
      const g = String(c.grade || "");
      if (g && !list.includes(g)) list.push(g);
    });
    return list;
  }, [classes]);

  // Filtered classes
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.major && c.major.toLowerCase().includes(search.toLowerCase())) ||
        String(c.grade).toLowerCase().includes(search.toLowerCase());
      const matchGrade = gradeFilter === "ALL" || String(c.grade) === gradeFilter;
      return matchSearch && matchGrade;
    });
  }, [classes, search, gradeFilter]);

  // Grade Selector Component
  const renderGradeSelector = () => (
    <div className="space-y-2">
      <label className="block font-bold text-slate-700 mb-1">Tingkat / Jenjang *</label>
      <select
        value={gradeType}
        onChange={(e) => {
          setGradeType(e.target.value);
          if (e.target.value !== "CUSTOM") {
            setCustomGrade("");
          }
        }}
        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-lime-500 text-xs sm:text-sm font-medium"
      >
        <optgroup label="Tingkat Kustom">
          <option value="CUSTOM">✏️ Tingkat Kustom (Ketik Sendiri...)</option>
        </optgroup>
        <optgroup label="SMA / SMK / MA">
          <option value="10">Kelas 10 (X)</option>
          <option value="11">Kelas 11 (XI)</option>
          <option value="12">Kelas 12 (XII)</option>
        </optgroup>
        <optgroup label="SMP / MTs">
          <option value="7">Kelas 7 (SMP)</option>
          <option value="8">Kelas 8 (SMP)</option>
          <option value="9">Kelas 9 (SMP)</option>
        </optgroup>
        <optgroup label="Sekolah Dasar (SD / MI)">
          <option value="1">Kelas 1 (SD)</option>
          <option value="2">Kelas 2 (SD)</option>
          <option value="3">Kelas 3 (SD)</option>
          <option value="4">Kelas 4 (SD)</option>
          <option value="5">Kelas 5 (SD)</option>
          <option value="6">Kelas 6 (SD)</option>
        </optgroup>
        <optgroup label="PAUD / KB / TK">
          <option value="TK B">TK B</option>
          <option value="TK A">TK A</option>
          <option value="KB">Kelompok Bermain (KB)</option>
          <option value="Playgroup">Playgroup / Daycare</option>
        </optgroup>
      </select>

      {gradeType === "CUSTOM" && (
        <div className="pt-1 animate-in fade-in slide-in-from-top-1">
          <label className="block text-[11px] font-bold text-lime-800 mb-1">
            Ketik Nama Tingkat / Jenjang Kustom *
          </label>
          <input
            type="text"
            required
            value={customGrade}
            onChange={(e) => setCustomGrade(e.target.value)}
            placeholder="Contoh: Pra-Sekolah, Level 1, Tahfidz, dsb."
            className="w-full px-3.5 py-2.5 bg-lime-50/70 border border-lime-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-lime-500 focus:outline-none text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Data Kelas</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manajemen rombongan belajar, tingkat (TK/SD/SMP/SMA/Kustom), dan peminatan jurusan.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 bg-lime-600 hover:bg-lime-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-lime-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Kelas Baru
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama kelas, tingkat, jurusan..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
          >
            <option value="ALL">Semua Tingkat ({classes.length})</option>
            {availableFilterGrades.map((g) => (
              <option key={g} value={g}>
                {formatGradeLabel(g)}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap hidden sm:inline">
            Total: {filteredClasses.length} Kelas
          </span>
        </div>
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400">Memuat data kelas...</div>
        ) : filteredClasses.length === 0 ? (
          <div className="col-span-3 bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Tidak ada data kelas ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">
              Silakan sesuaikan kata kunci pencarian atau tambah kelas baru.
            </p>
          </div>
        ) : (
          filteredClasses.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-lime-400 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-lime-50 text-lime-700 flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200/70">
                    {formatGradeLabel(c.grade)}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{c.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Jurusan / Peminatan: <strong className="text-slate-700">{c.major || "Umum"}</strong>
                  </p>
                </div>
              </div>

              <div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-lime-600" />
                    <span>
                      <strong className="text-slate-800">{c._count?.students || 0}</strong> Siswa
                    </span>
                  </div>
                  <span className="text-slate-400 font-medium">{c.academicYear?.name || "-"}</span>
                </div>

                {/* Card Action Buttons (Edit & Delete) */}
                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-500" />
                    Ubah
                  </button>
                  <button
                    onClick={() => handleOpenDelete(c)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Tambah Kelas */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Tambah Kelas Baru"
        subtitle="Buat rombongan belajar baru"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Kelas *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: TK A Lebah Ceria atau X MIPA 1"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-lime-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderGradeSelector()}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Peminatan / Jurusan</label>
              <input
                type="text"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                placeholder="Contoh: Umum / MIPA / IPS / Reguler"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-lime-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran</label>
            <select
              value={formData.academicYearId}
              onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-lime-500"
            >
              <option value="">Pilih Tahun Ajaran...</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} - Semester {y.semester} {y.isCurrent ? "(Aktif)" : ""}
                </option>
              ))}
            </select>
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
              {submitting ? "Menyimpan..." : "Simpan Kelas"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Kelas */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Ubah Data Kelas"
        subtitle={`Mengedit data rombongan belajar ${selectedClass?.name || ""}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Kelas *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: TK A Lebah Ceria atau X MIPA 1"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-lime-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderGradeSelector()}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Peminatan / Jurusan</label>
              <input
                type="text"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                placeholder="Contoh: Umum / MIPA / IPS / Reguler"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-lime-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran</label>
            <select
              value={formData.academicYearId}
              onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-lime-500"
            >
              <option value="">Pilih Tahun Ajaran...</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} - Semester {y.semester} {y.isCurrent ? "(Aktif)" : ""}
                </option>
              ))}
            </select>
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

      {/* Modal Konfirmasi Hapus Kelas */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Hapus Kelas"
        subtitle="Konfirmasi penghapusan rombongan belajar"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          {selectedClass?._count?.students > 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Tidak dapat menghapus kelas ini</p>
                <p className="text-xs text-amber-700 mt-1">
                  Kelas <strong>{selectedClass?.name}</strong> saat ini memiliki{" "}
                  <strong>{selectedClass?._count?.students} siswa terdaftar</strong>. Demi integritas data akademik dan tagihan, Anda harus memindahkan atau menghapus data siswa terlebih dahulu sebelum kelas dapat dihapus.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Apakah Anda yakin ingin menghapus kelas ini?</p>
                <p className="text-xs text-rose-700 mt-1">
                  Kelas <strong>{selectedClass?.name}</strong> ({formatGradeLabel(selectedClass?.grade)}) akan dihapus secara permanen dari sistem. Tindakan ini tidak dapat dibatalkan.
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
              {selectedClass?._count?.students > 0 ? "Tutup" : "Batal"}
            </button>
            {selectedClass?._count?.students === 0 && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Menghapus..." : "Ya, Hapus Kelas"}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
