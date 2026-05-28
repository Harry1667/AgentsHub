// 體驗帳號相關工具：確保體驗帳號存在、token 配額計量、模型限制。

import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { hashPassword, TRIAL_USERNAME, TRIAL_HOURLY_TOKEN_LIMIT, TRIAL_BLOCKED_MODELS } from "@/lib/session"

// 確保體驗帳號存在；密碼隨機（外部無法用密碼登入此帳號），只能透過 /api/auth/trial
export async function ensureTrialUserExists(): Promise<string> {
  const db = getDb()
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, TRIAL_USERNAME))
    .limit(1)
  if (existing) return existing.id

  const id = `user-trial-${Date.now()}`
  const randomPw = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  const hash = await hashPassword(randomPw)
  await db.insert(users).values({
    id,
    username: TRIAL_USERNAME,
    passwordHash: hash,
    role: "user",
    displayName: "🎁 體驗帳號",
    avatar: "🎁",
  })
  return id
}

// 判斷此 userId 是否為體驗帳號（DB 查詢有快取）
const trialIdCache: { id: string | null; checkedAt: number } = { id: null, checkedAt: 0 }
const TRIAL_ID_CACHE_MS = 60_000

export async function isTrialUser(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false
  const now = Date.now()
  if (!trialIdCache.id || now - trialIdCache.checkedAt > TRIAL_ID_CACHE_MS) {
    const db = getDb()
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, TRIAL_USERNAME))
      .limit(1)
    trialIdCache.id = row?.id ?? null
    trialIdCache.checkedAt = now
  }
  return trialIdCache.id === userId
}

// 模型是否禁用（體驗帳號用）
export function isModelBlockedForTrial(model: string | undefined | null): boolean {
  if (!model) return false
  return TRIAL_BLOCKED_MODELS.has(model)
}

// ─── 共享 token 配額（每小時）─────────────────────────
// 體驗帳號全員共用一個額度桶；in-memory，重啟即重置（可接受）。
type Bucket = { used: number; resetAt: number }
const HOUR_MS = 60 * 60 * 1000
const trialBucket: Bucket = { used: 0, resetAt: Date.now() + HOUR_MS }

export function getTrialQuota(): { used: number; limit: number; resetAt: number } {
  if (Date.now() > trialBucket.resetAt) {
    trialBucket.used = 0
    trialBucket.resetAt = Date.now() + HOUR_MS
  }
  return { used: trialBucket.used, limit: TRIAL_HOURLY_TOKEN_LIMIT, resetAt: trialBucket.resetAt }
}

// 嘗試扣除 tokens；不足回 false 並附帶剩餘秒數
export function chargeTrialTokens(estTokens: number): { ok: boolean; retryAfterSec: number; used: number; limit: number } {
  const q = getTrialQuota()
  if (q.used + estTokens > q.limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((q.resetAt - Date.now()) / 1000)),
      used: q.used,
      limit: q.limit,
    }
  }
  trialBucket.used += estTokens
  return { ok: true, retryAfterSec: 0, used: trialBucket.used, limit: q.limit }
}

// 粗估 prompt 的 token 數（中英文混合，1 token ≈ 2.5 字）+ 預留回覆 buffer
export function estimateTokens(prompt: string, reserveResponseTokens = 1500): number {
  const promptTokens = Math.ceil((prompt?.length ?? 0) / 2.5)
  return promptTokens + reserveResponseTokens
}
