"use client"

import { useEffect, useRef } from "react"
import { Agent, Conversation } from "@/lib/types"

/**
 * 像素辦公室視圖。
 * 美術素材：pixel-agents（MIT, Pablo De Lucca / Metro City / LimeZu）放在 /public/assets/office。
 * 渲染與走位邏輯為本專案自寫的輕量 canvas 引擎。
 * sprite-ready：若日後換素材，只需替換 /public/assets/office 下的 PNG 並調整 FRAME 常數。
 */

// ── sprite 規格（來自 pixel-agents 素材）──
const TILE = 16              // 地板 tile 與世界格大小
const CHAR_W = 16
const CHAR_H = 32
const CHAR_SHEET_COLS = 7    // 每列 7 幀
// 方向 → sheet 列：down=0, up=1, right=2（left 由 right 水平翻轉）
const DIR_ROW: Record<Direction, number> = { down: 0, up: 1, right: 2, left: 2 }
const WALK_FRAMES = [0, 1, 2, 3]   // 走路循環用前 4 幀
const SCALE = 3                     // 像素放大倍率
const CHAR_COUNT = 6

// 世界尺寸（source px），canvas 以 SCALE 放大，CSS 再縮放填滿容器
const WORLD_W = 260
const WORLD_H = 168

const WALK_SPEED = 24        // world px/s
const FRAME_DUR = 0.16       // 每走路幀秒數

type Direction = "down" | "up" | "right" | "left"

interface Furniture { src: string; x: number; y: number; w: number; h: number }

// 靜態家具擺設（world 座標，y 為底部基準用 y+h 排序）
const FURNITURE: Furniture[] = [
  { src: "LARGE_PLANT.png",     x: 8,   y: 18,  w: 32, h: 48 },
  { src: "DESK_FRONT.png",      x: 60,  y: 30,  w: 48, h: 32 },
  { src: "PC_FRONT_ON_1.png",   x: 76,  y: 14,  w: 16, h: 32 },
  { src: "WHITEBOARD.png",      x: 150, y: 12,  w: 32, h: 32 },
  { src: "SOFA_FRONT.png",      x: 200, y: 40,  w: 32, h: 16 },
  { src: "CACTUS.png",          x: 236, y: 30,  w: 16, h: 16 },
  { src: "PLANT.png",           x: 16,  y: 120, w: 16, h: 32 },
  { src: "SMALL_TABLE_FRONT.png", x: 120, y: 130, w: 16, h: 16 },
  { src: "COFFEE.png",          x: 132, y: 120, w: 16, h: 16 },
  { src: "LARGE_PLANT.png",     x: 224, y: 116, w: 32, h: 48 },
]

// 會議室區域（地毯），點擊發起會議
const MEETING_ZONE = { x: 168, y: 96, w: 76, h: 56 }

interface Walker {
  agent: Agent
  sheetIndex: number
  x: number; y: number          // 腳底中心 world 座標
  tx: number; ty: number        // 目標
  dir: Direction
  moving: boolean
  frame: number
  frameTimer: number
  pause: number                 // 待機剩餘秒
  active: boolean               // 近期有對話
  bob: number
}

function rand(a: number, b: number) { return a + Math.random() * (b - a) }

interface OfficeViewProps {
  agents: Agent[]
  conversations: Conversation[]
  onOpenAgent: (a: Agent) => void
  onOpenMeeting: () => void
}

export function OfficeView({ agents, conversations, onOpenAgent, onOpenMeeting }: OfficeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const walkersRef = useRef<Walker[]>([])
  const hoverRef = useRef<Walker | null>(null)
  const mouseRef = useRef<{ x: number; y: number } | null>(null)
  const rafRef = useRef<number>(0)
  // 用 ref 持有最新 callback / 資料，避免重啟動畫迴圈
  const cbRef = useRef({ onOpenAgent, onOpenMeeting })
  cbRef.current = { onOpenAgent, onOpenMeeting }

  // 近期活躍：updatedAt 在 24h 內
  const recentByAgent = (() => {
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

    // ── 載入素材 ──
    const load = (src: string) => {
      const img = new Image()
      img.src = src
      return img
    }
    const floor = load("/assets/office/floors/floor_2.png")
    const sheets = Array.from({ length: CHAR_COUNT }, (_, i) =>
      load(`/assets/office/characters/char_${i}.png`))
    const furnImgs = new Map<string, HTMLImageElement>()
    for (const f of FURNITURE) {
      if (!furnImgs.has(f.src)) furnImgs.set(f.src, load(`/assets/office/furniture/${f.src}`))
    }

    // ── 初始化角色 ──
    walkersRef.current = agents.map((agent, i) => {
      const now = Date.now()
      const recent = recentByAgent.get(agent.id) ?? 0
      return {
        agent,
        sheetIndex: i % CHAR_COUNT,
        x: rand(24, WORLD_W - 24),
        y: rand(56, WORLD_H - 16),
        tx: rand(24, WORLD_W - 24),
        ty: rand(56, WORLD_H - 16),
        dir: "down" as Direction,
        moving: true,
        frame: 0,
        frameTimer: 0,
        pause: rand(0, 2),
        active: now - recent < 24 * 3600 * 1000,
        bob: Math.random() * Math.PI * 2,
      }
    })

    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      // 更新
      for (const w of walkersRef.current) {
        w.bob += dt * 4
        if (w.pause > 0) {
          w.pause -= dt
          w.moving = false
        } else {
          const dx = w.tx - w.x
          const dy = w.ty - w.y
          const dist = Math.hypot(dx, dy)
          if (dist < 2) {
            // 到達 → 待機後挑新目標
            w.moving = false
            w.pause = rand(1.2, 4.5)
            w.tx = rand(24, WORLD_W - 24)
            w.ty = rand(56, WORLD_H - 16)
          } else {
            w.moving = true
            const step = Math.min(dist, WALK_SPEED * dt)
            w.x += (dx / dist) * step
            w.y += (dy / dist) * step
            // 面向：水平優先
            if (Math.abs(dx) > Math.abs(dy)) w.dir = dx > 0 ? "right" : "left"
            else w.dir = dy > 0 ? "down" : "up"
            w.frameTimer += dt
            if (w.frameTimer >= FRAME_DUR) {
              w.frameTimer = 0
              w.frame = (w.frame + 1) % WALK_FRAMES.length
            }
          }
        }
      }

      // ── 繪製 ──
      ctx.save()
      ctx.scale(SCALE, SCALE)
      ctx.clearRect(0, 0, WORLD_W, WORLD_H)

      // 地板平鋪
      if (floor.complete && floor.naturalWidth) {
        for (let y = 0; y < WORLD_H; y += TILE)
          for (let x = 0; x < WORLD_W; x += TILE)
            ctx.drawImage(floor, x, y, TILE, TILE)
      } else {
        ctx.fillStyle = "#cdbfae"
        ctx.fillRect(0, 0, WORLD_W, WORLD_H)
      }

      // 會議室地毯
      const mz = MEETING_ZONE
      ctx.fillStyle = "rgba(99,102,241,0.18)"
      ctx.fillRect(mz.x, mz.y, mz.w, mz.h)
      ctx.strokeStyle = "rgba(99,102,241,0.5)"
      ctx.lineWidth = 1
      ctx.strokeRect(mz.x + 0.5, mz.y + 0.5, mz.w - 1, mz.h - 1)
      ctx.fillStyle = "rgba(79,70,229,0.85)"
      ctx.font = "7px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("🏛 會議室", mz.x + mz.w / 2, mz.y + 10)

      // 可繪物件（家具 + 角色）依基準 y 排序做前後遮擋
      type Drawable = { baseY: number; draw: () => void }
      const items: Drawable[] = []

      for (const f of FURNITURE) {
        const img = furnImgs.get(f.src)
        if (!img) continue
        items.push({
          baseY: f.y + f.h,
          draw: () => { if (img.complete && img.naturalWidth) ctx.drawImage(img, f.x, f.y, f.w, f.h) },
        })
      }

      for (const w of walkersRef.current) {
        items.push({
          baseY: w.y,
          draw: () => {
            const sheet = sheets[w.sheetIndex]
            const drawX = Math.round(w.x - CHAR_W / 2)
            const bobY = w.moving ? Math.round(Math.sin(w.bob * 2) * 0.5) : Math.round(Math.sin(w.bob) * 0.6)
            const drawY = Math.round(w.y - CHAR_H) + bobY
            // 活躍光暈
            if (w.active) {
              ctx.fillStyle = "rgba(245,200,90,0.35)"
              ctx.beginPath()
              ctx.ellipse(w.x, w.y, 9, 4, 0, 0, Math.PI * 2)
              ctx.fill()
            }
            // 陰影
            ctx.fillStyle = "rgba(0,0,0,0.18)"
            ctx.beginPath()
            ctx.ellipse(w.x, w.y, 6, 2.5, 0, 0, Math.PI * 2)
            ctx.fill()

            if (sheet.complete && sheet.naturalWidth) {
              const col = w.moving ? WALK_FRAMES[w.frame] : 0
              const sx = (col % CHAR_SHEET_COLS) * CHAR_W
              const sy = DIR_ROW[w.dir] * CHAR_H
              if (w.dir === "left") {
                ctx.save()
                ctx.translate(drawX + CHAR_W, drawY)
                ctx.scale(-1, 1)
                ctx.drawImage(sheet, sx, sy, CHAR_W, CHAR_H, 0, 0, CHAR_W, CHAR_H)
                ctx.restore()
              } else {
                ctx.drawImage(sheet, sx, sy, CHAR_W, CHAR_H, drawX, drawY, CHAR_W, CHAR_H)
              }
            }
            // 頭上 emoji 徽章（辨識 agent）
            ctx.font = "9px sans-serif"
            ctx.textAlign = "center"
            ctx.fillText(w.agent.avatar, w.x, drawY - 1)
          },
        })
      }

      items.sort((a, b) => a.baseY - b.baseY)
      for (const it of items) it.draw()

      // hover 名牌
      const hv = hoverRef.current
      if (hv) {
        const label = hv.agent.name
        ctx.font = "7px sans-serif"
        const tw = ctx.measureText(label).width
        const bx = hv.x - tw / 2 - 3
        const by = hv.y - CHAR_H - 14
        ctx.fillStyle = "rgba(20,20,20,0.85)"
        ctx.fillRect(bx, by, tw + 6, 11)
        ctx.fillStyle = "#fff"
        ctx.textAlign = "center"
        ctx.fillText(label, hv.x, by + 8)
      }

      ctx.restore()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(rafRef.current)
    // 僅在 agents 數量/identity 改變時重建
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agents.map((a) => a.id).join(",")])

  // 滑鼠座標 → world 命中測試
  const toWorld = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!
    const r = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - r.left) / r.width) * WORLD_W,
      y: ((e.clientY - r.top) / r.height) * WORLD_H,
    }
  }
  const pick = (wx: number, wy: number): Walker | null => {
    let hit: Walker | null = null
    for (const w of walkersRef.current) {
      const left = w.x - CHAR_W / 2, right = w.x + CHAR_W / 2
      const top = w.y - CHAR_H, bottom = w.y + 2
      if (wx >= left && wx <= right && wy >= top && wy <= bottom) {
        if (!hit || w.y > hit.y) hit = w  // 取較前（y 大）者
      }
    }
    return hit
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-auto rounded-2xl border shadow-sm select-none"
      style={{ imageRendering: "pixelated", maxWidth: "100%" }}
      onMouseMove={(e) => {
        const { x, y } = toWorld(e)
        mouseRef.current = { x, y }
        hoverRef.current = pick(x, y)
        const canvas = canvasRef.current!
        const inMeeting = x >= MEETING_ZONE.x && x <= MEETING_ZONE.x + MEETING_ZONE.w && y >= MEETING_ZONE.y && y <= MEETING_ZONE.y + MEETING_ZONE.h
        canvas.style.cursor = hoverRef.current || inMeeting ? "pointer" : "default"
      }}
      onMouseLeave={() => { hoverRef.current = null; mouseRef.current = null }}
      onClick={(e) => {
        const { x, y } = toWorld(e)
        const w = pick(x, y)
        if (w) { cbRef.current.onOpenAgent(w.agent); return }
        if (x >= MEETING_ZONE.x && x <= MEETING_ZONE.x + MEETING_ZONE.w && y >= MEETING_ZONE.y && y <= MEETING_ZONE.y + MEETING_ZONE.h) {
          cbRef.current.onOpenMeeting()
        }
      }}
    />
  )
}
