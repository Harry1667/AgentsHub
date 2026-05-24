"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Shield, Trash2, Plus, Key, Users } from "lucide-react"

interface User {
  id: string
  username: string
  role: "admin" | "user"
  createdAt: string
}

export default function AdminPage() {
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
      setError(data.error ?? "建立失敗")
    }
  }

  const deleteUser = async (user: User) => {
    if (!confirm(`確定要刪除用戶「${user.username}」？此操作無法復原。`)) return
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
      setError(data.error ?? "重設失敗")
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
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">用戶管理</h1>
            <p className="text-sm text-muted-foreground">管理 AgentHub 的所有用戶帳號</p>
          </div>
          <Button
            className="ml-auto bg-amber-700 hover:bg-amber-800 text-white gap-2"
            onClick={() => { setShowCreate(true); setError("") }}
          >
            <Plus className="w-4 h-4" />新增用戶
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">載入中...</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Users className="w-4 h-4" />
              共 {users.length} 位用戶
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
                      className={user.role === "admin" ? "bg-amber-700 hover:bg-amber-800" : ""}
                    >
                      {user.role === "admin" ? "管理員" : "一般用戶"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    建立於 {new Date(user.createdAt).toLocaleDateString("zh-TW")}
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
                    {user.role === "admin" ? "降為用戶" : "升為管理員"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => { setShowReset(user); setNewPassword(""); setError("") }}
                  >
                    <Key className="w-3.5 h-3.5" />重設密碼
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1 text-destructive hover:text-destructive"
                    onClick={() => deleteUser(user)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />刪除
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
            <DialogTitle>新增用戶</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>帳號</Label>
              <Input
                placeholder="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>密碼（最少 6 字）</Label>
              <Input
                type="password"
                placeholder="••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>帳戶類型</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "admin" | "user" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">一般用戶</SelectItem>
                  <SelectItem value="admin">管理員</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
              <Button
                className="bg-amber-700 hover:bg-amber-800 text-white"
                disabled={saving || !form.username || !form.password}
                onClick={createUser}
              >
                {saving ? "建立中..." : "建立"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!showReset} onOpenChange={(v) => { if (!v) setShowReset(null); setError("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重設密碼 — {showReset?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>新密碼（最少 6 字）</Label>
              <Input
                type="password"
                placeholder="••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowReset(null)}>取消</Button>
              <Button
                className="bg-amber-700 hover:bg-amber-800 text-white"
                disabled={saving || !newPassword}
                onClick={resetPassword}
              >
                {saving ? "儲存中..." : "確認重設"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
