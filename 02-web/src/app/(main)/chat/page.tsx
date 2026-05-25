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
import { Plus, Users, Check, LayoutGrid, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Agent, Conversation } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { OfficeView } from "@/components/office-view"

// 多 agent 會議判定
function isMeetingConv(c: Conversation): boolean {
  return (c.participantIds?.length ?? 1) > 1
}

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

// 會議室卡片 — 工位區的「大家一起開會的地方」
function MeetingRoomCard({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl overflow-hidden border border-transparent hover:border-white/60 dark:hover:border-white/20 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 cursor-pointer w-full relative"
    >
      <div className="relative h-28 flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-200 dark:from-indigo-900 dark:to-violet-950">
        <span className="absolute top-2 left-3 text-lg opacity-30 rotate-[-12deg] select-none">🪑</span>
        <span className="absolute bottom-3 right-3 text-base opacity-25 rotate-[8deg] select-none">🗣️</span>
        <span className="text-4xl group-hover:scale-110 transition-transform duration-200 select-none drop-shadow-sm z-10">
          🏛️
        </span>
      </div>
      <div className="h-1.5 bg-indigo-300 dark:bg-indigo-800" />
      <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-950">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-snug truncate">會議室</h3>
          <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5 bg-black/5 dark:bg-white/10 rounded-full px-2 py-0.5">
            {count}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">多個 Agent 一起開會討論</p>
        <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/10 flex items-center gap-1.5">
          <Users className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">點擊發起會議</span>
        </div>
      </div>
    </button>
  )
}

export default function ChatPage() {
  const router = useRouter()
  const { agents, conversations, addConversation, setActiveConversation, isLoaded, togglePinAgent, workspaceView, setWorkspaceView } = useAppStore()

  // 會議室
  const [meetingOpen, setMeetingOpen] = useState(false)
  const [picking, setPicking] = useState(false)
  const [pickedIds, setPickedIds] = useState<string[]>([])

  const meetings = conversations
    .filter(isMeetingConv)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const togglePick = (id: string) =>
    setPickedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handleCreateMeeting = () => {
    if (pickedIds.length < 2) return
    const [primary, ...rest] = pickedIds
    const conv = addConversation(primary, rest)
    setActiveConversation(conv.id)
    setMeetingOpen(false)
    setPicking(false)
    setPickedIds([])
    router.push(`/chat/${conv.id}`)
  }

  const meetingParticipants = (c: Conversation): Agent[] =>
    (c.participantIds ?? [c.agentId])
      .map((id) => agents.find((a) => a.id === id))
      .filter((a): a is Agent => !!a)

  const sortedAgents = [...agents].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return 0
  })

  // 點 agent → 直接進該 agent 最近一次（單人）對話；沒有就開新
  const handleAgentClick = (agent: Agent) => {
    const latest = conversations
      .filter((c) => c.agentId === agent.id && !isMeetingConv(c))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
    const conv = latest ?? addConversation(agent.id)
    setActiveConversation(conv.id)
    router.push(`/chat/${conv.id}`)
  }

  const handleTogglePin = (e: React.MouseEvent | React.KeyboardEvent, agent: Agent) => {
    e.stopPropagation()
    togglePinAgent(agent.id)
  }

  const handleSelectConversation = (convId: string) => {
    setActiveConversation(convId)
    setMeetingOpen(false)
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
      <PageHeader
        title="對話工作區"
        subtitle="選擇一個 Agent 開始對話，或進入會議室發起多人討論"
        actions={
          <div className="flex items-center rounded-lg border p-0.5">
            <button
              onClick={() => setWorkspaceView("grid")}
              className={cn("flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                workspaceView === "grid" ? "bg-amber-700 text-white" : "text-muted-foreground hover:bg-muted")}
              title="卡片檢視"
            >
              <LayoutGrid className="w-3.5 h-3.5" /> 卡片
            </button>
            <button
              onClick={() => setWorkspaceView("office")}
              className={cn("flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                workspaceView === "office" ? "bg-amber-700 text-white" : "text-muted-foreground hover:bg-muted")}
              title="辦公室檢視"
            >
              <Building2 className="w-3.5 h-3.5" /> 辦公室
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {workspaceView === "office" ? (
          <div className="max-w-4xl mx-auto">
            <OfficeView
              agents={sortedAgents}
              conversations={conversations}
              onOpenAgent={handleAgentClick}
              onOpenMeeting={() => { setPicking(false); setMeetingOpen(true) }}
              onStartMeeting={(ids) => {
                if (ids.length < 2) return
                const conv = addConversation(ids[0], ids.slice(1))
                setActiveConversation(conv.id)
                router.push(`/chat/${conv.id}`)
              }}
            />
            <p className="text-center text-xs text-muted-foreground mt-3">點小人開始對話 ・ 點地毯發起會議</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* 會議室固定在最前 */}
            <MeetingRoomCard count={meetings.length} onClick={() => { setPicking(false); setMeetingOpen(true) }} />
            {sortedAgents.map((agent, index) => {
              const convCount = conversations.filter((c) => c.agentId === agent.id && !isMeetingConv(c)).length
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
        )}
      </div>

      {/* 會議室 Dialog */}
      <Dialog open={meetingOpen} onOpenChange={(o) => { setMeetingOpen(o); if (!o) { setPicking(false); setPickedIds([]) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">🏛️ 會議室</DialogTitle>
          </DialogHeader>

          {picking ? (
            /* 發起新會議：選擇與會者 */
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">選擇至少 2 個 Agent 組成會議。</p>
              <ScrollArea className="max-h-72">
                <div className="space-y-1 pr-2">
                  {agents.map((a) => {
                    const checked = pickedIds.includes(a.id)
                    return (
                      <button
                        key={a.id}
                        onClick={() => togglePick(a.id)}
                        className={cn(
                          "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors",
                          checked ? "bg-amber-100 dark:bg-amber-900" : "hover:bg-muted"
                        )}
                      >
                        <span className="text-base">{a.avatar}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block truncate">{a.name}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">{a.description}</span>
                        </span>
                        <span className={cn(
                          "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                          checked ? "bg-amber-700 border-amber-700" : "border-muted-foreground/40"
                        )}>
                          {checked && <Check className="w-3 h-3 text-white" />}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setPicking(false); setPickedIds([]) }}>
                  取消
                </Button>
                <Button
                  className="flex-1 gap-2 bg-amber-700 hover:bg-amber-800 text-white"
                  disabled={pickedIds.length < 2}
                  onClick={handleCreateMeeting}
                >
                  <Users className="w-4 h-4" />建立會議{pickedIds.length >= 2 ? `（${pickedIds.length}）` : ""}
                </Button>
              </div>
            </div>
          ) : (
            /* 會議列表 */
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => { setPicking(true); setPickedIds([]) }}
                className="w-full gap-2 bg-amber-700 hover:bg-amber-800 text-white"
              >
                <Plus className="w-4 h-4" />發起新會議
              </Button>

              {meetings.length > 0 ? (
                <ScrollArea className="max-h-72">
                  <div className="space-y-1 pr-2">
                    {meetings.map((conv) => {
                      const parts = meetingParticipants(conv)
                      return (
                        <button
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv.id)}
                          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                        >
                          <span className="flex -space-x-1.5 shrink-0">
                            {parts.slice(0, 3).map((p) => (
                              <span key={p.id} className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 ring-2 ring-background flex items-center justify-center text-xs">
                                {p.avatar}
                              </span>
                            ))}
                            {parts.length > 3 && (
                              <span className="w-6 h-6 rounded-full bg-muted ring-2 ring-background flex items-center justify-center text-[9px] font-medium">
                                +{parts.length - 3}
                              </span>
                            )}
                          </span>
                          <span className="flex-1 truncate">{conv.title}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(conv.updatedAt).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" })}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">還沒有會議，點上方按鈕發起</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
