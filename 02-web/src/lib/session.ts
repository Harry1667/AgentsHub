// Session token: base64(payload).hex(hmac)
// payload = JSON.stringify({ sub, role, exp })
// Works in both Edge (middleware) and Node (API routes) via Web Crypto

export type UserRole = "admin" | "user"

export interface SessionPayload {
  sub: string   // user id
  role: UserRole
  exp: number   // unix ms
}

const COOKIE_NAME = "ah_session"
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

async function hmac(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("")
}

export async function signSession(secret: string, payload: Omit<SessionPayload, "exp">): Promise<string> {
  const full: SessionPayload = { ...payload, exp: Date.now() + SESSION_DURATION_MS }
  const b64 = btoa(JSON.stringify(full))
  const sig = await hmac(secret, b64)
  return `${b64}.${sig}`
}

export async function verifySession(secret: string, token: string): Promise<SessionPayload | null> {
  const dot = token.lastIndexOf(".")
  if (dot === -1) return null
  const b64 = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = await hmac(secret, b64)
  if (expected !== sig) return null
  try {
    const payload: SessionPayload = JSON.parse(atob(b64))
    if (!payload.sub || !payload.role || !payload.exp) return null
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, "0")).join("")
  const enc = new TextEncoder()
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(password + salt))
  const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("")
  return `${hex}:${salt}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [, salt] = stored.split(":")
  if (!salt) return false
  const enc = new TextEncoder()
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(password + salt))
  const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("")
  const candidate = `${hex}:${salt}`
  // Constant-time comparison
  if (candidate.length !== stored.length) return false
  let diff = 0
  for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ stored.charCodeAt(i)
  return diff === 0
}

export { COOKIE_NAME, SESSION_DURATION_MS }
