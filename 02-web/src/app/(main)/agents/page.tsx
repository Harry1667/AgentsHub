"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { DEFAULT_AGENTS } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Edit2, Trash2, MessageSquare, LayoutTemplate } from "lucide-react"
import { PageHeader } from "@/components/page-header"

export default function AgentsPage() {
  const router = useRouter()
  const { agents, deleteAgent, addConversation, setActiveConversation, saveAgent } = useAppStore()
  const [showTemplates, setShowTemplates] = useState(false)

  const handleChat = (agentId: string) => {
    const conv = addConversation(agentId)
    setActiveConversation(conv.id)
    router.push(`/chat/${conv.id}`)
  }

  const myIds = new Set(agents.map((a) => a.id))
  const templates = DEFAULT_AGENTS.filter((a) => !myIds.has(a.id))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="我的 Agent"
        subtitle="管理你的 AI 助手，自訂個性與能力"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setShowTemplates(true)}>
              <LayoutTemplate className="w-4 h-4" />
              從範本新增
            </Button>
            <Button
              className="gap-2 bg-amber-700 hover:bg-amber-800 text-white"
              onClick={() => router.push("/agents/new")}
            >
              <Plus className="w-4 h-4" />
              建立 Agent
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="text-3xl mb-2">{agent.avatar}</div>
                <CardTitle className="text-base">{agent.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{agent.description}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-wrap gap-1 mb-2">
                  {agent.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{agent.model}</p>
              </CardContent>
              <CardFooter className="gap-2 pt-2">
                <Button
                  size="sm"
                  className="flex-1 bg-amber-700 hover:bg-amber-800 text-white"
                  onClick={() => handleChat(agent.id)}
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1" />
                  對話
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/agents/${agent.id}/edit`)}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteAgent(agent.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </CardFooter>
            </Card>
          ))}

          {/* Add card */}
          <button
            onClick={() => router.push("/agents/new")}
            className="min-h-[200px] rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-amber-700 transition-all"
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm">建立新 Agent</span>
          </button>
        </div>
      </div>

      {/* 從範本新增（原 Agent 廣場） */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4" />從範本新增 Agent
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2">挑一個預設範本，一鍵加入你的 Agent。</p>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">所有範本都已加入 🎉</p>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="space-y-1 pr-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => saveAgent({ ...t, createdAt: new Date().toISOString() })}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                  >
                    <span className="text-2xl shrink-0">{t.avatar}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium truncate">{t.name}</span>
                      <span className="block text-xs text-muted-foreground truncate">{t.description}</span>
                    </span>
                    <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
