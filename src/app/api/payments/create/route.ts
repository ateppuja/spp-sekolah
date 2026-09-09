import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { generateTransactionNumber, generateMockPaymentDetails, PaymentMethod } from "@/lib/payment";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["PARENT", "ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { billId, installmentId, paymentMethod = "BANK_TRANSFER", proofImage, bankSender, notes } = body;

    if (!billId) {
      return NextResponse.json(
        { success: false, message: "Tagihan wajib dipilih." },
        { status: 400 }
      );
    }

    if (paymentMethod === "BANK_TRANSFER" && !proofImage) {
      return NextResponse.json(
        { success: false, message: "Foto atau file bukti transfer wajib diunggah." },
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

    // Check if there is already a PENDING payment for this exact bill/installment
    const existingPending = await prisma.payment.findFirst({
      where: {
        billId: bill.id,
        installmentId: installmentId || null,
        status: "PENDING",
      },
    });

    if (existingPending) {
      return NextResponse.json(
        {
          success: false,
          message: "Tagihan ini sudah memiliki transaksi yang sedang menunggu verifikasi admin. Mohon tunggu konfirmasi bagian Tata Usaha.",
        },
        { status: 400 }
      );
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
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiry for manual review

    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        billId: bill.id,
        installmentId: targetInstallment?.id || null,
        studentId: bill.studentId,
        amount: targetAmount,
        paymentMethod: paymentMethod || "BANK_TRANSFER",
        status: "PENDING",
        proofUrl: proofImage || null,
        bankSender: bankSender || null,
        notes: notes || null,
        expiresAt,
      },
    });

    // Notify administrators of newly uploaded payment proof
    const formattedAmount = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(targetAmount);

    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    });

    if (adminUsers.length > 0) {
      const notifs = adminUsers.map((adm) => ({
        userId: adm.id,
        title: "Bukti Transfer Masuk 🔔",
        message: `Bukti transfer ${formattedAmount} untuk ${bill.student.fullName} (${bill.title}) telah diunggah dan menunggu verifikasi.`,
        type: "PAYMENT_PENDING",
        linkUrl: `/admin/payments`,
      }));
      prisma.notification.createMany({ data: notifs, skipDuplicates: true }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Bukti pembayaran berhasil diunggah! Status: Menunggu verifikasi admin.",
      data: {
        payment,
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
