import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, ["PARENT"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;

  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: auth.user.id },
      include: { parentStudents: true },
    });

    if (!parent) {
      return NextResponse.json({ success: false, message: "Profil tidak ditemukan." }, { status: 404 });
    }

    const studentIds = parent.parentStudents.map((ps) => ps.studentId);

    const bill = await prisma.bill.findFirst({
      where: {
        id,
        studentId: { in: studentIds },
      },
      include: {
        student: {
          include: { class: true, academicYear: true },
        },
        billType: true,
        academicYear: true,
        installments: {
          orderBy: { installmentNumber: "asc" },
          include: {
            payments: {
              where: { status: "SUCCESS" },
            },
          },
        },
        payments: {
          where: { status: "SUCCESS" },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!bill) {
      return NextResponse.json(
        { success: false, message: "Tagihan tidak ditemukan atau bukan milik anak Anda." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: bill });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal memuat detail tagihan." },
      { status: 500 }
    );
  }
}
