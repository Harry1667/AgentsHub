"use client"

import { useAppStore } from "@/lib/store"
import { LOCALES, LOCALE_LABELS, Locale } from "@/lib/i18n"
import { cn } from "@/lib/utils"

// 語言下拉切換器；variant="inline" 用於設定頁，"compact" 用於側邊欄
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useAppStore((s) => s.locale)
  const setLocale = useAppStore((s) => s.setLocale)

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className={cn(
        "text-sm bg-muted rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:bg-muted/80",
        className,
      )}
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABELS[l].flag} {LOCALE_LABELS[l].native}
        </option>
      ))}
    </select>
  )
}
