import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { conversations, messages } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

function getUserId(req: NextRequest): string {
  return req.headers.get("x-user-id") ?? "anonymous"
}

export async function GET(req: NextRequest) {
  const db = getDb()
  const userId = getUserId(req)

  const convRows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))

  const msgRows = await db.select().from(messages).orderBy(messages.createdAt)

  const msgMap = new Map<string, (typeof messages.$inferSelect)[]>()
  for (const msg of msgRows) {
    const list = msgMap.get(msg.conversationId) ?? []
    list.push(msg)
    msgMap.set(msg.conversationId, list)
  }

  return NextResponse.json(
    convRows.map((conv) => ({
      id: conv.id,
      agentId: conv.agentId,
      title: conv.title,
      createdAt: conv.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: conv.updatedAt?.toISOString() ?? new Date().toISOString(),
      messages: (msgMap.get(conv.id) ?? []).map((msg) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt?.toISOString() ?? new Date().toISOString(),
      })),
    }))
  )
}

export async function POST(req: NextRequest) {
  const db = getDb()
  const userId = getUserId(req)
  const body = await req.json()
  await db.insert(conversations).values({
    id: body.id,
    userId,
    agentId: body.agentId,
    title: body.title ?? "新對話",
  })
  return NextResponse.json({ ok: true })
}
