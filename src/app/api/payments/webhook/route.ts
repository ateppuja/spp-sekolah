import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { markPaymentSuccess } from "@/lib/payment";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Standard parameter mapping for Midtrans / Xendit / Mock
    const orderId = body.order_id || body.payment_number || body.external_id || body.paymentNumber;
    const transactionStatus = body.transaction_status || body.status;
    const referenceNumber = body.transaction_id || body.reference_number || `WH-${Date.now()}`;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Nomor pesanan / order_id tidak valid." },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ paymentNumber: orderId }, { id: orderId }],
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Transaksi tidak ditemukan pada database sekolah." },
        { status: 404 }
      );
    }

    // Idempotent processing: If already processed, respond 200 OK immediately
    if (payment.status === "SUCCESS") {
      return NextResponse.json({
        success: true,
        message: "Idempotent: Pembayaran sudah tercatat berhasil sebelumnya.",
      });
    }

    if (
      transactionStatus === "settlement" ||
      transactionStatus === "capture" ||
      transactionStatus === "SUCCESS" ||
      transactionStatus === "PAID"
    ) {
      await markPaymentSuccess(payment.id, referenceNumber);
      return NextResponse.json({
        success: true,
        message: "Webhook diproses: Pembayaran berhasil diperbarui.",
      });
    } else if (
      transactionStatus === "expire" ||
      transactionStatus === "EXPIRED"
    ) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ success: true, message: "Transaksi ditandai kedaluwarsa." });
    } else if (
      transactionStatus === "deny" ||
      transactionStatus === "cancel" ||
      transactionStatus === "FAILED"
    ) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
      return NextResponse.json({ success: true, message: "Transaksi ditandai gagal." });
    }

    return NextResponse.json({
      success: true,
      message: `Status transaksi tercatat: ${transactionStatus}`,
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses webhook." },
      { status: 500 }
    );
  }
}
