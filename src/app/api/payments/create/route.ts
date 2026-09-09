import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { generateTransactionNumber, generateMockPaymentDetails, PaymentMethod } from "@/lib/payment";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["PARENT", "ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { billId, installmentId, paymentMethod } = body;

    if (!billId || !paymentMethod) {
      return NextResponse.json(
        { success: false, message: "Tagihan dan Metode Pembayaran wajib dipilih." },
        { status: 400 }
      );
    }

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        installments: true,
        student: {
          include: {
            parentStudents: {
              include: { parent: true },
            },
          },
        },
      },
    });

    if (!bill) {
      return NextResponse.json({ success: false, message: "Tagihan tidak ditemukan." }, { status: 404 });
    }

    // If PARENT, verify that student belongs to parent
    if (auth.user.role === "PARENT") {
      const isParentOfStudent = bill.student.parentStudents.some(
        (ps) => ps.parent.userId === auth.user.id
      );
      if (!isParentOfStudent) {
        return NextResponse.json(
          { success: false, message: "Akses ditolak. Tagihan ini bukan milik anak Anda." },
          { status: 403 }
        );
      }
    }

    // Determine amount
    let targetAmount = bill.remainingAmount;
    let targetInstallment = null;

    if (installmentId) {
      targetInstallment = bill.installments.find((i) => i.id === installmentId);
      if (!targetInstallment) {
        return NextResponse.json(
          { success: false, message: "Data cicilan tidak ditemukan." },
          { status: 404 }
        );
      }
      if (targetInstallment.remainingAmount <= 0) {
        return NextResponse.json(
          { success: false, message: "Cicilan ini sudah lunas." },
          { status: 400 }
        );
      }
      targetAmount = targetInstallment.remainingAmount;
    } else if (bill.allowInstallment && bill.installments.length > 0) {
      // If bill has installments, enforce paying the next unpaid installment
      const nextUnpaid = bill.installments.find((i) => i.remainingAmount > 0);
      if (nextUnpaid) {
        targetInstallment = nextUnpaid;
        targetAmount = nextUnpaid.remainingAmount;
      }
    }

    if (targetAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Tagihan ini sudah lunas." },
        { status: 400 }
      );
    }

    const paymentNumber = generateTransactionNumber();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry

    // Generate mock details
    const mockDetails = generateMockPaymentDetails(paymentMethod as PaymentMethod, paymentNumber, targetAmount);

    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        billId: bill.id,
        installmentId: targetInstallment?.id || null,
        studentId: bill.studentId,
        amount: targetAmount,
        paymentMethod,
        status: "PENDING",
        expiresAt,
        rawGatewayResponse: JSON.stringify(mockDetails),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi pembayaran berhasil dibuat.",
      data: {
        payment,
        details: mockDetails,
      },
    });
  } catch (error: any) {
    console.error("Payment create error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat transaksi pembayaran." },
      { status: 500 }
    );
  }
}
