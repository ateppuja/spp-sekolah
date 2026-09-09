import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { generateTransactionNumber, markPaymentSuccess } from "@/lib/payment";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const {
      billId,
      installmentId,
      studentId,
      amount,
      paymentMethod, // "CASH", "BANK_TRANSFER", etc.
      referenceNumber,
      notes,
    } = body;

    const payAmount = Number(amount);
    if (!billId || !studentId || isNaN(payAmount) || payAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Tagihan, Siswa, dan Nominal Pembayaran valid wajib diisi." },
        { status: 400 }
      );
    }

    // Verify bill & remaining amount
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: { installments: true },
    });

    if (!bill) {
      return NextResponse.json({ success: false, message: "Tagihan tidak ditemukan." }, { status: 404 });
    }

    if (payAmount > bill.remainingAmount) {
      return NextResponse.json(
        {
          success: false,
          message: `Nominal pembayaran (${payAmount.toLocaleString("id-ID")}) melebihi sisa tagihan (${bill.remainingAmount.toLocaleString("id-ID")}).`,
        },
        { status: 400 }
      );
    }

    // If installment is specified, check installment remaining
    if (installmentId) {
      const inst = bill.installments.find((i) => i.id === installmentId);
      if (!inst) {
        return NextResponse.json({ success: false, message: "Cicilan tidak ditemukan." }, { status: 404 });
      }
      if (payAmount > inst.remainingAmount) {
        return NextResponse.json(
          {
            success: false,
            message: `Nominal pembayaran melebihi sisa cicilan ke-${inst.installmentNumber} (${inst.remainingAmount.toLocaleString("id-ID")}).`,
          },
          { status: 400 }
        );
      }
    }

    const paymentNumber = generateTransactionNumber();

    // 1. Create Payment record in PENDING first
    const createdPayment = await prisma.payment.create({
      data: {
        paymentNumber,
        billId,
        installmentId: installmentId || null,
        studentId,
        amount: payAmount,
        paymentMethod: paymentMethod || "CASH",
        status: "PENDING",
        referenceNumber: referenceNumber || `MANUAL-${Date.now()}`,
        recordedById: auth.user.id,
        notes: notes || "Pencatatan kasir Tata Usaha",
      },
    });

    // 2. Mark as SUCCESS atomically using transaction
    const completedPayment = await markPaymentSuccess(
      createdPayment.id,
      referenceNumber || `REF-${Date.now()}`
    );

    return NextResponse.json({
      success: true,
      message: "Pembayaran manual berhasil dicatat dan kuitansi telah diterbitkan.",
      data: completedPayment,
    });
  } catch (error: any) {
    console.error("Manual payment error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mencatat pembayaran manual." },
      { status: 500 }
    );
  }
}
