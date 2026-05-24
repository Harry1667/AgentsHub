"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Agent } from "@/lib/types"

const DESK_THEMES = [
  // Warm sand
  { wall: "bg-amber-100 dark:bg-amber-900",  desk: "bg-amber-50 dark:bg-amber-950",   edge: "bg-amber-200 dark:bg-amber-800" },
  // Dusty rose
  { wall: "bg-rose-100 dark:bg-rose-900",    desk: "bg-rose-50 dark:bg-rose-950",     edge: "bg-rose-200 dark:bg-rose-800" },
  // Warm stone
  { wall: "bg-stone-200 dark:bg-stone-800",  desk: "bg-stone-100 dark:bg-stone-900",  edge: "bg-stone-300 dark:bg-stone-700" },
  // Peach / apricot
  { wall: "bg-orange-100 dark:bg-orange-900", desk: "bg-orange-50 dark:bg-orange-950", edge: "bg-orange-200 dark:bg-orange-800" },
  // Sunshine yellow
  { wall: "bg-yellow-100 dark:bg-yellow-900", desk: "bg-yellow-50 dark:bg-yellow-950", edge: "bg-yellow-200 dark:bg-yellow-800" },
  // Soft sage
  { wall: "bg-lime-100 dark:bg-lime-900",    desk: "bg-lime-50 dark:bg-lime-950",     edge: "bg-lime-200 dark:bg-lime-800" },
  // Blush pink
  { wall: "bg-pink-100 dark:bg-pink-900",    desk: "bg-pink-50 dark:bg-pink-950",     edge: "bg-pink-200 dark:bg-pink-800" },
  // Lavender
  { wall: "bg-purple-100 dark:bg-purple-900", desk: "bg-purple-50 dark:bg-purple-950", edge: "bg-purple-200 dark:bg-purple-800" },
]

const DESK_THEMES_MAP: Record<string, typeof DESK_THEMES[0]> = {
  amber:  DESK_THEMES[0],
  rose:   DESK_THEMES[1],
  stone:  DESK_THEMES[2],
  orange: DESK_THEMES[3],
  yellow: DESK_THEMES[4],
  lime:   DESK_THEMES[5],
  pink:   DESK_THEMES[6],
  purple: DESK_THEMES[7],
}

function getDeskDecor(agent: Agent): string[] {
  const tags = agent.tags?.map((t) => t.toLowerCase()).join(" ") ?? ""
  const name = agent.name.toLowerCase()
  if (name.includes("code") || tags.includes("程式") || tags.includes("code")) return ["💻", "☕", "🐛"]
  if (name.includes("翻譯") || tags.includes("翻譯")) return ["📚", "🗺️", "✏️"]
  if (name.includes("寫作") || tags.includes("寫作")) return ["📝", "✒️", "📖"]
  if (name.includes("資料") || tags.includes("數據")) return ["📊", "🔍", "📈"]
  if (name.includes("頭腦") || tags.includes("創意")) return ["💡", "🎯", "🌈"]
  if (name.includes("財務") || tags.includes("財務")) return ["💰", "📋", "🏦"]
  if (name.includes("生活") || tags.includes("生活")) return ["🌱", "⏰", "🎯"]
  if (name.includes("prompt") || tags.includes("ai")) return ["⚡", "🤖", "✨"]
  return ["📌", "🗂️", "☕"]
}

function AgentCard({
  agent,
  index,
  convCount,
  onClick,
  onTogglePin,
}: {
  agent: Agent
  index: number
  convCount: number
  onClick: () => void
  onTogglePin: (e: React.MouseEvent | React.KeyboardEvent) => void
}) {
  const theme = agent.color
    ? (DESK_THEMES_MAP[agent.color] ?? DESK_THEMES[index % DESK_THEMES.length])
    : DESK_THEMES[index % DESK_THEMES.length]
  const decor = getDeskDecor(agent)

  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl overflow-hidden border border-transparent hover:border-white/60 dark:hover:border-white/20 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 cursor-pointer w-full relative"
    >
      {/* Pinned indicator */}
      {agent.pinned && (
        <span className="absolute top-2 left-2 z-20 text-amber-400 drop-shadow text-sm" title="已釘選">📌</span>
      )}

      {/* Backdrop / wall area */}
      <div className={cn("relative h-28 flex items-center justify-center overflow-hidden", theme.wall)}>
        <span className="absolute top-2 left-3 text-lg opacity-30 rotate-[-12deg] select-none">{decor[1]}</span>
        <span className="absolute bottom-3 right-3 text-base opacity-25 rotate-[8deg] select-none">{decor[2]}</span>

        <span className="text-4xl group-hover:scale-110 transition-transform duration-200 select-none drop-shadow-sm z-10">
          {agent.avatar || "🤖"}
        </span>

        {/* Pin toggle — appears on hover */}
        <div
          role="button"
          tabIndex={0}
          onClick={onTogglePin}
          onKeyDown={(e) => e.key === "Enter" && onTogglePin(e as unknown as React.MouseEvent)}
          className={cn(
            "absolute top-2 right-2 z-20 p-1 rounded-full transition-all cursor-pointer",
            "bg-black/10 dark:bg-white/10 hover:bg-black/25 dark:hover:bg-white/25",
            agent.pinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          title={agent.pinned ? "取消釘選" : "釘選到頂部"}
        >
          <span className="text-sm leading-none">{agent.pinned ? "📌" : "📍"}</span>
        </div>
      </div>

      {/* Desk edge */}
      <div className={cn("h-1.5", theme.edge)} />

      {/* Desk surface */}
      <div className={cn("px-4 py-3", theme.desk)}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-snug truncate">{agent.name}</h3>
          <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5 bg-black/5 dark:bg-white/10 rounded-full px-2 py-0.5">
            {convCount}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{agent.description}</p>

        <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/10 flex items-center gap-1.5">
          <span className="text-[10px]">{decor[0]}</span>
          <span className="text-[10px] text-muted-foreground">點擊開始對話</span>
        </div>
      </div>
    </button>
  )
}

export default function ChatPage() {
  const router = useRouter()
  const { agents, conversations, addConversation, setActiveConversation, isLoaded, togglePinAgent } = useAppStore()
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const agentConversations = selectedAgent
    ? conversations.filter((c) => c.agentId === selectedAgent.id)
    : []

  const sortedAgents = [...agents].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return 0
  })

  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent)
    setDialogOpen(true)
  }

  const handleTogglePin = (e: React.MouseEvent | React.KeyboardEvent, agent: Agent) => {
    e.stopPropagation()
    togglePinAgent(agent.id)
  }

  const handleNewConversation = () => {
    if (!selectedAgent) return
    const conv = addConversation(selectedAgent.id)
    setActiveConversation(conv.id)
    setDialogOpen(false)
    router.push(`/chat/${conv.id}`)
  }

  const handleSelectConversation = (convId: string) => {
    setActiveConversation(convId)
    setDialogOpen(false)
    router.push(`/chat/${convId}`)
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        載入中...
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
        <div className="text-5xl">🤖</div>
        <h2 className="text-lg font-semibold">還沒有 Agent</h2>
        <p className="text-sm text-muted-foreground max-w-xs">前往「我的 Agent」頁面建立你的第一個 AI 助手</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b shrink-0">
        <h1 className="text-lg font-semibold">對話工作區</h1>
        <p className="text-sm text-muted-foreground mt-0.5">選擇一個 Agent 開始對話・長按卡片可釘選</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedAgents.map((agent, index) => {
            const convCount = conversations.filter((c) => c.agentId === agent.id).length
            return (
              <AgentCard
                key={agent.id}
                agent={agent}
                index={index}
                convCount={convCount}
                onClick={() => handleAgentClick(agent)}
                onTogglePin={(e) => handleTogglePin(e, agent)}
              />
            )
          })}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedAgent?.avatar} {selectedAgent?.name} 的對話
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleNewConversation}
              className="w-full gap-2 bg-amber-700 hover:bg-amber-800 text-white"
            >
              <Plus className="w-4 h-4" />
              新對話
            </Button>

            {agentConversations.length > 0 ? (
              <ScrollArea className="max-h-72">
                <div className="space-y-1 pr-2">
                  {agentConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                    >
                      <span className="flex-1 truncate">{conv.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(conv.updatedAt).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" })}
                      </span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">還沒有對話，點上方按鈕開始</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
