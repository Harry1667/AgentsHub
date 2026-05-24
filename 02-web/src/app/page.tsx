"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bot, Sparkles, Zap, Shield, ArrowRight, MessageSquare, Store } from "lucide-react"

const FEATURES = [
  {
    icon: Bot,
    title: "自訂 AI 角色",
    desc: "建立有個性、有專業的 Agent，設定 System Prompt 和行為模式",
  },
  {
    icon: Sparkles,
    title: "Agent 廣場",
    desc: "探索社群分享的精選 Agent，一鍵加入你的助手陣容",
  },
  {
    icon: Zap,
    title: "多模型支援",
    desc: "Claude、GPT-4o 自由切換，為不同任務選擇最適合的模型",
  },
  {
    icon: Shield,
    title: "隱私優先",
    desc: "資料儲存於本地瀏覽器，API 金鑰不上傳至任何伺服器",
  },
]

const SHOWCASE_AGENTS = [
  { avatar: "🤖", name: "Code Buddy", desc: "程式助手" },
  { avatar: "✍️", name: "寫作教練", desc: "文章潤稿" },
  { avatar: "🌐", name: "翻譯官", desc: "多語翻譯" },
  { avatar: "💡", name: "頭腦風暴", desc: "創意發想" },
  { avatar: "📊", name: "資料分析師", desc: "數據洞察" },
  { avatar: "⚡", name: "Prompt 工程師", desc: "AI 優化" },
]

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-700 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">AgentHub</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.push("/marketplace")}>
              <Store className="w-4 h-4 mr-1.5" />
              Agent 廣場
            </Button>
            <Button
              className="bg-amber-700 hover:bg-amber-800 text-white gap-1.5"
              onClick={() => router.push("/chat")}
            >
              開始使用
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4 gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-700" />
            個人 AI 助手平台
          </Badge>

          <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
            打造你的
            <span className="text-amber-700"> AI 夢幻隊</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            建立有個性的 AI Agent，讓每一位助手都有專屬的能力與風格。
            <br />
            程式、寫作、翻譯、分析，一個平台全搞定。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-amber-700 hover:bg-amber-800 text-white gap-2 h-12 px-8"
              onClick={() => router.push("/chat")}
            >
              <MessageSquare className="w-5 h-5" />
              開始對話
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 h-12 px-8"
              onClick={() => router.push("/marketplace")}
            >
              <Store className="w-5 h-5" />
              瀏覽 Agent 廣場
            </Button>
          </div>
        </div>
      </section>

      {/* Agent Showcase */}
      <section className="py-12 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-6">6 個精選 Agent 立即可用</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {SHOWCASE_AGENTS.map((agent) => (
              <button
                key={agent.name}
                onClick={() => router.push("/marketplace")}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border bg-background hover:border-amber-300 hover:shadow-md transition-all group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">{agent.avatar}</span>
                <div className="text-center">
                  <div className="text-sm font-medium">{agent.name}</div>
                  <div className="text-xs text-muted-foreground">{agent.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">為什麼選擇 AgentHub？</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((feat) => (
              <div key={feat.title} className="p-6 rounded-2xl border hover:border-amber-200 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center mb-4">
                  <feat.icon className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center bg-amber-700">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">準備好了嗎？</h2>
          <p className="text-amber-100 mb-8">免費使用，無需註冊，帶入你自己的 API 金鑰即可</p>
          <Button
            size="lg"
            className="bg-white text-amber-700 hover:bg-amber-50 gap-2 h-12 px-8"
            onClick={() => router.push("/chat")}
          >
            立即開始
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      <footer className="border-t py-8 px-6 text-center text-sm text-muted-foreground">
        © 2026 AgentHub · 個人 AI 助手平台
      </footer>
    </div>
  )
}
