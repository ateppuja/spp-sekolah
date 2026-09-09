import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-jwt-key-spp-sekolah-indonesia-2026-secure-random"
);

export const COOKIE_NAME = "spp_auth_token";

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "PARENT";
  parentId?: string | null;
}

export async function verifyJwtEdge(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}
