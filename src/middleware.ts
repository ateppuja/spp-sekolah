import { NextRequest, NextResponse } from "next/server";
import { verifyJwtEdge, COOKIE_NAME } from "./lib/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifyJwtEdge(token) : null;

  // Protect Admin Routes
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/parent", req.url));
    }
    return NextResponse.next();
  }

  // Protect Parent Routes
  if (pathname.startsWith("/parent")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // Handle Login Route when already authenticated
  if (pathname === "/login") {
    if (session) {
      if (session.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url));
      } else {
        return NextResponse.redirect(new URL("/parent", req.url));
      }
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/parent/:path*", "/login"],
};
