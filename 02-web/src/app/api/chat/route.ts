import { NextRequest, NextResponse } from "next/server"

const PROXY_BASE = process.env.PROXY_BASE_URL || "https://clip.twloop.com"

export async function POST(req: NextRequest) {
  const { prompt, systemPrompt, project, group, token: clientToken } = await req.json()

  // 優先用 .env.local 的 token，沒有才用前端傳來的
  const token = process.env.PROXY_TOKEN || clientToken

  if (!token) {
    return NextResponse.json({ error: "缺少 proxy token（請在 .env.local 設定 PROXY_TOKEN，或在設定頁輸入）" }, { status: 401 })
  }

  const resolvedProject = process.env.PROXY_PROJECT || project || "agent-hub"

  const fullPrompt = systemPrompt
    ? `[System]\n${systemPrompt}\n\n[User]\n${prompt}`
    : prompt

  try {
    const upstream = await fetch(`${PROXY_BASE}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        project: resolvedProject,
        group: group || "chat",
      }),
    })

    if (!upstream.ok) {
      // fallback 到非串流端點
      const fallback = await fetch(`${PROXY_BASE}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          project: resolvedProject,
          group: group || "chat",
        }),
      })
      const data = await fallback.json()
      if (!data.ok) {
        return NextResponse.json({ error: data.error || "proxycli 錯誤" }, { status: 502 })
      }
      const sseBody = `data: ${JSON.stringify({ content: data.content, done: true, actual_provider: data.actual_provider, actual_model: data.actual_model })}\n\n`
      return new Response(sseBody, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
      })
    }

    return new Response(upstream.body, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
