import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["PARENT"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    const parent = await prisma.parent.findUnique({
      where: { userId: auth.user.id },
      include: { parentStudents: true },
    });

    if (!parent) {
      return NextResponse.json({ success: true, data: [] });
    }

    const studentIds = parent.parentStudents.map((ps) => ps.studentId);
    const targetIds = studentId && studentIds.includes(studentId) ? [studentId] : studentIds;

    const payments = await prisma.payment.findMany({
      where: {
        studentId: { in: targetIds },
        status: "SUCCESS",
      },
      orderBy: { paidAt: "desc" },
      include: {
        student: {
          include: { class: true },
        },
        bill: {
          include: { billType: true },
        },
        installment: true,
      },
    });

    return NextResponse.json({ success: true, data: payments });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal memuat riwayat pembayaran." },
      { status: 500 }
    );
  }
}
