"use client"

import { useAppStore } from "./store"
import { translate, INTL_LOCALE } from "./i18n"

// 介面翻譯 hook：t(key, vars?) 取字串、locale 取當前語系、intlLocale 供 toLocaleString 用
export function useI18n() {
  const locale = useAppStore((s) => s.locale)
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(locale, key, vars)
  return { t, locale, intlLocale: INTL_LOCALE[locale] }
}
