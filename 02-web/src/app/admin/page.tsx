"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Shield, Trash2, Plus, Key, Users, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { usePageTitle } from "@/components/page-header"
import { useI18n } from "@/lib/use-i18n"

interface User {
  id: string
  username: string
  role: "admin" | "user"
  createdAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const { t, intlLocale } = useI18n()
  usePageTitle(t("admin.title"))
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showReset, setShowReset] = useState<User | null>(null)
  const [form, setForm] = useState({ username: "", password: "", role: "user" as "admin" | "user" })
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch("/api/admin/users")
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const createUser = async () => {
    setError("")
    setSaving(true)
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      setShowCreate(false)
      setForm({ username: "", password: "", role: "user" })
      load()
    } else {
      setError(data.error ?? t("admin.createFailed"))
    }
  }

  const deleteUser = async (user: User) => {
    if (!confirm(t("admin.deleteConfirm", { name: user.username }))) return
    await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" })
    load()
  }

  const resetPassword = async () => {
    if (!showReset || !newPassword) return
    setError("")
    setSaving(true)
    const res = await fetch(`/api/admin/users/${showReset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      setShowReset(null)
      setNewPassword("")
    } else {
      setError(data.error ?? t("admin.resetFailed"))
    }
  }

  const toggleRole = async (user: User) => {
    const newRole = user.role === "admin" ? "user" : "admin"
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    })
    load()
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push("/chat")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          {t("admin.backToHub")}
        </button>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("admin.subtitle")}</p>
          </div>
          <Button
            className="ml-auto bg-indigo-700 hover:bg-indigo-800 text-white gap-2"
            onClick={() => { setShowCreate(true); setError("") }}
          >
            <Plus className="w-4 h-4" />{t("admin.addUser")}
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">{t("common.loading")}</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Users className="w-4 h-4" />
              {t("admin.userCount", { count: users.length })}
            </div>
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-4 rounded-xl border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{user.username}</span>
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                      className={user.role === "admin" ? "bg-indigo-700 hover:bg-indigo-800" : ""}
                    >
                      {user.role === "admin" ? t("admin.roleAdmin") : t("admin.roleUser")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("admin.createdOn", { date: new Date(user.createdAt).toLocaleDateString(intlLocale) })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => toggleRole(user)}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    {user.role === "admin" ? t("admin.demote") : t("admin.promote")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => { setShowReset(user); setNewPassword(""); setError("") }}
                  >
                    <Key className="w-3.5 h-3.5" />{t("admin.resetPassword")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1 text-destructive hover:text-destructive"
                    onClick={() => deleteUser(user)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />{t("admin.delete")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={(v) => { setShowCreate(v); setError("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.addUser")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{t("admin.username")}</Label>
              <Input
                placeholder="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("admin.passwordMin")}</Label>
              <Input
                type="password"
                placeholder="••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("admin.accountType")}</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "admin" | "user" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t("admin.roleUser")}</SelectItem>
                  <SelectItem value="admin">{t("admin.roleAdmin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>{t("common.cancel")}</Button>
              <Button
                className="bg-indigo-700 hover:bg-indigo-800 text-white"
                disabled={saving || !form.username || !form.password}
                onClick={createUser}
              >
                {saving ? t("admin.creating") : t("admin.create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!showReset} onOpenChange={(v) => { if (!v) setShowReset(null); setError("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.resetTitle", { name: showReset?.username ?? "" })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{t("admin.newPasswordMin")}</Label>
              <Input
                type="password"
                placeholder="••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowReset(null)}>{t("common.cancel")}</Button>
              <Button
                className="bg-indigo-700 hover:bg-indigo-800 text-white"
                disabled={saving || !newPassword}
                onClick={resetPassword}
              >
                {saving ? t("common.saving") : t("admin.confirmReset")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
