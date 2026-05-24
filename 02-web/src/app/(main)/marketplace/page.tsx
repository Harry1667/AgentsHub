"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { DEFAULT_AGENTS } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Users, Plus, Check } from "lucide-react"
import { Agent } from "@/lib/types"

const CATEGORIES = ["全部", "程式", "寫作", "翻譯", "分析", "創意", "工具", "生活", "財務"]

export default function MarketplacePage() {
  const router = useRouter()
  const { agents, saveAgent, addConversation, setActiveConversation } = useAppStore()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("全部")
  const [added, setAdded] = useState<Set<string>>(new Set())

  const myAgentIds = new Set(agents.map((a) => a.id))

  const filtered = DEFAULT_AGENTS.filter((agent) => {
    const matchSearch =
      !search ||
      agent.name.includes(search) ||
      agent.description.includes(search) ||
      agent.tags.some((t) => t.includes(search))
    const matchCat = category === "全部" || agent.tags.includes(category)
    return matchSearch && matchCat
  })

  const handleUse = (agent: Agent) => {
    if (!myAgentIds.has(agent.id)) {
      saveAgent(agent)
    }
    const conv = addConversation(agent.id)
    setActiveConversation(conv.id)
    router.push(`/chat/${conv.id}`)
  }

  const handleAdd = (agent: Agent) => {
    saveAgent(agent)
    setAdded((prev) => new Set(prev).add(agent.id))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b px-6 py-5">
        <h1 className="text-2xl font-bold mb-1">Agent 廣場</h1>
        <p className="text-muted-foreground text-sm">探索社群分享的 AI Agent，一鍵加入你的工作流</p>

        <div className="mt-4 flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜尋 Agent..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              size="sm"
              className={category === cat ? "bg-amber-700 hover:bg-amber-800" : ""}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((agent) => {
            const isOwned = myAgentIds.has(agent.id) || added.has(agent.id)
            return (
              <Card key={agent.id} className="hover:shadow-md transition-shadow group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="text-3xl mb-2">{agent.avatar}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {(agent.useCount || 0).toLocaleString()}
                    </div>
                  </div>
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">{agent.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex flex-wrap gap-1">
                    {agent.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-amber-700 hover:bg-amber-800 text-white"
                    onClick={() => handleUse(agent)}
                  >
                    開始對話
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={isOwned ? "text-green-600 border-green-300" : ""}
                    onClick={() => handleAdd(agent)}
                    disabled={isOwned}
                  >
                    {isOwned ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>找不到符合的 Agent</p>
          </div>
        )}
      </div>
    </div>
  )
}
