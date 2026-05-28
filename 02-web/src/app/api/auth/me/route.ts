import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { TRIAL_USERNAME } from "@/lib/session"
import { getTrialQuota } from "@/lib/trial"

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id")
  const role = req.headers.get("x-user-role")
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = getDb()
  const [user] = await db.select({ username: users.username }).from(users).where(eq(users.id, userId)).limit(1)

  const username = user?.username ?? ""
  const trial = username === TRIAL_USERNAME
  const quota = trial ? getTrialQuota() : undefined

  return NextResponse.json({ userId, role, username, trial, quota })
}
