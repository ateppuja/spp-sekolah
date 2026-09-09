import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 1. Total active students
    const totalStudents = await prisma.student.count({
      where: { status: "ACTIVE" },
    });

    // 2. Total bills created this month
    const monthlyBills = await prisma.bill.aggregate({
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    // 3. Total payments received this month
    const monthlyPayments = await prisma.payment.aggregate({
      where: {
        status: "SUCCESS",
        paidAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    // 4. Total overall receivables (piutang/tunggakan)
    const totalReceivables = await prisma.bill.aggregate({
      where: {
        remainingAmount: { gt: 0 },
      },
      _sum: { remainingAmount: true },
    });

    // 5. Total students with unpaid/overdue bills
    const studentsUnpaid = await prisma.student.count({
      where: {
        status: "ACTIVE",
        bills: {
          some: {
            remainingAmount: { gt: 0 },
          },
        },
      },
    });

    // 6. Recent Payments
    const recentPayments = await prisma.payment.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          include: {
            class: true,
          },
        },
        bill: {
          include: {
            billType: true,
          },
        },
        installment: true,
        recordedBy: {
          select: { name: true },
        },
      },
    });

    // 7. Monthly Cashflow Chart Data (Past 6 Months)
    const chartMonths: Array<{ month: string; income: number; billed: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const monthLabel = d.toLocaleString("id-ID", { month: "short", year: "2-digit" });

      const [paidAgg, billedAgg] = await Promise.all([
        prisma.payment.aggregate({
          where: {
            status: "SUCCESS",
            paidAt: { gte: mStart, lte: mEnd },
          },
          _sum: { amount: true },
        }),
        prisma.bill.aggregate({
          where: {
            createdAt: { gte: mStart, lte: mEnd },
          },
          _sum: { totalAmount: true },
        }),
      ]);

      chartMonths.push({
        month: monthLabel,
        income: paidAgg._sum.amount || 0,
        billed: billedAgg._sum.totalAmount || 0,
      });
    }

    // 8. Bill breakdown by type
    const billTypes = await prisma.billType.findMany({
      include: {
        bills: {
          select: {
            totalAmount: true,
            paidAmount: true,
            remainingAmount: true,
          },
        },
      },
    });

    const categoryStats = billTypes.map((bt) => {
      const total = bt.bills.reduce((acc, b) => acc + b.totalAmount, 0);
      const paid = bt.bills.reduce((acc, b) => acc + b.paidAmount, 0);
      return {
        name: bt.name,
        code: bt.code,
        total,
        paid,
        remaining: total - paid,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalBillsThisMonth: monthlyBills._sum.totalAmount || 0,
          totalPaymentsThisMonth: monthlyPayments._sum.amount || 0,
          totalReceivables: totalReceivables._sum.remainingAmount || 0,
          studentsUnpaidCount: studentsUnpaid,
        },
        chartMonths,
        recentPayments,
        categoryStats,
      },
    });
  } catch (error: any) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat ringkasan dashboard admin." },
      { status: 500 }
    );
  }
}
