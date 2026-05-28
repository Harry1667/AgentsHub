"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/use-i18n"

// Agent 廣場已併入「我的 Agent」的「從範本新增」。保留此路由並導向。
export default function MarketplaceRedirect() {
  const router = useRouter()
  const { t } = useI18n()
  useEffect(() => { router.replace("/agents") }, [router])
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      {t("marketplace.redirecting")}
    </div>
  )
}
