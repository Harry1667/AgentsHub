import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { agents } from "@/lib/db/schema"
import { eq, or, isNull } from "drizzle-orm"
import { DEFAULT_AGENTS } from "@/lib/mock-data"

function mapRow(row: typeof agents.$inferSelect) {
  return {
    ...row,
    description: row.description ?? "",
    systemPrompt: row.systemPrompt ?? "",
    tags: (row.tags as string[]) ?? [],
    isDefault: row.isDefault === 1,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  }
}

function getUserId(req: NextRequest): string {
  return req.headers.get("x-user-id") ?? "anonymous"
}

export async function GET(req: NextRequest) {
  const db = getDb()
  const userId = getUserId(req)

  let rows = await db
    .select()
    .from(agents)
    .where(or(eq(agents.userId, userId), isNull(agents.userId)))

  // Seed default agents for new users
  if (rows.length === 0) {
    await db.insert(agents).values(
      DEFAULT_AGENTS.map((a) => ({
        id: `${a.id}-${userId}`,
        userId,
        name: a.name,
        avatar: a.avatar,
        description: a.description,
        systemPrompt: a.systemPrompt,
        model: a.model,
        temperature: a.temperature,
        maxTokens: a.maxTokens,
        tags: a.tags,
        useCount: a.useCount ?? 0,
        isDefault: a.isDefault ? 1 : 0,
      }))
    )
    rows = await db
      .select()
      .from(agents)
      .where(or(eq(agents.userId, userId), isNull(agents.userId)))
  }

  return NextResponse.json(rows.map(mapRow))
}

export async function POST(req: NextRequest) {
  const db = getDb()
  const userId = getUserId(req)
  const body = await req.json()
  await db.insert(agents).values({
    id: body.id,
    userId,
    name: body.name,
    avatar: body.avatar ?? "🤖",
    description: body.description ?? "",
    systemPrompt: body.systemPrompt ?? "",
    model: body.model ?? "claude-sonnet-4-6",
    temperature: body.temperature ?? 0.7,
    maxTokens: body.maxTokens ?? 2048,
    tags: body.tags ?? [],
    useCount: 0,
    isDefault: 0,
  })
  return NextResponse.json({ ok: true })
}
