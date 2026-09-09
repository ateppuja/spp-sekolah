const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seeding data SPP Sekolah...");

  // 1. Bersihkan database
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.paymentAllocation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.installment.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.billType.deleteMany();
  await prisma.parentStudent.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.schoolSetting.deleteMany();
  await prisma.user.deleteMany();

  // 2. School Setting
  await prisma.schoolSetting.create({
    data: {
      schoolName: "White Bee School of Life",
      schoolNpsn: "20104567",
      schoolAddress: "Jl. Taman White Bee No. 12, Kebayoran Baru, Jakarta Selatan, DKI Jakarta 12150",
      schoolPhone: "021-78901234",
      schoolEmail: "info@whitebee.sch.id",
      schoolLogo: "/logo.png",
      principalName: "Drs. H. Bambang Suhartono, M.Pd",
      treasurerName: "Siti Rahmawati, S.E",
      paymentGatewayConfig: JSON.stringify({ mode: "MOCK", enabled: true }),
    },
  });

  // 3. Tahun Ajaran
  const ayActive = await prisma.academicYear.create({
    data: {
      name: "2025/2026",
      semester: "GANJIL",
      isCurrent: true,
      startDate: new Date("2025-07-15"),
      endDate: new Date("2025-12-20"),
    },
  });

  const ayPast = await prisma.academicYear.create({
    data: {
      name: "2024/2025",
      semester: "GENAP",
      isCurrent: false,
      startDate: new Date("2025-01-06"),
      endDate: new Date("2025-06-25"),
    },
  });

  // 4. Kelas
  const class10A = await prisma.class.create({
    data: { name: "X MIPA 1", grade: 10, major: "MIPA", academicYearId: ayActive.id, isActive: true },
  });
  const class10B = await prisma.class.create({
    data: { name: "X MIPA 2", grade: 10, major: "MIPA", academicYearId: ayActive.id, isActive: true },
  });
  const class11A = await prisma.class.create({
    data: { name: "XI IPS 1", grade: 11, major: "IPS", academicYearId: ayActive.id, isActive: true },
  });
  const class12A = await prisma.class.create({
    data: { name: "XII MIPA 1", grade: 12, major: "MIPA", academicYearId: ayActive.id, isActive: true },
  });

  // 5. Jenis Tagihan
  const btSPP = await prisma.billType.create({
    data: {
      code: "SPP",
      name: "SPP Bulanan",
      description: "Iuran Pembinaan Pendidikan Bulanan Siswa",
      isInstallmentAllowed: false,
      defaultAmount: 500000,
    },
  });
  const btGedung = await prisma.billType.create({
    data: {
      code: "GEDUNG",
      name: "Uang Gedung / Sarana",
      description: "Sumbangan Pengembangan Institusi dan Sarana Prasarana (Dapat dicicil)",
      isInstallmentAllowed: true,
      defaultAmount: 3000000,
    },
  });
  const btDaftarUlang = await prisma.billType.create({
    data: {
      code: "DAFTAR_ULANG",
      name: "Daftar Ulang Tahunan",
      description: "Registrasi ulang tahun ajaran baru",
      isInstallmentAllowed: true,
      defaultAmount: 1500000,
    },
  });
  const btSeragam = await prisma.billType.create({
    data: {
      code: "SERAGAM",
      name: "Paket Seragam & Atribut",
      description: "Seragam OSIS, Batik, Pramuka, Olahraga & Atribut Sekolah",
      isInstallmentAllowed: false,
      defaultAmount: 750000,
    },
  });
  const btKegiatan = await prisma.billType.create({
    data: {
      code: "KEGIATAN",
      name: "Iuran Kegiatan & Praktikum",
      description: "Biaya praktikum sains, field trip, dan kegiatan semester",
      isInstallmentAllowed: false,
      defaultAmount: 400000,
    },
  });

  // 6. Users & Parents
  const adminPassword = await bcrypt.hash("admin123", 10);
  const parentPassword = await bcrypt.hash("ortu123", 10);

  // Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@sekolah.id",
      passwordHash: adminPassword,
      name: "Hendra Wijaya (Admin TU)",
      phone: "081234567890",
      role: "ADMIN",
      isActive: true,
    },
  });

  // Orang Tua 1 (2 Anak: Ahmad Fauzi & Siti Fauziah)
  const parentUser1 = await prisma.user.create({
    data: {
      email: "orangtua1@gmail.com",
      passwordHash: parentPassword,
      name: "Ir. Bambang Santoso",
      phone: "081398765432",
      role: "PARENT",
      isActive: true,
    },
  });
  const parentProfile1 = await prisma.parent.create({
    data: {
      userId: parentUser1.id,
      nik: "3174012304780001",
      address: "Jl. Tebet Barat Dalam No. 12, Jakarta Selatan",
      occupation: "Wiraswasta",
      emergencyContact: "081398765433 (Ibu Rina Santoso)",
    },
  });

  // Orang Tua 2 (1 Anak: Budi Pratama)
  const parentUser2 = await prisma.user.create({
    data: {
      email: "orangtua2@gmail.com",
      passwordHash: parentPassword,
      name: "Drs. Eko Prasetyo",
      phone: "081512348765",
      role: "PARENT",
      isActive: true,
    },
  });
  const parentProfile2 = await prisma.parent.create({
    data: {
      userId: parentUser2.id,
      nik: "3174051108800002",
      address: "Jl. Pancoran Timur No. 8, Jakarta Selatan",
      occupation: "PNS / Pegawai Negeri",
      emergencyContact: "081512348766",
    },
  });

  // Orang Tua 3 (2 Anak: Citra Kirana & Doni Setiawan)
  const parentUser3 = await prisma.user.create({
    data: {
      email: "orangtua3@gmail.com",
      passwordHash: parentPassword,
      name: "Dewi Lestari, S.Farm",
      phone: "081765432109",
      role: "PARENT",
      isActive: true,
    },
  });
  const parentProfile3 = await prisma.parent.create({
    data: {
      userId: parentUser3.id,
      nik: "3174072512820003",
      address: "Jl. Pasar Minggu Raya No. 99, Jakarta Selatan",
      occupation: "Apoteker",
      emergencyContact: "081765432110",
    },
  });

  // 7. Siswa
  const student1 = await prisma.student.create({
    data: {
      nis: "20251001",
      nisn: "0081234561",
      fullName: "Ahmad Fauzi Santoso",
      gender: "L",
      classId: class10A.id,
      academicYearId: ayActive.id,
      address: "Jl. Tebet Barat Dalam No. 12, Jakarta Selatan",
      phone: "081211112222",
      status: "ACTIVE",
    },
  });

  const student2 = await prisma.student.create({
    data: {
      nis: "20241102",
      nisn: "0072345672",
      fullName: "Siti Fauziah Santoso",
      gender: "P",
      classId: class11A.id,
      academicYearId: ayActive.id,
      address: "Jl. Tebet Barat Dalam No. 12, Jakarta Selatan",
      phone: "081211113333",
      status: "ACTIVE",
    },
  });

  const student3 = await prisma.student.create({
    data: {
      nis: "20251003",
      nisn: "0083456783",
      fullName: "Budi Pratama Prasetyo",
      gender: "L",
      classId: class10B.id,
      academicYearId: ayActive.id,
      address: "Jl. Pancoran Timur No. 8, Jakarta Selatan",
      phone: "081211114444",
      status: "ACTIVE",
    },
  });

  const student4 = await prisma.student.create({
    data: {
      nis: "20231204",
      nisn: "0064567894",
      fullName: "Citra Kirana",
      gender: "P",
      classId: class12A.id,
      academicYearId: ayActive.id,
      address: "Jl. Pasar Minggu Raya No. 99, Jakarta Selatan",
      phone: "081211115555",
      status: "ACTIVE",
    },
  });

  const student5 = await prisma.student.create({
    data: {
      nis: "20251005",
      nisn: "0085678905",
      fullName: "Doni Setiawan",
      gender: "L",
      classId: class10A.id,
      academicYearId: ayActive.id,
      address: "Jl. Pasar Minggu Raya No. 99, Jakarta Selatan",
      phone: "081211116666",
      status: "ACTIVE",
    },
  });

  // Hubungkan Siswa dengan Orang Tua
  await prisma.parentStudent.createMany({
    data: [
      { parentId: parentProfile1.id, studentId: student1.id, relationship: "AYAH", isPrimary: true },
      { parentId: parentProfile1.id, studentId: student2.id, relationship: "AYAH", isPrimary: true },
      { parentId: parentProfile2.id, studentId: student3.id, relationship: "AYAH", isPrimary: true },
      { parentId: parentProfile3.id, studentId: student4.id, relationship: "IBU", isPrimary: true },
      { parentId: parentProfile3.id, studentId: student5.id, relationship: "IBU", isPrimary: true },
    ],
  });

  // 8. Tagihan & Cicilan
  // Tagihan 1: SPP Bulan Juli 2026 untuk Ahmad Fauzi (Lunas - via Tunai Kasir)
  const bill1 = await prisma.bill.create({
    data: {
      billNumber: "BILL-2026-0001",
      studentId: student1.id,
      billTypeId: btSPP.id,
      academicYearId: ayActive.id,
      title: "SPP Bulan Juli 2026",
      totalAmount: 500000,
      paidAmount: 500000,
      remainingAmount: 0,
      status: "PAID",
      dueDate: new Date("2026-07-10"),
      allowInstallment: false,
      notes: "Pembayaran SPP Reguler",
      createdById: adminUser.id,
    },
  });

  const pay1 = await prisma.payment.create({
    data: {
      paymentNumber: "TRX-20260705-1001",
      billId: bill1.id,
      studentId: student1.id,
      amount: 500000,
      paymentMethod: "CASH",
      status: "SUCCESS",
      referenceNumber: "KASIR-0012",
      paidAt: new Date("2026-07-05T09:30:00Z"),
      recordedById: adminUser.id,
      notes: "Dibayar tunai di Tata Usaha",
    },
  });
  await prisma.paymentAllocation.create({
    data: { paymentId: pay1.id, billId: bill1.id, allocatedAmount: 500000 },
  });

  // Tagihan 2: Uang Gedung Ahmad Fauzi Rp 3.000.000 (DENGAN SKEMA CICILAN 3X ADMIN)
  // Cicilan 1 (Rp 1.000.000) -> Lunas
  // Cicilan 2 (Rp 1.000.000) -> Belum Bayar
  // Cicilan 3 (Rp 1.000.000) -> Belum Bayar
  const bill2 = await prisma.bill.create({
    data: {
      billNumber: "BILL-2026-0002",
      studentId: student1.id,
      billTypeId: btGedung.id,
      academicYearId: ayActive.id,
      title: "Uang Gedung & Sarana T.A 2025/2026",
      totalAmount: 3000000,
      paidAmount: 1000000,
      remainingAmount: 2000000,
      status: "PARTIAL",
      dueDate: new Date("2026-09-10"),
      allowInstallment: true,
      notes: "Skema cicilan 3 termin resmi disetujui TU",
      createdById: adminUser.id,
    },
  });

  const inst1 = await prisma.installment.create({
    data: {
      billId: bill2.id,
      installmentNumber: 1,
      amount: 1000000,
      paidAmount: 1000000,
      remainingAmount: 0,
      dueDate: new Date("2026-07-10"),
      status: "PAID",
      notes: "Cicilan 1 / Uang Muka Masuk",
    },
  });

  const inst2 = await prisma.installment.create({
    data: {
      billId: bill2.id,
      installmentNumber: 2,
      amount: 1000000,
      paidAmount: 0,
      remainingAmount: 1000000,
      dueDate: new Date("2026-08-10"),
      status: "UNPAID",
      notes: "Cicilan 2 Periode Agustus",
    },
  });

  const inst3 = await prisma.installment.create({
    data: {
      billId: bill2.id,
      installmentNumber: 3,
      amount: 1000000,
      paidAmount: 0,
      remainingAmount: 1000000,
      dueDate: new Date("2026-09-10"),
      status: "UNPAID",
      notes: "Cicilan 3 Periode September (Pelunasan)",
    },
  });

  const pay2 = await prisma.payment.create({
    data: {
      paymentNumber: "TRX-20260708-2002",
      billId: bill2.id,
      installmentId: inst1.id,
      studentId: student1.id,
      amount: 1000000,
      paymentMethod: "QRIS",
      status: "SUCCESS",
      referenceNumber: "QRIS-88239019",
      paidAt: new Date("2026-07-08T14:15:00Z"),
      notes: "Pembayaran QRIS Cicilan 1 Gedung",
    },
  });
  await prisma.paymentAllocation.create({
    data: { paymentId: pay2.id, billId: bill2.id, installmentId: inst1.id, allocatedAmount: 1000000 },
  });

  // Tagihan 3: SPP Bulan Agustus 2026 untuk Siti Fauziah (Belum Bayar)
  await prisma.bill.create({
    data: {
      billNumber: "BILL-2026-0003",
      studentId: student2.id,
      billTypeId: btSPP.id,
      academicYearId: ayActive.id,
      title: "SPP Bulan Agustus 2026",
      totalAmount: 500000,
      paidAmount: 0,
      remainingAmount: 500000,
      status: "UNPAID",
      dueDate: new Date("2026-08-10"),
      allowInstallment: false,
      notes: "SPP Reguler",
      createdById: adminUser.id,
    },
  });

  // Tagihan 4: Seragam untuk Budi Pratama (Terlambat)
  await prisma.bill.create({
    data: {
      billNumber: "BILL-2026-0004",
      studentId: student3.id,
      billTypeId: btSeragam.id,
      academicYearId: ayActive.id,
      title: "Paket Seragam & Atribut",
      totalAmount: 750000,
      paidAmount: 0,
      remainingAmount: 750000,
      status: "OVERDUE",
      dueDate: new Date("2026-06-30"),
      allowInstallment: false,
      notes: "Telah melewati batas tanggal jatuh tempo",
      createdById: adminUser.id,
    },
  });

  // Tagihan 5: SPP Bulan Juli untuk Citra Kirana (Lunas via Transfer)
  const bill5 = await prisma.bill.create({
    data: {
      billNumber: "BILL-2026-0005",
      studentId: student4.id,
      billTypeId: btSPP.id,
      academicYearId: ayActive.id,
      title: "SPP Bulan Juli 2026",
      totalAmount: 500000,
      paidAmount: 500000,
      remainingAmount: 0,
      status: "PAID",
      dueDate: new Date("2026-07-10"),
      allowInstallment: false,
      notes: "Lunas",
      createdById: adminUser.id,
    },
  });
  const pay5 = await prisma.payment.create({
    data: {
      paymentNumber: "TRX-20260710-5005",
      billId: bill5.id,
      studentId: student4.id,
      amount: 500000,
      paymentMethod: "VA_BCA",
      status: "SUCCESS",
      referenceNumber: "BCA-VA-192837",
      paidAt: new Date("2026-07-10T10:00:00Z"),
      notes: "Pembayaran via Virtual Account BCA",
    },
  });
  await prisma.paymentAllocation.create({
    data: { paymentId: pay5.id, billId: bill5.id, allocatedAmount: 500000 },
  });

  // Tagihan 6: SPP Doni Setiawan (Belum Bayar)
  await prisma.bill.create({
    data: {
      billNumber: "BILL-2026-0006",
      studentId: student5.id,
      billTypeId: btSPP.id,
      academicYearId: ayActive.id,
      title: "SPP Bulan Agustus 2026",
      totalAmount: 500000,
      paidAmount: 0,
      remainingAmount: 500000,
      status: "UNPAID",
      dueDate: new Date("2026-08-10"),
      allowInstallment: false,
      notes: "SPP Reguler",
      createdById: adminUser.id,
    },
  });

  // 9. Initial Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: parentUser1.id,
        title: "Tagihan Baru: Uang Gedung 2025/2026",
        message: "Tagihan Uang Gedung untuk Ahmad Fauzi telah dibuat dengan skema 3x cicilan.",
        type: "BILL_CREATED",
        linkUrl: "/parent/bills",
        isRead: false,
      },
      {
        userId: parentUser1.id,
        title: "Pembayaran Berhasil! 🎉",
        message: "Pembayaran Rp 1.000.000 untuk Cicilan 1 Uang Gedung (Ahmad Fauzi) telah berhasil.",
        type: "PAYMENT_SUCCESS",
        linkUrl: `/parent/receipt/${pay2.id}`,
        isRead: true,
      },
      {
        userId: parentUser2.id,
        title: "Peringatan Tunggakan: Paket Seragam",
        message: "Tagihan Paket Seragam untuk Budi Pratama telah melewati batas jatuh tempo (30 Juni 2026).",
        type: "DUE_REMINDER",
        linkUrl: "/parent/bills",
        isRead: false,
      },
    ],
  });

  // 10. Initial Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: "CREATE_BILL",
        entityType: "Bill",
        entityId: bill2.id,
        afterData: JSON.stringify({ billNumber: "BILL-2026-0002", title: "Uang Gedung & Sarana T.A 2025/2026", totalAmount: 3000000 }),
      },
      {
        userId: adminUser.id,
        action: "CREATE_INSTALLMENT",
        entityType: "Installment",
        entityId: bill2.id,
        afterData: JSON.stringify({ terms: 3, amountPerTerm: 1000000 }),
      },
      {
        userId: adminUser.id,
        action: "MANUAL_PAYMENT",
        entityType: "Payment",
        entityId: pay1.id,
        afterData: JSON.stringify({ paymentNumber: "TRX-20260705-1001", amount: 500000, method: "CASH" }),
      },
    ],
  });

  console.log("✅ Seeding data berhasil diselesaikan!");
  console.log("-----------------------------------------");
  console.log("Kredensial Demo:");
  console.log("Admin     : admin@sekolah.id / admin123");
  console.log("Orang Tua : orangtua1@gmail.com / ortu123 (2 Anak)");
  console.log("Orang Tua : orangtua2@gmail.com / ortu123");
  console.log("Orang Tua : orangtua3@gmail.com / ortu123 (2 Anak)");
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error("Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
