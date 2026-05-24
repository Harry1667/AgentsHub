"use client"

import { useState, useRef, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, User, Sparkles, Plus, AlertCircle, Copy, Check, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type ProviderOption = "auto" | "gemini" | "openai" | "claude"

const PROVIDER_OPTIONS: { value: ProviderOption; label: string }[] = [
  { value: "auto", label: "自動" },
  { value: "gemini", label: "Gemini" },
  { value: "openai", label: "GPT-4o" },
  { value: "claude", label: "Claude" },
]

async function* readSSEStream(response: Response): AsyncGenerator<{
  delta?: string
  done?: boolean
  actual_provider?: string
  actual_model?: string
  error?: string
}> {
  const reader = response.body?.getReader()
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
      if (line.startsWith("data:")) {
        const raw = line.slice(5).trim()
        if (!raw || raw === "[DONE]") continue
        try { yield JSON.parse(raw) } catch { /* skip */ }
      }
    }
  }
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 py-4">
      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center shrink-0 text-base">
        🤖
      </div>
      <div className="flex items-center gap-1 bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  )
}

function parseProviderSuffix(content: string) {
  const match = content.match(/^([\s\S]*?)\n\n_via (.+?) · (.*?)_\s*$/)
  if (match) return { text: match[1].trim(), provider: match[2], model: match[3] }
  return { text: content, provider: null, model: null }
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = typeof children === "string" ? children : String(children)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="relative group/code my-2">
      <code className="block bg-black/10 dark:bg-white/10 rounded-lg px-3 py-2 text-xs font-mono overflow-x-auto whitespace-pre">
        {children}
      </code>
      <button
        onClick={handleCopy}
        className="absolute top-1.5 right-1.5 p-1 rounded opacity-0 group-hover/code:opacity-100 transition-opacity bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20"
        title="複製程式碼"
      >
        {copied
          ? <Check className="w-3 h-3 text-green-500" />
          : <Copy className="w-3 h-3 text-muted-foreground" />}
      </button>
    </div>
  )
}

function AssistantMarkdown({ content }: { content: string }) {
  const { text, provider, model } = parseProviderSuffix(content)
  return (
    <div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-muted-foreground/40 pl-3 my-2 text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.startsWith("language-")
            return isBlock ? (
              <CodeBlock>{children}</CodeBlock>
            ) : (
              <code className="bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 text-xs font-mono">
                {children}
              </code>
            )
          },
          pre: ({ children }) => <>{children}</>,
          hr: () => <hr className="my-3 border-muted-foreground/20" />,
        }}
      >
        {text}
      </ReactMarkdown>
      {provider && (
        <p className="mt-2 text-[10px] text-muted-foreground/60 border-t border-muted-foreground/10 pt-1.5">
          via {provider}{model ? ` · ${model}` : ""}
        </p>
      )}
    </div>
  )
}

function MessageBubble({
  role,
  content,
  avatar,
  isLast,
  onRegenerate,
}: {
  role: "user" | "assistant"
  content: string
  avatar?: string
  isLast?: boolean
  onRegenerate?: () => void
}) {
  const isUser = role === "user"
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const { text } = parseProviderSuffix(content)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={cn("flex gap-3 py-2", isUser && "flex-row-reverse")}>
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm", isUser ? "bg-indigo-500 text-white" : "bg-indigo-100 dark:bg-indigo-900")}>
        {isUser ? <User className="w-4 h-4" /> : <span>{avatar || "🤖"}</span>}
      </div>
      <div className="flex flex-col gap-1 max-w-[70%]">
        <div className={cn("relative group/msg rounded-2xl px-4 py-3 text-sm leading-relaxed break-words", isUser ? "bg-indigo-500 text-white rounded-tr-sm whitespace-pre-wrap" : "bg-muted rounded-tl-sm")}>
          {isUser ? content : <AssistantMarkdown content={content} />}
          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover/msg:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10"
              title="複製訊息"
            >
              {copied
                ? <Check className="w-3.5 h-3.5 text-green-500" />
                : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
          )}
        </div>
        {!isUser && isLast && onRegenerate && (
          <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity pl-1">
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              重新生成
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface ChatInterfaceProps {
  conversationId?: string
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const router = useRouter()
  const { conversations, agents, addMessage, updateLastMessage, removeLastAssistantMessage, addConversation, setActiveConversation } = useAppStore()
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<ProviderOption>("auto")
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const conversation = conversations.find((c) => c.id === conversationId)
  const agent = conversation ? agents.find((a) => a.id === conversation.agentId) : agents[0]

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conversation?.messages, isStreaming])

  const callProxy = async (convId: string, userPrompt: string) => {
    abortRef.current = new AbortController()

    const body: Record<string, string> = {
      prompt: userPrompt,
      systemPrompt: agent?.systemPrompt || "",
      group: agent?.name || "chat",
    }
    if (selectedProvider !== "auto") {
      body.provider = selectedProvider
    }

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: abortRef.current.signal,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      throw new Error(err.error || `HTTP ${res.status}`)
    }

    const assistantMsg = addMessage(convId, { role: "assistant", content: "" })
    let accumulated = ""
    let providerSuffix = ""

    for await (const chunk of readSSEStream(res)) {
      if (chunk.error) throw new Error(chunk.error)
      if (chunk.delta) {
        accumulated += chunk.delta
        updateLastMessage(convId, accumulated)
      }
      if (chunk.done && chunk.actual_provider) {
        providerSuffix = `\n\n_via ${chunk.actual_provider} · ${chunk.actual_model || ""}_`
        updateLastMessage(convId, accumulated + providerSuffix)
      }
    }

    const finalContent = accumulated
      ? accumulated + providerSuffix
      : "（無回應）"
    if (!accumulated) updateLastMessage(convId, finalContent)

    // Persist final assistant message to DB
    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: assistantMsg.id,
        conversationId: convId,
        role: "assistant",
        content: finalContent,
      }),
    }).catch(console.error)
  }

  const handleSend = async (promptOverride?: string) => {
    const trimmed = (promptOverride ?? input).trim()
    if (!trimmed || isStreaming) return

    let convId = conversationId
    if (!convId || !conversation) {
      const defaultAgent = agent || agents[0]
      if (!defaultAgent) return
      const newConv = addConversation(defaultAgent.id)
      convId = newConv.id
      setActiveConversation(convId)
      router.push(`/chat/${convId}`)
    }

    if (!promptOverride) {
      addMessage(convId, { role: "user", content: trimmed }, true)
      setInput("")
    }
    setError(null)
    setIsStreaming(true)

    try {
      await callProxy(convId, trimmed)
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") setError(e.message)
    } finally {
      setIsStreaming(false)
    }
  }

  const handleRegenerate = async () => {
    if (!conversationId || !conversation || isStreaming) return
    const msgs = conversation.messages
    // Find last user message before the last assistant message
    const lastAssistant = msgs[msgs.length - 1]
    if (!lastAssistant || lastAssistant.role !== "assistant") return
    const lastUserMsg = [...msgs].reverse().find((m) => m.role === "user")
    if (!lastUserMsg) return

    removeLastAssistantMessage(conversationId)
    setError(null)
    setIsStreaming(true)

    try {
      await callProxy(conversationId, lastUserMsg.content)
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") setError(e.message)
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleNewChat = () => {
    const a = agents[0]
    if (!a) return
    const conv = addConversation(a.id)
    setActiveConversation(conv.id)
    router.push(`/chat/${conv.id}`)
  }

  const isEmpty = !conversation || conversation.messages.length === 0

  const messages = conversation?.messages ?? []
  const lastMsg = messages[messages.length - 1]
  const lastIsAssistant = lastMsg?.role === "assistant"

  return (
    <div className="flex flex-col h-full">
      {agent && (
        <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
          <span className="text-xl">{agent.avatar}</span>
          <div>
            <h2 className="font-semibold text-sm">{agent.name}</h2>
            <p className="text-xs text-muted-foreground">{isEmpty ? agent.description : conversation?.title}</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto gap-1.5" onClick={handleNewChat}>
            <Plus className="w-3.5 h-3.5" />新對話
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto py-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
              <div className="text-center">
                <div className="text-5xl mb-4">{agent?.avatar || "🤖"}</div>
                <h1 className="text-2xl font-bold mb-2">你好！我是 {agent?.name}</h1>
                <p className="text-muted-foreground max-w-md text-sm">{agent?.description}</p>
              </div>
              {agent && (
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {agent.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                {["幫我分析這段程式碼", "解釋這個概念", "幫我優化文案", "翻譯成英文"].map((p) => (
                  <button key={p} onClick={() => setInput(p)} className="text-left px-4 py-3 rounded-xl border hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-sm text-muted-foreground transition-colors">
                    <Sparkles className="w-3.5 h-3.5 inline mr-1.5 text-indigo-400" />{p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  avatar={agent?.avatar}
                  isLast={idx === messages.length - 1}
                  onRegenerate={idx === messages.length - 1 && lastIsAssistant && !isStreaming ? handleRegenerate : undefined}
                />
              ))}
              {isStreaming && messages[messages.length - 1]?.role === "user" && <TypingIndicator />}
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-xl px-4 py-3 mt-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex flex-col gap-2 rounded-2xl border bg-background shadow-sm px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-300">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isStreaming ? "AI 回應中..." : "輸入訊息… (Enter 送出，Shift+Enter 換行)"}
                className="flex-1 border-0 shadow-none resize-none focus-visible:ring-0 min-h-[24px] max-h-[200px] p-0 text-sm"
                rows={1}
                disabled={isStreaming}
              />
              <Button
                onClick={isStreaming ? () => abortRef.current?.abort() : () => handleSend()}
                size="icon"
                className={cn("h-8 w-8 rounded-xl shrink-0", isStreaming ? "bg-red-500 hover:bg-red-600" : "bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40")}
                disabled={!isStreaming && !input.trim()}
              >
                {isStreaming
                  ? <span className="w-3 h-3 rounded-sm bg-white" />
                  : <Send className="w-3.5 h-3.5 text-white" />}
              </Button>
            </div>
            {/* Model selector chips */}
            <div className="flex items-center gap-1.5">
              {PROVIDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedProvider(opt.value)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs transition-colors",
                    selectedProvider === opt.value
                      ? "bg-indigo-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
