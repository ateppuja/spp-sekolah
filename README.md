# White Bee School of Life: Sistem Pembayaran SPP Sekolah

Aplikasi web modern, responsif, dan komprehensif untuk pengelolaan tagihan SPP dan pembayaran biaya pendidikan **White Bee School of Life**. Dibangun menggunakan **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, dan **InsForge / PostgreSQL / SQLite**.

---

## 🚀 Fitur Utama

### 1. Role Admin Sekolah
* **Dashboard Finansial**: Statistik total siswa, tagihan bulan ini, penerimaan kas, total piutang/tunggakan, grafik arus kas 6 bulan terakhir, dan tabel pembayaran terkini.
* **Data Siswa**: CRUD Siswa (NIS, NISN, nama, kelas, tahun ajaran, kontak orang tua, status).
* **Kelas & Tahun Ajaran**: Manajemen rombel kelas dan penetapan semester aktif.
* **Manajemen Tagihan**: Terbitkan tagihan (per siswa, per kelas, atau masal) untuk SPP, Uang Gedung, Seragam, dll.
* **Sistem Cicilan Eksklusif Admin**:
  * Tagihan dapat dicicil hanya atas pengaturan Admin.
  * Admin menentukan jumlah termin, nominal per termin, dan tanggal jatuh tempo tiap termin.
  * Validasi matematis: total seluruh cicilan wajib sama dengan total tagihan.
  * Cicilan terkunci dari penghapusan jika sudah memiliki mutasi pembayaran.
* **Log Pembayaran & Kasir Manual**: Pencatatan pembayaran tunai di loket Tata Usaha lengkap dengan bukti setor dan nama admin pencatat.
* **Daftar Tunggakan & Piutang**: Pelacakan tagihan dan cicilan melewati jatuh tempo beserta kalkulasi hari keterlambatan.
* **Laporan Keuangan Komprehensif**: Laporan harian, per kelas, per siswa, per jenis tagihan dengan filter tanggal/bulan, ekspor CSV/Excel, dan layout cetak.
* **Pusat Notifikasi**: Notifikasi in-app dan fitur broadcast pengumuman masal ke seluruh orang tua.
* **Audit Trail (Log Aktivitas)**: Pelacakan otomatis mutasi tagihan, cicilan, dan transaksi kasir (Before vs After JSON).
* **Pengaturan Sekolah**: Konfigurasi identitas kop surat kuitansi resmi dan mode Payment Gateway.

### 2. Role Orang Tua / Wali Siswa (Mobile-First)
* **Student Switcher**: Kemudahan beralih akun anak jika memiliki lebih dari 1 siswa terdaftar.
* **Beranda Interaktif**: Ringkasan sisa kewajiban, progress bar pembayaran (*"Rp2.000.000 dari Rp3.000.000 telah dibayar — 67%"*), dan tombol cepat *Bayar Sekarang*.
* **Timeline Cicilan Terstruktur**: Rincian termin cicilan resmi (*Lunas ✓, Siap Dibayar, Menunggu Termin*).
* **Payment Gateway & Sandbox Simulator**:
  * Pilihan metode: QRIS, Virtual Account (BCA, Mandiri, BRI, BNI), dan Transfer Bank.
  * Dilengkapi **Simulator Sandbox** untuk menguji alur pembayaran berhasil secara instan tanpa gateway riil.
* **Kwitansi Digital Resmi**: Bukti pembayaran resmi berstandar sekolah dengan kop surat, nomor transaksi unik, status LUNAS, dan fitur Cetak / Simpan PDF langsung.
* **Kotak Masuk Notifikasi**: Pengingat tagihan baru, jatuh tempo mendekat, dan konfirmasi transaksi berhasil.

---

## 🛠️ Stack Teknologi

- **Frontend & Backend**: Next.js 15+ (App Router, Server Components & Route Handlers)
- **Bahasa Pemrograman**: TypeScript
- **Styling**: Tailwind CSS + Lucide Icons
- **Database & ORM**: Prisma ORM (SQLite out-of-the-box / PostgreSQL ready)
- **Kalkulasi Keuangan**: Integer Rupiah (IDR) anti floating-point error
- **Autentikasi**: JSON Web Token (JWT) dengan HttpOnly Cookies & Bcrypt Password Hashing

---

## 🔑 Kredensial Akun Demo

Aplikasi telah dilengkapi data seed awal yang realistis:

| Role | Email | Password | Keterangan |
|---|---|---|---|
| **Admin Sekolah** | `admin@sekolah.id` | `admin123` | Akses penuh dashboard Tata Usaha & Finansial |
| **Orang Tua 1** | `orangtua1@gmail.com` | `ortu123` | Memiliki 2 Anak (Ahmad Fauzi - 10 MIPA 1 & Siti Fauziah - 11 IPS 1) |
| **Orang Tua 2** | `orangtua2@gmail.com` | `ortu123` | Memiliki 1 Anak (Budi Pratama - 10 MIPA 2) |
| **Orang Tua 3** | `orangtua3@gmail.com` | `ortu123` | Memiliki 2 Anak (Citra Kirana - 12 MIPA 1 & Doni Setiawan - 10 MIPA 1) |

> 💡 *Pada halaman login (`/login`), terdapat tombol "PILIH AKUN DEMO CEPAT" untuk login otomatis 1-klik tanpa perlu mengetik manual.*

---

## 📦 Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat
- Node.js versi 18 atau lebih baru.
- npm / yarn / pnpm.

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Setup Database & Seeding Data
```bash
# Sinkronkan skema database
npx prisma db push

# Jalankan seed data awal
node prisma/seed.js
```

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```

Buka browser dan akses:
```
http://localhost:3000
```

---

## 🔒 Konfigurasi Produksi / PostgreSQL

Untuk beralih ke PostgreSQL:
1. Ubah provider di `prisma/schema.prisma` menjadi `provider = "postgresql"`.
2. Ubah `DATABASE_URL` di file `.env` menjadi koneksi PostgreSQL Anda:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/spp_sekolah?schema=public"
   ```
3. Jalankan `npx prisma db push` dan `node prisma/seed.js`.
