import { MGQuestion } from './types';

export const QUESTIONS: MGQuestion[] = [
  // ── X 軸：記憶觸發方式（感官 S ↔ 抽象 Ab）Q1–10 ─────────────────────
  {
    id: 1, group: 'X',
    text: '你學了一個新詞「憂鬱」(melancholy)。一個月後，什麼最容易讓你想起它？',
    options: [
      { label: 'A', text: '第一次聽到它時的聲音和語氣', score: { s: 1 } },
      { label: 'B', text: '你在哪裡、當時發生了什麼', score: { s: 1 } },
      { label: 'C', text: '這個字的構詞邏輯或與其他詞的關係', score: { ab: 1 } },
    ],
  },
  {
    id: 2, group: 'X',
    text: '朋友向你解釋一個複雜概念，你最想問哪個問題？',
    options: [
      { label: 'A', text: '「可以舉個生活中的具體例子嗎？」', score: { s: 1 } },
      { label: 'B', text: '「這和我知道的某件事有什麼相似之處？」', score: { ab: 1 } },
      { label: 'C', text: '「它背後的原理是什麼？為什麼這樣運作？」', score: { ab: 1 } },
    ],
  },
  {
    id: 3, group: 'X',
    text: '你需要記住一段重要演講的重點，你會怎麼做？',
    options: [
      { label: 'A', text: '大聲複述，用自己的語氣說一遍', score: { s: 1, a: 1 } },
      { label: 'B', text: '聯想到你親身經歷的相關故事', score: { s: 1, k: 1 } },
      { label: 'C', text: '整理成邏輯框架或大綱', score: { ab: 1, r: 1 } },
    ],
  },
  {
    id: 4, group: 'X',
    text: '在語言課上，哪個環節讓你進步最明顯？',
    options: [
      { label: 'A', text: '角色扮演和情境模擬對話', score: { s: 1, k: 1 } },
      { label: 'B', text: '反覆聆聽原版音頻，感受語調語感', score: { s: 1, a: 1 } },
      { label: 'C', text: '研究文法規則和詞根詞彙結構', score: { ab: 1, r: 1 } },
    ],
  },
  {
    id: 5, group: 'X',
    text: '你在閱讀時，說「我真的理解這段了」是因為？',
    options: [
      { label: 'A', text: '腦中出現了清晰的場景和畫面', score: { s: 1, v: 1 } },
      { label: 'B', text: '感受到了和作者類似的情緒', score: { s: 1, na: 1 } },
      { label: 'C', text: '能用一句話概括這段的核心論點', score: { ab: 1, an: 1 } },
    ],
  },
  {
    id: 6, group: 'X',
    text: '你要在一個派對上記住十個新朋友的名字，你最常用的方法是？',
    options: [
      { label: 'A', text: '重複發音，感受每個名字的聲音節奏', score: { s: 1, a: 1 } },
      { label: 'B', text: '把名字和他們的外貌或特徵連在一起', score: { s: 1, v: 1 } },
      { label: 'C', text: '聯想名字的意思或按某種邏輯分類', score: { ab: 1 } },
    ],
  },
  {
    id: 7, group: 'X',
    text: '你在學一首外語歌，你最先記住的通常是？',
    options: [
      { label: 'A', text: '旋律和聲音，歌詞之後自然浮現', score: { s: 1, a: 1 } },
      { label: 'B', text: '某個讓你有感覺的片段，從那裡延伸', score: { s: 1, na: 1 } },
      { label: 'C', text: '先把歌詞翻譯理解，再去背誦', score: { ab: 1, r: 1 } },
    ],
  },
  {
    id: 8, group: 'X',
    text: '在陌生城市，什麼幫你最快記住路線？',
    options: [
      { label: 'A', text: '走過去的身體感覺，走一次就記住了', score: { s: 1, k: 1 } },
      { label: 'B', text: '特定的地標景色或某個氣味', score: { s: 1 } },
      { label: 'C', text: '地圖的方向感和距離邏輯', score: { ab: 1, v: 1 } },
    ],
  },
  {
    id: 9, group: 'X',
    text: '你有「啊哈！」頓悟的感覺，通常是因為？',
    options: [
      { label: 'A', text: '你親自嘗試或體驗後突然明白了', score: { s: 1, k: 1 } },
      { label: 'B', text: '有人用生動比喻讓你突然理解了', score: { s: 1, na: 1 } },
      { label: 'C', text: '你把新知識放進已有框架，看到了連結', score: { ab: 1, cn: 1 } },
    ],
  },
  {
    id: 10, group: 'X',
    text: '語言考試前，你最有信心的部分通常是？',
    options: [
      { label: 'A', text: '聽力和口說，因為你能感受語感', score: { s: 1, a: 1 } },
      { label: 'B', text: '情境題，因為可以想像自己在那個場景', score: { s: 1, k: 1 } },
      { label: 'C', text: '語法分析和閱讀理解，因為邏輯清晰', score: { ab: 1, r: 1 } },
    ],
  },

  // ── Y 軸：學習節奏（深度沉浸 D ↔ 即時反應 Im）Q11–20 ─────────────────
  {
    id: 11, group: 'Y',
    text: '開始學一個新語言時，你最自然的方式是？',
    options: [
      { label: 'A', text: '大量沉浸——每天聽讀看，先感受再開口', score: { d: 1 } },
      { label: 'B', text: '有計劃地穩定輸入，慢慢建立紮實基礎', score: { d: 1 } },
      { label: 'C', text: '馬上開口說，從錯誤中快速學習', score: { im: 1 } },
    ],
  },
  {
    id: 12, group: 'Y',
    text: '對話練習時，你覺得最有效的反饋時機是？',
    options: [
      { label: 'A', text: '讓我說完整個想法，事後再統一糾正', score: { d: 1 } },
      { label: 'B', text: '如果有嚴重錯誤，可以隨時打斷我', score: { im: 1 } },
      { label: 'C', text: '每說完一句就給反饋，馬上修正', score: { im: 1 } },
    ],
  },
  {
    id: 13, group: 'Y',
    text: '學完一批新詞彙後，你的下一步是？',
    options: [
      { label: 'A', text: '繼續深入這個主題，擴展相關詞彙和語境', score: { d: 1 } },
      { label: 'B', text: '等幾天讓它沉澱，再回來複習', score: { d: 1 } },
      { label: 'C', text: '馬上在真實對話中試著用這些詞', score: { im: 1, pf: 1 } },
    ],
  },
  {
    id: 14, group: 'Y',
    text: '你感覺「今天學夠了」是因為？',
    options: [
      { label: 'A', text: '對這個主題有了更深的理解或新的視角', score: { d: 1 } },
      { label: 'B', text: '花了夠多時間，感覺大腦需要休息了', score: { d: 1 } },
      { label: 'C', text: '能夠流暢地輸出並運用今天學到的內容', score: { im: 1, pf: 1 } },
    ],
  },
  {
    id: 15, group: 'Y',
    text: '你偏好的學習素材長度是？',
    options: [
      { label: 'A', text: '長文章、完整電影、深度Podcast，要完整才值得', score: { d: 1 } },
      { label: 'B', text: '中等長度，有頭有尾，剛好', score: { d: 1 } },
      { label: 'C', text: '短片段、flashcard、快速練習，效率最高', score: { im: 1 } },
    ],
  },
  {
    id: 16, group: 'Y',
    text: '你在語言學習上最大的挑戰是？',
    options: [
      { label: 'A', text: '很喜歡學習，但不太敢開口說話', score: { d: 1 } },
      { label: 'B', text: '需要完全理解才肯繼續，進度慢', score: { d: 1, an: 1 } },
      { label: 'C', text: '說了很多，但基礎不夠扎實，錯誤多', score: { im: 1, pf: 1 } },
    ],
  },
  {
    id: 17, group: 'Y',
    text: '你最享受的學習狀態是？',
    options: [
      { label: 'A', text: '完全沉浸在一個主題裡，忘記時間', score: { d: 1 } },
      { label: 'B', text: '有計劃有節奏地穩定前進', score: { d: 1, r: 1 } },
      { label: 'C', text: '快速切換不同類型的練習，保持新鮮感', score: { im: 1 } },
    ],
  },
  {
    id: 18, group: 'Y',
    text: '你要進入學習狀態，通常需要多少暖機時間？',
    options: [
      { label: 'A', text: '15–30 分鐘，需要慢慢進入狀態', score: { d: 1 } },
      { label: 'B', text: '5–10 分鐘', score: { im: 1 } },
      { label: 'C', text: '幾乎立刻，換個話題或形式就馬上投入', score: { im: 1 } },
    ],
  },
  {
    id: 19, group: 'Y',
    text: '你對「反覆練習同一件事」的感受是？',
    options: [
      { label: 'A', text: '喜歡，重複中能發現越來越深的層次', score: { d: 1 } },
      { label: 'B', text: '能接受，但要有些變化才不無聊', score: { d: 1 } },
      { label: 'C', text: '很快就膩了，寧可接觸新內容', score: { im: 1 } },
    ],
  },
  {
    id: 20, group: 'Y',
    text: '你最不喜歡哪種學習情境？',
    options: [
      { label: 'A', text: '被催著快速回答，沒有足夠的思考時間', score: { d: 1 } },
      { label: 'B', text: '學習節奏太慢，感覺在浪費時間', score: { im: 1 } },
      { label: 'C', text: '長時間獨自學習，沒有任何互動或反饋', score: { pf: 1 } },
    ],
  },

  // ── 次要分類：象限內精確定位（K / A / R / V / Cn / Pf / An / Na）Q21–28 ──
  {
    id: 21, group: 'S',
    text: '你學到一個讓你很興奮的新知識，最想怎麼做？',
    options: [
      { label: 'A', text: '繼續探索相關主題，停不下來', score: { k: 1 } },
      { label: 'B', text: '整理成系統，和已知知識整合', score: { r: 1, an: 1 } },
      { label: 'C', text: '立刻告訴別人，分享這份興奮', score: { pf: 1 } },
      { label: 'D', text: '做成視覺筆記或心智圖', score: { v: 1 } },
    ],
  },
  {
    id: 22, group: 'S',
    text: '在陌生環境（如第一次去某國餐廳），你最自然的反應是？',
    options: [
      { label: 'A', text: '直接跳進去試，邊做邊學', score: { k: 1 } },
      { label: 'B', text: '先觀察環境和其他人怎麼做', score: { v: 1 } },
      { label: 'C', text: '問旁邊的人或仔細聽服務生說', score: { a: 1 } },
      { label: 'D', text: '回想之前讀過或學過的相關知識', score: { r: 1 } },
    ],
  },
  {
    id: 23, group: 'S',
    text: '你最擅長的記憶方式是？',
    options: [
      { label: 'A', text: '把事情連結到身體動作或親身情境', score: { k: 1 } },
      { label: 'B', text: '在腦中想像畫面或空間佈局', score: { v: 1 } },
      { label: 'C', text: '用音韻、節奏或反覆聆聽', score: { a: 1 } },
      { label: 'D', text: '寫下來整理，或找邏輯關係', score: { r: 1, an: 1 } },
    ],
  },
  {
    id: 24, group: 'S',
    text: '朋友問你一個複雜問題，你最可能怎麼回答？',
    options: [
      { label: 'A', text: '「讓我用個比喻來說明……」', score: { na: 1 } },
      { label: 'B', text: '「我先列出幾個重點……」', score: { r: 1, an: 1 } },
      { label: 'C', text: '「我親身試過的感受是……」', score: { k: 1 } },
      { label: 'D', text: '「我看過一個圖解說得很清楚……」', score: { v: 1 } },
    ],
  },
  {
    id: 25, group: 'S',
    text: '你最享受哪種語言練習活動？',
    options: [
      { label: 'A', text: '和真人自由對話，說錯沒關係', score: { pf: 1, k: 1 } },
      { label: 'B', text: '看影片或圖片，然後描述你看到的', score: { v: 1 } },
      { label: 'C', text: '聽音樂、Podcast，感受語言節奏', score: { a: 1 } },
      { label: 'D', text: '寫作或做語法練習，梳理邏輯', score: { r: 1, an: 1 } },
    ],
  },
  {
    id: 26, group: 'S',
    text: '需要記住大量資訊時（如考試），你的策略是？',
    options: [
      { label: 'A', text: '把所有東西串成一個大故事', score: { na: 1 } },
      { label: 'B', text: '做心智圖或視覺化筆記', score: { v: 1 } },
      { label: 'C', text: '分類整理，建立清晰框架', score: { r: 1, an: 1 } },
      { label: 'D', text: '主動連結不同領域的知識', score: { cn: 1 } },
    ],
  },
  {
    id: 27, group: 'S',
    text: '和別人合作學習時，你通常是哪個角色？',
    options: [
      { label: 'A', text: '提出新點子和不同視角的人', score: { k: 1 } },
      { label: 'B', text: '把大家的想法整合成系統的人', score: { cn: 1, r: 1 } },
      { label: 'C', text: '帶動氣氛、讓學習變有趣的人', score: { pf: 1 } },
      { label: 'D', text: '確保每個細節都有邏輯支撐的人', score: { an: 1 } },
    ],
  },
  {
    id: 28, group: 'S',
    text: '你語言學習最大的「突破時刻」最接近哪個描述？',
    options: [
      { label: 'A', text: '親身在某個地方使用後，所有東西突然串連起來', score: { k: 1 } },
      { label: 'B', text: '在某首歌或對話中突然感受到語感和節奏', score: { a: 1 } },
      { label: 'C', text: '把所有知識整理成框架或教別人後，豁然開朗', score: { r: 1, an: 1 } },
      { label: 'D', text: '在對話或故事中，詞彙和情感自然記住了', score: { na: 1, pf: 1 } },
    ],
  },
];
