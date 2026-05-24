import { NextRequest, NextResponse } from "next/server"

const PROXY_BASE = process.env.PROXY_BASE_URL || "https://clip.twloop.com"
const PROVIDER_ORDER = ["gemini", "openai", "claude"] as const
type Provider = (typeof PROVIDER_ORDER)[number]

// Returns the Response if provider is available, null if we should try next provider.
// Throws on non-retryable errors (auth, bad request, etc.)
async function tryStreamWithProvider(
  prompt: string,
  project: string,
  group: string,
  provider: Provider,
  token: string,
): Promise<Response | null> {
  const res = await fetch(`${PROXY_BASE}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ prompt, project, group, provider }),
  })

  if (res.ok) return res

  const errorCode = res.headers.get("x-pcli-error-code") ?? ""
  const isRetryable =
    errorCode === "quota_exhausted" ||
    errorCode === "provider_down" ||
    res.status === 429 ||
    res.status === 502

  if (isRetryable) return null

  // auth_invalid, bad_request, unknown — don't retry
  throw new Error(errorCode || `HTTP ${res.status}`)
}

// Non-streaming fallback for the final provider attempt
async function tryRestWithProvider(
  prompt: string,
  project: string,
  group: string,
  provider: Provider,
  token: string,
): Promise<{ delta: string; actual_provider: string; actual_model: string } | null> {
  const res = await fetch(`${PROXY_BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ prompt, project, group, provider }),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.ok) return null
  return { delta: data.content, actual_provider: data.actual_provider, actual_model: data.actual_model }
}

export async function POST(req: NextRequest) {
  const { prompt, systemPrompt, project, group } = await req.json()
  const token = process.env.PROXY_TOKEN

  if (!token) {
    return NextResponse.json({ error: "缺少 PROXY_TOKEN，請在 .env.local 設定" }, { status: 401 })
  }

  const resolvedProject = process.env.PROXY_PROJECT || project || "agent-hub"
  const fullPrompt = systemPrompt
    ? `[System]\n${systemPrompt}\n\n[User]\n${prompt}`
    : prompt

  try {
    // Try each provider in order: gemini → openai → claude
    for (const provider of PROVIDER_ORDER) {
      const streamRes = await tryStreamWithProvider(
        fullPrompt, resolvedProject, group || "chat", provider, token,
      )

      if (streamRes) {
        return new Response(streamRes.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        })
      }
      // null → provider unavailable, try next
    }

    // All streaming failed — try REST with claude as last resort
    const rest = await tryRestWithProvider(
      fullPrompt, resolvedProject, group || "chat", "claude", token,
    )
    if (rest) {
      const sseBody = `data: ${JSON.stringify({ delta: rest.delta, done: true, actual_provider: rest.actual_provider, actual_model: rest.actual_model })}\n\n`
      return new Response(sseBody, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
      })
    }

    return NextResponse.json(
      { error: "所有 AI provider 均無法使用（gemini / openai / claude 全數失敗）" },
      { status: 503 },
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
