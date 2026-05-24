"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Trash2, CheckCircle2, Zap } from "lucide-react"

export default function SettingsPage() {
  const { theme, toggleTheme, proxyToken, proxyProject, setProxyToken, setProxyProject } = useAppStore()

  const [tokenInput, setTokenInput] = useState(proxyToken)
  const [projectInput, setProjectInput] = useState(proxyProject)
  const [showToken, setShowToken] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSaveProxy = () => {
    setProxyToken(tokenInput.trim())
    setProxyProject(projectInput.trim() || "agent-hub")
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b px-6 py-5">
        <h1 className="text-2xl font-bold mb-1">設定</h1>
        <p className="text-muted-foreground text-sm">管理 AI 連線、外觀與偏好設定</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">

          {/* Proxy Token */}
          <section>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-semibold">AI Proxy 連線</h2>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Zap className="w-3 h-3 text-indigo-400" />
                proxycli
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              連接你的 proxycli 服務（clip.twloop.com），取得真實 AI 回應。
              Token 儲存於本地瀏覽器。
            </p>

            <div className="space-y-4 p-4 rounded-xl border bg-muted/30">
              <div>
                <Label className="mb-2 block">Bearer Token</Label>
                <div className="relative">
                  <Input
                    type={showToken ? "text" : "password"}
                    placeholder="輸入你的 proxy token..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="pr-10 font-mono text-sm"
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Project 名稱</Label>
                <Input
                  placeholder="agent-hub"
                  value={projectInput}
                  onChange={(e) => setProjectInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">proxycli 的 project 欄位，用於用量分類</p>
              </div>

              <Button
                className={saved ? "bg-green-500 hover:bg-green-600 text-white gap-2" : "bg-indigo-500 hover:bg-indigo-600 text-white gap-2"}
                onClick={handleSaveProxy}
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    已儲存
                  </>
                ) : (
                  "儲存設定"
                )}
              </Button>

              {proxyToken && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  已連線 · proxycli token 已設定
                </div>
              )}
              {!proxyToken && (
                <p className="text-sm text-amber-600">⚠ 未設定 token，目前使用 mock 模式</p>
              )}
            </div>
          </section>

          <Separator />

          {/* Appearance */}
          <section>
            <h2 className="text-base font-semibold mb-4">外觀</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">深色模式</p>
                <p className="text-xs text-muted-foreground">切換介面主題</p>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>
          </section>

          <Separator />

          {/* Danger Zone */}
          <section>
            <h2 className="text-base font-semibold mb-1 text-destructive">危險區域</h2>
            <p className="text-sm text-muted-foreground mb-4">以下操作無法復原</p>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => {
                if (confirm("確定要清除所有對話記錄與設定？")) {
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
