import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-jwt-key-spp-sekolah-indonesia-2026-secure-random"
);

export const COOKIE_NAME = "spp_auth_token";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "PARENT";
  phone?: string | null;
  avatar?: string | null;
  parentId?: string | null;
}

/**
 * Hash plain password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare plain password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign JWT Token
 */
export async function signToken(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Verify JWT Token
 */
export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch (err) {
    return null;
  }
}

/**
 * Get current session from server-side cookies
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Get user session from NextRequest (for route handlers/middleware)
 */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Require authenticated user with specified role
 */
export async function requireAuth(
  req: NextRequest,
  allowedRoles: Array<"ADMIN" | "PARENT"> = ["ADMIN", "PARENT"]
): Promise<{ user: SessionUser } | { errorResponse: NextResponse }> {
  const user = await getSessionFromRequest(req);
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { success: false, message: "Sesi tidak valid atau telah kedaluwarsa. Silakan login kembali." },
        { status: 401 }
      ),
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      errorResponse: NextResponse.json(
        { success: false, message: "Akses ditolak. Anda tidak memiliki izin untuk mengakses fitur ini." },
        { status: 403 }
      ),
    };
  }

  return { user };
}
