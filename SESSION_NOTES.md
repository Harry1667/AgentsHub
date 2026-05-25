# SESSION NOTES — AgentsHub

## 2026-05-26

### 完成事項（本輪大改）
- **環境**：clone repo、建 `02-web/.env.local`、SSH tunnel 連正式 MySQL（127.0.0.1:3306）
- **登入**：Mac 風格頭像登入；users 表加 `display_name`/`avatar`；公開 `/api/auth/users`
- **多 agent 會議**：conversations 加 `participant_ids`、messages 加 `agent_id`；@點名發言、完整逐字稿、會議室卡片
- **頁面命名/主從**：`PageHeader` 元件（瀏覽器標題 + 麵包屑），主頁/從頁分層
- **對話自選模型/溫度**：`/api/chat` 透傳 `model`/`temperature`（stream+rest 兩條上游）；輸入區下拉+滑桿；選具體 model pin provider
- **段落重寫**：選段重寫 + 指示 + 舊/新對照預覽 + 可中止
- **單人對話多輪記憶**（送完整逐字稿）；**行動裝置 RWD**（側邊欄抽屜）
- **設定**：對話預設模型；**provider/model 改存 message metadata**（`actual_provider`/`actual_model`，消除 _via_ 後綴衝突）
- **像素辦公室**（office view）：pixel-agents(MIT) 素材、走動小人、**狀態可視化**(工作/活躍/閒置)、**拖拉組會議**
- **流程重設計**：側邊欄常駐跨 agent「最近對話」、點 agent 直接進最近對話（移除中間 dialog）、Agent 廣場併入「我的 Agent → 從範本新增」
- **檔案上傳**：文字檔/PDF 抽文 + **圖片 vision**（`images:[{mime_type,data}]`，gemini/openai 可、claude 多模態暫不穩）
- **邀請碼註冊**：`/api/auth/register` + `REGISTER_CODE`；登入頁「新增用戶」
- **互動式新手導覽**：首次登入 coach-mark
- **部署**：全部 commit 已 push GitHub + 部署 aaPanel(3011) 上線 `https://agentshub.looptw.com`；清掉多餘 ubuntu pm2(3100)
- **安全修補**：prod 原本缺 `SESSION_SECRET`（proxy 放行=驗證沒生效），已補 SESSION_SECRET + ADMIN 帳密，**現在強制登入**

### 未完成 / 已知問題
- claude 多模態目前不穩 → 含圖片自動走 gemini/openai
- 圖片僅當回合送出（base64 不持久化，多輪不重送）
- PDF worker 走 unpkg CDN（離線環境需注意）
- 新手導覽手機版：側邊欄步驟因抽屜隱藏會置中顯示
- REST proxy 對檔案僅能「抽文字併入 prompt」（非檔案理解）

### 下次起點（可選方向）
- 會議「實況」：開會時小人聚到會議桌、輪流冒發言氣泡
- 點小人快捷環選單 / 辦公室儀表板
- 對話搜尋、訊息匯出強化
- 若要真檔案理解或穩定 vision：評估接 gRPC SDK 或請 proxy 端開通

### 關鍵資訊
- 邀請碼 / admin 帳密：見本機與伺服器 `02-web/.env.local`（勿寫入版本控制）
- 部署見記憶 [[deploy-aapanel-procedure]]；proxy 圖片格式見 [[proxy-rest-image-contract]]
