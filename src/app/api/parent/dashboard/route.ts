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
      include: {
        parentStudents: {
          include: {
            student: {
              include: { class: true, academicYear: true },
            },
          },
        },
      },
    });

    if (!parent || parent.parentStudents.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          students: [],
          selectedStudent: null,
          stats: { totalBilled: 0, totalPaid: 0, totalRemaining: 0, progressPercent: 100 },
          upcomingBills: [],
          recentTransactions: [],
        },
      });
    }

    const students = parent.parentStudents.map((ps) => ps.student);
    const selectedStudentId = studentId || students[0].id;
    const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

    // Fetch bills for selected student
    const bills = await prisma.bill.findMany({
      where: { studentId: selectedStudent.id },
      orderBy: { dueDate: "asc" },
      include: {
        billType: true,
        installments: {
          orderBy: { installmentNumber: "asc" },
        },
      },
    });

    // Calculate aggregated metrics
    const totalBilled = bills.reduce((acc, b) => acc + b.totalAmount, 0);
    const totalPaid = bills.reduce((acc, b) => acc + b.paidAmount, 0);
    const totalRemaining = bills.reduce((acc, b) => acc + b.remainingAmount, 0);
    const progressPercent = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 100;

    // Upcoming unpaid bills & installments
    const upcomingBills = bills
      .filter((b) => b.remainingAmount > 0)
      .slice(0, 5)
      .map((b) => {
        // If it has installments, find the next unpaid installment
        let nextInstallment = null;
        if (b.allowInstallment && b.installments.length > 0) {
          nextInstallment = b.installments.find((i) => i.remainingAmount > 0) || null;
        }

        return {
          id: b.id,
          title: b.title,
          billType: b.billType.name,
          totalAmount: b.totalAmount,
          paidAmount: b.paidAmount,
          remainingAmount: b.remainingAmount,
          status: b.status,
          dueDate: nextInstallment ? nextInstallment.dueDate : b.dueDate,
          allowInstallment: b.allowInstallment,
          nextInstallment,
        };
      });

    // Recent payments
    const recentTransactions = await prisma.payment.findMany({
      where: {
        studentId: selectedStudent.id,
        status: "SUCCESS",
      },
      take: 5,
      orderBy: { paidAt: "desc" },
      include: {
        bill: true,
        installment: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        students,
        selectedStudent,
        stats: {
          totalBilled,
          totalPaid,
          totalRemaining,
          progressPercent,
        },
        upcomingBills,
        recentTransactions,
      },
    });
  } catch (error: any) {
    console.error("Parent dashboard error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat dashboard orang tua." },
      { status: 500 }
    );
  }
}
