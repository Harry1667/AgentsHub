"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Bot,
  MessageSquare,
  Plus,
  Settings,
  Sun,
  Moon,
  Store,
  ChevronLeft,
  ChevronRight,
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

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const {
    conversations,
    agents,
    activeConversationId,
    sidebarOpen,
    theme,
    setActiveConversation,
    addConversation,
    deleteConversation,
    toggleTheme,
    toggleSidebar,
  } = useAppStore()

  const [hoveredConv, setHoveredConv] = useState<string | null>(null)

  const handleNewChat = () => {
    const defaultAgent = agents[0]
    if (!defaultAgent) return
    const conv = addConversation(defaultAgent.id)
    setActiveConversation(conv.id)
    router.push(`/chat/${conv.id}`)
  }

  const handleSelectConv = (id: string) => {
    setActiveConversation(id)
    router.push(`/chat/${id}`)
  }

  const navItems = [
    { icon: MessageSquare, label: "對話", href: "/chat", active: pathname.startsWith("/chat") },
    { icon: Bot, label: "我的 Agent", href: "/agents", active: pathname.startsWith("/agents") },
    { icon: Store, label: "Agent 廣場", href: "/marketplace", active: pathname.startsWith("/marketplace") },
  ]

  return (
    <div
      className={cn(
        "flex flex-col h-full border-r bg-background transition-all duration-200",
        sidebarOpen ? "w-64" : "w-14"
      )}
    >
      {/* Logo + Toggle */}
      <div className={cn("flex items-center border-b px-2 py-3", sidebarOpen ? "justify-between" : "justify-center")}>
        {sidebarOpen && (
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm">AgentHub</span>
          </div>
        )}
        {!sidebarOpen && (
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1 hover:bg-muted transition-colors text-muted-foreground"
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
            onClick={() => router.push(item.href)}
          />
        ))}
      </div>

      {/* New Chat Button */}
      {sidebarOpen && (
        <div className="px-2 pb-2">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            新對話
          </button>
        </div>
      )}

      {/* Conversation List */}
      {sidebarOpen && (
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-0.5 py-1">
            {conversations.map((conv) => {
              const agent = agents.find((a) => a.id === conv.agentId)
              return (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-2 py-2 text-sm cursor-pointer hover:bg-muted transition-colors",
                    activeConversationId === conv.id && "bg-muted"
                  )}
                  onClick={() => handleSelectConv(conv.id)}
                  onMouseEnter={() => setHoveredConv(conv.id)}
                  onMouseLeave={() => setHoveredConv(null)}
                >
                  <span className="text-base shrink-0">{agent?.avatar || "🤖"}</span>
                  <span className="flex-1 truncate text-xs text-muted-foreground">{conv.title}</span>
                  {hoveredConv === conv.id && (
                    <button
                      className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded hover:bg-muted-foreground/20"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConversation(conv.id)
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
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
          onClick={() => router.push("/settings")}
        />
      </div>
    </div>
  )
}
