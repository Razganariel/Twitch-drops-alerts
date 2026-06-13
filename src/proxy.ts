import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getMaintenanceValue } from "@/lib/maintenance"

const allowedInMaintenance = ["/login", "/maintenance"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next()
  }

  if (/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(pathname)) {
    return NextResponse.next()
  }

  if (allowedInMaintenance.includes(pathname)) {
    return NextResponse.next()
  }

  if (getMaintenanceValue() === "true") {
    return NextResponse.redirect(new URL("/maintenance", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)"],
}
