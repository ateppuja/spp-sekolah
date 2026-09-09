import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ["PARENT"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: auth.user.id },
      include: {
        parentStudents: {
          include: {
            student: {
              include: {
                class: true,
                academicYear: true,
              },
            },
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ success: true, data: [] });
    }

    const students = parent.parentStudents.map((ps) => ({
      ...ps.student,
      relationship: ps.relationship,
      isPrimary: ps.isPrimary,
    }));

    return NextResponse.json({ success: true, data: students });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data anak." },
      { status: 500 }
    );
  }
}
