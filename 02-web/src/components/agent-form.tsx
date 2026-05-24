"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Agent } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, X } from "lucide-react"

const MODELS = [
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (快速)" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (均衡)" },
  { value: "claude-opus-4-7", label: "Claude Opus 4.7 (最強)" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4o", label: "GPT-4o" },
]

const AVATAR_OPTIONS = ["🤖", "🧠", "✍️", "🌐", "📊", "💡", "⚡", "🌱", "💰", "🎯", "🔬", "🎨", "📚", "🏃", "🎵"]

interface AgentFormProps {
  existingAgent?: Agent
}

export function AgentForm({ existingAgent }: AgentFormProps) {
  const router = useRouter()
  const { saveAgent } = useAppStore()

  const [form, setForm] = useState<Omit<Agent, "createdAt" | "useCount" | "isDefault">>({
    id: existingAgent?.id || `agent-${Date.now()}`,
    name: existingAgent?.name || "",
    avatar: existingAgent?.avatar || "🤖",
    description: existingAgent?.description || "",
    systemPrompt: existingAgent?.systemPrompt || "",
    model: existingAgent?.model || "claude-sonnet-4-6",
    temperature: existingAgent?.temperature ?? 0.7,
    maxTokens: existingAgent?.maxTokens || 2048,
    tags: existingAgent?.tags || [],
  })

  const [tagInput, setTagInput] = useState("")

  const handleSave = () => {
    if (!form.name.trim()) return
    saveAgent({ ...form, createdAt: existingAgent?.createdAt || new Date().toISOString() })
    router.push("/agents")
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) {
      setForm((f) => ({ ...f, tags: [...f.tags, t] }))
    }
    setTagInput("")
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-bold text-lg">{existingAgent ? "編輯 Agent" : "建立 Agent"}</h1>
          <p className="text-muted-foreground text-sm">設定你的 AI 助手個性與能力</p>
        </div>
        <Button
          className="ml-auto bg-indigo-500 hover:bg-indigo-600 text-white"
          onClick={handleSave}
          disabled={!form.name.trim()}
        >
          儲存
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Avatar */}
          <div>
            <Label className="mb-2 block">頭像</Label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setForm((f) => ({ ...f, avatar: emoji }))}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-all hover:scale-110 ${
                    form.avatar === emoji ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950" : "border-transparent"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <Label className="mb-2 block">名稱 *</Label>
            <Input
              placeholder="例如：程式助手、翻譯官..."
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div>
            <Label className="mb-2 block">簡介</Label>
            <Input
              placeholder="一句話描述這個 Agent 的功能"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* System Prompt */}
          <div>
            <Label className="mb-2 block">System Prompt</Label>
            <Textarea
              placeholder="告訴 AI 它的角色、行為方式和限制..."
              value={form.systemPrompt}
              onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
              rows={8}
              className="resize-none font-mono text-sm"
            />
          </div>

          {/* Model */}
          <div>
            <Label className="mb-2 block">模型</Label>
            <Select value={form.model} onValueChange={(v) => v && setForm((f) => ({ ...f, model: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Temperature */}
          <div>
            <div className="flex justify-between mb-2">
              <Label>溫度 (Temperature)</Label>
              <span className="text-sm text-muted-foreground">{form.temperature.toFixed(1)}</span>
            </div>
            <Slider
              min={0}
              max={2}
              step={0.1}
              value={form.temperature}
              onValueChange={(v) => setForm((f) => ({ ...f, temperature: typeof v === "number" ? v : f.temperature }))}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>精確</span>
              <span>創意</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <Label className="mb-2 block">最大輸出 Tokens</Label>
            <Input
              type="number"
              min={256}
              max={8192}
              value={form.maxTokens}
              onChange={(e) => setForm((f) => ({ ...f, maxTokens: parseInt(e.target.value) || 2048 }))}
            />
          </div>

          {/* Tags */}
          <div>
            <Label className="mb-2 block">標籤</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="新增標籤..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag()}
              />
              <Button variant="outline" onClick={addTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
