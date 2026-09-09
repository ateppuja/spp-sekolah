import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const method = searchParams.get("method") || "";
    const status = searchParams.get("status") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { paymentNumber: { contains: search } },
        { referenceNumber: { contains: search } },
        { student: { fullName: { contains: search } } },
        { student: { nis: { contains: search } } },
        { bill: { title: { contains: search } } },
      ];
    }

    if (method) {
      where.paymentMethod = method;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(`${endDate}T23:59:59Z`);
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          include: { class: true },
        },
        bill: {
          include: { billType: true },
        },
        installment: true,
        recordedBy: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: payments });
  } catch (error: any) {
    console.error("Fetch payments error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data pembayaran." },
      { status: 500 }
    );
  }
}
