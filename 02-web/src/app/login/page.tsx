"use client"

import { useState, useEffect, useRef, FormEvent, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, ChevronRight, ArrowLeft, User, UserPlus, KeyRound, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/use-i18n"
import { LanguageSwitcher } from "@/components/language-switcher"

type LoginUser = { id: string; username: string; displayName: string; avatar: string }

const AVATAR_CHOICES = ["👤", "🧑‍💻", "👩‍💼", "🧑‍🎨", "🦸", "🧙", "🐱", "🦊", "🐼", "🦁", "🤖", "👽", "🌟", "🔥", "🍀"]

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useI18n()

  const [mode, setMode] = useState<"login" | "register">("login")

  const [users, setUsers] = useState<LoginUser[]>([])
  const [usersLoaded, setUsersLoaded] = useState(false)
  const [selected, setSelected] = useState<LoginUser | null>(null)

  const [manualUsername, setManualUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)

  // 註冊欄位
  const [reg, setReg] = useState({ code: "", username: "", password: "", displayName: "", avatar: "👤" })

  useEffect(() => {
    fetch("/api/auth/users")
      .then((r) => r.json())
      .then((data: LoginUser[]) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoaded(true))
  }, [])

  useEffect(() => { if (selected) passwordRef.current?.focus() }, [selected])

  const goAfterAuth = () => {
    const from = searchParams.get("from") ?? "/chat"
    router.push(from)
    router.refresh()
  }

  const pickUser = (u: LoginUser) => { setError(""); setPassword(""); setSelected(u) }
  const back = () => { setError(""); setPassword(""); setSelected(null) }

  const submitLogin = async (e: FormEvent) => {
    e.preventDefault()
    const username = selected ? selected.username : manualUsername
    if (!username || !password) return
    setError(""); setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) goAfterAuth()
      else { const d = await res.json().catch(() => ({})); setError(d.error ?? t("login.loginFailed")); setPassword(""); passwordRef.current?.focus() }
    } catch { setError(t("common.connError")) } finally { setLoading(false) }
  }

  const submitTrial = async () => {
    setError(""); setLoading(true)
    try {
      const res = await fetch("/api/auth/trial", { method: "POST" })
      if (res.ok) goAfterAuth()
      else { const d = await res.json().catch(() => ({})); setError(d.error ?? t("login.trialFailed")) }
    } catch { setError(t("common.connError")) } finally { setLoading(false) }
  }

  const submitRegister = async (e: FormEvent) => {
    e.preventDefault()
    if (!reg.code || !reg.username || !reg.password) { setError(t("login.registerRequired")); return }
    setError(""); setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reg),
      })
      if (res.ok) goAfterAuth()
      else { const d = await res.json().catch(() => ({})); setError(d.error ?? t("login.registerFailed")) }
    } catch { setError(t("common.connError")) } finally { setLoading(false) }
  }

  const hasUsers = users.length > 0

  // ── 註冊模式 ──
  if (mode === "register") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <button onClick={() => { setMode("login"); setError("") }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition">
            <ArrowLeft className="w-3 h-3" /> {t("login.backToLogin")}
          </button>
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-700 flex items-center justify-center mb-3">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">{t("login.registerTitle")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("login.registerSubtitle")}</p>
          </div>

          <form onSubmit={submitRegister} className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">{t("login.pickAvatar")}</p>
              <div className="flex flex-wrap gap-1.5">
                {AVATAR_CHOICES.map((a) => (
                  <button key={a} type="button" onClick={() => setReg((r) => ({ ...r, avatar: a }))}
                    className={cn("w-8 h-8 rounded-full flex items-center justify-center text-lg transition",
                      reg.avatar === a ? "bg-indigo-700/15 ring-2 ring-indigo-700" : "hover:bg-muted")}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-10" placeholder={t("login.inviteCode")} value={reg.code} onChange={(e) => setReg((r) => ({ ...r, code: e.target.value }))} />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-10" placeholder={t("login.username")} value={reg.username} autoComplete="username" onChange={(e) => setReg((r) => ({ ...r, username: e.target.value }))} />
            </div>
            <Input placeholder={t("login.displayNameOptional")} value={reg.displayName} onChange={(e) => setReg((r) => ({ ...r, displayName: e.target.value }))} />
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-10" type="password" placeholder={t("login.passwordMin")} value={reg.password} autoComplete="new-password" onChange={(e) => setReg((r) => ({ ...r, password: e.target.value }))} />
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button type="submit" className="w-full bg-indigo-700 hover:bg-indigo-800 text-white" disabled={loading}>
              {loading ? t("login.creating") : t("login.createAndLogin")}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // ── 登入模式 ──
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md flex flex-col items-center">
        <p className="text-sm text-muted-foreground mb-10">
          {selected ? t("login.loginAs", { name: selected.displayName }) : t("login.pickUser")}
        </p>

        {hasUsers && selected ? (
          <div className="flex flex-col items-center w-full max-w-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="w-24 h-24 rounded-full bg-indigo-700/10 ring-2 ring-indigo-700/30 flex items-center justify-center text-5xl mb-3 select-none">{selected.avatar}</div>
            <p className="text-lg font-semibold mb-5">{selected.displayName}</p>
            <form onSubmit={submitLogin} className="w-full space-y-3">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input ref={passwordRef} type="password" placeholder={t("login.enterPassword")} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 text-center" autoComplete="current-password" />
                <button type="submit" disabled={loading || !password} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-700 text-white flex items-center justify-center disabled:opacity-30 transition hover:bg-indigo-800" aria-label={t("login.login")}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <button type="button" onClick={back} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mx-auto mt-2 transition">
                <ArrowLeft className="w-3 h-3" /> {t("login.switchUser")}
              </button>
            </form>
          </div>
        ) : null}

        {hasUsers && !selected ? (
          <>
            <div className="flex flex-wrap gap-6 justify-center">
              {users.map((u) => (
                <button key={u.id} onClick={() => pickUser(u)} className="group flex flex-col items-center gap-2 focus:outline-none">
                  <div className="w-20 h-20 rounded-full bg-card ring-2 ring-border group-hover:ring-indigo-700 group-focus:ring-indigo-700 flex items-center justify-center text-4xl transition select-none">{u.avatar}</div>
                  <span className="text-sm text-foreground/80 group-hover:text-foreground transition">{u.displayName}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-6 mt-10">
              <button onClick={() => { setMode("register"); setError("") }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
                <UserPlus className="w-4 h-4" /> {t("login.addUser")}
              </button>
              <button onClick={submitTrial} disabled={loading} className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100 transition disabled:opacity-50">
                <Gift className="w-4 h-4" /> {loading ? t("login.verifying") : t("login.tryTrial")}
              </button>
            </div>
            {error && !selected && <p className="text-sm text-red-500 text-center mt-2">{error}</p>}
          </>
        ) : null}

        {usersLoaded && !hasUsers ? (
          <form onSubmit={submitLogin} className="w-full max-w-sm space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="text" placeholder={t("login.username")} value={manualUsername} onChange={(e) => setManualUsername(e.target.value)} className="pl-10" autoFocus autoComplete="username" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="password" placeholder={t("login.password")} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" autoComplete="current-password" />
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button type="submit" className="w-full bg-indigo-700 hover:bg-indigo-800 text-white" disabled={loading || !manualUsername || !password}>
              {loading ? t("login.verifying") : t("login.login")}
            </Button>
            <div className="flex items-center justify-center gap-6">
              <button type="button" onClick={() => { setMode("register"); setError("") }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
                <UserPlus className="w-4 h-4" /> {t("login.addUser")}
              </button>
              <button type="button" onClick={submitTrial} disabled={loading} className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100 transition disabled:opacity-50">
                <Gift className="w-4 h-4" /> {t("login.tryTrial")}
              </button>
            </div>
          </form>
        ) : null}

        {!usersLoaded ? <div className="w-20 h-20 rounded-full bg-muted animate-pulse" /> : null}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}
