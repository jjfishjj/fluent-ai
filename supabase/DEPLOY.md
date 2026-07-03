# 部署 Supabase Edge Functions

App 的 AI 對話走 Supabase Edge Function `supabase/functions/chat`。
**Vercel 不會部署它**——每次改動 `supabase/functions/**` 都要用 Supabase CLI 手動部署。

> 例：機器人「依記憶天才型態調整教學」的邏輯就在 `chat/index.ts`。改完 code、合併到
> `main` 之後，還要跑一次下面的部署，機器人端才會生效。前端（推薦課題、情境排序、
> 對話 chip/提示、記憶卡 SRS）不靠這步，隨 Vercel 自動上線。

---

## 前置：確認要部署到哪個專案

以 **production 實際使用的** Supabase 為準——去
**Vercel → 專案 → Settings → Environment Variables → `VITE_SUPABASE_URL`**：

```
https://<PROJECT_REF>.supabase.co
```

`<PROJECT_REF>` 就是要部署的目標。

> ⚠️ 注意：本 repo 的 `supabase/config.toml` 的 `project_id` 與 `.env` 的
> `VITE_SUPABASE_URL` **可能不一致**。一律以 Vercel 的 `VITE_SUPABASE_URL` 為準，
> 否則會部署到錯的專案，App 仍呼叫到舊版 function。

---

## 步驟（在 repo 根目錄執行）

不需要先安裝 CLI，直接用 `npx`（需要 Node）：

```bash
# 0. 進到 repo 根目錄（旁邊要有 supabase/ 資料夾）
cd /path/to/fluent-ai
ls supabase/functions/chat        # 應看到 index.ts

# 1. 登入（會開瀏覽器授權）
npx supabase login

# 2. 連到 production 專案（PROJECT_REF 來自上面的 VITE_SUPABASE_URL）
npx supabase link --project-ref <PROJECT_REF>

# 3. 部署 chat function
npx supabase functions deploy chat
```

想正式安裝 CLI（之後省略 `npx`）：

```bash
brew install supabase/tap/supabase      # macOS
# 其他系統見 https://supabase.com/docs/guides/cli
```

也可以跳過 `link`，直接指定專案部署：

```bash
npx supabase functions deploy chat --project-ref <PROJECT_REF>
```

---

## 密鑰（Secrets）

`chat` function 需要 `LOVABLE_API_KEY` 才能呼叫 AI gateway。
**通常不用重設**——只要機器人本來就會回話，代表密鑰已存在。確認：

```bash
npx supabase secrets list                       # 應看到 LOVABLE_API_KEY
# 若沒有：
npx supabase secrets set LOVABLE_API_KEY=<你的key>
```

---

## 驗證

1. 終端機出現 `Deployed Function chat` 成功訊息。
2. 先到 `/quizzes/memory-genius-quiz/` 測一次記憶天才型態。
3. 到 `/practice?lang=english` 開始英文對話 → 機器人的教法會依型態不同
   （探索者→情境角色扮演、分析師→講規則與「為什麼」、旋律人→強調發音節奏…）。

## 常見卡點

- `login` 沒開瀏覽器 → 手動複製終端機顯示的網址開啟。
- `link` 要求 DB 密碼 → 部署 function 用不到，可直接 Enter 跳過。
- deploy 說找不到 function → 確認在 repo 根目錄執行（`supabase/` 要在旁邊）。
- 部署成功但 App 沒變 → 多半是 link 到錯的 `PROJECT_REF`；核對 Vercel 的 `VITE_SUPABASE_URL`。
