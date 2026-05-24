import { NextRequest, NextResponse } from "next/server"

const COOKIE_NAME = "ah_session"
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"]
const ADMIN_PATHS = ["/admin", "/api/admin/"]

async function hmac(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("")
}

async function verifyToken(secret: string, token: string) {
  const dot = token.lastIndexOf(".")
  if (dot === -1) return null
  const b64 = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = await hmac(secret, b64)
  if (expected !== sig) return null
  try {
    const payload = JSON.parse(atob(b64))
    if (!payload.sub || !payload.role || !payload.exp) return null
    if (payload.exp < Date.now()) return null
    return payload as { sub: string; role: string; exp: number }
  } catch {
    return null
  }
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  if (PUBLIC_PATHS.some((p) => path.startsWith(p))) {
    return NextResponse.next()
  }

  const secret = process.env.SESSION_SECRET
  if (!secret) return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifyToken(secret, token) : null

  if (!session) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    if (path !== "/") url.searchParams.set("from", path)
    return NextResponse.redirect(url)
  }

  if (ADMIN_PATHS.some((p) => path.startsWith(p)) && session.role !== "admin") {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.redirect(new URL("/chat", req.url))
  }

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-user-id", session.sub)
  requestHeaders.set("x-user-role", session.role)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
