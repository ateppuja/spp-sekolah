"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Eye,
  CheckCircle,
  XCircle,
  Filter,
  GraduationCap,
  Phone,
  UserCheck,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah, formatDateIndo } from "@/lib/formatters";

export default function StudentsPage() {
  const { showToast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    nis: "",
    nisn: "",
    fullName: "",
    gender: "L",
    classId: "",
    academicYearId: "",
    address: "",
    phone: "",
    status: "ACTIVE",
  });

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (classFilter) params.append("classId", classFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/admin/students?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (e) {
      showToast("Gagal memuat data siswa", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchMasters = async () => {
    try {
      const [resClass, resAY] = await Promise.all([
        fetch("/api/admin/classes"),
        fetch("/api/admin/academic-years"),
      ]);
      const dataClass = await resClass.json();
      const dataAY = await resAY.json();

      if (dataClass.success) setClasses(dataClass.data);
      if (dataAY.success) setAcademicYears(dataAY.data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, classFilter, statusFilter]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Siswa berhasil ditambahkan!", "success");
        setIsAddOpen(false);
        setFormData({
          nis: "",
          nisn: "",
          fullName: "",
          gender: "L",
          classId: "",
          academicYearId: "",
          address: "",
          phone: "",
          status: "ACTIVE",
        });
        fetchStudents();
      } else {
        showToast(data.message || "Gagal menambahkan siswa", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem", "error");
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const res = await fetch(`/api/admin/students/${selectedStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Data siswa berhasil diperbarui!", "success");
        setIsEditOpen(false);
        fetchStudents();
      } else {
        showToast(data.message || "Gagal memperbarui siswa", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan sistem", "error");
    }
  };

  const openEdit = (s: any) => {
    setSelectedStudent(s);
    setFormData({
      nis: s.nis,
      nisn: s.nisn || "",
      fullName: s.fullName,
      gender: s.gender,
      classId: s.classId,
      academicYearId: s.academicYearId,
      address: s.address || "",
      phone: s.phone || "",
      status: s.status,
    });
    setIsEditOpen(true);
  };

  const openDetail = async (s: any) => {
    try {
      const res = await fetch(`/api/admin/students/${s.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedStudent(data.data);
        setIsDetailOpen(true);
      }
    } catch (e) {
      showToast("Gagal memuat detail siswa", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Data Siswa</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola data induk siswa, penugasan kelas, dan akun orang tua/wali.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              nis: "",
              nisn: "",
              fullName: "",
              gender: "L",
              classId: classes[0]?.id || "",
              academicYearId: academicYears.find((y) => y.isCurrent)?.id || academicYears[0]?.id || "",
              address: "",
              phone: "",
              status: "ACTIVE",
            });
            setIsAddOpen(true);
          }}
          className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-sky-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Siswa
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama, NIS, atau NISN..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white"
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
              Kelas {c.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none"
        >
          <option value="">Semua Status</option>
          <option value="ACTIVE">Aktif</option>
          <option value="INACTIVE">Nonaktif</option>
          <option value="GRADUATED">Lulus</option>
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">NIS / NISN</th>
                <th className="px-6 py-3.5">Nama Lengkap</th>
                <th className="px-6 py-3.5">L/P</th>
                <th className="px-6 py-3.5">Kelas</th>
                <th className="px-6 py-3.5">Orang Tua / Wali</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Memuat data siswa...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Tidak ada data siswa yang cocok.
                  </td>
                </tr>
              ) : (
                students.map((s) => {
                  const parentName = s.parentStudents?.[0]?.parent?.user?.name || "-";
                  const parentPhone = s.parentStudents?.[0]?.parent?.user?.phone || "-";

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {s.nis}
                        {s.nisn && <div className="text-[11px] font-normal text-slate-400">{s.nisn}</div>}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{s.fullName}</td>
                      <td className="px-6 py-4 font-semibold text-slate-600">{s.gender}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-0.5 rounded-lg text-xs font-bold">
                          {s.class?.name || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{parentName}</div>
                        {parentPhone !== "-" && (
                          <div className="text-xs text-slate-500">{parentPhone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            s.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {s.status === "ACTIVE" ? "Aktif" : s.status === "GRADUATED" ? "Lulus" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openDetail(s)}
                            title="Lihat Detail Siswa"
                            className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(s)}
                            title="Edit Siswa"
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Siswa */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Tambah Data Siswa"
        subtitle="Masukkan identitas lengkap siswa baru"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">NIS (Nomor Induk Siswa) *</label>
              <input
                type="text"
                required
                value={formData.nis}
                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                placeholder="Contoh: 20261001"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">NISN (Nasional)</label>
              <input
                type="text"
                value={formData.nisn}
                onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                placeholder="Contoh: 0081234567"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Contoh: Ahmad Fauzi"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kelas *</label>
              <select
                required
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none"
              >
                <option value="">Pilih Kelas...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran *</label>
              <select
                required
                value={formData.academicYearId}
                onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none"
              >
                <option value="">Pilih Tahun...</option>
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>
                    {ay.name} ({ay.semester}) {ay.isCurrent ? "★ Aktif" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">No. HP / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Contoh: 081234567890"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Alamat Domisili</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Alamat lengkap..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition shadow-md shadow-sky-600/20"
            >
              Simpan Siswa
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Siswa */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Data Siswa"
        subtitle={`Mengubah data siswa: ${selectedStudent?.fullName}`}
        maxWidth="xl"
      >
        <form onSubmit={handleUpdateStudent} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">NIS *</label>
              <input
                type="text"
                required
                value={formData.nis}
                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">NISN</label>
              <input
                type="text"
                value={formData.nisn}
                onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kelas</label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status Siswa</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              >
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
                <option value="GRADUATED">Lulus</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition shadow-md shadow-sky-600/20"
            >
              Perbarui Data
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Detail Siswa */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Profil Siswa"
        subtitle={`NIS: ${selectedStudent?.nis} • ${selectedStudent?.fullName}`}
        maxWidth="2xl"
      >
        {selectedStudent && (
          <div className="space-y-6 text-xs sm:text-sm">
            {/* Biodata Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-slate-400 block">Nama Lengkap</span>
                <span className="font-bold text-slate-900">{selectedStudent.fullName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">NIS / NISN</span>
                <span className="font-semibold text-slate-800">
                  {selectedStudent.nis} {selectedStudent.nisn ? `(${selectedStudent.nisn})` : ""}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Kelas</span>
                <span className="font-bold text-sky-700">{selectedStudent.class?.name || "-"}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Jenis Kelamin</span>
                <span className="font-semibold text-slate-800">
                  {selectedStudent.gender === "L" ? "Laki-laki" : "Perempuan"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Status</span>
                <Badge status={selectedStudent.status === "ACTIVE" ? "SUCCESS" : "INACTIVE"} label={selectedStudent.status} />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Orang Tua Terhubung</span>
                <span className="font-bold text-slate-800">
                  {selectedStudent.parentStudents?.[0]?.parent?.user?.name || "Belum Ditautkan"}
                </span>
              </div>
            </div>

            {/* List of Bills for this Student */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-3">Daftar Tagihan Siswa:</h4>
              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {selectedStudent.bills?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada riwayat tagihan.</p>
                ) : (
                  selectedStudent.bills?.map((b: any) => (
                    <div
                      key={b.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{b.title}</div>
                        <div className="text-[11px] text-slate-500">
                          {b.billType?.name} • Jatuh tempo: {formatDateIndo(b.dueDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{formatRupiah(b.totalAmount)}</div>
                        <Badge status={b.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
