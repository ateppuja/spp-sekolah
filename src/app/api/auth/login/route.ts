import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        parentProfile: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: "Email atau kata sandi tidak sesuai / akun tidak aktif." },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Email atau kata sandi tidak sesuai." },
        { status: 401 }
      );
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "PARENT",
      phone: user.phone,
      avatar: user.avatar,
      parentId: user.parentProfile?.id || null,
    };

    const token = await signToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil",
      user: tokenPayload,
      redirectUrl: user.role === "ADMIN" ? "/admin" : "/parent",
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server internal." },
      { status: 500 }
    );
  }
}
