import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { hashPassword, verifyPassword } from "@/lib/session"

export async function PATCH(req: NextRequest) {
  const userId = req.headers.get("x-user-id")
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const currentPassword: string = body.currentPassword ?? ""
  const newPassword: string = body.newPassword ?? ""

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "請填寫所有欄位" }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "新密碼至少需要 6 個字元" }, { status: 400 })
  }

  const db = getDb()
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) return NextResponse.json({ error: "用戶不存在" }, { status: 404 })

  const valid = await verifyPassword(currentPassword, user.passwordHash)
  if (!valid) return NextResponse.json({ error: "目前密碼錯誤" }, { status: 400 })

  const newHash = await hashPassword(newPassword)
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId))

  return NextResponse.json({ ok: true })
}
