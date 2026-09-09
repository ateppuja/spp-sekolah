import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;

  try {
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            class: true,
            parentStudents: {
              include: {
                parent: {
                  include: { user: true },
                },
              },
            },
          },
        },
        billType: true,
        academicYear: true,
        installments: {
          orderBy: { installmentNumber: "asc" },
          include: {
            payments: {
              where: { status: "SUCCESS" },
            },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          include: {
            recordedBy: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!bill) {
      return NextResponse.json(
        { success: false, message: "Tagihan tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: bill });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal memuat detail tagihan." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const existing = await prisma.bill.findUnique({
      where: { id },
      include: { installments: true, payments: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Tagihan tidak ditemukan." }, { status: 404 });
    }

    const { title, dueDate, notes, installments } = body;

    // If updating installments, check if any payment already occurred
    const hasPaidPayments = existing.payments.some((p) => p.status === "SUCCESS");
    
    const updated = await prisma.$transaction(async (tx) => {
      // Update bill metadata
      const b = await tx.bill.update({
        where: { id },
        data: {
          title: title ?? existing.title,
          dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
          notes: notes !== undefined ? notes : existing.notes,
        },
      });

      // If installments are provided and not locked by payment
      if (installments && Array.isArray(installments)) {
        if (hasPaidPayments) {
          throw new Error(
            "Tidak dapat mengubah skema cicilan karena sudah ada pembayaran yang tercatat pada tagihan ini."
          );
        }

        // Validate sum of installments
        const sum = installments.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
        if (sum !== existing.totalAmount) {
          throw new Error(
            `Total cicilan (${sum.toLocaleString("id-ID")}) harus sama dengan total tagihan (${existing.totalAmount.toLocaleString("id-ID")}).`
          );
        }

        // Delete old and recreate
        await tx.installment.deleteMany({ where: { billId: id } });
        for (let i = 0; i < installments.length; i++) {
          const inst = installments[i];
          await tx.installment.create({
            data: {
              billId: id,
              installmentNumber: i + 1,
              amount: Number(inst.amount),
              paidAmount: 0,
              remainingAmount: Number(inst.amount),
              dueDate: new Date(inst.dueDate),
              status: "UNPAID",
              notes: inst.notes || `Cicilan Ke-${i + 1}`,
            },
          });
        }
      }

      return b;
    });

    await logAudit({
      userId: auth.user.id,
      action: "UPDATE_BILL",
      entityType: "Bill",
      entityId: id,
      beforeData: existing,
      afterData: updated,
    });

    return NextResponse.json({
      success: true,
      message: "Tagihan berhasil diperbarui.",
      data: updated,
    });
  } catch (error: any) {
    console.error("Update bill error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memperbarui tagihan." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;

  try {
    const existing = await prisma.bill.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Tagihan tidak ditemukan." }, { status: 404 });
    }

    const hasSuccessfulPayment = existing.payments.some((p) => p.status === "SUCCESS");
    if (hasSuccessfulPayment) {
      return NextResponse.json(
        {
          success: false,
          message: "Tagihan yang sudah memiliki transaksi pembayaran berhasil tidak dapat dihapus.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.paymentAllocation.deleteMany({ where: { billId: id } });
      await tx.payment.deleteMany({ where: { billId: id } });
      await tx.installment.deleteMany({ where: { billId: id } });
      await tx.bill.delete({ where: { id } });
    });

    await logAudit({
      userId: auth.user.id,
      action: "DELETE_BILL",
      entityType: "Bill",
      entityId: id,
      beforeData: existing,
    });

    return NextResponse.json({
      success: true,
      message: "Tagihan berhasil dihapus.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal menghapus tagihan." },
      { status: 500 }
    );
  }
}
