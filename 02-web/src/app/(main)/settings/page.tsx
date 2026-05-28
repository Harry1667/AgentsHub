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
import { useI18n } from "@/lib/use-i18n"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function SettingsPage() {
  const { theme, toggleTheme, defaultModel, setDefaultModel } = useAppStore()
  const { t } = useI18n()
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
        setUnError(data.error ?? t("settings.changeFailed"))
      }
    } catch {
      setUnError(t("common.connError"))
    } finally {
      setUnSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPwError("")
    setPwSuccess(false)
    if (pwForm.next !== pwForm.confirm) {
      setPwError(t("settings.pwMismatch"))
      return
    }
    if (pwForm.next.length < 6) {
      setPwError(t("settings.pwTooShort"))
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
        setPwError(data.error ?? t("settings.changeFailed"))
      }
    } catch {
      setPwError(t("common.connError"))
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">

          <section>
            <h2 className="text-base font-semibold mb-4">{t("settings.appearance")}</h2>
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="text-sm font-medium">{t("settings.darkMode")}</p>
                <p className="text-xs text-muted-foreground">{t("settings.darkModeDesc")}</p>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>
            <div className="flex items-center justify-between py-3 border-b gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{t("settings.language")}</p>
                <p className="text-xs text-muted-foreground">{t("settings.languageDesc")}</p>
              </div>
              <LanguageSwitcher className="shrink-0" />
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-base font-semibold mb-4">{t("settings.conversation")}</h2>
            <div className="flex items-center justify-between py-3 border-b gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{t("settings.defaultModel")}</p>
                <p className="text-xs text-muted-foreground">{t("settings.defaultModelDesc")}</p>
              </div>
              <select
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                className="text-sm bg-muted rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:bg-muted/80 shrink-0 max-w-[200px]"
              >
                <option value="">{t("settings.followAgent")}</option>
                <option value="auto">{t("chat.modelAuto")}</option>
                <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 {t("agentForm.modelFast")}</option>
                <option value="claude-sonnet-4-6">Claude Sonnet 4.6 {t("agentForm.modelBalanced")}</option>
                <option value="claude-opus-4-7">Claude Opus 4.7 {t("agentForm.modelBest")}</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              </select>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-base font-semibold mb-4">{t("settings.account")}</h2>
            <div className="space-y-4 max-w-sm mb-8">
              <div className="flex items-center gap-2 mb-2">
                <UserRound className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t("settings.accountName")}</span>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("settings.accountLabel")}</Label>
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
                  {t("settings.accountUpdated")}
                </div>
              )}
              <Button
                className="bg-indigo-700 hover:bg-indigo-800 text-white"
                disabled={unSaving || !usernameInput || usernameInput === username}
                onClick={handleChangeUsername}
              >
                {unSaving ? t("common.saving") : t("settings.saveAccount")}
              </Button>
            </div>

            <div className="space-y-4 max-w-sm">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t("settings.changePassword")}</span>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("settings.currentPassword")}</Label>
                <Input
                  type="password"
                  placeholder="••••••"
                  value={pwForm.current}
                  onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("settings.newPassword")}</Label>
                <Input
                  type="password"
                  placeholder={t("settings.newPasswordPlaceholder")}
                  value={pwForm.next}
                  onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("settings.confirmPassword")}</Label>
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
                  {t("settings.pwUpdated")}
                </div>
              )}
              <Button
                className="bg-indigo-700 hover:bg-indigo-800 text-white"
                disabled={pwSaving || !pwForm.current || !pwForm.next || !pwForm.confirm}
                onClick={handleChangePassword}
              >
                {pwSaving ? t("common.saving") : t("settings.confirmChange")}
              </Button>
            </div>

            <div className="mt-6">
              <Button variant="outline" className="gap-2" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                {t("settings.logout")}
              </Button>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-base font-semibold mb-1 text-destructive">{t("settings.dangerZone")}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t("settings.dangerDesc")}</p>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => {
                if (confirm(t("settings.clearConfirm"))) {
                  localStorage.removeItem("agent-store")
                  window.location.reload()
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
              {t("settings.clearData")}
            </Button>
          </section>

        </div>
      </div>
    </div>
  )
}
