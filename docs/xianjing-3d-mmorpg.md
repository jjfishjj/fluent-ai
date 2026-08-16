# 仙境奇俠傳 3D — 架構說明文件

> 一個仿《仙境傳說》風格的 3D 動作 MMORPG，內建於本專案的 `/xianjing` 路由。
> 使用 three.js 即時渲染，所有場景、角色、怪物皆為程式產生（不需外部 3D 模型檔）。
> 修改玩法時請同步更新本檔。

---

## 一、系統總覽

```
CharacterCreate（選職業）
     ↓
World（純 TypeScript 模擬）  ←─ 存檔 localStorage
     ↓ 每幀讀取
GameRenderer（three.js 場景）      HUD（React + Tailwind）
     ↓                                  ↓
CompanionDirector（其他玩家：模擬 bot 或 Supabase Realtime）
```

核心設計原則：**模擬與渲染完全分離**。
`src/game/core` 與 `src/game/data` 是純 TypeScript，不 import three.js 或 React，
因此可以用固定亂數種子在 vitest 中無頭跑完整戰鬥流程（見 `world.test.ts`，共 47 個測試）。

---

## 二、檔案結構

| 路徑 | 職責 |
| --- | --- |
| `src/game/core/types.ts` | 全部領域型別（實體、技能、任務、HUD 快照…） |
| `src/game/core/rng.ts` | 可重現亂數（mulberry32）＋ 地形用的 value noise / fbm |
| `src/game/core/formulas.ts` | 傷害、命中、爆擊、屬性相剋、經驗曲線 |
| `src/game/core/terrain.ts` | 地形高度函式與場景物件散佈（渲染與碰撞共用同一份資料） |
| `src/game/core/world.ts` | **模擬主體**：AI、仇恨、戰鬥、掉寶、重生、任務、傳送 |
| `src/game/core/save.ts` | localStorage 存讀檔（含舊存檔補欄位） |
| `src/game/data/*` | 職業、技能、怪物、道具、地圖、任務資料表 |
| `src/game/render/scenery.ts` | 地形網格、水面、天空、樹木/岩石/草（InstancedMesh）、村莊、傳送門 |
| `src/game/render/actors.ts` | 以基本幾何體組裝角色/怪物骨架 + 走路與揮擊動畫 |
| `src/game/render/effects.ts` | 傷害數字、技能特效、名條血條、目標環 |
| `src/game/render/GameRenderer.ts` | 場景管理、攝影機、滑鼠拾取、每幀同步 World → 3D |
| `src/game/net/companions.ts` | 其他玩家：模擬 bot／Supabase Realtime 同步 |
| `src/components/game/*` | HUD、小地圖、聊天、角色面板、NPC 與商店對話框 |
| `src/pages/XianjingWorld.tsx` | 頁面：建角 → 遊戲 |

---

## 三、四大職業

| 職業 | 定位 | 技能（Lv.1 / 5–6 / 9–12 / 18–20） |
| --- | --- | --- |
| 劍俠 | 近戰高血 | 斷嶽斬、旋風掃、金剛護體、蛟龍突 |
| 符籙師 | 遠程法系爆發 | 烈焰符、天雷陣、寒冰封、隕星訣 |
| 御風獵手 | 遠程物理 / 高機動 | 雙月箭、踏風訣、箭雨、穿雲一箭 |
| 丹霞醫者 | 自補續戰 | 淨光咒、回春術、丹霞祝福、淨土結界 |

每個技能最高 5 級，每升一級威力 +18%、耗靈 +12%。
升級每級給 3 點屬性點、1 點技能點；屬性每滿 10 點漲一次加點成本。

---

## 四、戰鬥公式

```
物攻 ATK  = STR×2 + DEX×0.6 + Lv×0.9 + 裝備
法攻 MATK = INT×2.2 + Lv×0.8 + 裝備
防禦 DEF  = VIT×0.7 + Lv×0.3 + 裝備
命中 HIT  = 80 + DEX×1.2 + Lv×0.8
迴避 FLEE = 60 + AGI×1.3 + Lv×0.8
爆擊率    = 3 + LUK×0.35（上限 60%）
攻速      = 職業基礎 + AGI×0.018（上限 3.2 次/秒）

命中率 = clamp(0.8 + (HIT − FLEE)/200, 5%, 100%)
減傷   = 1 − DEF/(DEF+120)      ← 遞減但永不歸零
傷害   = ATK × 威力% × 隨機(0.9~1.1) × 屬性倍率 × 減傷 × (爆擊 ? 1.6 : 1)
```

爆擊**無視迴避**（與原作一致），且只吃一半防禦。傷害最低為 1。

屬性相剋：火剋地、水剋火、風剋水、地剋風、聖⇄暗互剋 1.75 倍。

經驗曲線：`expToNext(Lv) = 28×Lv^1.75 + 22×Lv + 30`，上限 60 級。
等級高於怪物 5 級以上開始遞減經驗，最低保留 10%。

---

## 五、地圖與怪物

| 地圖 | 等級 | 怪物 | 備註 |
| --- | --- | --- | --- |
| 青雲村 | — | 無 | 安全區、商店、治療、任務起點 |
| 迷霧竹林 | 1–12 | 靈芝精、竹靈鼠、霧狐 | 靈芝精為被動怪 |
| 赤炎峽谷 | 12–22 | 赤焰狼、炎魈 | 需 Lv.10 進入 |
| 幽冥洞窟 | 22+ | 幽魂、玉靈傀儡、**千年樹妖王** | 需 Lv.20 進入，Boss 重生 90 秒 |

怪物一般重生 14 秒；被拉太遠（22 單位、Boss 34）會脫戰回巢並回血。
掉落物會落地並在走過時自動拾取，45 秒後消失（最後 4 秒閃爍）。

---

## 六、操作

| 操作 | 說明 |
| --- | --- |
| 左鍵點地面 | 移動（點擊標記會顯示落點） |
| 左鍵點怪物 | 選取目標，進入攻擊距離後自動攻擊 |
| 左鍵點 NPC | 靠近則對話，太遠則走過去 |
| 右鍵拖曳 / 滾輪 | 旋轉視角 / 縮放 |
| WASD | 依攝影機方向移動 |
| 1–4 | 施放技能（範圍技以滑鼠所指地面為中心） |
| R / T | 使用第 1、2 個消耗品 |
| Tab | 切換最近的目標 |
| F | 與附近 NPC 對話 |
| C | 開／關角色面板 |
| Enter | 聚焦聊天輸入框 |

---

## 七、多人（MMO）層

`CompanionDirector` 有兩種模式，會自動選擇：

1. **連線模式** — 當 `VITE_SUPABASE_URL` 有設定時，會訂閱 `xianjing:<地圖>` 頻道，
   以 broadcast 每 0.2 秒同步座標與朝向、presence 維護名單、聊天走同一頻道。
   12 秒沒有訊號的玩家會被移除。
2. **模擬模式** — 沒有 Supabase 或訂閱失敗（逾時 6 秒）時，改用 4–6 個 AI 假玩家，
   會在地圖上遊走並偶爾在世界頻道發言，讓場景不至於空蕩。

切換地圖時會重新連線到該地圖的頻道。

---

## 八、效能注意事項

- three.js 以 `React.lazy` 動態載入，不影響主 bundle（遊戲 chunk 約 609 KB / gzip 165 KB）。
- 樹、岩石、草使用 `InstancedMesh`，一張地圖最多 3 個 draw call 處理數百棵植被。
- 傷害數字的字型貼圖以文字內容快取（上限 400 張），重複數字不會重新產生 canvas。
- HUD 每 100ms 才更新一次 React state；小地圖用自己的 15fps 迴圈直接讀 world，
  避免每幀觸發整棵 HUD 重新 render。
- `world.tick(dt)` 會把 dt 夾在 0.1 秒內，分頁切回來不會瞬移。

---

## 九、測試

```bash
npm test          # 全部（含 47 個遊戲測試）
npx vitest run src/game
```

覆蓋範圍：傷害/命中/爆擊/屬性公式、經驗與升級、加點與技能學習、
自動攻擊與擊殺、怪物重生、技能（單體/範圍/治療/增益）、
背包與裝備、商店買賣、掉落拾取、任務（擊殺/收集）流程、地圖傳送與等級門檻、HUD 快照。

---

## 十、資料來源

- 模擬：`src/game/core/world.ts`
- 公式：`src/game/core/formulas.ts`
- 內容：`src/game/data/{classes,skills,monsters,items,zones,quests}.ts`
