import prisma from "./prisma";
import { logAudit } from "./audit";

export type PaymentMethod =
  | "QRIS"
  | "VA_BCA"
  | "VA_BNI"
  | "VA_BRI"
  | "VA_MANDIRI"
  | "BANK_TRANSFER"
  | "CASH";

export interface CreatePaymentRequest {
  billId: string;
  installmentId?: string | null;
  studentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  userId: string; // Requester User ID
}

export interface PaymentGatewayResponse {
  paymentNumber: string;
  paymentMethod: string;
  amount: number;
  qrCodeUrl?: string;
  virtualAccountNumber?: string;
  bankName?: string;
  expiresAt: Date;
}

/**
 * Generate unique transaction number: TRX-YYYYMMDD-XXXX
 */
export function generateTransactionNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TRX-${year}${month}${day}-${randomSuffix}`;
}

/**
 * Generate mock payment details (QRIS or Virtual Account numbers)
 */
export function generateMockPaymentDetails(
  method: PaymentMethod,
  paymentNumber: string,
  amount: number
): {
  qrCodeUrl?: string;
  virtualAccountNumber?: string;
  bankName?: string;
  instructions: string[];
} {
  switch (method) {
    case "QRIS":
      return {
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021226580016ID.CO.SPP.SEKOLAH0118${paymentNumber}520454115303360540${amount}5802ID5914SPP+SEKOLAH+ID6007JAKARTA`,
        instructions: [
          "Buka aplikasi E-Wallet (GoPay, OVO, DANA, ShopeePay, LinkAja) atau Mobile Banking favorit Anda.",
          "Pilih menu 'Scan' atau 'Bayar dengan QRIS'.",
          "Arahkan kamera ke kode QR di atas.",
          "Periksa nominal pembayaran pastikan sesuai.",
          "Masukkan PIN Anda untuk menyelesaikan transaksi.",
        ],
      };
    case "VA_BCA":
      return {
        virtualAccountNumber: `80777${Math.floor(10000000 + Math.random() * 90000000)}`,
        bankName: "BCA (Bank Central Asia)",
        instructions: [
          "Buka BCA mobile / KlikBCA / ATM BCA.",
          "Pilih menu 'Transfer' > 'BCA Virtual Account'.",
          "Masukkan nomor Virtual Account yang tertera di atas.",
          "Periksa nama siswa dan total tagihan pada layar konfirmasi.",
          "Masukkan PIN / respon KeyBCA untuk konfirmasi.",
        ],
      };
    case "VA_BNI":
      return {
        virtualAccountNumber: `98888${Math.floor(10000000 + Math.random() * 90000000)}`,
        bankName: "BNI (Bank Negara Indonesia)",
        instructions: [
          "Buka BNI Mobile Banking / ATM BNI.",
          "Pilih menu 'Pembayaran' > 'Virtual Account Billing'.",
          "Masukkan nomor Virtual Account di atas.",
          "Konfirmasi data tagihan dan selesaikan pembayaran.",
        ],
      };
    case "VA_BRI":
      return {
        virtualAccountNumber: `12800${Math.floor(10000000 + Math.random() * 90000000)}`,
        bankName: "BRI (BRIVA)",
        instructions: [
          "Buka BRImo atau ATM BRI.",
          "Pilih menu 'BRIVA'.",
          "Masukkan nomor Virtual Account BRIVA di atas.",
          "Konfirmasi nominal dan masukkan PIN BRImo Anda.",
        ],
      };
    case "VA_MANDIRI":
      return {
        virtualAccountNumber: `89508${Math.floor(10000000 + Math.random() * 90000000)}`,
        bankName: "Bank Mandiri (Livin')",
        instructions: [
          "Buka Livin' by Mandiri.",
          "Pilih menu 'Bayar' > 'Multi Payment' / 'Virtual Account'.",
          "Masukkan kode perusahaan / nomor VA di atas.",
          "Konfirmasi rincian pembayaran dan masukkan PIN Livin'.",
        ],
      };
    case "BANK_TRANSFER":
      return {
        virtualAccountNumber: "123-00-9876543-2 (Bank Mandiri a.n Yayasan Sekolah)",
        bankName: "Transfer Bank Manual",
        instructions: [
          "Lakukan transfer ke rekening tujuan di atas.",
          "Gunakan kode referensi / nomor transaksi pada berita transfer.",
          "Simpan bukti transfer dan status akan diverifikasi otomatis.",
        ],
      };
    case "CASH":
    default:
      return {
        instructions: [
          "Lakukan pembayaran langsung di loket kasir / Tata Usaha sekolah.",
          "Petugas sekolah akan mencatat transaksi dan menerbitkan kuitansi resmi.",
        ],
      };
  }
}

/**
 * Process a successful payment idempotently with Database Transaction
 */
export async function markPaymentSuccess(paymentId: string, referenceNumber?: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        bill: {
          include: {
            installments: true,
          },
        },
        installment: true,
        student: {
          include: {
            parentStudents: {
              include: {
                parent: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new Error("Transaksi tidak ditemukan.");
    }

    // IDEMPOTENCY CHECK: If already SUCCESS, return existing record
    if (payment.status === "SUCCESS") {
      return payment;
    }

    const now = new Date();
    const paidAmount = payment.amount;

    // 1. Update Payment status
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "SUCCESS",
        paidAt: now,
        referenceNumber: referenceNumber || payment.referenceNumber || `REF-${Date.now()}`,
      },
    });

    // 2. Create payment allocation record
    await tx.paymentAllocation.create({
      data: {
        paymentId: payment.id,
        billId: payment.billId,
        installmentId: payment.installmentId,
        allocatedAmount: paidAmount,
      },
    });

    // 3. Update Installment if payment is specifically for an installment
    if (payment.installmentId && payment.installment) {
      const inst = payment.installment;
      const newInstPaid = inst.paidAmount + paidAmount;
      const newInstRemaining = Math.max(0, inst.amount - newInstPaid);
      const newInstStatus = newInstRemaining === 0 ? "PAID" : "UNPAID";

      await tx.installment.update({
        where: { id: inst.id },
        data: {
          paidAmount: newInstPaid,
          remainingAmount: newInstRemaining,
          status: newInstStatus,
        },
      });
    }

    // 4. Update Bill overall status and paid amounts
    const bill = payment.bill;
    const newBillPaid = bill.paidAmount + paidAmount;
    const newBillRemaining = Math.max(0, bill.totalAmount - newBillPaid);
    
    let newBillStatus = "UNPAID";
    if (newBillRemaining === 0) {
      newBillStatus = "PAID";
    } else if (newBillPaid > 0) {
      newBillStatus = "PARTIAL";
    }

    await tx.bill.update({
      where: { id: bill.id },
      data: {
        paidAmount: newBillPaid,
        remainingAmount: newBillRemaining,
        status: newBillStatus,
      },
    });

    // 5. Send in-app notification to parents linked to this student
    for (const ps of payment.student.parentStudents) {
      const parentUserId = ps.parent?.userId;
      if (parentUserId) {
        await tx.notification.create({
          data: {
            userId: parentUserId,
            title: "Pembayaran Berhasil! 🎉",
            message: `Pembayaran sebesar ${new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(paidAmount)} untuk ${bill.title} (${payment.student.fullName}) telah berhasil diverifikasi.`,
            type: "PAYMENT_SUCCESS",
            linkUrl: `/parent/receipt/${payment.id}`,
          },
        });
      }
    }

    // 6. Record in Audit Log
    await logAudit({
      userId: payment.recordedById || null,
      action: "PAYMENT_SUCCESS",
      entityType: "Payment",
      entityId: payment.id,
      beforeData: { status: payment.status, paidAmount: bill.paidAmount },
      afterData: { status: "SUCCESS", paidAmount: newBillPaid, referenceNumber },
    });

    return updatedPayment;
  });
}
