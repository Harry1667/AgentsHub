import { NextRequest, NextResponse } from "next/server"
import { signSession, COOKIE_NAME, SESSION_DURATION_MS } from "@/lib/session"
import { ensureTrialUserExists } from "@/lib/trial"

// 體驗帳號一鍵登入：不需密碼，直接以 trial 共用帳號發 session。
export async function POST(_req: NextRequest) {
  const secret = process.env.SESSION_SECRET
  if (!secret) return NextResponse.json({ error: "Server not configured" }, { status: 500 })

  try {
    const userId = await ensureTrialUserExists()
    const token = await signSession(secret, { sub: userId, role: "user" })
    const res = NextResponse.json({ ok: true, trial: true })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_DURATION_MS / 1000,
      path: "/",
    })
    return res
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
