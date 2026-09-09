import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const classId = searchParams.get("classId") || "";
    const billTypeId = searchParams.get("billTypeId") || "";
    const status = searchParams.get("status") || "";
    const academicYearId = searchParams.get("academicYearId") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { billNumber: { contains: search } },
        { student: { fullName: { contains: search } } },
        { student: { nis: { contains: search } } },
      ];
    }

    if (classId) {
      where.student = { ...where.student, classId };
    }

    if (billTypeId) {
      where.billTypeId = billTypeId;
    }

    if (status) {
      where.status = status;
    }

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    const bills = await prisma.bill.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          include: {
            class: true,
          },
        },
        billType: true,
        academicYear: true,
        installments: {
          orderBy: { installmentNumber: "asc" },
        },
        payments: {
          where: { status: "SUCCESS" },
        },
      },
    });

    return NextResponse.json({ success: true, data: bills });
  } catch (error: any) {
    console.error("Fetch bills error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat daftar tagihan." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const {
      targetType, // "SINGLE" | "CLASS" | "MULTIPLE" | "ALL"
      studentId,
      studentIds,
      classId,
      billTypeId,
      academicYearId,
      title,
      totalAmount,
      dueDate,
      allowInstallment,
      installments, // Array: [{ installmentNumber: 1, amount: 1000000, dueDate: "2026-07-10", notes: "" }]
      notes,
    } = body;

    const amount = Number(totalAmount);
    if (!title || !billTypeId || !academicYearId || !dueDate || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Mohon lengkapi formulir tagihan dengan nominal valid (> 0)." },
        { status: 400 }
      );
    }

    // Determine target students
    let targetStudentIds: string[] = [];
    if (targetType === "SINGLE") {
      if (!studentId) {
        return NextResponse.json({ success: false, message: "Siswa wajib dipilih." }, { status: 400 });
      }
      targetStudentIds = [studentId];
    } else if (targetType === "CLASS") {
      if (!classId) {
        return NextResponse.json({ success: false, message: "Kelas wajib dipilih." }, { status: 400 });
      }
      const studentsInClass = await prisma.student.findMany({
        where: { classId, status: "ACTIVE" },
        select: { id: true },
      });
      targetStudentIds = studentsInClass.map((s) => s.id);
    } else if (targetType === "MULTIPLE") {
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return NextResponse.json({ success: false, message: "Pilih minimal 1 siswa." }, { status: 400 });
      }
      targetStudentIds = studentIds;
    } else if (targetType === "ALL") {
      const allActive = await prisma.student.findMany({
        where: { status: "ACTIVE" },
        select: { id: true },
      });
      targetStudentIds = allActive.map((s) => s.id);
    }

    if (targetStudentIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada siswa aktif yang sesuai dengan target tagihan." },
        { status: 400 }
      );
    }

    // STRICT VALIDATION FOR INSTALLMENTS (CICILAN)
    if (allowInstallment) {
      if (!installments || !Array.isArray(installments) || installments.length === 0) {
        return NextResponse.json(
          { success: false, message: "Tagihan dicicil wajib memiliki rincian termin cicilan." },
          { status: 400 }
        );
      }

      let installmentSum = 0;
      for (const inst of installments) {
        const instAmount = Number(inst.amount);
        if (isNaN(instAmount) || instAmount <= 0) {
          return NextResponse.json(
            { success: false, message: `Nominal cicilan ke-${inst.installmentNumber} harus lebih besar dari 0.` },
            { status: 400 }
          );
        }
        if (!inst.dueDate) {
          return NextResponse.json(
            { success: false, message: `Tanggal jatuh tempo cicilan ke-${inst.installmentNumber} wajib diisi.` },
            { status: 400 }
          );
        }
        installmentSum += instAmount;
      }

      if (installmentSum !== amount) {
        return NextResponse.json(
          {
            success: false,
            message: `Total cicilan (${installmentSum.toLocaleString("id-ID")}) wajib sama dengan total tagihan (${amount.toLocaleString("id-ID")}).`,
          },
          { status: 400 }
        );
      }
    }

    // Pre-fetch all target students and their parent user IDs in ONE single query
    const targetStudents = await prisma.student.findMany({
      where: { id: { in: targetStudentIds } },
      select: {
        id: true,
        fullName: true,
        parentStudents: {
          select: {
            parent: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (targetStudents.length === 0) {
      return NextResponse.json(
        { success: false, message: "Data siswa yang dipilih tidak ditemukan." },
        { status: 400 }
      );
    }

    const now = new Date();
    const year = now.getFullYear();

    // Prepare installment creation payload if installments are enabled
    const installmentData = (allowInstallment && installments && installments.length > 0)
      ? installments.map((inst: any, idx: number) => ({
          installmentNumber: idx + 1,
          amount: Number(inst.amount),
          paidAmount: 0,
          remainingAmount: Number(inst.amount),
          dueDate: new Date(inst.dueDate),
          status: "UNPAID",
          notes: inst.notes || `Cicilan Ke-${idx + 1}`,
        }))
      : null;

    // Execute atomic creation with increased timeout and maxWait
    const createdBills = await prisma.$transaction(
      async (tx) => {
        const results = [];

        for (let i = 0; i < targetStudents.length; i++) {
          const student = targetStudents[i];
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          const billNumber = `BILL-${year}-${Date.now().toString().slice(-4)}${randomNum}`;

          const newBill = await tx.bill.create({
            data: {
              billNumber,
              studentId: student.id,
              billTypeId,
              academicYearId,
              title,
              totalAmount: amount,
              paidAmount: 0,
              remainingAmount: amount,
              status: "UNPAID",
              dueDate: new Date(dueDate),
              allowInstallment: !!allowInstallment,
              notes: notes || null,
              createdById: auth.user.id,
              ...(installmentData ? {
                installments: {
                  create: installmentData,
                },
              } : {}),
            },
          });

          results.push(newBill);
        }

        return results;
      },
      {
        maxWait: 15000,
        timeout: 30000,
      }
    );

    // Asynchronously dispatch notifications outside the transaction to avoid holding locks
    const formattedAmount = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

    const notificationsToCreate: Array<{
      userId: string;
      title: string;
      message: string;
      type: string;
      linkUrl: string;
    }> = [];

    for (const student of targetStudents) {
      for (const ps of student.parentStudents) {
        if (ps.parent?.userId) {
          notificationsToCreate.push({
            userId: ps.parent.userId,
            title: `Tagihan Baru: ${title}`,
            message: `Tagihan sebesar ${formattedAmount} untuk ${student.fullName} telah diterbitkan.`,
            type: "BILL_CREATED",
            linkUrl: `/parent/bills`,
          });
        }
      }
    }

    if (notificationsToCreate.length > 0) {
      prisma.notification.createMany({
        data: notificationsToCreate,
        skipDuplicates: true,
      }).catch((notifError) => {
        console.error("Failed to batch create notifications:", notifError);
      });
    }

    await logAudit({
      userId: auth.user.id,
      action: "CREATE_BILL",
      entityType: "Bill",
      afterData: {
        count: createdBills.length,
        title,
        totalAmount: amount,
        allowInstallment,
        installmentCount: allowInstallment ? installments.length : 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil membuat ${createdBills.length} tagihan baru.`,
      data: createdBills,
    });
  } catch (error: any) {
    console.error("Create bill error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal membuat tagihan." },
      { status: 500 }
    );
  }
}
