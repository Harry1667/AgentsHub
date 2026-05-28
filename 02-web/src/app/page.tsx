"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bot, Sparkles, Zap, Shield, ArrowRight, MessageSquare, Store } from "lucide-react"
import { useI18n } from "@/lib/use-i18n"

export default function LandingPage() {
  const router = useRouter()
  const { t } = useI18n()

  const FEATURES = [
    { icon: Bot, title: t("landing.feat1Title"), desc: t("landing.feat1Desc") },
    { icon: Sparkles, title: t("landing.feat2Title"), desc: t("landing.feat2Desc") },
    { icon: Zap, title: t("landing.feat3Title"), desc: t("landing.feat3Desc") },
    { icon: Shield, title: t("landing.feat4Title"), desc: t("landing.feat4Desc") },
  ]

  const SHOWCASE_AGENTS = [
    { avatar: "🤖", name: "Code Buddy", desc: t("landing.showcaseCode") },
    { avatar: "✍️", name: t("landing.showcaseWriter"), desc: t("landing.showcaseWriterDesc") },
    { avatar: "🌐", name: t("landing.showcaseTranslator"), desc: t("landing.showcaseTranslatorDesc") },
    { avatar: "💡", name: t("landing.showcaseBrainstorm"), desc: t("landing.showcaseBrainstormDesc") },
    { avatar: "📊", name: t("landing.showcaseAnalyst"), desc: t("landing.showcaseAnalystDesc") },
    { avatar: "⚡", name: t("landing.showcasePrompt"), desc: t("landing.showcasePromptDesc") },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">AgentHub</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.push("/marketplace")}>
              <Store className="w-4 h-4 mr-1.5" />
              {t("landing.marketplace")}
            </Button>
            <Button
              className="bg-indigo-700 hover:bg-indigo-800 text-white gap-1.5"
              onClick={() => router.push("/chat")}
            >
              {t("landing.getStarted")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4 gap-1.5">
            <Sparkles className="w-3 h-3 text-indigo-700" />
            {t("landing.heroBadge")}
          </Badge>

          <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
            {t("landing.heroTitlePre")}
            <span className="text-indigo-700">{t("landing.heroTitleAccent")}</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            {t("landing.heroDesc1")}
            <br />
            {t("landing.heroDesc2")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-indigo-700 hover:bg-indigo-800 text-white gap-2 h-12 px-8"
              onClick={() => router.push("/chat")}
            >
              <MessageSquare className="w-5 h-5" />
              {t("landing.startChat")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 h-12 px-8"
              onClick={() => router.push("/marketplace")}
            >
              <Store className="w-5 h-5" />
              {t("landing.browseMarketplace")}
            </Button>
          </div>
        </div>
      </section>

      {/* Agent Showcase */}
      <section className="py-12 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-6">{t("landing.showcaseHint")}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {SHOWCASE_AGENTS.map((agent) => (
              <button
                key={agent.name}
                onClick={() => router.push("/marketplace")}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border bg-background hover:border-indigo-300 hover:shadow-md transition-all group"
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
          <h2 className="text-3xl font-bold text-center mb-12">{t("landing.featuresTitle")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((feat) => (
              <div key={feat.title} className="p-6 rounded-2xl border hover:border-indigo-200 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-4">
                  <feat.icon className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center bg-indigo-700">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">{t("landing.ctaTitle")}</h2>
          <p className="text-indigo-100 mb-8">{t("landing.ctaDesc")}</p>
          <Button
            size="lg"
            className="bg-white text-indigo-700 hover:bg-indigo-50 gap-2 h-12 px-8"
            onClick={() => router.push("/chat")}
          >
            {t("landing.ctaButton")}
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      <footer className="border-t py-8 px-6 text-center text-sm text-muted-foreground">
        {t("landing.footer")}
      </footer>
    </div>
  )
}
