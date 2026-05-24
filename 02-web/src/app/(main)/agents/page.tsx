"use client"

import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit2, Trash2, MessageSquare } from "lucide-react"

export default function AgentsPage() {
  const router = useRouter()
  const { agents, deleteAgent, addConversation, setActiveConversation } = useAppStore()

  const handleChat = (agentId: string) => {
    const conv = addConversation(agentId)
    setActiveConversation(conv.id)
    router.push(`/chat/${conv.id}`)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">我的 Agent</h1>
            <p className="text-muted-foreground text-sm">管理你的 AI 助手，自訂個性與能力</p>
          </div>
          <Button
            className="gap-2 bg-amber-700 hover:bg-amber-800 text-white"
            onClick={() => router.push("/agents/new")}
          >
            <Plus className="w-4 h-4" />
            建立 Agent
          </Button>
        </div>
      </div>

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
    </div>
  )
}
