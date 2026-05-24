import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { agents } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = getDb()
  const body = await req.json()
  await db
    .update(agents)
    .set({
      name: body.name,
      avatar: body.avatar,
      description: body.description,
      systemPrompt: body.systemPrompt,
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      tags: body.tags,
    })
    .where(eq(agents.id, id))
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = getDb()
  await db.delete(agents).where(eq(agents.id, id))
  return NextResponse.json({ ok: true })
}
