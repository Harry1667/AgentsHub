"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Agent 廣場已併入「我的 Agent」的「從範本新增」。保留此路由並導向。
export default function MarketplaceRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace("/agents") }, [router])
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      已移至「我的 Agent → 從範本新增」，導向中…
    </div>
  )
}
