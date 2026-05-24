import { NextRequest, NextResponse } from "next/server"

const COOKIE_NAME = "ah_session"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const password: string = body.password ?? ""

  const SESSION_PASSWORD = process.env.SESSION_PASSWORD
  const SESSION_SECRET = process.env.SESSION_SECRET

  if (!SESSION_PASSWORD || !SESSION_SECRET) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 })
  }

  // Timing-safe comparison via hash (avoids leaking password length)
  const enc = new TextEncoder()
  const [inputHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(password)),
    crypto.subtle.digest("SHA-256", enc.encode(SESSION_PASSWORD)),
  ])
  const match =
    btoa(String.fromCharCode(...new Uint8Array(inputHash))) ===
    btoa(String.fromCharCode(...new Uint8Array(expectedHash)))

  if (!match) {
    return NextResponse.json({ error: "密碼錯誤" }, { status: 401 })
  }

  const token = await computeToken(SESSION_SECRET)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  })
  return res
}
