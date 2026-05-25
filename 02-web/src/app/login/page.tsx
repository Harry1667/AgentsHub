"use client"

import { useState, useEffect, useRef, FormEvent, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, ChevronRight, ArrowLeft, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type LoginUser = {
  id: string
  username: string
  displayName: string
  avatar: string
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [users, setUsers] = useState<LoginUser[]>([])
  const [usersLoaded, setUsersLoaded] = useState(false)
  const [selected, setSelected] = useState<LoginUser | null>(null)

  // 手動模式（無使用者列表時 fallback）
  const [manualUsername, setManualUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)

  // 載入使用者頭像牆
  useEffect(() => {
    fetch("/api/auth/users")
      .then((r) => r.json())
      .then((data: LoginUser[]) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoaded(true))
  }, [])

  // 選中頭像後自動 focus 密碼框
  useEffect(() => {
    if (selected) passwordRef.current?.focus()
  }, [selected])

  const pickUser = (u: LoginUser) => {
    setError("")
    setPassword("")
    setSelected(u)
  }

  const back = () => {
    setError("")
    setPassword("")
    setSelected(null)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const username = selected ? selected.username : manualUsername
    if (!username || !password) return

    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        const from = searchParams.get("from") ?? "/chat"
        router.push(from)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "登入失敗")
        setPassword("")
        passwordRef.current?.focus()
      }
    } catch {
      setError("連線錯誤，請稍後再試")
    } finally {
      setLoading(false)
    }
  }

  const hasUsers = users.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* 標題 */}
        <p className="text-sm text-muted-foreground mb-10">
          {selected ? `以 ${selected.displayName} 身分登入` : "選擇使用者登入 AgentHub"}
        </p>

        {/* 已選使用者：放大頭像 + 密碼 */}
        {hasUsers && selected ? (
          <div className="flex flex-col items-center w-full max-w-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="w-24 h-24 rounded-full bg-amber-700/10 ring-2 ring-amber-700/30 flex items-center justify-center text-5xl mb-3 select-none">
              {selected.avatar}
            </div>
            <p className="text-lg font-semibold mb-5">{selected.displayName}</p>

            <form onSubmit={submit} className="w-full space-y-3">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={passwordRef}
                  type="password"
                  placeholder="輸入密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 text-center"
                  autoComplete="current-password"
                />
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center disabled:opacity-30 transition hover:bg-amber-800"
                  aria-label="登入"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {error && <p className="text-sm text-red-500 text-center">{error}</p>}

              <button
                type="button"
                onClick={back}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mx-auto mt-2 transition"
              >
                <ArrowLeft className="w-3 h-3" /> 切換使用者
              </button>
            </form>
          </div>
        ) : null}

        {/* 頭像牆 */}
        {hasUsers && !selected ? (
          <div className="flex flex-wrap gap-6 justify-center">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => pickUser(u)}
                className="group flex flex-col items-center gap-2 focus:outline-none"
              >
                <div className="w-20 h-20 rounded-full bg-card ring-2 ring-border group-hover:ring-amber-700 group-focus:ring-amber-700 flex items-center justify-center text-4xl transition select-none">
                  {u.avatar}
                </div>
                <span className="text-sm text-foreground/80 group-hover:text-foreground transition">
                  {u.displayName}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {/* fallback：無使用者列表時手動輸入 */}
        {usersLoaded && !hasUsers ? (
          <form onSubmit={submit} className="w-full max-w-sm space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="帳號"
                value={manualUsername}
                onChange={(e) => setManualUsername(e.target.value)}
                className="pl-10"
                autoFocus
                autoComplete="username"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-amber-700 hover:bg-amber-800 text-white"
              disabled={loading || !manualUsername || !password}
            >
              {loading ? "驗證中..." : "登入"}
            </Button>
          </form>
        ) : null}

        {/* 載入中 */}
        {!usersLoaded ? (
          <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
        ) : null}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
