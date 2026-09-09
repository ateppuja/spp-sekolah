import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { markPaymentSuccess } from "@/lib/payment";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    const { paymentId, status } = await req.json();

    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: "ID Pembayaran wajib disertakan." },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Transaksi tidak ditemukan." },
        { status: 404 }
      );
    }

    if (status === "FAILED") {
      const updated = await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "FAILED" },
      });
      return NextResponse.json({
        success: true,
        message: "Simulasi: Pembayaran ditandai GAGAL.",
        data: updated,
      });
    }

    // Default: Simulate SUCCESS
    const referenceNumber = `MOCK-GATEWAY-${Date.now()}`;
    const result = await markPaymentSuccess(paymentId, referenceNumber);

    return NextResponse.json({
      success: true,
      message: "Simulasi pembayaran sandbox berhasil! Tagihan & cicilan telah diperbarui otomatis.",
      data: result,
    });
  } catch (error: any) {
    console.error("Sandbox simulation error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memproses simulasi sandbox." },
      { status: 500 }
    );
  }
}
