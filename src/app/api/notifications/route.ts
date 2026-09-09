import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: session.id, isRead: false },
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil notifikasi." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    const { notificationId, markAllRead } = await req.json();

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: session.id, isRead: false },
        data: { isRead: true },
      });
    } else if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId, userId: session.id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true, message: "Notifikasi telah diperbarui." });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui notifikasi." },
      { status: 500 }
    );
  }
}
