# AgentsHub

> 個人 AI 助手平台 — 建立、自訂多個有個性的 AI Agent，用「對話 / 會議 / 像素辦公室」三種方式跟它們協作。

線上站點：**https://agentshub.looptw.com**（需登入）

---

## ✨ 功能總覽

### Agent
- **自訂 Agent**：名稱、emoji 頭像、簡介、System Prompt、模型、溫度、最大輸出、標籤、釘選、工位顏色
- **三種建立方式**
  - 🪄 **AI 建構師**：用白話跟建構師聊需求 → 自動整理成草稿 → 一鍵建立或進階編輯
  - 📋 **從範本新增**：內建多個預設助手範本
  - ✏️ **手動建立**：完整表單

### 對話
- Markdown 渲染（程式碼框一鍵複製）、串流輸出、多輪記憶
- **段落重寫**（選段 + 指示 + 新舊對照）、訊息書籤、一鍵複製、匯出 `.md`
- 對話內臨時切換**模型 / 溫度**
- **檔案上傳**：文字檔 / PDF 抽文，圖片走 vision

### 多人會議
- 把多個 Agent 拉進同一場對話，用 `@名稱` 點名發言，產出完整逐字稿

### 像素辦公室 🏢
- 走動小人、狀態可視化（工作中 / 活躍 / 閒置 / 新同事）
- **拖拉小人進會議室地毯**組會議
- 牆上「徵人」板 → 進 AI 建構師
- 活潑行為：喝咖啡、聽音樂、鄰座聊天等隨機氣泡

### 帳號 / 系統
- 頭像式登入、邀請碼註冊、Admin 用戶管理、Session 驗證
- 深色 / 淺色模式、行動裝置 RWD、首次登入互動式導覽

---

## 🧱 技術棧

| 層 | 技術 |
|---|---|
| 框架 | Next.js 16（App Router, Turbopack）、React 19、TypeScript |
| 樣式 | Tailwind CSS v4、shadcn/ui（base-ui）、lucide 圖示 |
| 狀態 | Zustand（含 localStorage 持久化） |
| 資料庫 | MySQL，透過 Drizzle ORM + `mysql2` |
| 內容 | react-markdown + remark-gfm、pdfjs-dist（PDF 抽文） |
| AI | 透過 Proxy 服務統一存取多供應商（Gemini / OpenAI / Claude），自動回退 |

---

## 📁 專案結構

```
AgentsHub/
├─ 01-dev/             產品與技術文件（PRD、UserFlow、TechStack、log）
├─ 02-web/             Next.js 應用（主程式）
│  ├─ src/app/         App Router 頁面 + API routes（/api/*）
│  ├─ src/components/  UI 元件（chat-interface、office-view、agent-builder…）
│  ├─ src/lib/         store（zustand）、db（schema/drizzle）、types、proxy helper
│  └─ src/proxy.ts     middleware：登入驗證
├─ 03-Skills/          私有 skills（已被 .gitignore 排除）
├─ CLAUDE.md           專案 AI 協作指引
└─ SESSION_NOTES.md    每次開發進度筆記
```

---

## 🚀 本地開發

> 主程式在 `02-web/`，以下指令請在該目錄執行。

### 1. 安裝依賴
```bash
cd 02-web
npm install
```

### 2. 設定環境變數
複製範本並填值（見下方[環境變數](#-環境變數)）：
```bash
cp .env.example .env.local
```

### 3. 連接資料庫
本機透過 SSH tunnel 連正式 MySQL，或自建本地 MySQL，把連線字串填入 `DATABASE_URL`。

首次或 schema 變更時推送資料表：
```bash
npx drizzle-kit push
```

### 4. 啟動
```bash
npm run dev      # http://localhost:3000
```

其他指令：
```bash
npm run build    # 正式建置
npm run start    # 啟動正式建置
npm run lint     # ESLint
```

---

## 🔑 環境變數

於 `02-web/.env.local` 設定（**切勿提交版本控制**）：

| 變數 | 說明 |
|---|---|
| `DATABASE_URL` | MySQL 連線字串 `mysql://user:pass@host:3306/db` |
| `SESSION_SECRET` | Session 加密金鑰（`openssl rand -hex 32`）。**缺此值會導致驗證失效** |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 管理員登入帳密 |
| `REGISTER_CODE` | 註冊邀請碼（留空則關閉註冊） |
| `PROXY_TOKEN` | Proxy AI 服務的存取 token |
| `PROXY_BASE_URL` | Proxy 服務端點 URL |
| `PROXY_PROJECT` | Proxy 專案代號，預設 `agent-hub` |

---

## 📦 部署（Oracle aaPanel + PM2 + Nginx）

正式站部署於 Oracle 伺服器，Nginx 反向代理至 PM2 程序 `agentshub-web`（port `3011`）。

伺服器端流程：
```bash
cd /www/wwwroot/agentshub.looptw.com
sudo git pull origin main
cd 02-web && npm install
sudo rm -rf .next && npm run build       # .next 常有 root 殘檔，先刪
sudo env PATH=$PATH PM2_HOME=/root/.pm2 pm2 restart agentshub-web --update-env
```
> Node/PM2 在 `/www/server/nvm/versions/node/v24.14.1/bin`（需 export 進 PATH）。

---

## 📝 開發慣例

- 程式註解使用**繁體中文**
- 優先 `async/await`，錯誤處理明確、不 silent fail
- ⚠️ 本專案使用較新的 Next.js，API 可能與訓練資料不同 —— 改動 Next 相關程式前，先讀 `02-web/node_modules/next/dist/docs/`

---

## English

> A personal AI-assistant platform. Build and customize multiple AI agents, each with their own personality, and work with them in three modes: chat, multi-agent meetings, and a pixel-art office.

Live at: **https://agentshub.looptw.com** (login required)

### ✨ Features

#### Agents
- **Custom agents**: name, emoji avatar, bio, system prompt, model, temperature, max output, tags, pinning, desk color
- **Three creation flows**
  - 🪄 **AI builder**: describe what you want in plain language → the builder drafts the spec → create or refine
  - 📋 **From template**: built-in library of preset assistants
  - ✏️ **Manual**: the full form

#### Chat
- Markdown rendering (one-click copy on code blocks), streaming, multi-turn memory
- **Paragraph rewrite** (select + instruct + before/after diff), message bookmarks, copy, export to `.md`
- Switch **model / temperature** mid-conversation
- **File upload**: text and PDF parsed as text; images go through vision

#### Multi-agent meetings
- Drop multiple agents into the same conversation, address them with `@name`, get a full transcript

#### Pixel office 🏢
- Walking pixel characters, live status (working / active / idle / new hire)
- **Drag a character onto the meeting-room rug** to start a meeting
- "Hiring" board on the wall → opens the AI builder
- Random life: coffee breaks, music, desk-side small talk

#### Account / system
- Avatar-based login, invite-code registration, admin user management, session validation
- Light / dark mode, mobile-responsive, first-time interactive onboarding

### 🧱 Tech stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui (base-ui), lucide icons |
| State | Zustand (with localStorage persistence) |
| Database | MySQL via Drizzle ORM + `mysql2` |
| Content | react-markdown + remark-gfm, pdfjs-dist (PDF extraction) |
| AI | Unified multi-provider access (Gemini / OpenAI / Claude) via a proxy with auto-fallback |

### 📁 Project structure

```
AgentsHub/
├─ 01-dev/             Product and tech docs (PRD, UserFlow, TechStack, log)
├─ 02-web/             Next.js app (main)
│  ├─ src/app/         App Router pages + API routes (/api/*)
│  ├─ src/components/  UI (chat-interface, office-view, agent-builder…)
│  ├─ src/lib/         Zustand store, Drizzle schema, types, proxy helper
│  └─ src/proxy.ts     middleware: auth
├─ 03-Skills/          Private skills (gitignored)
├─ CLAUDE.md           AI collaboration guide
└─ SESSION_NOTES.md    Per-session dev notes
```

### 🚀 Local dev

> The app lives in `02-web/` — run all commands from there.

#### 1. Install
```bash
cd 02-web
npm install
```

#### 2. Env vars
```bash
cp .env.example .env.local
```

#### 3. Connect the database
Either SSH-tunnel into the production MySQL or run a local MySQL, then put the connection string into `DATABASE_URL`.

Push tables on first run or after schema changes:
```bash
npx drizzle-kit push
```

#### 4. Run
```bash
npm run dev      # http://localhost:3000
```

Other commands:
```bash
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint
```

### 🔑 Env vars

In `02-web/.env.local` (**do not commit**):

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | MySQL DSN `mysql://user:pass@host:3306/db` |
| `SESSION_SECRET` | Session encryption key (`openssl rand -hex 32`). **Missing this breaks auth.** |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin credentials |
| `REGISTER_CODE` | Invite code for registration (empty = registration disabled) |
| `PROXY_TOKEN` | Proxy AI service token |
| `PROXY_BASE_URL` | Proxy service endpoint URL |
| `PROXY_PROJECT` | Proxy project code, default `agent-hub` |

### 📦 Deploy (Oracle aaPanel + PM2 + Nginx)

Production runs on an Oracle host; Nginx reverse-proxies to a PM2 process `agentshub-web` on port `3011`.

```bash
cd /www/wwwroot/agentshub.looptw.com
sudo git pull origin main
cd 02-web && npm install
sudo rm -rf .next && npm run build       # .next often has root-owned leftovers, wipe first
sudo env PATH=$PATH PM2_HOME=/root/.pm2 pm2 restart agentshub-web --update-env
```
> Node/PM2 lives at `/www/server/nvm/versions/node/v24.14.1/bin` (must be on PATH).

### 📝 Conventions

- Code comments in **Traditional Chinese**
- Prefer `async/await`; explicit error handling, no silent failures
- ⚠️ This project uses a newer Next.js whose API may differ from training data — read `02-web/node_modules/next/dist/docs/` before touching Next-related code
