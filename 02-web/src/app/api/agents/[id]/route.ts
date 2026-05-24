import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { agents } from "@/lib/db/schema"
import { eq, and, or, isNull } from "drizzle-orm"

function getUserId(req: NextRequest): string {
  return req.headers.get("x-user-id") ?? "anonymous"
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = getUserId(req)
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
    .where(and(eq(agents.id, id), or(eq(agents.userId, userId), isNull(agents.userId))))

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = getUserId(req)
  const db = getDb()

  await db
    .delete(agents)
    .where(and(eq(agents.id, id), or(eq(agents.userId, userId), isNull(agents.userId))))

  return NextResponse.json({ ok: true })
}
