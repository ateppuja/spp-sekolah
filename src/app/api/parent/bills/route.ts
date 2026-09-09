import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["PARENT"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const status = searchParams.get("status"); // "unpaid", "paid", "all"

    const parent = await prisma.parent.findUnique({
      where: { userId: auth.user.id },
      include: { parentStudents: true },
    });

    if (!parent) {
      return NextResponse.json({ success: true, data: [] });
    }

    const studentIds = parent.parentStudents.map((ps) => ps.studentId);
    if (studentId && !studentIds.includes(studentId)) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Siswa tidak terdaftar pada akun Anda." },
        { status: 403 }
      );
    }

    const targetIds = studentId ? [studentId] : studentIds;

    const where: any = {
      studentId: { in: targetIds },
    };

    if (status === "unpaid") {
      where.remainingAmount = { gt: 0 };
    } else if (status === "paid") {
      where.remainingAmount = 0;
    }

    const bills = await prisma.bill.findMany({
      where,
      orderBy: { dueDate: "asc" },
      include: {
        student: {
          include: { class: true },
        },
        billType: true,
        academicYear: true,
        installments: {
          orderBy: { installmentNumber: "asc" },
          include: {
            payments: {
              where: { status: { in: ["SUCCESS", "PENDING"] } },
            },
          },
        },
        payments: {
          where: { status: { in: ["SUCCESS", "PENDING"] } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({ success: true, data: bills });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal memuat tagihan siswa." },
      { status: 500 }
    );
  }
}
