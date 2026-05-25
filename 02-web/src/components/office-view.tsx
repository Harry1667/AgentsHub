"use client"

import { useEffect, useRef, useState } from "react"
import { Agent, Conversation } from "@/lib/types"

/**
 * 像素辦公室視圖。
 * 美術素材：pixel-agents（MIT, Pablo De Lucca / Metro City / LimeZu）放在 /public/assets/office。
 * 渲染、走位、狀態與拖拉邏輯為本專案自寫的輕量 canvas 引擎。
 * sprite-ready：換素材只需替換 /public/assets/office 下 PNG 並調 FRAME 常數。
 */

const TILE = 16
const CHAR_W = 16
const CHAR_H = 32
const CHAR_SHEET_COLS = 7
type Direction = "down" | "up" | "right" | "left"
const DIR_ROW: Record<Direction, number> = { down: 0, up: 1, right: 2, left: 2 }
const WALK_FRAMES = [0, 1, 2, 3]
const SCALE = 3
const CHAR_COUNT = 6

const WORLD_W = 260
const WORLD_H = 168
const WALK_SPEED = 24
const FRAME_DUR = 0.16

// 狀態門檻（距今）
const WORKING_MS = 60 * 60 * 1000          // 1 小時內 → 工作中
const ACTIVE_MS = 7 * 24 * 60 * 60 * 1000  // 7 天內 → 活躍；更久 → 閒置
type Behavior = "working" | "active" | "idle"

interface Furniture { src: string; x: number; y: number; w: number; h: number }
const FURNITURE: Furniture[] = [
  { src: "LARGE_PLANT.png",       x: 8,   y: 18,  w: 32, h: 48 },
  { src: "DESK_FRONT.png",        x: 60,  y: 30,  w: 48, h: 32 },
  { src: "PC_FRONT_ON_1.png",     x: 76,  y: 14,  w: 16, h: 32 },
  { src: "WHITEBOARD.png",        x: 150, y: 12,  w: 32, h: 32 },
  { src: "SOFA_FRONT.png",        x: 200, y: 40,  w: 32, h: 16 },
  { src: "CACTUS.png",            x: 236, y: 30,  w: 16, h: 16 },
  { src: "PLANT.png",             x: 16,  y: 120, w: 16, h: 32 },
  { src: "SMALL_TABLE_FRONT.png", x: 120, y: 130, w: 16, h: 16 },
  { src: "COFFEE.png",            x: 132, y: 120, w: 16, h: 16 },
  { src: "LARGE_PLANT.png",       x: 224, y: 116, w: 32, h: 48 },
]

const MEETING_ZONE = { x: 168, y: 96, w: 76, h: 56 }
// 工作中聚集（桌子附近）、閒置聚集（沙發附近）
const DESK_ZONE = { x: 50, y: 66, w: 70, h: 30 }
const REST_ZONE = { x: 192, y: 58, w: 48, h: 28 }

interface Walker {
  agent: Agent
  sheetIndex: number
  x: number; y: number
  tx: number; ty: number
  dir: Direction
  moving: boolean
  frame: number
  frameTimer: number
  pause: number
  behavior: Behavior
  dragging: boolean
  bob: number
}

function rand(a: number, b: number) { return a + Math.random() * (b - a) }
function inZone(x: number, y: number, z: { x: number; y: number; w: number; h: number }) {
  return x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h
}
function targetFor(b: Behavior): { x: number; y: number } {
  if (b === "working") return { x: rand(DESK_ZONE.x, DESK_ZONE.x + DESK_ZONE.w), y: rand(DESK_ZONE.y, DESK_ZONE.y + DESK_ZONE.h) }
  if (b === "idle") return { x: rand(REST_ZONE.x, REST_ZONE.x + REST_ZONE.w), y: rand(REST_ZONE.y, REST_ZONE.y + REST_ZONE.h) }
  return { x: rand(24, WORLD_W - 24), y: rand(56, WORLD_H - 16) }
}

interface OfficeViewProps {
  agents: Agent[]
  conversations: Conversation[]
  onOpenAgent: (a: Agent) => void
  onOpenMeeting: () => void
  onStartMeeting: (agentIds: string[]) => void
}

export function OfficeView({ agents, conversations, onOpenAgent, onOpenMeeting, onStartMeeting }: OfficeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const walkersRef = useRef<Walker[]>([])
  const hoverRef = useRef<Walker | null>(null)
  const rafRef = useRef<number>(0)
  const stagedRef = useRef<string[]>([])         // 進入會議室待組會的 agentId（有序）
  const downRef = useRef<{ walker: Walker | null; moved: boolean } | null>(null)
  const [stagedIds, setStagedIds] = useState<string[]>([])
  const cbRef = useRef({ onOpenAgent, onOpenMeeting, onStartMeeting })
  cbRef.current = { onOpenAgent, onOpenMeeting, onStartMeeting }

  // 每個 agent 最後活躍時間
  const lastActive = (() => {
    const m = new Map<string, number>()
    for (const c of conversations) {
      const t = new Date(c.updatedAt).getTime()
      const ids = c.participantIds?.length ? c.participantIds : [c.agentId]
      for (const id of ids) m.set(id, Math.max(m.get(id) ?? 0, t))
    }
    return m
  })()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    canvas.width = WORLD_W * SCALE
    canvas.height = WORLD_H * SCALE
    ctx.imageSmoothingEnabled = false

    const load = (src: string) => { const i = new Image(); i.src = src; return i }
    const floor = load("/assets/office/floors/floor_2.png")
    const sheets = Array.from({ length: CHAR_COUNT }, (_, i) => load(`/assets/office/characters/char_${i}.png`))
    const furnImgs = new Map<string, HTMLImageElement>()
    for (const f of FURNITURE) if (!furnImgs.has(f.src)) furnImgs.set(f.src, load(`/assets/office/furniture/${f.src}`))

    const now = Date.now()
    walkersRef.current = agents.map((agent, i) => {
      const la = lastActive.get(agent.id) ?? 0
      const age = now - la
      const behavior: Behavior = la === 0 || age >= ACTIVE_MS ? "idle" : age < WORKING_MS ? "working" : "active"
      const t = targetFor(behavior)
      return {
        agent, sheetIndex: i % CHAR_COUNT,
        x: rand(24, WORLD_W - 24), y: rand(56, WORLD_H - 16),
        tx: t.x, ty: t.y, dir: "down", moving: true,
        frame: 0, frameTimer: 0, pause: rand(0, 2),
        behavior, dragging: false, bob: Math.random() * Math.PI * 2,
      }
    })

    let last = performance.now()
    const loop = (tnow: number) => {
      const dt = Math.min(0.05, (tnow - last) / 1000)
      last = tnow
      const staged = stagedRef.current

      for (const w of walkersRef.current) {
        w.bob += dt * (w.behavior === "working" ? 7 : 4)
        if (w.dragging) { w.moving = false; continue }

        const stagedIdx = staged.indexOf(w.agent.id)
        if (stagedIdx >= 0) {
          // 停在會議室排排站
          const col = stagedIdx % 4, row = Math.floor(stagedIdx / 4)
          const sx = MEETING_ZONE.x + 16 + col * 18
          const sy = MEETING_ZONE.y + 28 + row * 22
          const dx = sx - w.x, dy = sy - w.y, d = Math.hypot(dx, dy)
          if (d > 1.5) { const s = Math.min(d, WALK_SPEED * dt); w.x += dx / d * s; w.y += dy / d * s; w.moving = true; w.dir = dx > 0 ? "right" : dx < 0 ? "left" : "down" }
          else w.moving = false
          w.frameTimer += dt; if (w.frameTimer >= FRAME_DUR) { w.frameTimer = 0; w.frame = (w.frame + 1) % WALK_FRAMES.length }
          continue
        }

        if (w.pause > 0) { w.pause -= dt; w.moving = false; continue }
        const dx = w.tx - w.x, dy = w.ty - w.y, dist = Math.hypot(dx, dy)
        if (dist < 2) {
          w.moving = false
          w.pause = w.behavior === "idle" ? rand(2.5, 6) : rand(1, 3.5)
          const t = targetFor(w.behavior); w.tx = t.x; w.ty = t.y
        } else {
          w.moving = true
          const speed = w.behavior === "idle" ? WALK_SPEED * 0.6 : WALK_SPEED
          const step = Math.min(dist, speed * dt)
          w.x += dx / dist * step; w.y += dy / dist * step
          if (Math.abs(dx) > Math.abs(dy)) w.dir = dx > 0 ? "right" : "left"
          else w.dir = dy > 0 ? "down" : "up"
          w.frameTimer += dt; if (w.frameTimer >= FRAME_DUR) { w.frameTimer = 0; w.frame = (w.frame + 1) % WALK_FRAMES.length }
        }
      }

      // ── 繪製 ──
      ctx.save()
      ctx.scale(SCALE, SCALE)
      ctx.clearRect(0, 0, WORLD_W, WORLD_H)
      if (floor.complete && floor.naturalWidth) {
        for (let y = 0; y < WORLD_H; y += TILE) for (let x = 0; x < WORLD_W; x += TILE) ctx.drawImage(floor, x, y, TILE, TILE)
      } else { ctx.fillStyle = "#cdbfae"; ctx.fillRect(0, 0, WORLD_W, WORLD_H) }

      // 會議室地毯（待組會時高亮）
      const mz = MEETING_ZONE
      const hot = staged.length > 0
      ctx.fillStyle = hot ? "rgba(99,102,241,0.30)" : "rgba(99,102,241,0.16)"
      ctx.fillRect(mz.x, mz.y, mz.w, mz.h)
      ctx.strokeStyle = hot ? "rgba(79,70,229,0.9)" : "rgba(99,102,241,0.5)"
      ctx.lineWidth = 1
      ctx.strokeRect(mz.x + 0.5, mz.y + 0.5, mz.w - 1, mz.h - 1)
      ctx.fillStyle = "rgba(79,70,229,0.9)"; ctx.font = "7px sans-serif"; ctx.textAlign = "center"
      ctx.fillText("🏛 會議室", mz.x + mz.w / 2, mz.y + 10)

      type Drawable = { baseY: number; draw: () => void }
      const items: Drawable[] = []
      for (const f of FURNITURE) {
        const img = furnImgs.get(f.src); if (!img) continue
        items.push({ baseY: f.y + f.h, draw: () => { if (img.complete && img.naturalWidth) ctx.drawImage(img, f.x, f.y, f.w, f.h) } })
      }
      for (const w of walkersRef.current) {
        const isStaged = staged.includes(w.agent.id)
        items.push({
          baseY: w.dragging ? 9999 : w.y,
          draw: () => {
            const sheet = sheets[w.sheetIndex]
            const drawX = Math.round(w.x - CHAR_W / 2)
            const bobY = w.moving ? Math.round(Math.sin(w.bob * 2) * 0.6) : Math.round(Math.sin(w.bob) * 0.6)
            const drawY = Math.round(w.y - CHAR_H) + bobY
            const dim = w.behavior === "idle" && !isStaged && !w.dragging

            // 光暈：staged 紫、working 綠、active 金
            const glow = isStaged ? "rgba(99,102,241,0.5)" : w.behavior === "working" ? "rgba(80,200,120,0.4)" : w.behavior === "active" ? "rgba(245,200,90,0.32)" : null
            if (glow) { ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(w.x, w.y, 9, 4, 0, 0, Math.PI * 2); ctx.fill() }
            ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.beginPath(); ctx.ellipse(w.x, w.y, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill()

            ctx.globalAlpha = dim ? 0.55 : 1
            if (sheet.complete && sheet.naturalWidth) {
              const col = w.moving ? WALK_FRAMES[w.frame] : 0
              const sx = (col % CHAR_SHEET_COLS) * CHAR_W
              const sy = DIR_ROW[w.dir] * CHAR_H
              if (w.dir === "left") {
                ctx.save(); ctx.translate(drawX + CHAR_W, drawY); ctx.scale(-1, 1)
                ctx.drawImage(sheet, sx, sy, CHAR_W, CHAR_H, 0, 0, CHAR_W, CHAR_H); ctx.restore()
              } else {
                ctx.drawImage(sheet, sx, sy, CHAR_W, CHAR_H, drawX, drawY, CHAR_W, CHAR_H)
              }
            }
            ctx.globalAlpha = 1
            // 頭上：emoji 徽章 + 狀態氣泡
            ctx.font = "9px sans-serif"; ctx.textAlign = "center"
            ctx.fillText(w.agent.avatar, w.x, drawY - 1)
            const bubble = isStaged ? null : w.behavior === "working" ? "💬" : w.behavior === "idle" ? "💤" : null
            if (bubble) { ctx.font = "8px sans-serif"; ctx.fillText(bubble, w.x + 9, drawY + 2) }
          },
        })
      }
      items.sort((a, b) => a.baseY - b.baseY)
      for (const it of items) it.draw()

      const hv = hoverRef.current
      if (hv) {
        const label = hv.agent.name
        ctx.font = "7px sans-serif"
        const tw = ctx.measureText(label).width
        const bx = hv.x - tw / 2 - 3, by = hv.y - CHAR_H - 14
        ctx.fillStyle = "rgba(20,20,20,0.85)"; ctx.fillRect(bx, by, tw + 6, 11)
        ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.fillText(label, hv.x, by + 8)
      }
      ctx.restore()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agents.map((a) => a.id).join(",")])

  const toWorld = (e: React.MouseEvent) => {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * WORLD_W, y: ((e.clientY - r.top) / r.height) * WORLD_H }
  }
  const pick = (wx: number, wy: number): Walker | null => {
    let hit: Walker | null = null
    for (const w of walkersRef.current) {
      if (wx >= w.x - CHAR_W / 2 && wx <= w.x + CHAR_W / 2 && wy >= w.y - CHAR_H && wy <= w.y + 2) {
        if (!hit || w.y > hit.y) hit = w
      }
    }
    return hit
  }
  const setStaged = (ids: string[]) => { stagedRef.current = ids; setStagedIds(ids) }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-2xl border shadow-sm select-none touch-none"
        style={{ imageRendering: "pixelated", maxWidth: "100%" }}
        onMouseDown={(e) => {
          const { x, y } = toWorld(e)
          const w = pick(x, y)
          downRef.current = { walker: w, moved: false }
          if (w) w.dragging = true
        }}
        onMouseMove={(e) => {
          const { x, y } = toWorld(e)
          const d = downRef.current
          if (d?.walker) {
            d.moved = true
            d.walker.x = Math.max(10, Math.min(WORLD_W - 10, x))
            d.walker.y = Math.max(40, Math.min(WORLD_H - 6, y))
          }
          hoverRef.current = d?.walker ? null : pick(x, y)
          const inMeeting = inZone(x, y, MEETING_ZONE)
          canvasRef.current!.style.cursor = d?.walker ? "grabbing" : (hoverRef.current ? "grab" : inMeeting ? "pointer" : "default")
        }}
        onMouseUp={(e) => {
          const { x, y } = toWorld(e)
          const d = downRef.current
          downRef.current = null
          if (!d) return
          if (d.walker) {
            d.walker.dragging = false
            const id = d.walker.agent.id
            if (d.moved) {
              const intoMeeting = inZone(d.walker.x, d.walker.y, MEETING_ZONE)
              const cur = stagedRef.current
              if (intoMeeting && !cur.includes(id)) setStaged([...cur, id])
              else if (!intoMeeting && cur.includes(id)) {
                setStaged(cur.filter((x2) => x2 !== id))
                const t = targetFor(d.walker.behavior); d.walker.tx = t.x; d.walker.ty = t.y
              }
            } else {
              cbRef.current.onOpenAgent(d.walker.agent) // 純點擊
            }
          } else if (inZone(x, y, MEETING_ZONE)) {
            cbRef.current.onOpenMeeting()
          }
        }}
        onMouseLeave={() => {
          hoverRef.current = null
          if (downRef.current?.walker) downRef.current.walker.dragging = false
          downRef.current = null
        }}
      />

      {/* 拖拉組會議：2+ 顯示發起按鈕 */}
      {stagedIds.length >= 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/95 border rounded-full shadow-lg px-3 py-1.5">
          <span className="text-xs text-muted-foreground">
            會議室：{stagedIds.length} 位
          </span>
          <button
            onClick={() => { if (stagedIds.length >= 2) { onStartMeeting(stagedIds); setStaged([]) } }}
            disabled={stagedIds.length < 2}
            className="text-xs px-2.5 py-1 rounded-full bg-amber-700 text-white disabled:opacity-40 hover:bg-amber-800 transition-colors"
          >
            發起會議{stagedIds.length >= 2 ? `（${stagedIds.length}）` : "（至少 2 位）"}
          </button>
          <button onClick={() => setStaged([])} className="text-xs text-muted-foreground hover:text-foreground">清空</button>
        </div>
      )}

      {/* 圖例 */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted-foreground">
        <span>🟢 工作中(近1h)</span>
        <span>🟡 活躍(7天內)</span>
        <span>😴 閒置</span>
        <span>・拖小人進會議室地毯可組會議</span>
      </div>
    </div>
  )
}
