import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { hashPassword } from "@/lib/session"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const db = getDb()

  const updates: Partial<typeof users.$inferInsert> = {}
  if (body.role === "admin" || body.role === "user") updates.role = body.role
  if (body.password) {
    if (body.password.length < 6) {
      return NextResponse.json({ error: "密碼最短 6 字" }, { status: 400 })
    }
    updates.passwordHash = await hashPassword(body.password)
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "無更新內容" }, { status: 400 })
  }

  await db.update(users).set(updates).where(eq(users.id, id))
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const selfId = req.headers.get("x-user-id")
  if (id === selfId) {
    return NextResponse.json({ error: "無法刪除自己的帳號" }, { status: 400 })
  }
  const db = getDb()
  await db.delete(users).where(eq(users.id, id))
  return NextResponse.json({ ok: true })
}
