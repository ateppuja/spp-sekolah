import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const types = await prisma.billType.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { bills: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: types });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil master jenis tagihan." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { code, name, description, isInstallmentAllowed, defaultAmount } = await req.json();

    if (!code || !name) {
      return NextResponse.json(
        { success: false, message: "Kode dan Nama jenis tagihan wajib diisi." },
        { status: 400 }
      );
    }

    const created = await prisma.billType.create({
      data: {
        code: code.toUpperCase().trim(),
        name,
        description: description || null,
        isInstallmentAllowed: !!isInstallmentAllowed,
        defaultAmount: Number(defaultAmount) || 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Jenis tagihan berhasil ditambahkan.",
      data: created,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal membuat jenis tagihan." },
      { status: 500 }
    );
  }
}
