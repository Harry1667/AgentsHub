"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Conversation } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Bot,
  MessageSquare,
  Settings,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Shield,
  Plus,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"

function SidebarButton({
  icon: Icon,
  label,
  active,
  collapsed,
  onClick,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active?: boolean
  collapsed?: boolean
  onClick?: () => void
  className?: string
}) {
  const btn = (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted",
        active && "bg-muted font-medium",
        collapsed && "justify-center px-0",
        className
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </button>
  )
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="block w-full" />}>{btn}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }
  return btn
}

export function Sidebar({
  mobileOpen = false,
  onNavigate,
}: {
  mobileOpen?: boolean
  onNavigate?: () => void
} = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const {
    sidebarOpen,
    theme,
    toggleTheme,
    toggleSidebar,
    agents,
    conversations,
    activeConversationId,
    addConversation,
    setActiveConversation,
    deleteConversation,
  } = useAppStore()

  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.role === "admin") setIsAdmin(true) })
      .catch(() => {})
  }, [])

  const go = (href: string) => { router.push(href); onNavigate?.() }

  const navItems = [
    { icon: MessageSquare, label: "對話工作區", href: "/chat", active: pathname === "/chat" },
    { icon: Bot, label: "我的 Agent", href: "/agents", active: pathname.startsWith("/agents") },
  ]

  // 跨 agent 最近對話（含會議），依更新時間排序
  const recent = [...conversations]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 20)

  const isMeeting = (c: Conversation) => (c.participantIds?.length ?? 1) > 1
  const convIcon = (c: Conversation) => {
    if (isMeeting(c)) {
      const parts = (c.participantIds ?? [c.agentId]).map((id) => agents.find((a) => a.id === id)?.avatar).filter(Boolean)
      return parts.slice(0, 2).join("") || "🏛"
    }
    return agents.find((a) => a.id === c.agentId)?.avatar ?? "🤖"
  }

  const openConv = (id: string) => { setActiveConversation(id); go(`/chat/${id}`) }

  const handleNewChat = () => {
    // 用最近對話的 agent；否則第一個 agent；都沒有就去建立
    const lastAgentId = recent[0]?.agentId
    const agent = agents.find((a) => a.id === lastAgentId) ?? agents[0]
    if (!agent) { go("/agents"); return }
    const conv = addConversation(agent.id)
    setActiveConversation(conv.id)
    go(`/chat/${conv.id}`)
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full border-r bg-background transition-all duration-200 shrink-0",
        sidebarOpen ? "w-64" : "w-14",
        "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:w-64",
        mobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
      )}
    >
      {/* Logo + Toggle */}
      <div className={cn("flex items-center border-b px-2 py-3", sidebarOpen ? "justify-between" : "justify-center")}>
        <div className={cn("flex items-center gap-2 px-1", !sidebarOpen && "px-0")}>
          <div className="w-7 h-7 rounded-lg bg-amber-700 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && <span className="font-semibold text-sm">AgentHub</span>}
        </div>
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1 hover:bg-muted transition-colors text-muted-foreground max-md:hidden"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <div className="px-2 py-2 space-y-0.5">
        {navItems.map((item) => (
          <SidebarButton
            key={item.href}
            icon={item.icon}
            label={item.label}
            active={item.active}
            collapsed={!sidebarOpen}
            onClick={() => go(item.href)}
          />
        ))}
      </div>

      {/* 新對話 */}
      <div className="px-2 pb-2">
        {sidebarOpen ? (
          <button
            data-tour="new-chat"
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 rounded-lg px-2 py-2 text-sm bg-amber-700 text-white hover:bg-amber-800 transition-colors"
          >
            <Plus className="w-4 h-4 shrink-0" /> 新對話
          </button>
        ) : (
          <Tooltip>
            <TooltipTrigger render={<span className="block w-full" />}>
              <button onClick={handleNewChat} className="w-full flex justify-center rounded-lg py-2 bg-amber-700 text-white hover:bg-amber-800">
                <Plus className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">新對話</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* 最近對話（展開時顯示） */}
      {sidebarOpen ? (
        <div className="flex-1 overflow-y-auto px-2 min-h-0">
          <p data-tour="recent" className="text-[11px] font-medium text-muted-foreground px-2 py-1.5 sticky top-0 bg-background">最近對話</p>
          {recent.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-2">還沒有對話</p>
          ) : (
            <div className="space-y-0.5 pb-2">
              {recent.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "group/conv flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm cursor-pointer transition-colors hover:bg-muted",
                    activeConversationId === c.id && pathname.startsWith("/chat/") && "bg-muted"
                  )}
                  onClick={() => openConv(c.id)}
                >
                  <span className="text-sm shrink-0 w-5 text-center">{convIcon(c)}</span>
                  <span className="flex-1 truncate text-foreground/90">{c.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(c.id) }}
                    className="opacity-0 group-hover/conv:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 shrink-0"
                    title="刪除對話"
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Bottom Actions */}
      <div className="border-t px-2 py-2 space-y-0.5 mt-auto">
        <SidebarButton
          icon={theme === "light" ? Moon : Sun}
          label={theme === "light" ? "深色模式" : "淺色模式"}
          collapsed={!sidebarOpen}
          onClick={toggleTheme}
        />
        <SidebarButton
          icon={Settings}
          label="設定"
          active={pathname.startsWith("/settings")}
          collapsed={!sidebarOpen}
          onClick={() => go("/settings")}
        />
        {isAdmin && (
          <SidebarButton
            icon={Shield}
            label="用戶管理"
            active={pathname.startsWith("/admin")}
            collapsed={!sidebarOpen}
            onClick={() => go("/admin")}
          />
        )}
      </div>
    </div>
  )
}
