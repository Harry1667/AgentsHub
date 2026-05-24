import { NextRequest, NextResponse } from "next/server"

const COOKIE_NAME = "ah_session"
const PUBLIC_PATHS = ["/login", "/api/auth/"]

// Uses Web Crypto (available in Edge runtime)
async function computeToken(secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("authenticated"))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  if (PUBLIC_PATHS.some((p) => path.startsWith(p))) {
    return NextResponse.next()
  }

  const secret = process.env.SESSION_SECRET
  if (!secret) {
    // No secret → dev fallback, pass through
    return NextResponse.next()
  }

  const cookie = req.cookies.get(COOKIE_NAME)?.value
  const expected = await computeToken(secret)

  if (cookie === expected) {
    return NextResponse.next()
  }

  if (path.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = req.nextUrl.clone()
  const from = path !== "/" ? `?from=${encodeURIComponent(path)}` : ""
  url.pathname = `/login${from}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
