"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, MessageSquare } from "lucide-react"

interface SearchResult {
  conversationId: string
  conversationTitle: string
  agentAvatar: string
  agentName: string
  excerpt?: string
  updatedAt: string
}

export function SearchModal() {
  const router = useRouter()
  const { conversations, agents, setActiveConversation } = useAppStore()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const results: SearchResult[] = (() => {
    const found: SearchResult[] = []
    const q = query.trim().toLowerCase()

    for (const conv of [...conversations].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )) {
      const agent = agents.find((a) => a.id === conv.agentId)
      if (!q || conv.title.toLowerCase().includes(q)) {
        found.push({
          conversationId: conv.id,
          conversationTitle: conv.title,
          agentAvatar: agent?.avatar || "🤖",
          agentName: agent?.name || "",
          updatedAt: conv.updatedAt,
        })
        if (!q && found.length >= 8) break
        continue
      }
      for (const msg of conv.messages) {
        if (msg.content.toLowerCase().includes(q)) {
          const idx = msg.content.toLowerCase().indexOf(q)
          const start = Math.max(0, idx - 25)
          const end = Math.min(msg.content.length, idx + 55)
          const excerpt =
            (start > 0 ? "…" : "") + msg.content.slice(start, end) + (end < msg.content.length ? "…" : "")
          found.push({
            conversationId: conv.id,
            conversationTitle: conv.title,
            agentAvatar: agent?.avatar || "🤖",
            agentName: agent?.name || "",
            excerpt,
            updatedAt: msg.createdAt,
          })
          break
        }
      }
      if (found.length >= 10) break
    }
    return found
  })()

  const handleSelect = (conversationId: string) => {
    setActiveConversation(conversationId)
    setOpen(false)
    setQuery("")
    router.push(`/chat/${conversationId}`)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery("") }}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="搜尋對話或訊息..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 p-0 text-sm"
            autoFocus
          />
        </div>

        <div className="max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">找不到結果</div>
          ) : (
            <div className="py-1">
              {!query.trim() && (
                <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium">最近對話</div>
              )}
              {results.map((r, i) => (
                <button
                  key={`${r.conversationId}-${i}`}
                  onClick={() => handleSelect(r.conversationId)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                >
                  <span className="text-base shrink-0 mt-0.5">{r.agentAvatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.conversationTitle}</div>
                    {r.excerpt && (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{r.excerpt}</div>
                    )}
                    <div className="text-[10px] text-muted-foreground/60 mt-0.5">{r.agentName}</div>
                  </div>
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t px-3 py-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span><kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px]">↵</kbd> 開啟</span>
          <span><kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px]">Esc</kbd> 關閉</span>
          <span className="ml-auto"><kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px]">⌘K</kbd> 搜尋</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
