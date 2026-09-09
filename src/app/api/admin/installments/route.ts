import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId") || "";
    const status = searchParams.get("status") || "";

    const where: any = {
      allowInstallment: true,
    };

    if (classId) {
      where.student = { classId };
    }

    if (status) {
      where.status = status;
    }

    const installmentBills = await prisma.bill.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
              where: { status: "SUCCESS" },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: installmentBills,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal memuat data cicilan." },
      { status: 500 }
    );
  }
}
