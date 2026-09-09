import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("type") || "daily"; // "daily" | "monthly" | "class" | "student" | "bill_type" | "arrears"
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const classId = searchParams.get("classId") || "";
    const billTypeId = searchParams.get("billTypeId") || "";

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(`${endDate}T23:59:59Z`);

    // 1. Transaction-based query
    const paymentWhere: any = {
      status: "SUCCESS",
    };
    if (Object.keys(dateFilter).length > 0) {
      paymentWhere.paidAt = dateFilter;
    }
    if (classId) {
      paymentWhere.student = { classId };
    }
    if (billTypeId) {
      paymentWhere.bill = { billTypeId };
    }

    const payments = await prisma.payment.findMany({
      where: paymentWhere,
      orderBy: { paidAt: "desc" },
      include: {
        student: {
          include: { class: true },
        },
        bill: {
          include: { billType: true },
        },
        installment: true,
        recordedBy: {
          select: { name: true },
        },
      },
    });

    const totalIncome = payments.reduce((acc, p) => acc + p.amount, 0);

    // Grouping according to reportType
    let breakdown: any[] = [];

    if (reportType === "class") {
      const classMap: Record<string, { className: string; total: number; count: number }> = {};
      for (const p of payments) {
        const cName = p.student.class?.name || "Tanpa Kelas";
        if (!classMap[cName]) {
          classMap[cName] = { className: cName, total: 0, count: 0 };
        }
        classMap[cName].total += p.amount;
        classMap[cName].count += 1;
      }
      breakdown = Object.values(classMap);
    } else if (reportType === "bill_type") {
      const typeMap: Record<string, { typeName: string; total: number; count: number }> = {};
      for (const p of payments) {
        const tName = p.bill.billType?.name || "Lainnya";
        if (!typeMap[tName]) {
          typeMap[tName] = { typeName: tName, total: 0, count: 0 };
        }
        typeMap[tName].total += p.amount;
        typeMap[tName].count += 1;
      }
      breakdown = Object.values(typeMap);
    } else if (reportType === "student") {
      const studentMap: Record<string, { studentName: string; nis: string; className: string; total: number; count: number }> = {};
      for (const p of payments) {
        const sid = p.student.id;
        if (!studentMap[sid]) {
          studentMap[sid] = {
            studentName: p.student.fullName,
            nis: p.student.nis,
            className: p.student.class?.name || "-",
            total: 0,
            count: 0,
          };
        }
        studentMap[sid].total += p.amount;
        studentMap[sid].count += 1;
      }
      breakdown = Object.values(studentMap);
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalIncome,
          transactionCount: payments.length,
        },
        payments,
        breakdown,
      },
    });
  } catch (error: any) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses data laporan." },
      { status: 500 }
    );
  }
}
