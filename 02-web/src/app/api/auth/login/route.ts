import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { signSession, hashPassword, verifyPassword, COOKIE_NAME, SESSION_DURATION_MS } from "@/lib/session"

async function ensureAdminExists() {
  const db = getDb()
  const adminUser = process.env.ADMIN_USERNAME
  const adminPass = process.env.ADMIN_PASSWORD
  if (!adminUser || !adminPass) return

  const existing = await db.select({ id: users.id }).from(users).limit(1)
  if (existing.length > 0) return

  const hash = await hashPassword(adminPass)
  await db.insert(users).values({
    id: `user-admin-${Date.now()}`,
    username: adminUser,
    passwordHash: hash,
    role: "admin",
    displayName: adminUser,
    avatar: "👤",
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const username: string = (body.username ?? "").trim()
  const password: string = body.password ?? ""

  if (!username || !password) {
    return NextResponse.json({ error: "請填寫帳號與密碼" }, { status: 400 })
  }

  const secret = process.env.SESSION_SECRET
  if (!secret) return NextResponse.json({ error: "Server not configured" }, { status: 500 })

  await ensureAdminExists()

  const db = getDb()
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1)

  if (!user) {
    return NextResponse.json({ error: "帳號或密碼錯誤" }, { status: 401 })
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: "帳號或密碼錯誤" }, { status: 401 })
  }

  const token = await signSession(secret, { sub: user.id, role: user.role })

  const res = NextResponse.json({ ok: true, role: user.role })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DURATION_MS / 1000,
    path: "/",
  })
  return res
}
