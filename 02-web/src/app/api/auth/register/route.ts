import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { signSession, hashPassword, COOKIE_NAME, SESSION_DURATION_MS } from "@/lib/session"

// 公開註冊：需通過邀請碼（REGISTER_CODE）。成功即自動登入。
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const code: string = (body.code ?? "").trim()
  const username: string = (body.username ?? "").trim()
  const password: string = body.password ?? ""
  const displayName: string = (body.displayName ?? "").trim() || username
  const avatar: string = (body.avatar ?? "").trim() || "👤"

  const registerCode = process.env.REGISTER_CODE
  const secret = process.env.SESSION_SECRET
  if (!registerCode) return NextResponse.json({ error: "尚未開放註冊（缺少 REGISTER_CODE）" }, { status: 403 })
  if (!secret) return NextResponse.json({ error: "Server not configured" }, { status: 500 })

  if (!code || code !== registerCode) {
    return NextResponse.json({ error: "邀請碼不正確" }, { status: 403 })
  }
  if (!username || !password) {
    return NextResponse.json({ error: "請填寫帳號與密碼" }, { status: 400 })
  }
  if (username.length > 64 || password.length < 6) {
    return NextResponse.json({ error: "帳號最長 64 字，密碼最短 6 字" }, { status: 400 })
  }

  const db = getDb()
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1)
  if (existing.length > 0) {
    return NextResponse.json({ error: "帳號已存在" }, { status: 409 })
  }

  const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const hash = await hashPassword(password)
  await db.insert(users).values({ id, username, passwordHash: hash, role: "user", displayName, avatar })

  // 自動登入
  const token = await signSession(secret, { sub: id, role: "user" })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DURATION_MS / 1000,
    path: "/",
  })
  return res
}
