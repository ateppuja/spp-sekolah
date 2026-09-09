import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const years = await prisma.academicYear.findMany({
      orderBy: { name: "desc" },
      include: {
        _count: {
          select: { students: true, classes: true, bills: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: years });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data tahun ajaran." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { name, semester, isCurrent, startDate, endDate } = await req.json();

    if (!name || !semester) {
      return NextResponse.json(
        { success: false, message: "Nama dan Semester wajib diisi." },
        { status: 400 }
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      if (isCurrent) {
        // Reset previous isCurrent
        await tx.academicYear.updateMany({
          where: { isCurrent: true },
          data: { isCurrent: false },
        });
      }

      return tx.academicYear.create({
        data: {
          name,
          semester,
          isCurrent: !!isCurrent,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Tahun ajaran berhasil dibuat.",
      data: created,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal membuat tahun ajaran." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { id, name, semester, isCurrent, startDate, endDate } = await req.json();

    if (!id || !name || !semester) {
      return NextResponse.json(
        { success: false, message: "ID, Nama, dan Semester wajib diisi." },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (isCurrent) {
        await tx.academicYear.updateMany({
          where: { id: { not: id }, isCurrent: true },
          data: { isCurrent: false },
        });
      }

      return tx.academicYear.update({
        where: { id },
        data: {
          name,
          semester,
          isCurrent: !!isCurrent,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        },
        include: {
          _count: {
            select: { students: true, classes: true, bills: true },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Tahun ajaran berhasil diperbarui.",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memperbarui tahun ajaran." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID tahun ajaran wajib disertakan." },
        { status: 400 }
      );
    }

    const existing = await prisma.academicYear.findUnique({
      where: { id },
      include: {
        _count: {
          select: { students: true, classes: true, bills: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Tahun ajaran tidak ditemukan." },
        { status: 404 }
      );
    }

    if (existing._count.students > 0 || existing._count.classes > 0 || existing._count.bills > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Tidak dapat menghapus tahun ajaran "${existing.name}" karena masih memiliki ${existing._count.classes} kelas, ${existing._count.students} siswa, dan ${existing._count.bills} tagihan terkait.`,
        },
        { status: 400 }
      );
    }

    await prisma.academicYear.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Tahun ajaran "${existing.name}" berhasil dihapus.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menghapus tahun ajaran." },
      { status: 500 }
    );
  }
}
