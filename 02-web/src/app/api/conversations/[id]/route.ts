import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { conversations, messages } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = getDb()
  const body = await req.json()
  await db.update(conversations).set({ title: body.title }).where(eq(conversations.id, id))
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = getDb()
  await db.delete(messages).where(eq(messages.conversationId, id))
  await db.delete(conversations).where(eq(conversations.id, id))
  return NextResponse.json({ ok: true })
}
