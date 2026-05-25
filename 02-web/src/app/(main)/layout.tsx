"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { DbLoader } from "@/components/db-loader"
import { SearchModal } from "@/components/search-modal"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DbLoader />

      {/* 手機抽屜背景遮罩 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* 手機頂列：漢堡開抽屜 */}
        <div className="flex items-center gap-2 border-b px-3 h-12 shrink-0 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="開啟選單"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">AgentHub</span>
        </div>

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>

      <SearchModal />
    </div>
  )
}
