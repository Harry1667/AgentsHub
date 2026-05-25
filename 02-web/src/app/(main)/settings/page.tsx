"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, LogOut, KeyRound, CheckCircle2, UserRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"

export default function SettingsPage() {
  const { theme, toggleTheme, defaultModel, setDefaultModel } = useAppStore()
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [usernameInput, setUsernameInput] = useState("")
  const [unError, setUnError] = useState("")
  const [unSuccess, setUnSuccess] = useState(false)
  const [unSaving, setUnSaving] = useState(false)

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" })
  const [pwError, setPwError] = useState("")
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.username) { setUsername(d.username); setUsernameInput(d.username) } })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const handleChangeUsername = async () => {
    setUnError("")
    setUnSuccess(false)
    if (usernameInput === username) return
    setUnSaving(true)
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput }),
      })
      const data = await res.json()
      if (res.ok) {
        setUsername(data.username)
        setUnSuccess(true)
      } else {
        setUnError(data.error ?? "更改失敗")
      }
    } catch {
      setUnError("連線錯誤，請稍後再試")
    } finally {
      setUnSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPwError("")
    setPwSuccess(false)
    if (pwForm.next !== pwForm.confirm) {
      setPwError("新密碼與確認密碼不一致")
      return
    }
    if (pwForm.next.length < 6) {
      setPwError("新密碼至少需要 6 個字元")
      return
    }
    setPwSaving(true)
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      })
      const data = await res.json()
      if (res.ok) {
        setPwSuccess(true)
        setPwForm({ current: "", next: "", confirm: "" })
      } else {
        setPwError(data.error ?? "更改失敗")
      }
    } catch {
      setPwError("連線錯誤，請稍後再試")
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader title="設定" subtitle="管理外觀與偏好設定" />

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
            <h2 className="text-base font-semibold mb-4">對話</h2>
            <div className="flex items-center justify-between py-3 border-b gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">對話預設模型</p>
                <p className="text-xs text-muted-foreground">新對話的起始模型，仍可在對話中臨時更改</p>
              </div>
              <select
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                className="text-sm bg-muted rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:bg-muted/80 shrink-0 max-w-[200px]"
              >
                <option value="">跟隨 Agent 設定</option>
                <option value="auto">自動（跨供應商）</option>
                <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5（快速）</option>
                <option value="claude-sonnet-4-6">Claude Sonnet 4.6（均衡）</option>
                <option value="claude-opus-4-7">Claude Opus 4.7（最強）</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              </select>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-base font-semibold mb-4">帳號</h2>
            <div className="space-y-4 max-w-sm mb-8">
              <div className="flex items-center gap-2 mb-2">
                <UserRound className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">帳號名稱</span>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">帳號</Label>
                <Input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => { setUsernameInput(e.target.value); setUnSuccess(false) }}
                  autoComplete="username"
                  maxLength={64}
                />
              </div>
              {unError && <p className="text-sm text-red-500">{unError}</p>}
              {unSuccess && (
                <div className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  帳號名稱已更新
                </div>
              )}
              <Button
                className="bg-amber-700 hover:bg-amber-800 text-white"
                disabled={unSaving || !usernameInput || usernameInput === username}
                onClick={handleChangeUsername}
              >
                {unSaving ? "儲存中..." : "儲存帳號"}
              </Button>
            </div>

            <div className="space-y-4 max-w-sm">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">更改密碼</span>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">目前密碼</Label>
                <Input
                  type="password"
                  placeholder="••••••"
                  value={pwForm.current}
                  onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">新密碼</Label>
                <Input
                  type="password"
                  placeholder="••••••（至少 6 個字元）"
                  value={pwForm.next}
                  onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">確認新密碼</Label>
                <Input
                  type="password"
                  placeholder="••••••"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  autoComplete="new-password"
                />
              </div>
              {pwError && <p className="text-sm text-red-500">{pwError}</p>}
              {pwSuccess && (
                <div className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  密碼已成功更改
                </div>
              )}
              <Button
                className="bg-amber-700 hover:bg-amber-800 text-white"
                disabled={pwSaving || !pwForm.current || !pwForm.next || !pwForm.confirm}
                onClick={handleChangePassword}
              >
                {pwSaving ? "儲存中..." : "確認更改"}
              </Button>
            </div>

            <div className="mt-6">
              <Button variant="outline" className="gap-2" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                登出
              </Button>
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
