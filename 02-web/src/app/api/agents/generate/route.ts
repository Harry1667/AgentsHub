import { NextRequest, NextResponse } from "next/server"

// 對話式建立 Agent：使用者用白話描述需求，AI 產出 Agent 草稿（JSON）。
// 走 proxy REST（非串流），方便一次拿到完整 JSON 再解析。

const PROXY_BASE = process.env.PROXY_BASE_URL || "https://clip.twloop.com"
const PROVIDER_ORDER = ["gemini", "openai", "claude"] as const
type Provider = (typeof PROVIDER_ORDER)[number]

// 與前端 agent-form 的選項對齊
const ALLOWED_MODELS = [
  "claude-haiku-4-5-20251001",
  "claude-sonnet-4-6",
  "claude-opus-4-7",
  "gpt-4o-mini",
  "gpt-4o",
]
const ALLOWED_AVATARS = ["🤖", "🧠", "✍️", "🌐", "📊", "💡", "⚡", "🌱", "💰", "🎯", "🔬", "🎨", "📚", "🏃", "🎵"]

const SYSTEM_PROMPT = `你是一個 AI 助手設定產生器。使用者會用白話描述他想要的助手，請你產出該助手的完整設定。

只輸出一個 JSON 物件（不要 markdown 程式碼框、不要任何說明文字），格式如下：
{
  "name": "助手名稱（繁中，4-10 字，好記）",
  "avatar": "從這些 emoji 擇一：🤖 🧠 ✍️ 🌐 📊 💡 ⚡ 🌱 💰 🎯 🔬 🎨 📚 🏃 🎵",
  "description": "一句話簡介（繁中，20 字內）",
  "systemPrompt": "完整且專業的 system prompt（繁中撰寫），明確定義角色、語氣、行為方式、輸出格式與限制。要具體、可直接使用。",
  "model": "從這些擇一：claude-haiku-4-5-20251001(快) / claude-sonnet-4-6(均衡) / claude-opus-4-7(最強) / gpt-4o-mini / gpt-4o。一般任務用 claude-sonnet-4-6，需深度推理用 claude-opus-4-7，簡單快速用 claude-haiku-4-5-20251001。",
  "temperature": 0.0 到 1.5 的數字（精確任務如翻譯/分析用 0.3-0.5，一般 0.7，創意/發想用 1.0-1.2）,
  "maxTokens": 1024 到 8192 的整數,
  "tags": ["2-4 個繁中標籤"]
}`

async function callProxy(prompt: string, provider: Provider, token: string): Promise<string | null> {
  const res = await fetch(`${PROXY_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      prompt: `[System]\n${SYSTEM_PROMPT}\n\n[User]\n請依以下需求產生助手設定：\n${prompt}`,
      project: process.env.PROXY_PROJECT || "agent-hub",
      group: "agent-gen",
      provider,
      temperature: 0.7,
    }),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.ok) return null
  return data.content as string
}

// 從可能含雜訊的回應抽出第一個 JSON 物件
function parseAgentJson(raw: string) {
  const start = raw.indexOf("{")
  const end = raw.lastIndexOf("}")
  if (start === -1 || end === -1 || end < start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}

function sanitize(obj: Record<string, unknown>) {
  const model = typeof obj.model === "string" && ALLOWED_MODELS.includes(obj.model)
    ? obj.model
    : "claude-sonnet-4-6"
  const avatar = typeof obj.avatar === "string" && ALLOWED_AVATARS.includes(obj.avatar)
    ? obj.avatar
    : "🤖"
  const temp = typeof obj.temperature === "number" ? obj.temperature : 0.7
  const maxTokens = typeof obj.maxTokens === "number" ? Math.round(obj.maxTokens) : 2048
  const tags = Array.isArray(obj.tags)
    ? obj.tags.filter((t): t is string => typeof t === "string").slice(0, 4)
    : []
  return {
    name: typeof obj.name === "string" ? obj.name.slice(0, 40) : "",
    avatar,
    description: typeof obj.description === "string" ? obj.description.slice(0, 100) : "",
    systemPrompt: typeof obj.systemPrompt === "string" ? obj.systemPrompt : "",
    model,
    temperature: Math.min(2, Math.max(0, temp)),
    maxTokens: Math.min(8192, Math.max(256, maxTokens)),
    tags,
  }
}

export async function POST(req: NextRequest) {
  const { description, transcript } = await req.json()
  // 兩種來源：單句描述（description）或整段討論逐字稿（transcript）
  const requirement = (typeof transcript === "string" && transcript.trim())
    ? `以下是使用者與建構師的需求討論，請依此設計助手：\n\n${transcript.trim()}`
    : (typeof description === "string" ? description.trim() : "")

  if (!requirement) {
    return NextResponse.json({ error: "請描述你想要的助手" }, { status: 400 })
  }

  const token = process.env.PROXY_TOKEN
  if (!token) {
    return NextResponse.json({ error: "缺少 PROXY_TOKEN，請在 .env.local 設定" }, { status: 401 })
  }

  // 依序嘗試各 provider，直到拿到可解析的 JSON
  for (const provider of PROVIDER_ORDER) {
    const content = await callProxy(requirement, provider, token)
    if (!content) continue
    const parsed = parseAgentJson(content)
    if (parsed) {
      return NextResponse.json({ ok: true, agent: sanitize(parsed) })
    }
  }

  return NextResponse.json(
    { error: "生成失敗，請換個說法再試一次" },
    { status: 503 },
  )
}
