"use client"

import { useAppStore } from "@/lib/store"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export default function SettingsPage() {
  const { theme, toggleTheme } = useAppStore()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b px-6 py-5">
        <h1 className="text-2xl font-bold mb-1">設定</h1>
        <p className="text-muted-foreground text-sm">管理外觀與偏好設定</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">

          <section>
            <h2 className="text-base font-semibold mb-4">外觀</h2>
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="text-sm font-medium">深色模式</p>
                <p className="text-xs text-muted-foreground">切換介面主題</p>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-base font-semibold mb-1 text-destructive">危險區域</h2>
            <p className="text-sm text-muted-foreground mb-4">以下操作無法復原</p>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => {
                if (confirm("確定要清除所有對話記錄與 Agent 設定？")) {
                  localStorage.removeItem("agent-store")
                  window.location.reload()
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
              清除所有資料
            </Button>
          </section>

        </div>
      </div>
    </div>
  )
}
