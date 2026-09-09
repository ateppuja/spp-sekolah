import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const classes = await prisma.class.findMany({
      orderBy: [{ grade: "asc" }, { name: "asc" }],
      include: {
        academicYear: true,
        _count: {
          select: { students: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: classes });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data kelas." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { name, grade, major, academicYearId } = await req.json();

    if (!name || !grade) {
      return NextResponse.json(
        { success: false, message: "Nama Kelas dan Tingkat wajib diisi." },
        { status: 400 }
      );
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        grade: String(grade).trim(),
        major: major || null,
        academicYearId: academicYearId || null,
      },
      include: {
        academicYear: true,
        _count: {
          select: { students: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Kelas berhasil ditambahkan.",
      data: newClass,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal membuat kelas baru." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { id, name, grade, major, academicYearId } = await req.json();

    if (!id || !name || !grade) {
      return NextResponse.json(
        { success: false, message: "ID, Nama Kelas, dan Tingkat wajib diisi." },
        { status: 400 }
      );
    }

    const existing = await prisma.class.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Data kelas tidak ditemukan." },
        { status: 404 }
      );
    }

    const updated = await prisma.class.update({
      where: { id },
      data: {
        name,
        grade: String(grade).trim(),
        major: major || null,
        academicYearId: academicYearId || null,
      },
      include: {
        academicYear: true,
        _count: {
          select: { students: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Data kelas berhasil diperbarui.",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memperbarui data kelas." },
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
        { success: false, message: "ID kelas wajib disertakan." },
        { status: 400 }
      );
    }

    const existing = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Kelas tidak ditemukan." },
        { status: 404 }
      );
    }

    if (existing._count.students > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Tidak dapat menghapus kelas "${existing.name}" karena masih ada ${existing._count.students} siswa yang terdaftar. Pindahkan atau hapus data siswa di kelas ini terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    await prisma.class.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Kelas "${existing.name}" berhasil dihapus.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menghapus data kelas." },
      { status: 500 }
    );
  }
}
