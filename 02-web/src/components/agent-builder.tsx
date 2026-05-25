"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Agent, BUILDER_AGENT_ID } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, Send, Sparkles, User, AlertCircle, Wand2, Loader2, Check, Pencil,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePageTitle } from "@/components/page-header"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

// 建構師人設：負責問清需求、最後彙整成 Agent 設定
const BUILDER_SYSTEM = `你是「Agent 建構師」，AgentsHub 的助手招募官。你的任務是透過對話，幫使用者把「想要一個什麼樣的 AI 助手」聊清楚，最後好讓系統據此建立專屬助手。

對話原則：
- 用繁體中文、溫暖且精簡。一次只問 1-2 個關鍵問題，不要一次丟一長串。
- 重點釐清：這個助手要做什麼、面對什麼場景、語氣風格、輸出格式偏好、有沒有特別的限制或禁忌。
- 適時用自己的話幫使用者歸納目前的設定方向，讓他確認。
- 當你判斷需求已經夠清楚，主動告訴使用者：「我覺得可以建立囉，按下方的『整理成草稿』就會生成這個助手 ✨」，不要自己輸出 JSON。
- 不要假裝已經建立助手；建立動作由系統按鈕完成。`

type Draft = {
  name: string
  avatar: string
  description: string
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
  tags: string[]
}

const OPENER =
  "嗨！我是 Agent 建構師 🛠️ 想幫你打造一位專屬助手。\n\n先跟我說說：你希望這位助手主要幫你做什麼？（例如：寫小紅書文案、debug 程式、陪你練英文口說…）"

async function* readSSE(res: Response) {
  const reader = res.body?.getReader()
  if (!reader) return
  const decoder = new TextDecoder()
  let buffer = ""
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      if (!line.startsWith("data:")) continue
      const raw = line.slice(5).trim()
      if (!raw || raw === "[DONE]") continue
      try { yield JSON.parse(raw) as { delta?: string; error?: string } } catch { /* skip */ }
    }
  }
}

export function AgentBuilder({ conversationId }: { conversationId?: string }) {
  const router = useRouter()
  const {
    conversations, saveAgent,
    addConversation, addMessage, updateLastMessage, renameConversation, setActiveConversation,
  } = useAppStore()
  usePageTitle("AI 建構師")

  // 對話持久化：用哨兵 agentId 存成一般 conversation，但不進最近對話列表
  const [convId, setConvId] = useState<string | undefined>(conversationId)
  const conv = conversations.find((c) => c.id === convId)
  const messages = useMemo(
    () => (conv?.messages.length
      ? conv.messages
      : [{ id: "opener", role: "assistant" as const, content: OPENER, createdAt: "" }]),
    [conv],
  )

  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 草稿（暫態 UI）
  const [draft, setDraft] = useState<Draft | null>(null)
  const [generating, setGenerating] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, streaming, draft])

  const buildTranscript = (msgs: { role: string; content: string }[]) =>
    msgs.map((m) => `${m.role === "user" ? "使用者" : "建構師"}：${m.content}`).join("\n\n")

  const send = async () => {
    const trimmed = input.trim()
    if (!trimmed || streaming) return

    // 首次發言：建立建構師對話、把開場白也存進去（續聊時可重現）
    let id = convId
    if (!id) {
      const c = addConversation(BUILDER_AGENT_ID)
      id = c.id
      setConvId(id)
      setActiveConversation(id)
      addMessage(id, { role: "assistant", content: OPENER }, true)
      renameConversation(id, `🛠️ ${trimmed.slice(0, 20)}`)
    }

    addMessage(id, { role: "user", content: trimmed }, true)
    setInput("")
    setError(null)
    setStreaming(true)

    const convNow = useAppStore.getState().conversations.find((c) => c.id === id)
    const transcript = buildTranscript(convNow?.messages ?? [])

    abortRef.current = new AbortController()
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: BUILDER_SYSTEM,
          prompt: `${transcript}\n\n（請以建構師身分接著回應最後一則使用者訊息，不要加說話者標籤。）`,
          group: "agent-builder",
          model: "claude-sonnet-4-6",
          provider: "claude",
          temperature: 0.7,
        }),
        signal: abortRef.current.signal,
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || `HTTP ${res.status}`)
      }
      const assistantMsg = addMessage(id, { role: "assistant", content: "" })
      let acc = ""
      for await (const chunk of readSSE(res)) {
        if (chunk.error) throw new Error(chunk.error)
        if (chunk.delta) { acc += chunk.delta; updateLastMessage(id, acc) }
      }
      const finalContent = acc || "（無回應）"
      if (!acc) updateLastMessage(id, finalContent)
      // 持久化助理訊息
      fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: assistantMsg.id, conversationId: id, role: "assistant", content: finalContent }),
      }).catch(console.error)
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") setError(e.message)
    } finally {
      setStreaming(false)
    }
  }

  const generateDraft = async () => {
    if (generating || streaming) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: buildTranscript(messages) }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || "生成失敗")
      setDraft(data.agent as Draft)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "生成失敗")
    } finally {
      setGenerating(false)
    }
  }

  const createAgent = () => {
    if (!draft) return
    const agent: Agent = {
      id: `agent-${Date.now()}`,
      ...draft,
      createdAt: new Date().toISOString(),
    }
    saveAgent(agent)
    router.push("/agents")
  }

  // 進「進階編輯」：把草稿暫存到 sessionStorage，由建立頁讀取
  const editInForm = () => {
    if (!draft) return
    sessionStorage.setItem("agent-draft", JSON.stringify(draft))
    router.push("/agents/new?from=builder")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 拼音/注音等輸入法組字中（選字階段）按 Enter 不送出
    if (e.key === "Enter" && !e.shiftKey && !(e.nativeEvent as { isComposing?: boolean }).isComposing) {
      e.preventDefault(); send()
    }
  }

  const canGenerate = messages.some((m) => m.role === "user")

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.push("/agents")} title="返回我的 Agent">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-base shrink-0">🛠️</span>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm">Agent 建構師</h2>
          <p className="text-xs text-muted-foreground truncate">聊清楚需求，一鍵建立專屬助手</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setConvId(undefined); setDraft(null); setError(null); router.push("/agents/build") }}>
          新討論
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4" ref={scrollRef}>
        <div className="max-w-2xl mx-auto py-4 space-y-1">
          {messages.map((msg, i) => (
            <div key={msg.id || i} className={cn("flex gap-3 py-2", msg.role === "user" && "flex-row-reverse")}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm mt-1",
                msg.role === "user" ? "bg-amber-700 text-white" : "bg-amber-100 dark:bg-amber-900"
              )}>
                {msg.role === "user" ? <User className="w-4 h-4" /> : <span>🛠️</span>}
              </div>
              <div className={cn(
                "rounded-2xl px-4 py-3 text-sm leading-relaxed break-words max-w-[80%]",
                msg.role === "user" ? "bg-amber-700 text-white rounded-tr-sm whitespace-pre-wrap" : "bg-muted rounded-tl-sm"
              )}>
                {msg.role === "user" ? msg.content : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    }}
                  >
                    {msg.content || "…"}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}

          {/* 草稿預覽卡 */}
          {draft && (
            <div className="my-4 rounded-2xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 p-4">
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 mb-3">
                <Sparkles className="w-3.5 h-3.5" /> 助手草稿
              </div>
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl shrink-0">{draft.avatar}</span>
                <div className="min-w-0">
                  <p className="font-semibold">{draft.name || "（未命名）"}</p>
                  <p className="text-xs text-muted-foreground">{draft.description}</p>
                </div>
              </div>
              <div className="text-xs space-y-2">
                <div>
                  <span className="text-muted-foreground">System Prompt</span>
                  <p className="mt-1 rounded-lg bg-background/70 px-3 py-2 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                    {draft.systemPrompt}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                  <span>模型：<span className="text-foreground">{draft.model}</span></span>
                  <span>溫度：<span className="text-foreground">{draft.temperature.toFixed(1)}</span></span>
                  <span>上限：<span className="text-foreground">{draft.maxTokens}</span></span>
                </div>
                {draft.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {draft.tags.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button size="sm" className="bg-amber-700 hover:bg-amber-800 text-white gap-1.5" onClick={createAgent}>
                  <Check className="w-3.5 h-3.5" /> 建立這個 Agent
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={editInForm}>
                  <Pencil className="w-3.5 h-3.5" /> 進階編輯
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>繼續討論調整</Button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-xl px-4 py-3 mt-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
        </div>
      </div>

      {/* Input + 整理成草稿 */}
      <div className="px-4 pb-4 shrink-0">
        <div className="max-w-2xl mx-auto space-y-2">
          {canGenerate && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                onClick={generateDraft}
                disabled={generating || streaming}
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                {generating ? "整理中…" : draft ? "重新整理草稿" : "整理成草稿"}
              </Button>
            </div>
          )}
          <div className="flex items-end gap-2 rounded-2xl border bg-background shadow-sm px-4 py-3 focus-within:ring-2 focus-within:ring-amber-300">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={streaming ? "建構師思考中…" : "回覆建構師…（Enter 送出，Shift+Enter 換行）"}
              className="flex-1 border-0 shadow-none resize-none focus-visible:ring-0 min-h-[24px] max-h-[160px] p-0 text-sm"
              rows={1}
              disabled={streaming}
            />
            <Button
              onClick={streaming ? () => abortRef.current?.abort() : send}
              size="icon"
              className={cn("h-8 w-8 rounded-xl shrink-0", streaming ? "bg-red-500 hover:bg-red-600" : "bg-amber-700 hover:bg-amber-800 disabled:opacity-40")}
              disabled={!streaming && !input.trim()}
            >
              {streaming ? <span className="w-3 h-3 rounded-sm bg-white" /> : <Send className="w-3.5 h-3.5 text-white" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
