# quizzes — 獨立記憶天賦測驗

兩個零依賴、自包含的單檔測驗，加一個入口頁。單一來源放在此 `quizzes/` 資料夾，
同時由 **Vercel**（現有部署，免設定）與 **GitHub Pages**（需一次性開關）發佈。

```
quizzes/
  index.html              入口頁（連到兩個測驗）
  memory-quiz/            記憶語言天賦測驗（8 種記憶天份 × 5 大指標）
  memory-genius-quiz/     記憶天才測定（8 類型 × VARK × 腦波 · 兩軸 28 題）
```

兩個測驗都內建 **Brain Lab 校準**（反應力 + 記憶廣度小測驗），並支援
`?rt=<毫秒>&acc=<0..1 或 0..100>` 深度連結，讓 App 帶入真實腦力訓練數據。

## 部署

### A. Vercel（自動，免設定）
`vercel.json` 的 `buildCommand` 會在 `vite build` 後執行
`node scripts/copy-quizzes.mjs`，把本資料夾複製到 `dist/quizzes/`，
並設定路由讓 `/quizzes/...` 走靜態檔、不被 App 的 SPA 改寫吃掉。
推送後即可在現有網域使用：

```
https://<your-app>.vercel.app/quizzes/
https://<your-app>.vercel.app/quizzes/memory-quiz/
https://<your-app>.vercel.app/quizzes/memory-genius-quiz/
```

### B. GitHub Pages（需一次性開關）
`.github/workflows/deploy-quizzes.yml` 會自動組裝並發佈。**一次性設定**：
Repo → Settings → Pages → Source 選「GitHub Actions」（Actions token 無權自動開啟）。
之後每次推送自動部署：

```
https://<user>.github.io/<repo>/
https://<user>.github.io/<repo>/memory-quiz/
https://<user>.github.io/<repo>/memory-genius-quiz/
```

> 入口頁用相對子路徑連結，兩個平台的掛載點不同也都正確。
