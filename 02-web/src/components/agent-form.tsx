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
import { usePageTitle } from "@/components/page-header"
import { useI18n } from "@/lib/use-i18n"

const AVATAR_OPTIONS = ["🤖", "🧠", "✍️", "🌐", "📊", "💡", "⚡", "🌱", "💰", "🎯", "🔬", "🎨", "📚", "🏃", "🎵"]

interface AgentFormProps {
  existingAgent?: Agent
}

export function AgentForm({ existingAgent }: AgentFormProps) {
  const router = useRouter()
  const { t } = useI18n()
  const { saveAgent } = useAppStore()
  usePageTitle(existingAgent ? t("agentForm.editTitle") : t("agentForm.createTitle"))

  // 模型描述詞翻譯，模型名稱本身不翻
  const MODELS = [
    { value: "claude-haiku-4-5-20251001", label: `Claude Haiku 4.5 ${t("agentForm.modelFast")}` },
    { value: "claude-sonnet-4-6", label: `Claude Sonnet 4.6 ${t("agentForm.modelBalanced")}` },
    { value: "claude-opus-4-7", label: `Claude Opus 4.7 ${t("agentForm.modelBest")}` },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4o", label: "GPT-4o" },
  ]

  const COLOR_OPTIONS = [
    { value: "amber",  bg: "bg-amber-400",  label: t("agentForm.colorWarmSand") },
    { value: "rose",   bg: "bg-rose-400",   label: t("agentForm.colorRose") },
    { value: "stone",  bg: "bg-stone-400",  label: t("agentForm.colorWarmStone") },
    { value: "orange", bg: "bg-orange-400", label: t("agentForm.colorOrange") },
    { value: "yellow", bg: "bg-yellow-400", label: t("agentForm.colorSun") },
    { value: "lime",   bg: "bg-lime-400",   label: t("agentForm.colorMint") },
    { value: "pink",   bg: "bg-pink-400",   label: t("agentForm.colorPink") },
    { value: "purple", bg: "bg-purple-400", label: t("agentForm.colorLavender") },
  ]

  // 新建時讀取「Agent 建構師」暫存的草稿（client 端導航，無 SSR hydration 問題）
  const [form, setForm] = useState<Omit<Agent, "id" | "createdAt" | "useCount" | "isDefault">>(() => {
    const base = {
      name: existingAgent?.name || "",
      avatar: existingAgent?.avatar || "🤖",
      description: existingAgent?.description || "",
      systemPrompt: existingAgent?.systemPrompt || "",
      model: existingAgent?.model || "claude-sonnet-4-6",
      temperature: existingAgent?.temperature ?? 0.7,
      maxTokens: existingAgent?.maxTokens || 2048,
      tags: existingAgent?.tags || [],
      pinned: existingAgent?.pinned ?? false,
      color: existingAgent?.color,
    }
    if (!existingAgent && typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem("agent-draft")
        if (raw) {
          sessionStorage.removeItem("agent-draft")
          Object.assign(base, JSON.parse(raw))
        }
      } catch { /* ignore */ }
    }
    return base
  })

  const [tagInput, setTagInput] = useState("")

  const handleSave = () => {
    if (!form.name.trim()) return
    const id = existingAgent?.id || `agent-${Date.now()}`
    saveAgent({ ...form, id, createdAt: existingAgent?.createdAt || new Date().toISOString() })
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
        <Button variant="ghost" size="icon" onClick={() => router.push("/agents")} title={t("agentForm.backToAgents")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <button
            onClick={() => router.push("/agents")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("agentForm.myAgents")}
          </button>
          <h1 className="font-bold text-lg">{existingAgent ? t("agentForm.editTitle") : t("agentForm.createTitle")}</h1>
        </div>
        <Button
          className="ml-auto bg-indigo-700 hover:bg-indigo-800 text-white"
          onClick={handleSave}
          disabled={!form.name.trim()}
        >
          {t("common.save")}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Avatar */}
          <div>
            <Label className="mb-2 block">{t("agentForm.avatar")}</Label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setForm((f) => ({ ...f, avatar: emoji }))}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-all hover:scale-110 ${
                    form.avatar === emoji ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950" : "border-transparent"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Workstation color */}
          <div>
            <Label className="mb-2 block">{t("agentForm.color")}</Label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setForm((f) => ({ ...f, color: undefined }))}
                className={`w-8 h-8 rounded-full border-2 bg-gradient-to-br from-gray-300 to-gray-500 transition-all hover:scale-110 ${
                  !form.color ? "border-indigo-600 ring-2 ring-indigo-300" : "border-transparent"
                }`}
                title={t("agentForm.colorAuto")}
              />
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                  className={`w-8 h-8 rounded-full border-2 ${c.bg} transition-all hover:scale-110 ${
                    form.color === c.value ? "border-indigo-600 ring-2 ring-indigo-300" : "border-transparent"
                  }`}
                  title={c.label}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{t("agentForm.colorDesc")}</p>
          </div>

          {/* Pin toggle */}
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">{t("agentForm.pinTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("agentForm.pinDesc")}</p>
            </div>
            <button
              onClick={() => setForm((f) => ({ ...f, pinned: !f.pinned }))}
              className={`relative w-10 h-6 rounded-full transition-colors ${form.pinned ? "bg-indigo-700" : "bg-muted"}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.pinned ? "translate-x-5" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Name */}
          <div>
            <Label className="mb-2 block">{t("agentForm.nameLabel")}</Label>
            <Input
              placeholder={t("agentForm.namePlaceholder")}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div>
            <Label className="mb-2 block">{t("agentForm.descLabel")}</Label>
            <Input
              placeholder={t("agentForm.descPlaceholder")}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* System Prompt */}
          <div>
            <Label className="mb-2 block">{t("agentForm.systemPromptLabel")}</Label>
            <Textarea
              placeholder={t("agentForm.systemPromptPlaceholder")}
              value={form.systemPrompt}
              onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
              rows={8}
              className="resize-none font-mono text-sm"
            />
          </div>

          {/* Model */}
          <div>
            <Label className="mb-2 block">{t("agentForm.modelLabel")}</Label>
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
              <Label>{t("agentForm.tempLabel")}</Label>
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
              <span>{t("agentForm.tempPrecise")}</span>
              <span>{t("agentForm.tempCreative")}</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <Label className="mb-2 block">{t("agentForm.maxTokensLabel")}</Label>
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
            <Label className="mb-2 block">{t("agentForm.tagsLabel")}</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder={t("agentForm.addTagPlaceholder")}
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
