// 訓練方案（完整文字稿）+ 每日訓練卡 + 量表回饋強化。
// FULL_PLAN 文字來自 MemoBrain《記憶天才量表訓練方案》正式稿，直接套用於產品。
// Daily cards rotate deterministically by date; completing one reinforces the
// user's VARK profile and genius-dimension tally (the feedback loop).
import { GeniusType } from './genius-type';
import { LearningStyle } from './learning-styles';

export interface PlanBlock { tag: string; title: string; body: string; }
export interface FullPlan {
  signature: string;
  blocks: PlanBlock[]; // 編碼 / 提取 / 鞏固
  weekly: string;      // 本週訓練建議
  weeklyPrompt: string; // launches the weekly task with the AI
}

export const FULL_PLAN: Record<GeniusType, FullPlan> = {
  explorer: {
    signature: '你的記憶天才是「情境頓悟」——你不是靠反覆看才記住，而是在某個真實或想像的情境中，突然「懂了」。強迫自己用傳統方式死背，效率對你來說是最低的。',
    blocks: [
      { tag: '編碼策略', title: '給每個詞彙一個場景', body: '你的大腦不擅長接受「孤立的資訊」，但非常擅長記住「在那個當下發生的事」。每學一個新詞彙或句型，不要只看定義，而是立刻問自己：「我在哪裡會用到這個？是跟誰說？當時的心情是什麼？」把詞彙嵌進一個你能感受到的場景，它就會變成你長期記憶的一部分。' },
      { tag: '提取策略', title: '用「回想」，而不是翻課本', body: '對你來說，「再看一遍筆記」是最沒效率的複習方式——因為你的大腦看到答案就以為自己記得了，其實根本沒有真正提取。最有效的方式是「關上所有材料，進入那個場景，逼自己說出來」。Brain Lab 的 AI 角色扮演練習對你不是娛樂，而是最高效的提取訓練。' },
      { tag: '鞏固策略', title: '密集複習，對抗陡峭的遺忘曲線', body: '創意直覺型學習者記憶的峰值高，但衰減也快。建議使用比標準更密集的間隔複習節奏：第1天 → 第3天 → 第8天 → 第20天。每次複習不是重新看，而是重新「演一遍那個場景」。' },
    ],
    weekly: '選一個你喜歡或嚮往的場景（機場、展覽、咖啡廳、海邊），本週所有新學的詞彙全部用這個場景串成一段 AI 對話練習。這個場景本身就是你最強大的記憶鉤子。',
    weeklyPrompt: "Let's do my weekly training. Ask me to pick a scene I love (airport, exhibition, café, beach...), then role-play that scene with me and naturally weave in the new vocabulary I'm learning this week. Correct me gently as we go.",
  },
  architect: {
    signature: '你的記憶天才是「邏輯框架」——散亂的資訊對你幾乎無效，但一旦被放進清晰的結構裡，你的記憶保留率是八種類型中最高的。',
    blocks: [
      { tag: '編碼策略', title: '先建框架，再填內容', body: '你需要「先看見整體，再學細節」。每接觸一個新主題，先問自己：「這跟我已知的什麼結構最像？它的上位概念是什麼？下面有幾個分支？」用樹狀圖或語法地圖把知識組織起來，再往裡面填詞彙和例句。這個過程對你來說不是多餘的步驟，而是記憶本身。' },
      { tag: '提取策略', title: '從「再認」升級到「回想」', body: '你適合循序漸進地提升提取難度：先用選擇題確認理解（再認），再進階到看中文提示輸出完整英文句子（回想）。切記不要停在「複習」這個層次——翻筆記對你的長期記憶效果是最差的，因為你的大腦太容易在「看到」的瞬間誤以為「記得」了。' },
      { tag: '鞏固策略', title: '輸出替代輸入', body: '你的知識結構一旦建立，保留率高、衰減慢。可以使用標準間隔複習時間表：第1天 → 第7天 → 第21天 → 第60天。每次複習的形式是「合上書、輸出」，不是重新看。寫出來、說出來都算，眼睛掃過去不算。' },
    ],
    weekly: '建立一份屬於你的「語法關係地圖」，把本週所有學到的句型用樹狀結構連結起來，找出它們之間的邏輯關係。下次複習時，只看這張地圖的節點，不看例句，逼自己從節點「生出」例句。',
    weeklyPrompt: "Let's do my weekly training. Help me build a grammar relationship map: ask what sentence patterns I learned this week, organize them into a tree structure with me, then quiz me by naming a node and having me produce a full example sentence from it.",
  },
  melodist: {
    signature: '你的記憶天才是「音韻共鳴」——你記住的不是「這個字長什麼樣子」，而是「這個聲音在你耳邊迴響的感覺」。學語言對你來說，最大的武器是你的耳朵。',
    blocks: [
      { tag: '編碼策略', title: '讓每個詞彙先活在聲音裡', body: '你的大腦對音調、韻律、節奏有天生的敏感度。學新詞彙時，不要先看拼寫，先把音標唸出來至少三次，感受它的節奏感。如果這個詞有特殊韻律（重音位置、連音方式），那就是你的記憶鉤子。語言的音樂性對你來說不是邊角料，而是記憶的核心載體。' },
      { tag: '提取策略', title: '「跟讀再認」是你的最佳提取訓練', body: '你的再認不是靠眼睛認出選項，而是靠耳朵「聽出那個感覺對不對」。Shadowing 跟讀練習對你來說是同時進行編碼和提取的雙重效果——你在模仿的過程中，同時在強化神經路徑。每次跟讀後，蓋住原文，憑印象說一遍（回想），才算完整一個提取循環。' },
      { tag: '鞏固策略', title: '睡前聽，讓 δ 波鞏固白天的音韻記憶', body: '聽覺記憶的鞏固和睡眠深度強相關。建議在睡前 20 分鐘聆聽今天學過的音檔（不需要主動記憶，純粹聆聽），讓大腦在深度睡眠中自動鞏固音韻印記。間隔複習時間表：第1天 → 第4天 → 第10天 → 第28天。' },
    ],
    weekly: '找一段你喜歡的英語 Podcast 或新聞，每天聽同一段三遍：第一遍純聽、第二遍跟讀、第三遍遮住稿子複述。三遍之後，你的大腦對這段音頻的記憶深度，會遠超過看同樣內容十遍的效果。',
    weeklyPrompt: "Let's do my weekly shadowing training. Give me a short natural passage (3-4 sentences), mark the stress and rhythm, have me read it aloud, then have me recall it from memory without looking. Then check my version against the original.",
  },
  narrator: {
    signature: '你的記憶天才是「情感故事」——你記住的是「這個詞彙讓你有感覺的那一刻」，而不是定義本身。沒有情感連結的詞彙，對你來說進得去、出得快。',
    blocks: [
      { tag: '編碼策略', title: '把詞彙嵌進一個有人物的故事', body: '你需要的不是例句，而是故事。每學一個新詞彙，試著問：「如果有一個角色在說這句話，他是誰？他現在是什麼心情？他在說這句話的時候，對方的反應是什麼？」這個虛構的場景會成為你的記憶錨點，比任何字典例句都更持久。' },
      { tag: '提取策略', title: '「說出來」比「寫出來」更有效', body: '你的最強提取通道是語音輸出。與其做選擇題，不如對著 AI 把整個故事說一遍，並且把本週學的詞彙自然地嵌入其中。如果說得順，代表你真的記住了；如果說到某個詞就卡住，那就是你今天最重要的學習點。' },
      { tag: '鞏固策略', title: '週記式間隔複習', body: '你的記憶保留和情感強度正相關——感動越深，記得越久；無聊的內容衰減最快。每週選一個讓你有感的主題進行口說日記，把這週學到的東西全部「活用」進去。間隔複習時間表：第1天 → 第5天 → 第14天 → 第35天。' },
    ],
    weekly: '選一個你真實生活中發生過的故事或情境，用英文把它說給 AI 聽。AI 會幫你校正、補充更好的表達方式。這段對話結束後，把你用到的新詞彙記下來——因為它們已經和你的真實記憶綁定，你會記得比任何背單字 App 都更久。',
    weeklyPrompt: "Let's do my weekly training. Ask me to tell you a real story from my life, listen and help me tell it better — correct my mistakes, offer richer expressions, and at the end list the new vocabulary I used so I can save it.",
  },
  connector: {
    signature: '你的記憶天才是「跨域連結」——你的大腦天生會在不同知識之間建立關係，一個新詞彙一旦和你已知的某個概念建立了連結，就很難忘記。',
    blocks: [
      { tag: '編碼策略', title: '找類比，而不是找定義', body: '不要用「這個詞的意思是⋯⋯」來編碼，改成「這個詞讓我想到⋯⋯」。中英文之間的語感類比、不同學科知識之間的隱喻連結，都是你最強大的編碼工具。比如學到「nuance」這個詞，與其背定義，不如想「它就像中文的『細膩』，但更偏向差異的微妙感，就像音樂家說的那種你聽得出來但說不清楚的差距」。' },
      { tag: '提取策略', title: '教別人是你最有效的提取方式', body: '你的記憶在「輸出給別人」的過程中得到最大強化。費曼技巧對你天生有效——試著向 AI 或朋友解釋今天學到的語言概念，越清楚說明，代表記憶越深刻。如果解釋到一半卡住，那個卡住的地方就是你今天最需要補強的點。' },
      { tag: '鞏固策略', title: '主題式連結複習', body: '你的複習不應該是逐條翻閱，而是「找到這週所有詞彙的共同主題，用這個主題把它們串成一個完整的知識網」。間隔複習時間表：第1天 → 第5天 → 第15天 → 第40天，每次複習都嘗試把這個知識網再延伸一個新節點。' },
    ],
    weekly: '把本週所學的詞彙用「概念地圖」的方式手寫或畫出來，找出它們之間的關係和差異。完成後，對著 AI 解釋這張地圖上的每一個連結是什麼意思。這個過程會讓你的記憶深度遠超過任何傳統複習方式。',
    weeklyPrompt: "Let's do my weekly training. Ask me for the vocabulary I learned this week, help me organize the words into a concept map by themes and relationships, then have me explain each connection to you like a teacher.",
  },
  analyst: {
    signature: '你的記憶天才是「原理輸出」——你不記住你不理解的東西。淺層重複對你幾乎完全無效，但一旦你真正「弄懂了」，這個知識的保留時間比其他類型長出許多。',
    blocks: [
      { tag: '編碼策略', title: '先問「為什麼」，再記「是什麼」', body: '每個語法規則或詞彙用法，先追問它背後的邏輯：「為什麼英語要這樣說？這個用法的起源是什麼？和中文對應的邏輯有什麼差異？」這個追問的過程看似慢，但它創造的記憶深度是翻十遍課本無法達到的。' },
      { tag: '提取策略', title: '費曼技巧是你的標配', body: '你的最高效提取方式是「向別人（或 AI）解釋」。不是複述定義，而是用自己的話、自己的邏輯，把這個概念從頭講一遍。如果你能讓一個完全不懂的人聽懂，代表你真正記住了；如果講到某個地方說不清楚，那個地方就是你的記憶缺口。' },
      { tag: '鞏固策略', title: '輸出即複習', body: '你不需要傳統意義上的「複習」，因為你的複習本來就是輸出。建議每週一次「費曼輸出日」：選一個本週學過的語法點，從頭解釋給 AI 聽，不看任何材料。間隔時間表：第1天 → 第7天 → 第21天 → 第60天，每次複習方式都是輸出，不是閱讀。' },
    ],
    weekly: '把本週遇到的一個讓你覺得「奇怪」或「不直覺」的英語用法寫下來，花 15 分鐘查清楚它背後的語言邏輯，然後對 AI 解釋這個規則——包括為什麼這樣用、什麼情況不能這樣用、和中文思維的差異在哪裡。這一次理解，會讓你記住它至少半年。',
    weeklyPrompt: "Let's do my weekly Feynman training. Ask me for an English usage that felt strange or counter-intuitive this week. I'll explain the rule behind it to you — why it works, when it doesn't, and how it differs from Chinese thinking. Probe any gaps in my explanation.",
  },
  performer: {
    signature: '你的記憶天才是「即時輸出」——你記住的是「你說出口的那一刻」，而不是你讀過或聽過的內容。說、演、示範，是你大腦編碼的主要通道。',
    blocks: [
      { tag: '編碼策略', title: '開口說，不要先背', body: '你的大腦在「說出聲音」的同時才真正完成編碼。所以學新詞彙的第一步不是看、不是抄，而是立刻大聲說一遍，然後造一個句子說出來，再想一個你真實情境中可以用到的場景說第三遍。這三次開口，比默默看十遍有效。' },
      { tag: '提取策略', title: '即興對話是你的最強提取工具', body: 'AI 即興對話練習對你來說是最接近「真實提取」的訓練。不需要事先準備，直接進入話題，在對話的壓力下讓詞彙自然浮現。如果某個詞在對話中想不起來，對你來說這個卡頓本身就是最深刻的記憶強化——你下次絕對會記住。' },
      { tag: '鞏固策略', title: '錄音回聽，發現自己的盲點', body: '你的鞏固策略不是重新複習材料，而是重新聆聽自己說話的錄音。每週錄一段 3～5 分鐘的口說日記，隔天回聽，標記說得不順暢或用詞不精準的地方，那些就是本週的重點練習。間隔時間表：第1天 → 第3天 → 第9天 → 第25天。' },
    ],
    weekly: '每天結束前錄一段 2 分鐘的英語口說——主題不限，就是把今天腦子裡的事情用英語說出來。不需要完美，說錯了繼續說。這個習慣建立後，你的語言輸出能力會在兩週內出現明顯的加速。',
    weeklyPrompt: "Let's do my daily speaking sprint. Give me a spontaneous topic and keep me talking for two minutes — quick prompts, no long explanations. Afterwards, point out my top 3 fluency blockers and better ways to phrase them.",
  },
  visionary: {
    signature: '你的記憶天才是「空間視覺」——你的大腦以圖像和位置為記憶索引。你看過的東西能記住，聽過的內容卻容易忘記，因為聲音對你來說沒有「位置」可以掛靠。',
    blocks: [
      { tag: '編碼策略', title: '把詞彙變成圖像，用位置記住它', body: '每學一個新詞彙，試著在腦海中創造一個對應的視覺畫面——越荒誕、越誇張、越具體，越容易記住。記憶宮殿法（Method of Loci）對你來說幾乎是作弊等級的記憶工具：把今天要記的 10 個詞彙，依序放進你家從門口到廚房的 10 個位置，下次「走」過這條路，詞彙就會自然浮現。' },
      { tag: '提取策略', title: '先「看見圖」，再「說出詞」', body: '你的提取路徑是「視覺 → 語言」，而不是「語言 → 語言」。複習時，試著先在腦海中重建那個視覺畫面，再從畫面裡提取詞彙。如果能畫出心智圖然後合上它、憑記憶重畫，對你來說這就是最高效的回想訓練。' },
      { tag: '鞏固策略', title: '定期更新你的視覺地圖', body: '你的記憶和視覺空間的「鮮明度」正相關。建議每次間隔複習時，重新在腦中「走一遍」你的記憶宮殿，並補充或修改其中的畫面讓它更鮮明。間隔時間表：第1天 → 第6天 → 第18天 → 第45天。' },
    ],
    weekly: '選一個你熟悉的實體空間（你的房間、你常去的咖啡廳），把本週要學的 10 個詞彙用「視覺圖像」放進這個空間的 10 個位置。設計時越荒誕越好。三天後，閉眼「走」過這個空間，看能說出幾個。你會對自己的記憶效果感到驚訝。',
    weeklyPrompt: "Let's do my weekly memory-palace training. Ask me for up to 10 words I'm learning this week, then help me place each one into a familiar space (my room, a café) with an exaggerated vivid image per location. Finally walk me through the palace and quiz me.",
  },
};

/* ---------------- Daily challenge cards ---------------- */

export interface DailyChallenge {
  title: string;
  desc: string;
  kind: 'ai' | 'self';         // ai = launches an AI session; self = do it yourself, mark done
  prompt?: string;             // for kind 'ai'
  vark: LearningStyle;         // which VARK dimension this reinforces
  dimLabel: string;            // shown in the feedback toast, e.g. 動覺 K
}

const POOLS: Record<GeniusType, DailyChallenge[]> = {
  explorer: [
    { title: '場景速演', desc: '選一個場景，把今天的新詞演進對話裡', kind: 'ai', vark: 'kinesthetic', dimLabel: '動覺 K', prompt: "Quick scene drill: ask me to pick a scene, then improvise a 5-minute role-play in it, weaving in vocabulary I'm learning. Keep it fast and fun." },
      { title: '回想挑戰', desc: '不看任何材料，回想昨天學的 5 個詞並各造一句', kind: 'ai', vark: 'kinesthetic', dimLabel: '動覺 K', prompt: "Recall challenge: without me looking at notes, ask me to recall 5 words I learned recently and use each in a sentence. Grade my recall." },
    { title: '新環境探索', desc: '今天在一個新地點（或想像場景）用外語自言自語 3 分鐘', kind: 'self', vark: 'kinesthetic', dimLabel: '動覺 K' },
    { title: '情境句型獵人', desc: '把今天遇到的一個真實情境翻成外語說一遍', kind: 'self', vark: 'kinesthetic', dimLabel: '動覺 K' },
    { title: '冒險自由談', desc: '跟 AI 聊一個你從沒聊過的話題', kind: 'ai', vark: 'auditory', dimLabel: '聽覺 A', prompt: "Adventure chat: pick a topic I've probably never discussed in this language and get me talking about it. Push me out of my comfort zone gently." },
  ],
  architect: [
    { title: '框架快建', desc: '為今天學的主題畫一張 3 層樹狀圖', kind: 'self', vark: 'reading', dimLabel: '讀寫 R' },
    { title: '節點生成句', desc: '從語法地圖挑 3 個節點，各生出一個完整句子', kind: 'ai', vark: 'reading', dimLabel: '讀寫 R', prompt: "Node drill: ask me for 3 grammar points I know, then for each one have me produce a full original sentence. Check structure rigorously." },
    { title: '再認 → 回想升級', desc: '先做選擇題再做輸出題，體驗兩層提取', kind: 'ai', vark: 'reading', dimLabel: '讀寫 R', prompt: "Two-stage retrieval: give me 3 multiple-choice questions on grammar I'm learning, then upgrade to production — show me a Chinese hint and have me output the full sentence." },
    { title: '詞根家族 +3', desc: '為一個字根多掛 3 個家族成員', kind: 'ai', vark: 'reading', dimLabel: '讀寫 R', prompt: "Word-family drill: ask me for one word root I know, help me extend its family by 3 new members with the logic of each derivation." },
    { title: '合書輸出', desc: '合上筆記，把今天的重點寫成 3 句話', kind: 'self', vark: 'reading', dimLabel: '讀寫 R' },
  ],
  melodist: [
    { title: '三遍聽讀', desc: '同一段音頻：純聽 → 跟讀 → 遮稿複述', kind: 'self', vark: 'auditory', dimLabel: '聽覺 A' },
    { title: '節奏標記', desc: '請 AI 給一句話，標出重音節奏後跟讀', kind: 'ai', vark: 'auditory', dimLabel: '聽覺 A', prompt: "Rhythm drill: give me one natural sentence, mark its stress and linking, have me shadow it, then recall it from memory." },
    { title: '睡前音檔', desc: '睡前 20 分鐘純聆聽今天學過的內容', kind: 'self', vark: 'auditory', dimLabel: '聽覺 A' },
    { title: '語調變奏', desc: '同一句話用 3 種情緒說出來', kind: 'ai', vark: 'auditory', dimLabel: '聽覺 A', prompt: "Intonation drill: give me one sentence and have me say it with 3 different emotions; describe how each version should sound and give feedback." },
    { title: '歌詞一句', desc: '拆解一句歌詞的連音與發音', kind: 'ai', vark: 'auditory', dimLabel: '聽覺 A', prompt: "Lyric drill: pick one simple song line, break down its pronunciation and linking, and coach me to say it naturally." },
  ],
  narrator: [
    { title: '一分鐘故事', desc: '把今天發生的一件事說成 1 分鐘故事', kind: 'ai', vark: 'auditory', dimLabel: '聽覺 A', prompt: "Story minute: ask me to tell a one-minute story about something that happened today, help me tell it with feeling and better expressions." },
    { title: '角色配音', desc: '為一個新詞創造角色：誰說的？什麼心情？', kind: 'self', vark: 'kinesthetic', dimLabel: '動覺 K' },
    { title: '情緒詞收集', desc: '學 3 個帶情緒的表達並各配一個場景', kind: 'ai', vark: 'auditory', dimLabel: '聽覺 A', prompt: "Emotion words: teach me 3 emotional expressions, each inside a mini scene with a character and a feeling, then have me use them." },
    { title: '口說日記', desc: '對 AI 說一段今天的心情日記', kind: 'ai', vark: 'kinesthetic', dimLabel: '動覺 K', prompt: "Spoken diary: I'll talk about my day and feelings; listen, respond warmly, and upgrade my expressions as we go." },
    { title: '故事重述', desc: '把最近看過的影片/文章重述成故事', kind: 'self', vark: 'auditory', dimLabel: '聽覺 A' },
  ],
  connector: [
    { title: '類比三連', desc: '為 3 個新詞各找一個「讓我想到…」類比', kind: 'ai', vark: 'reading', dimLabel: '讀寫 R', prompt: "Analogy drill: ask me for 3 words I'm learning; for each, help me build a memorable analogy or metaphor link to something I already know." },
    { title: '教 AI 一課', desc: '把今天學的概念教給 AI，讓它當學生', kind: 'ai', vark: 'auditory', dimLabel: '聽覺 A', prompt: "Feynman flip: you are my student. I'll teach you a language concept I learned; ask naive questions and point out where my explanation breaks down." },
    { title: '主題串網', desc: '找出本週詞彙的共同主題，串成知識網', kind: 'self', vark: 'reading', dimLabel: '讀寫 R' },
    { title: '雙語對照', desc: '比較一個中英表達的語感差異', kind: 'ai', vark: 'reading', dimLabel: '讀寫 R', prompt: "Nuance compare: pick one expression and compare its nuance with the Chinese counterpart; discuss where they overlap and where they differ." },
    { title: '跨域一格', desc: '用你的興趣領域學 3 個外語詞', kind: 'ai', vark: 'auditory', dimLabel: '聽覺 A', prompt: "Cross-domain: ask about one of my hobbies, then teach me 3 domain words from it and connect them to everyday usage." },
  ],
  analyst: [
    { title: '為什麼三問', desc: '對一個語法規則連問三個為什麼', kind: 'ai', vark: 'reading', dimLabel: '讀寫 R', prompt: "Why-drill: ask me for one grammar rule I'm learning, then push me to answer three WHYs about it (why this form, why not another, how it differs from Chinese). Fill the gaps I can't answer." },
    { title: '費曼五分鐘', desc: '不看材料，把一個概念講給 AI 聽', kind: 'ai', vark: 'kinesthetic', dimLabel: '動覺 K', prompt: "Feynman five: I'll explain one concept from memory; probe my gaps until a beginner could understand my explanation." },
    { title: '錯誤解剖', desc: '把最近犯的一個錯誤查清根本原因', kind: 'self', vark: 'reading', dimLabel: '讀寫 R' },
    { title: '易混辨析', desc: '辨析一組易混詞背後的邏輯差異', kind: 'ai', vark: 'reading', dimLabel: '讀寫 R', prompt: "Confusable pair: pick two commonly confused words/structures and have me articulate the underlying difference, with edge cases." },
    { title: '錯誤日誌', desc: '把本週錯誤記進錯誤日誌並歸類', kind: 'self', vark: 'reading', dimLabel: '讀寫 R' },
  ],
  performer: [
    { title: '兩分鐘即興', desc: '隨機話題連續說 2 分鐘不冷場', kind: 'ai', vark: 'kinesthetic', dimLabel: '動覺 K', prompt: "Two-minute improv: give me a random topic and keep me talking for two minutes with quick prompts. Then give rapid-fire feedback." },
    { title: '三次開口', desc: '每個新詞：說一遍→造句說→放進場景說', kind: 'self', vark: 'kinesthetic', dimLabel: '動覺 K' },
    { title: '錄音日記', desc: '錄 2 分鐘口說日記，明天回聽', kind: 'self', vark: 'auditory', dimLabel: '聽覺 A' },
    { title: '即席角色', desc: '無準備進入一個角色扮演情境', kind: 'ai', vark: 'kinesthetic', dimLabel: '動覺 K', prompt: "Instant role-play: throw me into a scenario with zero preparation and improvise it with me. Keep the energy high." },
    { title: '演講開頭', desc: '為一個題目即興說出 30 秒開場白', kind: 'ai', vark: 'auditory', dimLabel: '聽覺 A', prompt: "Opening lines: give me a topic and have me improvise a 30-second speech opening; coach me on hooks and delivery." },
  ],
  visionary: [
    { title: '畫面三詞', desc: '為 3 個新詞各造一個誇張畫面', kind: 'ai', vark: 'visual', dimLabel: '視覺 V', prompt: "Image drill: ask me for 3 words; for each, help me craft an exaggerated, unforgettable mental image, then quiz me from image to word." },
    { title: '宮殿巡走', desc: '閉眼走一遍記憶宮殿，說出每站的詞', kind: 'self', vark: 'visual', dimLabel: '視覺 V' },
    { title: '場景描述', desc: '看著眼前的空間，用外語描述 1 分鐘', kind: 'ai', vark: 'visual', dimLabel: '視覺 V', prompt: "Scene describe: have me describe the room/space around me in the target language for one minute, then feed me upgraded visual vocabulary." },
    { title: '心智圖重畫', desc: '合上心智圖，憑記憶重畫一次', kind: 'self', vark: 'visual', dimLabel: '視覺 V' },
    { title: '圖像猜詞', desc: 'AI 描述畫面，你說出對應的詞', kind: 'ai', vark: 'visual', dimLabel: '視覺 V', prompt: "Picture-to-word: describe vivid scenes one at a time and have me name the target word each scene represents. Start with words I'm learning." },
  ],
};

/** Deterministic 3 cards per day, rotating through the type's pool. */
export function dailyChallenges(type: GeniusType, date = new Date()): DailyChallenge[] {
  const pool = POOLS[type];
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const start = (dayOfYear * 3) % pool.length;
  return [0, 1, 2].map(i => pool[(start + i) % pool.length]);
}

export function dateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/* ---------------- Completion + reinforcement storage ---------------- */

interface DailyStore { [dateKey: string]: number[] } // indices of completed cards

const dailyKey = (uid: string) => `fluent_daily_training_${uid}`;
const reinforceKey = (uid: string) => `fluent_genius_reinforce_${uid}`;

export function loadDailyDone(uid: string, dk = dateKey()): number[] {
  try {
    const store = JSON.parse(localStorage.getItem(dailyKey(uid)) || '{}') as DailyStore;
    return store[dk] || [];
  } catch { return []; }
}

export function markDailyDone(uid: string, idx: number, dk = dateKey()): number[] {
  let store: DailyStore = {};
  try { store = JSON.parse(localStorage.getItem(dailyKey(uid)) || '{}'); } catch { /* fresh */ }
  const done = new Set(store[dk] || []);
  done.add(idx);
  store[dk] = [...done];
  localStorage.setItem(dailyKey(uid), JSON.stringify(store));
  return store[dk];
}

/** Consecutive days (ending today) with ≥1 completed daily challenge. */
export function dailyStreak(uid: string): number {
  let store: DailyStore = {};
  try { store = JSON.parse(localStorage.getItem(dailyKey(uid)) || '{}'); } catch { return 0; }
  let streak = 0;
  const d = new Date();
  for (;;) {
    const k = dateKey(d);
    if ((store[k] || []).length > 0) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

export interface Reinforce { total: number; byDim: Record<string, number> }

export function loadReinforce(uid: string): Reinforce {
  try {
    const r = JSON.parse(localStorage.getItem(reinforceKey(uid)) || 'null');
    if (r && typeof r.total === 'number') return r;
  } catch { /* fresh */ }
  return { total: 0, byDim: {} };
}

export function addReinforce(uid: string, dimLabel: string): Reinforce {
  const r = loadReinforce(uid);
  r.total += 1;
  r.byDim[dimLabel] = (r.byDim[dimLabel] || 0) + 1;
  localStorage.setItem(reinforceKey(uid), JSON.stringify(r));
  return r;
}
