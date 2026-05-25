"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export interface TourStep {
  selector?: string   // 目標元素（缺省 = 置中、無聚光）
  title: string
  body: string
}

/**
 * 互動式新手導覽：聚光高亮目標元素 + 說明卡，逐步帶走。
 * 目標元素以 data-tour 屬性標記；找不到的步驟自動置中顯示。
 */
export function OnboardingTour({ steps, onDone }: { steps: TourStep[]; onDone: () => void }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const locate = useCallback(() => {
    const sel = steps[i]?.selector
    if (!sel) { setRect(null); return }
    const el = document.querySelector(sel) as HTMLElement | null
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" })
      setRect(el.getBoundingClientRect())
    } else {
      setRect(null)
    }
  }, [i, steps])

  useEffect(() => {
    let tries = 0
    let t: ReturnType<typeof setTimeout>
    const tryLocate = () => {
      const sel = steps[i]?.selector
      const el = sel ? (document.querySelector(sel) as HTMLElement | null) : null
      if (el || !sel || tries++ > 12) locate()
      else t = setTimeout(tryLocate, 100)
    }
    tryLocate()
    window.addEventListener("resize", locate)
    window.addEventListener("scroll", locate, true)
    return () => { clearTimeout(t); window.removeEventListener("resize", locate); window.removeEventListener("scroll", locate, true) }
  }, [i, steps, locate])

  const step = steps[i]
  if (!step) return null
  const isLast = i === steps.length - 1

  // 說明卡位置：目標下方優先，空間不足則上方；無 rect 則置中
  const pad = 8
  let cardStyle: React.CSSProperties
  if (rect) {
    const below = rect.bottom + 12
    const showBelow = below + 150 < window.innerHeight
    cardStyle = {
      position: "fixed",
      left: Math.min(Math.max(12, rect.left), window.innerWidth - 312),
      top: showBelow ? below : Math.max(12, rect.top - 12 - 150),
      width: 300,
    }
  } else {
    cardStyle = { position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 300 }
  }

  return (
    <div className="fixed inset-0 z-[100]">
      {/* 聚光：用超大 box-shadow 製造四周變暗 */}
      {rect ? (
        <div
          className="fixed rounded-xl ring-2 ring-amber-400 transition-all duration-200 pointer-events-none"
          style={{
            left: rect.left - pad, top: rect.top - pad,
            width: rect.width + pad * 2, height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-black/60" />
      )}

      {/* 說明卡 */}
      <div style={cardStyle} className="rounded-2xl border bg-background shadow-xl p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm">{step.title}</h3>
          <button onClick={onDone} className="text-muted-foreground hover:text-foreground -mt-0.5" title="跳過導覽"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{step.body}</p>
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <span key={idx} className={idx === i ? "w-4 h-1.5 rounded-full bg-amber-700" : "w-1.5 h-1.5 rounded-full bg-muted-foreground/30"} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onDone} className="text-xs text-muted-foreground hover:text-foreground">跳過</button>
            <Button size="sm" className="h-7 text-xs bg-amber-700 hover:bg-amber-800 text-white" onClick={() => (isLast ? onDone() : setI(i + 1))}>
              {isLast ? "開始使用" : "下一步"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
