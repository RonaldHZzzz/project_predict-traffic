import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access")?.value || null;
  const pathname = request.nextUrl.pathname;

  // Rutas públicas (sin protección)
  const publicRoutes = ["/login", "/signup"];

  // Si el usuario está en una ruta pública
  if (publicRoutes.includes(pathname)) {
    // Si tiene token, redirigir al dashboard
    if (token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Si no hay token, redirigir a login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|api).*)"],
};
