import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const classId = searchParams.get("classId") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { nis: { contains: search } },
        { nisn: { contains: search } },
      ];
    }

    if (classId) {
      where.classId = classId;
    }

    if (status) {
      where.status = status;
    }

    const students = await prisma.student.findMany({
      where,
      orderBy: [{ class: { name: "asc" } }, { fullName: "asc" }],
      include: {
        class: true,
        academicYear: true,
        parentStudents: {
          include: {
            parent: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, phone: true },
                },
              },
            },
          },
        },
        bills: {
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            remainingAmount: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: students,
    });
  } catch (error: any) {
    console.error("Fetch students error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data siswa." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const {
      nis,
      nisn,
      fullName,
      gender,
      classId,
      academicYearId,
      address,
      phone,
      parentUserId,
      relationship,
    } = body;

    if (!nis || !fullName || !classId || !academicYearId) {
      return NextResponse.json(
        { success: false, message: "NIS, Nama Lengkap, Kelas, dan Tahun Ajaran wajib diisi." },
        { status: 400 }
      );
    }

    // Check unique NIS
    const existing = await prisma.student.findUnique({ where: { nis } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Siswa dengan NIS ${nis} sudah terdaftar.` },
        { status: 400 }
      );
    }

    const newStudent = await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          nis,
          nisn: nisn || null,
          fullName,
          gender: gender || "L",
          classId,
          academicYearId,
          address: address || null,
          phone: phone || null,
          status: "ACTIVE",
        },
      });

      // If parent user is linked
      if (parentUserId) {
        let parent = await tx.parent.findUnique({ where: { userId: parentUserId } });
        if (!parent) {
          parent = await tx.parent.create({
            data: { userId: parentUserId },
          });
        }

        await tx.parentStudent.create({
          data: {
            parentId: parent.id,
            studentId: student.id,
            relationship: relationship || "ORANG_TUA",
            isPrimary: true,
          },
        });
      }

      return student;
    });

    await logAudit({
      userId: auth.user.id,
      action: "CREATE_STUDENT",
      entityType: "Student",
      entityId: newStudent.id,
      afterData: newStudent,
    });

    return NextResponse.json({
      success: true,
      message: "Data siswa berhasil ditambahkan.",
      data: newStudent,
    });
  } catch (error: any) {
    console.error("Create student error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menambahkan data siswa." },
      { status: 500 }
    );
  }
}
