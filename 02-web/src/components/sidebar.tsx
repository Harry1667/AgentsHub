"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Bot,
  MessageSquare,
  Settings,
  Sun,
  Moon,
  Store,
  ChevronLeft,
  ChevronRight,
  Shield,
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
    sidebarOpen,
    theme,
    toggleTheme,
    toggleSidebar,
  } = useAppStore()

  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.role === "admin") setIsAdmin(true) })
      .catch(() => {})
  }, [])

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
            <div className="w-7 h-7 rounded-lg bg-amber-700 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm">AgentHub</span>
          </div>
        )}
        {!sidebarOpen && (
          <div className="w-7 h-7 rounded-lg bg-amber-700 flex items-center justify-center">
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

      {/* Spacer */}
      <div className="flex-1" />

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
        {isAdmin && (
          <SidebarButton
            icon={Shield}
            label="用戶管理"
            active={pathname.startsWith("/admin")}
            collapsed={!sidebarOpen}
            onClick={() => router.push("/admin")}
          />
        )}
      </div>
    </div>
  )
}
