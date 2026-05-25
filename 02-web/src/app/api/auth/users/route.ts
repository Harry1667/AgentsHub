import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"

// 公開端點：供登入頁顯示頭像牆（不含任何敏感資料）
export async function GET() {
  try {
    const db = getDb()
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatar: users.avatar,
      })
      .from(users)

    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        username: r.username,
        displayName: r.displayName ?? r.username,
        avatar: r.avatar ?? "👤",
      })),
    )
  } catch {
    // DB 尚未初始化或無使用者時，回空陣列讓登入頁 fallback 成手動輸入
    return NextResponse.json([])
  }
}
