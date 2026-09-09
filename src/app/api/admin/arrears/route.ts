import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId") || "";

    const now = new Date();

    const where: any = {
      remainingAmount: { gt: 0 },
      OR: [
        { status: "OVERDUE" },
        { dueDate: { lt: now } },
      ],
    };

    if (classId) {
      where.student = { classId };
    }

    const overdueBills = await prisma.bill.findMany({
      where,
      orderBy: { dueDate: "asc" },
      include: {
        student: {
          include: {
            class: true,
            parentStudents: {
              include: {
                parent: {
                  include: { user: true },
                },
              },
            },
          },
        },
        billType: true,
        installments: {
          where: {
            remainingAmount: { gt: 0 },
          },
          orderBy: { installmentNumber: "asc" },
        },
      },
    });

    // Calculate total summary of arrears
    const totalArrearsAmount = overdueBills.reduce((acc, b) => acc + b.remainingAmount, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalArrearsAmount,
        totalOverdueBills: overdueBills.length,
        arrearsList: overdueBills,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data tunggakan." },
      { status: 500 }
    );
  }
}
