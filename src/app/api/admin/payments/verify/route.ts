import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { markPaymentSuccess } from "@/lib/payment";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { paymentId, action, rejectionReason, referenceNumber } = body;

    if (!paymentId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "ID Pembayaran dan Aksi (APPROVE/REJECT) wajib disertakan." },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        bill: true,
        student: {
          include: {
            parentStudents: {
              include: { parent: true },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Data transaksi tidak ditemukan." },
        { status: 404 }
      );
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json(
        { success: false, message: `Transaksi ini sudah berstatus ${payment.status} dan tidak dapat diubah.` },
        { status: 400 }
      );
    }

    if (action === "APPROVE") {
      // 1. Process payment success and bill allocation atomically
      const updatedPayment = await markPaymentSuccess(paymentId, referenceNumber);

      // 2. Set recordedById to the verifying admin
      await prisma.payment.update({
        where: { id: paymentId },
        data: { recordedById: auth.user.id },
      });

      await logAudit({
        userId: auth.user.id,
        action: "APPROVE_MANUAL_PAYMENT",
        entityType: "Payment",
        entityId: paymentId,
        afterData: { status: "SUCCESS", approvedBy: auth.user.name },
      });

      return NextResponse.json({
        success: true,
        message: "Pembayaran berhasil diverifikasi dan tagihan telah diperbarui menjadi lunas!",
        data: updatedPayment,
      });
    } else {
      // Action: REJECT
      const reason = rejectionReason || "Bukti transfer tidak valid atau dana belum masuk rekening sekolah.";

      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "FAILED",
          notes: `Ditolak: ${reason}`,
          recordedById: auth.user.id,
        },
      });

      // Send rejection notification to parent
      for (const ps of payment.student.parentStudents) {
        if (ps.parent?.userId) {
          await prisma.notification.create({
            data: {
              userId: ps.parent.userId,
              title: "Konfirmasi Pembayaran Ditolak ⚠️",
              message: `Bukti transfer untuk ${payment.bill.title} (${payment.student.fullName}) tidak dapat diverifikasi. Alasan: ${reason}. Silakan lakukan pembayaran ulang.`,
              type: "PAYMENT_FAILED",
              linkUrl: `/parent/bills`,
            },
          });
        }
      }

      await logAudit({
        userId: auth.user.id,
        action: "REJECT_MANUAL_PAYMENT",
        entityType: "Payment",
        entityId: paymentId,
        afterData: { status: "FAILED", reason, rejectedBy: auth.user.name },
      });

      return NextResponse.json({
        success: true,
        message: "Pembayaran telah ditolak. Notifikasi telah dikirimkan ke orang tua siswa.",
        data: updatedPayment,
      });
    }
  } catch (error: any) {
    console.error("Admin payment verify error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memproses verifikasi pembayaran." },
      { status: 500 }
    );
  }
}
