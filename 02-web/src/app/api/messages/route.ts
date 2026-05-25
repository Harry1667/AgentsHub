import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { messages } from "@/lib/db/schema"

export async function POST(req: NextRequest) {
  const db = getDb()
  const body = await req.json()
  await db.insert(messages).values({
    id: body.id,
    conversationId: body.conversationId,
    role: body.role,
    agentId: body.agentId ?? null,
    content: body.content,
  })
  return NextResponse.json({ ok: true })
}
