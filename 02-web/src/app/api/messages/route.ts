import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { messages } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: NextRequest) {
  const db = getDb()
  const body = await req.json()
  await db.insert(messages).values({
    id: body.id,
    conversationId: body.conversationId,
    role: body.role,
    agentId: body.agentId ?? null,
    content: body.content,
    actualProvider: body.actualProvider ?? null,
    actualModel: body.actualModel ?? null,
  })
  return NextResponse.json({ ok: true })
}

// 覆寫既有訊息內容（段落重寫後使用）
export async function PATCH(req: NextRequest) {
  const db = getDb()
  const body = await req.json()
  if (!body.id || typeof body.content !== "string") {
    return NextResponse.json({ error: "缺少 id 或 content" }, { status: 400 })
  }
  await db.update(messages).set({ content: body.content }).where(eq(messages.id, body.id))
  return NextResponse.json({ ok: true })
}
