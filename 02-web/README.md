# AgentsHub — Web

AgentsHub 的 Next.js 應用主程式。完整介紹、功能與部署請見 [根目錄 README](../README.md)。

## 快速開始

```bash
npm install
cp .env.example .env.local   # 填入環境變數（見根 README）
npx drizzle-kit push         # 首次或 schema 變更時建表
npm run dev                  # http://localhost:3000
```

## 指令

| 指令 | 說明 |
|---|---|
| `npm run dev` | 開發伺服器（Turbopack） |
| `npm run build` | 正式建置 |
| `npm run start` | 啟動正式建置 |
| `npm run lint` | ESLint |

## 結構速覽

```
src/
├─ app/          App Router 頁面 + API routes（/api/*）
├─ components/   UI 元件
├─ lib/          store（zustand）、db（drizzle schema）、types、proxy helper
└─ proxy.ts      middleware：登入驗證
```

> ⚠️ 本專案使用較新版 Next.js，改動 Next 相關程式前先讀 `node_modules/next/dist/docs/`。
