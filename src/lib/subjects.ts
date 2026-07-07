// 學科訓練 — subjects beyond language practice (math, physics, TOEIC, English
// certs). Each subject carries per-genius-type study strategies and AI-tutor
// tasks that launch /practice sessions. The chat backend already adapts its
// teaching to geniusType for any conversation, so tasks only need good prompts.
import { GeniusType } from './genius-type';

export interface SubjectTask {
  title: string;
  desc: string;
  prompt: string; // greeting prompt for the AI session
}

export interface Subject {
  id: string;
  name: string;
  emoji: string;
  color: string;
  desc: string;
  lang: 'chinese' | 'english'; // the practice language the session runs in
  typeTips: Record<GeniusType, string>; // how each type should study this subject
  tasks: SubjectTask[];
}

export const SUBJECTS: Subject[] = [
  {
    id: 'math',
    name: '數學',
    emoji: '➗',
    color: '#0ea5e9',
    desc: '觀念理解 · 解題策略 · 錯題診斷',
    lang: 'chinese',
    typeTips: {
      explorer: '從生活情境題進入（折扣、換算、機率遊戲），在情境中「用到」公式才記得住。',
      architect: '先建立公式體系與定理框架，理解推導邏輯再做題；做一份公式關係地圖。',
      melodist: '把公式與口訣唸出聲、用節奏背誦；聽講解比看課本有效。',
      narrator: '把題目當故事讀——「誰、要求什麼、已知什麼」；用自己的話重述題意再動筆。',
      connector: '把新公式連到已知概念（比例↔斜率、集合↔機率）；跨章節找關聯。',
      analyst: '每道錯題追問「為什麼錯」；自己推導一遍公式，勝過背十遍。',
      performer: '把解題過程「講出來」，像教別人一樣邊說邊解；找人互考。',
      visionary: '畫圖！幾何圖形、函數圖像、數線；把抽象數字視覺化成圖再思考。',
    },
    tasks: [
      { title: '觀念釐清家教', desc: '蘇格拉底式提問，一步步帶你真正搞懂', prompt: '你是一位有耐心的數學家教，全程使用繁體中文。先問我目前在學的數學主題和程度，然後用蘇格拉底式提問一步一步引導我理解觀念——不要直接給答案，讓我自己想出來，卡住時才給提示。' },
      { title: '錯題診斷', desc: '貼上做錯的題目，找出根本原因', prompt: '你是數學錯題診斷教練，使用繁體中文。請我提供一題做錯的題目和我的錯誤解法，然後診斷我錯在哪一步、背後是哪個觀念漏洞，並出一題類似題讓我重試。' },
      { title: '一題多解挑戰', desc: '同一題用不同方法解，訓練思路彈性', prompt: '你是數學思維教練，使用繁體中文。先依我的程度出一道適中的題目，我解完後，請展示至少兩種不同解法並比較優劣，然後再出一題讓我嘗試用新學的解法。' },
      { title: '公式費曼輸出', desc: '把公式講給 AI 聽，找出理解缺口', prompt: '你是費曼學習法教練，使用繁體中文。請我選一個數學公式或定理，用自己的話解釋給你聽（為什麼成立、什麼時候用），你負責追問我講不清楚的地方，直到我能完整教會一個初學者。' },
    ],
  },
  {
    id: 'physics',
    name: '物理',
    emoji: '🎢',
    color: '#8b5cf6',
    desc: '直覺建立 · 公式推導 · 情境應用',
    lang: 'chinese',
    typeTips: {
      explorer: '從真實現象進入（雲霄飛車、手機摔落）——先體驗現象，再回推原理。',
      architect: '把力學／電磁學整理成概念樹：定律 → 推論 → 適用條件，一層層掛。',
      melodist: '聽物理科普 Podcast／講解影片；把定律唸出聲並口述推導過程。',
      narrator: '把每個定律講成一個故事（牛頓與蘋果式）；情節記住了，公式就掛上去了。',
      connector: '跨域類比：電流↔水流、彈簧↔債券波動；用已知系統理解新系統。',
      analyst: '別背公式——推導它。每個公式追問「從哪個定律來、什麼條件下失效」。',
      performer: '向別人（或 AI）演示講解一個物理現象；能講順，才是真的懂。',
      visionary: '畫受力圖、場線圖、v-t 圖；物理是最適合視覺化的科目，先畫再算。',
    },
    tasks: [
      { title: '生活物理情境', desc: '從日常現象出發理解物理原理', prompt: '你是善用生活例子的物理家教，使用繁體中文。先問我在學的物理主題，然後用一個貼近生活的現象引入，一步步引導我發現背後的物理原理，過程中多問我「你覺得為什麼」。' },
      { title: '觀念家教', desc: '蘇格拉底式引導，破除物理迷思', prompt: '你是物理觀念家教，使用繁體中文。先問我目前的主題與程度，用提問引導我思考，特別留意常見迷思概念（例如「速度大代表受力大」），發現我有迷思時用思想實驗幫我拆掉它。' },
      { title: '公式推導對話', desc: '不背公式，跟著一起把它推出來', prompt: '你是物理推導教練，使用繁體中文。請我選一個公式，然後帶著我從基本定律一步步把它推導出來——每一步先問我「下一步該怎麼做」，我卡住才提示。推完後問我這個公式的適用條件。' },
      { title: '解題策略教練', desc: '學會「看到題目先做什麼」的思考流程', prompt: '你是物理解題策略教練，使用繁體中文。依我的程度出一題，但先不讓我算——先帶我完成：畫圖、列已知、判斷用哪個定律、預估答案量級，然後才動筆。培養我固定的解題流程。' },
    ],
  },
  {
    id: 'toeic',
    name: '多益 TOEIC',
    emoji: '💼',
    color: '#f59e0b',
    desc: '聽力情境 · 文法快攻 · 商業詞彙',
    lang: 'english',
    typeTips: {
      explorer: '把 Part 3/4 聽力當「進入辦公室場景」演練，聽完接著角色扮演同一情境。',
      architect: 'Part 5/6 文法先歸納考點框架（詞性、時態、連接詞…），按類型逐一擊破。',
      melodist: '每天精聽一段對話並跟讀（shadowing）；多益聽力口音是你的主場。',
      narrator: '把每段聽力對話重述成小故事；情節記住了，答案線索自然浮現。',
      connector: '把商業單字按情境串網（會議→議程→延期→改期），一次記一整串。',
      analyst: '建立錯題本，統計自己最常錯的題型與原因，針對弱點特訓。',
      performer: '用商業情境即興對話練習，把 Part 3 的場景實際「演」一遍。',
      visionary: 'Part 1 圖片題是你的強項；為高頻單字建立圖像卡（用記憶宮殿放商業詞彙）。',
    },
    tasks: [
      { title: '聽力情境模擬', desc: 'Part 3/4 風格對話 + 理解問答', prompt: "You are a TOEIC listening coach. Create a short TOEIC Part 3-style workplace conversation (write it out), then ask me 3 comprehension questions one at a time. After I answer, explain the answer-locating strategy. Keep the level appropriate after asking my target score." },
      { title: 'Part 5 文法快攻', desc: '單句文法選擇題連續操練 + 考點解析', prompt: "You are a TOEIC grammar coach. Give me Part 5-style sentence-completion questions one at a time (4 choices). After each answer, explain the tested grammar point and the elimination strategy. Track my weak points and drill them more." },
      { title: '商業詞彙情境', desc: '高頻商業單字放進真實情境學', prompt: "You are a TOEIC vocabulary coach. Teach me high-frequency TOEIC business words by putting them in realistic office mini-scenarios. After every few words, quiz me by asking me to use them in my own sentences." },
      { title: '商業會話演練', desc: '會議、電話、email 情境角色扮演', prompt: "Role-play common TOEIC workplace scenarios with me in English (meetings, phone calls, scheduling). Keep it interactive, correct my mistakes gently, and introduce useful business phrases as we go." },
    ],
  },
  {
    id: 'engcert',
    name: '英文檢定',
    emoji: '🎓',
    color: '#10b981',
    desc: '英檢 / IELTS / TOEFL 口說寫作',
    lang: 'english',
    typeTips: {
      explorer: '口說題當「真實訪談」來玩——別背稿，用親身經歷即興回答最加分。',
      architect: '寫作先練架構模板（立場→理由→例證→結論），有框架分數就穩。',
      melodist: '每天跟讀高分口說範例，模仿語調節奏；發音與流暢度是你的加分項。',
      narrator: '口說第二部分（敘事題）是你的主場；把每個話題準備成一個真實小故事。',
      connector: '準備「萬用素材庫」：一個經歷連到多個話題（科技、教育、環境都能用）。',
      analyst: '研究評分標準（band descriptors），逐項對照自己的答案找扣分點。',
      performer: '大量模擬口試——考官在前面反而讓你發揮更好；多錄音回聽。',
      visionary: '看圖敘述題是你的強項；用心智圖準備每個高頻話題的觀點分支。',
    },
    tasks: [
      { title: '口說模擬考官', desc: 'IELTS/英檢風格口試 + 即時評分回饋', prompt: "You are an English speaking examiner (IELTS/GEPT style). First ask which exam and level I'm preparing for, then run a realistic speaking test: Part 1 warm-up questions, Part 2 a topic card, Part 3 discussion. After each part, give band-style feedback on fluency, vocabulary, grammar and pronunciation tips." },
      { title: '寫作批改教練', desc: '交一段作文，依評分標準逐項批改', prompt: "You are an English writing coach. Ask me for the exam I'm preparing for and a writing prompt I want to try (or give me one). After I submit my writing, grade it against the official criteria, mark specific errors with corrections, and show one upgraded model paragraph." },
      { title: '看圖敘述練習', desc: '英檢口說看圖題：描述 → 追問 → 升級句型', prompt: "You are a GEPT-style speaking coach. Describe a scene to me in detail (as if it were a picture), have me narrate it back in English for 1-2 minutes, then ask follow-up questions and teach me upgraded sentence patterns for describing pictures." },
      { title: '高頻話題問答', desc: '考前高頻主題一問一答特訓', prompt: "You are an exam speaking coach. Drill me on high-frequency exam topics (hometown, technology, environment, education...) one question at a time. Push me to extend my answers with reasons and examples, and upgrade my vocabulary as we go." },
    ],
  },
];

export function getSubject(id: string): Subject | undefined {
  return SUBJECTS.find(s => s.id === id);
}
