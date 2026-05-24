# Agent 平台需求文件

## 產品定位

個人用 AI 助手平台 — 讓使用者可以建立、自訂多個有個性的 AI Agent，切換對話，管理提示詞，打造專屬 AI 工作流。

---

## 核心功能模組

### 1. Onboarding / 首頁
- Hero 區：標語 + 副標題 + CTA 按鈕
- 三個功能亮點卡片
- Agent 展示預覽圖
- 登入/註冊入口（第一版 mock，不接真實 auth）

### 2. 主介面佈局
```
┌──────────────┬────────────────────────────────┐
│   側邊欄      │         主內容區                │
│  - Logo      │                                │
│  - 對話列表   │   Chat / Agent 設定 / 廣場      │
│  - 新對話     │                                │
│  - 底部設定   │                                │
└──────────────┴────────────────────────────────┘
```

### 3. Chat 對話介面
- 選取 Agent → 開啟對話
- 對話氣泡（user / assistant 分開樣式）
- Markdown 渲染（程式碼高亮、清單、標題）
- 輸入框：多行、Enter 送出、Shift+Enter 換行
- 對話歷史（左側側邊欄顯示標題）
- Mock 回應（模擬打字串流效果）

### 4. Agent 建立 / 編輯
欄位：
- **名稱** — 文字輸入
- **頭像** — emoji picker 或上傳圖片
- **描述** — 一行簡介
- **System Prompt** — 大型文字區塊，支援 Markdown 預覽
- **模型** — 下拉選單（Claude Haiku / Sonnet / Opus、GPT-4o）
- **溫度 Temperature** — 滑桿 0–2
- **最大輸出 tokens** — 數字輸入
- **工具能力** — toggle（網路搜尋、程式碼執行、圖像生成）

### 5. Agent 廣場（Marketplace）
- 卡片式列表，每卡含：頭像、名稱、描述、標籤、使用次數
- 分類過濾：全部 / 寫作 / 程式 / 分析 / 翻譯 / 創意
- 搜尋欄
- 點擊可預覽詳情 → 一鍵加入我的 Agent
- 預設 8-12 個 mock agent

### 6. 設定頁
- API Key 設定（Claude、OpenAI）
- 主題切換（亮/暗）
- 語言（繁中/英文）
- 對話記錄清除

---

## 介面設計規範

### 視覺風格
- 參考 LobeHub：極簡、現代、圓角卡片
- 主色：靛藍 `#6366f1`（Indigo-500）
- 背景：亮色 `#f8f8f8` / 暗色 `#0f0f0f`
- 字型：Inter / system-ui
- 邊框圓角：`rounded-xl`（12px）

### 元件庫
- shadcn/ui（Button、Input、Textarea、Card、Dialog、Select、Slider、Switch、Tabs）
- lucide-react（icon 集）
- Tailwind CSS

### 動畫
- 側邊欄展開/收合：`transition-all 200ms`
- 對話氣泡淡入：`animate-fade-in`
- 打字效果：逐字顯示串流

---

## 頁面路由結構（Next.js App Router）

```
/                    → Onboarding / Landing
/chat                → 主 Chat 介面（預設第一個 Agent）
/chat/[id]           → 特定對話
/agents              → 我的 Agent 列表
/agents/new          → 建立新 Agent
/agents/[id]/edit    → 編輯 Agent
/marketplace         → Agent 廣場
/settings            → 設定
```

---

## Mock 資料

### 預設 Agent 列表
1. **Code Buddy** — 程式助手，debug、解釋、重構
2. **寫作教練** — 文章改寫、潤稿、風格調整
3. **翻譯官** — 中英日韓互譯，保留語氣
4. **資料分析師** — CSV 解讀、圖表建議
5. **頭腦風暴** — 創意發想、idea 展開
6. **Prompt 工程師** — 幫你優化 prompts

### 預設對話 mock
- 每個 Agent 有 2–3 則範例對話
- 助手回應用 setTimeout 模擬串流（30ms/字）

---

## 技術棧

| 層次 | 技術 |
|------|------|
| 框架 | Next.js 14（App Router） |
| 語言 | TypeScript |
| 樣式 | Tailwind CSS v3 |
| 元件 | shadcn/ui |
| 狀態 | Zustand |
| 圖示 | lucide-react |
| AI（未來）| Anthropic SDK / OpenAI SDK |
| 串流 | Vercel AI SDK（`useChat`） |

---

## 開發順序

1. `[x]` 需求文件
2. `[ ]` 初始化 Next.js 專案 + 安裝依賴
3. `[ ]` 全域佈局（Sidebar + 路由）
4. `[ ]` Landing / Onboarding 頁
5. `[ ]` Agent 廣場（Marketplace）
6. `[ ]` Chat 介面（含 mock 串流）
7. `[ ]` Agent 建立/編輯表單
8. `[ ]` 設定頁
9. `[ ]` 暗色主題切換
10. `[ ]` 接入真實 API（下一階段）
