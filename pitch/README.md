# Fluent AI × Brain Lab — Pitch Deck

從投影片（`記憶天才量表 Pitch Deck`）用 code 實現的網頁版投資簡報。
零依賴、自包含的單檔（`index.html`），12 張投影片。

## 內容（12 張）

1. 封面 — 記憶天才量表 Memory Talent System
2. The Problem — 三大致命缺陷
3. Our Solution — 一套系統解決三個問題（4 支柱）
4. 五層產品架構（①→⑤ + BINA 貫穿）
5. 八種記憶天才類型（θ/β/α/γ × VARK）
6. Brain Lab 技術架構（三路徑 × 四分頁）
7. BINA ACOUSY 硬體合作（五步串接 + 四種模式）
8. Market Opportunity（三市場交叉點 + 為何現在）
9. 五大收益模式（C/B/G 端）
10. 競品分析（對照表）
11. Go-to-Market 三階段路線圖
12. The Ask（策略合作 / 種子輪 / Beta）

## 操作

- `←` / `→`（或空白鍵、上下鍵）翻頁，`Home` / `End` 跳首尾
- `F` 全螢幕
- 底部圓點可點選跳頁；手機可左右滑動
- 網址 `#3` 之類的 hash 可深度連結到指定頁

## 部署

與 quizzes 共用同一套管線（詳見 `quizzes/README.md`）：

- **Vercel（自動）**：`vercel.json` 的 `buildCommand` 會把本頁複製到 `dist/pitch/`，
  網址 `https://<app>.vercel.app/pitch/`
- **GitHub Pages**：`.github/workflows/deploy-quizzes.yml` 一併發佈，
  網址 `https://<user>.github.io/<repo>/pitch/`（需一次性開啟 Pages）
