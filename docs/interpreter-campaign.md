# 通譯官 — fluent-ai 遊戲化模式

> 走訪各國、化解溝通障礙的 3D MMORPG，路由 `/interpreter`。
> 與 `/xianjing`（仙境奇俠傳）共用同一套引擎，差別在內容包與戰鬥模式。
> 修改玩法時請同步更新本檔。

---

## 一、為什麼這不只是換皮

三件事讓它成為 fluent-ai 的模式，而不是一款剛好放在這裡的遊戲：

1. **職業＝你的記憶天才型態。** 遊戲不讓你選職業，直接讀 `loadGeniusType()` 的測驗結果。
   八種型態對應八種職業，技法順序各不相同。
2. **彈藥＝你的記憶卡。** 戰鬥題目優先取自你自己的 SRS 卡片。
3. **答題會真的寫回排程。** 答對＝`good`、答錯＝`again`，經由 `reviewCard()` 推進 FSRS。
   **打這場就是在複習**，不是包了糖衣的問答。

---

## 二、引擎共用方式

`World` 不再直接 import 任何內容表，改成注入 `ContentPack`：

```
ContentPack { classes, skills, monsters, items, zones, quests, start, currency, shop, turnBased }
        ↓                                    ↓
XIANXIA_PACK（即時戰鬥）          INTERPRETER_PACK（turnBased）
        ↓                                    ↓
        └──────────  同一個 World / GameRenderer / GameShell  ──────────┘
```

`turnBased` 是唯一的行為開關：設了之後，走近敵人不再自動攻擊，而是凍結即時模擬、
開啟問答交換。存檔也依 pack id 分開（`game.save.v1.<packId>`）。

---

## 三、戰鬥＝回合制問答

| 檔案 | 職責 |
| --- | --- |
| `src/game/core/encounter.ts` | 純邏輯：傷害結算、技法效果、選項洗牌 |
| `src/game/core/world.ts` | `startEncounter` / `answerEncounter` / `nextQuestion` / `useAid` / `fleeEncounter` |
| `src/components/game/EncounterPanel.tsx` | 疊在 3D 場景上的問答介面 |

流程：

```
走近障礙 → startEncounter（即時世界凍結）
   ↓
答對 → 對障礙造成傷害；答錯 → 自己受到反噬
   ↓
連續答對累積氣勢（傷害 ×1.0→×2.2 上限）
6 秒內作答另有 ×1.25 速度加成
   ↓
障礙歸零 → win（給經驗與掉落）／自己歸零 → lose
```

傷害公式：`power × 氣勢 × 速度加成 × (技法加倍 ? 2 : 1)`，
其中 `power = MATK + ATK×0.35`。反噬走與其他地方相同的防禦遞減曲線。

---

## 四、記憶技法（技能）

技能不造成傷害，而是改變眼前的題目。四種效果：

| 效果 | 作用 |
| --- | --- |
| `eliminate` | 刪去多數錯誤選項（保留正解與一個干擾項） |
| `hint` | 顯示提示（你的卡片編碼，或內建詞庫的線索） |
| `amplify` | 下一次答對傷害加倍 |
| `shield` | 擋下一次答錯的反噬 |
| `skip` | 跳過這題（僅表演者的「即興應對」） |

八種型態學到的效果相同，但**順序不同**，所以前期手感差異明顯：
建築師先拿到刪選項、敘事者先拿到傷害加倍、分析師先拿到擋反噬。

---

## 五、題目從哪來

```
你的 SRS 卡片（prioritiseCards：到期的排前面）
        ↓ 不足時往下補
內建外交英語詞庫 STARTER_DECK_EN（48 條，依等級開放 tier 1–3）
        ↓
buildQuestions() → 四選一，干擾項取自同一題庫
        ↓
makeCyclingSource() → 滾動供題，每場不會從同一個字開頭
```

**為什麼一定要內建詞庫**：公開 demo 沒有登入，多數訪客的卡片數是 0。
沒有這個 fallback，遊戲會沒有彈藥而根本開不起來。

自己的卡片問「中→英」（recall，較難也較有價值）；內建詞庫兩個方向交替。

---

## 六、內容

| 地圖 | 內容 |
| --- | --- |
| 通譯學院 | 安全區。林教授（任務）、補給官、隨隊醫師 |
| 倫敦會場 | 六種溝通障礙 + 英國代表 Sir Whitmore（Lv.20 首領） |

障礙不是怪物，是口譯真正會遇到的東西：含糊音團、假朋友、口音之霧、
長句奔流、敬語迷宮、慣用語荊棘。

主線四段：第一次上場 → 會前準備 → 驅散口音之霧 → 面見英國代表，
通關取得「英語通譯認證」。

---

## 七、目前的邊界

這是垂直切片，刻意只做到能驗證玩法為止：

- **只有英語一國**。`LANGUAGES` 有 17 種語言、`STARTER_DECKS` 已經是以語言為 key 的表，
  要加國家就是加一份詞庫 + 一張地圖。
- **題目全部來自內建詞庫或 SRS 卡**，沒有接 AI 生成（公開 demo 的 API 成本考量）。
- **首領沒有專屬機制**，目前是血量較高的同一套問答。
- **沒有組隊共鬥**，其他玩家仍是裝飾。

---

## 八、測試

```bash
npx vitest run src/game
```

`encounter.test.ts`（13）純傷害／技法邏輯、
`world-encounter.test.ts`（19）整條遭遇迴圈與「仙境不受影響」的回歸、
`srs-deck.test.ts`（13）題庫組裝與供題。

---

## 九、資料來源

- 內容包：`src/game/data/interpreter/`
- 遭遇邏輯：`src/game/core/encounter.ts`、`src/game/core/world.ts`
- 學習資料橋接：`src/game/bridge/`
