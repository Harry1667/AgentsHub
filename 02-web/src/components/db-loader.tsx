"use client"

import { useEffect } from "react"
import { useAppStore } from "@/lib/store"

export function DbLoader() {
  const { isLoaded, loadFromDb } = useAppStore()
  useEffect(() => {
    if (!isLoaded) loadFromDb()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
