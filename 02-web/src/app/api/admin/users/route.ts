import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { hashPassword } from "@/lib/session"

export async function GET() {
  const db = getDb()
  const rows = await db
    .select({ id: users.id, username: users.username, role: users.role, displayName: users.displayName, avatar: users.avatar, createdAt: users.createdAt })
    .from(users)
  return NextResponse.json(rows.map(r => ({ ...r, createdAt: r.createdAt?.toISOString() })))
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const username: string = (body.username ?? "").trim()
  const password: string = body.password ?? ""
  const role: "admin" | "user" = body.role === "admin" ? "admin" : "user"
  const displayName: string = (body.displayName ?? "").trim() || username
  const avatar: string = (body.avatar ?? "").trim() || "👤"

  if (!username || !password) {
    return NextResponse.json({ error: "帳號與密碼為必填" }, { status: 400 })
  }
  if (username.length > 64 || password.length < 6) {
    return NextResponse.json({ error: "帳號最長 64 字，密碼最短 6 字" }, { status: 400 })
  }

  const db = getDb()
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1)
  if (existing.length > 0) {
    return NextResponse.json({ error: "帳號已存在" }, { status: 409 })
  }

  const hash = await hashPassword(password)
  await db.insert(users).values({
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    username,
    passwordHash: hash,
    role,
    displayName,
    avatar,
  })
  return NextResponse.json({ ok: true })
}
