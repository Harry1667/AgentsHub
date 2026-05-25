"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

const APP_NAME = "AgentHub"

// 設定瀏覽器分頁標題：「<頁名> · AgentHub」
export function usePageTitle(name?: string) {
  useEffect(() => {
    document.title = name ? `${name} · ${APP_NAME}` : APP_NAME
  }, [name])
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  /** 從頁專用：標示其所屬的主頁，點擊可返回 */
  parent?: { label: string; href: string }
  /** 右側操作按鈕 */
  actions?: React.ReactNode
}

/**
 * 統一頁首：負責頁面命名（瀏覽器標題 + 視覺標題）與主從關係呈現。
 * - 主頁：不帶 parent，僅標題 + 副標
 * - 從頁：帶 parent，上方顯示麵包屑回主頁
 */
export function PageHeader({ title, subtitle, icon, parent, actions }: PageHeaderProps) {
  const router = useRouter()
  usePageTitle(title)

  return (
    <div className="border-b px-6 py-5 shrink-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {parent && (
            <button
              onClick={() => router.push(parent.href)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1.5 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              {parent.label}
            </button>
          )}
          <div className="flex items-center gap-2">
            {icon}
            <h1 className="text-2xl font-bold truncate">{title}</h1>
          </div>
          {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
