import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil log notifikasi." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { title, message, targetRole, linkUrl } = await req.json();

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: "Judul dan Pesan notifikasi wajib diisi." },
        { status: 400 }
      );
    }

    const where: any = { isActive: true };
    if (targetRole) {
      where.role = targetRole;
    }

    const targetUsers = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada target penerima yang ditemukan." },
        { status: 400 }
      );
    }

    await prisma.notification.createMany({
      data: targetUsers.map((u) => ({
        userId: u.id,
        title,
        message,
        type: "SYSTEM",
        linkUrl: linkUrl || null,
      })),
    });

    return NextResponse.json({
      success: true,
      message: `Notifikasi berhasil dikirim ke ${targetUsers.length} pengguna.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal menyiarkan notifikasi." },
      { status: 500 }
    );
  }
}
