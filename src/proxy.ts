import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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

  try {
    const baseUrl = new URL(request.url).origin
    const res = await fetch(`${baseUrl}/api/settings/maintenance`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    })
    const { maintenance } = await res.json()

    if (maintenance === "true") {
      try {
        const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
          headers: { cookie: request.headers.get("cookie") ?? "" },
        })
        const session = await sessionRes.json()

        if (session?.user?.id) {
          const adminRes = await fetch(`${baseUrl}/api/settings/check-admin`, {
            headers: { cookie: request.headers.get("cookie") ?? "" },
          })
          const adminData = await adminRes.json()
          if (adminData.isAdmin) {
            return NextResponse.next()
          }
        }
      } catch {}

      return NextResponse.redirect(new URL("/maintenance", request.url))
    }
  } catch {}

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)"],
}
