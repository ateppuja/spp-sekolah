import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: "Tidak terautentikasi." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            class: true,
            academicYear: true,
            parentStudents: {
              include: { parent: true },
            },
          },
        },
        bill: {
          include: {
            billType: true,
            installments: {
              orderBy: { installmentNumber: "asc" },
            },
          },
        },
        installment: true,
        recordedBy: {
          select: { name: true, email: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ success: false, message: "Transaksi tidak ditemukan." }, { status: 404 });
    }

    // Role verification: If PARENT, verify student ownership
    if (session.role === "PARENT") {
      const isOwner = payment.student.parentStudents.some(
        (ps) => ps.parent.userId === session.id
      );
      if (!isOwner) {
        return NextResponse.json(
          { success: false, message: "Akses ditolak ke kuitansi ini." },
          { status: 403 }
        );
      }
    }

    const schoolSetting = await prisma.schoolSetting.findFirst();

    return NextResponse.json({
      success: true,
      data: {
        payment,
        school: schoolSetting,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data transaksi." },
      { status: 500 }
    );
  }
}
