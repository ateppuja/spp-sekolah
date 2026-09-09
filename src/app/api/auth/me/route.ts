import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Tidak terautentikasi." },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      avatar: true,
      isActive: true,
      parentProfile: {
        select: {
          id: true,
          nik: true,
          address: true,
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
      },
    },
  });

  if (!user || !user.isActive) {
    return NextResponse.json(
      { success: false, message: "Pengguna tidak ditemukan atau dinonaktifkan." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user,
  });
}
