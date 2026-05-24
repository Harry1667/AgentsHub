"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
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

const CARD_COLORS = [
  "bg-indigo-100 dark:bg-indigo-900",
  "bg-violet-100 dark:bg-violet-900",
  "bg-sky-100 dark:bg-sky-900",
  "bg-emerald-100 dark:bg-emerald-900",
  "bg-amber-100 dark:bg-amber-900",
  "bg-rose-100 dark:bg-rose-900",
  "bg-teal-100 dark:bg-teal-900",
  "bg-fuchsia-100 dark:bg-fuchsia-900",
]

function getColorForAgent(index: number) {
  return CARD_COLORS[index % CARD_COLORS.length]
}

function AgentCard({
  agent,
  index,
  convCount,
  onClick,
}: {
  agent: Agent
  index: number
  convCount: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center gap-3 rounded-2xl border bg-card p-5 text-center transition-all duration-200",
        "hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 hover:-translate-y-0.5",
        "cursor-pointer"
      )}
    >
      <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0", getColorForAgent(index))}>
        {agent.avatar || "🤖"}
      </div>
      <div className="w-full">
        <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{agent.description}</p>
      </div>
      <Badge variant="secondary" className="text-xs">
        {convCount} 個對話
      </Badge>
    </button>
  )
}

export default function ChatPage() {
  const router = useRouter()
  const { agents, conversations, addConversation, setActiveConversation, isLoaded } = useAppStore()
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const agentConversations = selectedAgent
    ? conversations.filter((c) => c.agentId === selectedAgent.id)
    : []

  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent)
    setDialogOpen(true)
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
        <p className="text-sm text-muted-foreground mt-0.5">選擇一個 Agent 開始對話</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {agents.map((agent, index) => {
            const convCount = conversations.filter((c) => c.agentId === agent.id).length
            return (
              <AgentCard
                key={agent.id}
                agent={agent}
                index={index}
                convCount={convCount}
                onClick={() => handleAgentClick(agent)}
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
              className="w-full gap-2 bg-indigo-500 hover:bg-indigo-600 text-white"
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
