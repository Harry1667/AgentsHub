import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, and, ne } from "drizzle-orm"

export async function PATCH(req: NextRequest) {
  const userId = req.headers.get("x-user-id")
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const username: string = (body.username ?? "").trim()

  if (!username) return NextResponse.json({ error: "帳號不得為空" }, { status: 400 })
  if (username.length > 64) return NextResponse.json({ error: "帳號最多 64 個字元" }, { status: 400 })
  if (!/^[a-zA-Z0-9_\-一-鿿]+$/.test(username)) {
    return NextResponse.json({ error: "帳號只能包含英數字、底線、連字號或中文" }, { status: 400 })
  }

  const db = getDb()
  const [taken] = await db.select({ id: users.id }).from(users)
    .where(and(eq(users.username, username), ne(users.id, userId)))
    .limit(1)

  if (taken) return NextResponse.json({ error: "此帳號已被使用" }, { status: 409 })

  await db.update(users).set({ username }).where(eq(users.id, userId))
  return NextResponse.json({ ok: true, username })
}
