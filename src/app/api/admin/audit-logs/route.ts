import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "";

    const where: any = {};
    if (action) {
      where.action = action;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data audit log." },
      { status: 500 }
    );
  }
}
