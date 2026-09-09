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
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
        academicYear: true,
        parentStudents: {
          include: {
            parent: {
              include: {
                user: true,
              },
            },
          },
        },
        bills: {
          orderBy: { createdAt: "desc" },
          include: {
            billType: true,
            installments: {
              orderBy: { installmentNumber: "asc" },
            },
            payments: {
              where: { status: "SUCCESS" },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: student });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal memuat detail siswa." },
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
    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    const {
      nis,
      nisn,
      fullName,
      gender,
      classId,
      academicYearId,
      address,
      phone,
      status,
      parentUserId,
      relationship,
    } = body;

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.student.update({
        where: { id },
        data: {
          nis: nis ?? existing.nis,
          nisn: nisn !== undefined ? nisn : existing.nisn,
          fullName: fullName ?? existing.fullName,
          gender: gender ?? existing.gender,
          classId: classId ?? existing.classId,
          academicYearId: academicYearId ?? existing.academicYearId,
          address: address !== undefined ? address : existing.address,
          phone: phone !== undefined ? phone : existing.phone,
          status: status ?? existing.status,
        },
      });

      // Update parent link if provided
      if (parentUserId !== undefined) {
        // Delete existing links for this student
        await tx.parentStudent.deleteMany({ where: { studentId: id } });

        if (parentUserId) {
          let parent = await tx.parent.findUnique({ where: { userId: parentUserId } });
          if (!parent) {
            parent = await tx.parent.create({ data: { userId: parentUserId } });
          }
          await tx.parentStudent.create({
            data: {
              parentId: parent.id,
              studentId: id,
              relationship: relationship || "ORANG_TUA",
              isPrimary: true,
            },
          });
        }
      }

      return s;
    });

    await logAudit({
      userId: auth.user.id,
      action: "UPDATE_STUDENT",
      entityType: "Student",
      entityId: id,
      beforeData: existing,
      afterData: updated,
    });

    return NextResponse.json({
      success: true,
      message: "Data siswa berhasil diperbarui.",
      data: updated,
    });
  } catch (error: any) {
    console.error("Update student error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memperbarui data siswa." },
      { status: 500 }
    );
  }
}
