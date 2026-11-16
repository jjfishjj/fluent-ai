import type { LanguageLesson } from './language-lessons';
import { LANGUAGE_LESSONS } from './language-lessons';

const forestBeginner: LanguageLesson[] = [
  {
    id: 'follow', word: 'follow', phonetic: '/ˈfɑːloʊ/', meaning: '跟隨；沿著',
    scene: '跟著森林裡的藍色光點', sentence: '___ the blue lights to find the hidden path.',
    translation: '沿著藍色光點走，就能找到隱藏小徑。',
    relatedWords: [
      { word: 'lead', meaning: '帶領', relation: '方向相反：follow 是跟在後面，lead 是走在前面帶路。' },
      { word: 'chase', meaning: '追趕', relation: 'chase 強調追著移動目標跑，follow 不一定要跑。' },
    ],
    mnemonic: '跟著光點走就是 follow；記得先看清楚方向，再跟上隊伍。',
    choices: ['follow', 'forget', 'farther', 'leave'], targetLanguage: 'en', locale: 'en-US', level: 'beginner', region: 'forest',
  },
  {
    id: 'search', word: 'search', phonetic: '/sɝːtʃ/', meaning: '搜尋；仔細找',
    scene: '在竹林裡找回遺失的徽章', sentence: 'We will ___ the forest for the missing badge.',
    translation: '我們會在森林裡搜尋遺失的徽章。',
    relatedWords: [
      { word: 'find', meaning: '找到', relation: 'search 是尋找的過程；find 是找到的結果。' },
      { word: 'research', meaning: '研究', relation: 'research 常指為了理解問題而做系統性的調查。' },
    ],
    mnemonic: '先 search 仔細搜尋，之後才可能 find 找到。',
    choices: ['search', 'research', 'seek', 'hide'], targetLanguage: 'en', locale: 'en-US', level: 'beginner', region: 'forest',
  },
  {
    id: 'quiet', word: 'quiet', phonetic: '/ˈkwaɪət/', meaning: '安靜的；平靜的',
    scene: '不驚動正在睡覺的靈狐', sentence: 'Please stay ___ near the sleeping fox.',
    translation: '請在睡著的靈狐附近保持安靜。',
    relatedWords: [
      { word: 'quite', meaning: '相當；十分', relation: '拼字只差最後一個字母；quite 是副詞，quiet 是「安靜的」。' },
      { word: 'silent', meaning: '寂靜的；不出聲的', relation: 'silent 語氣更強，常表示完全沒有聲音。' },
    ],
    mnemonic: 'quiet 中間有 e，想像 e 像一隻小耳朵，提醒你安靜聽森林的聲音。',
    choices: ['quiet', 'quite', 'silent', 'soft'], targetLanguage: 'en', locale: 'en-US', level: 'beginner', region: 'forest',
  },
  {
    id: 'protect', word: 'protect', phonetic: '/prəˈtekt/', meaning: '保護；防護',
    scene: '保護森林古樹不受火焰侵襲', sentence: 'We must ___ the old trees from fire.',
    translation: '我們必須保護古樹，避免它們遭受火災。',
    relatedWords: [
      { word: 'prevent', meaning: '預防；阻止', relation: 'prevent 是事前阻止事情發生；protect 是保護人或物免受傷害。' },
      { word: 'defend', meaning: '防衛；辯護', relation: 'defend 常指面對攻擊時防守或為人辯護。' },
    ],
    mnemonic: 'protect 常和 from 搭配：protect something from danger，保護某物免受危險。',
    choices: ['protect', 'prevent', 'defend', 'rescue'], targetLanguage: 'en', locale: 'en-US', level: 'beginner', region: 'forest',
  },
];

const ruinsIntermediate: LanguageLesson[] = [
  {
    id: 'discover', word: 'discover', phonetic: '/dɪˈskʌvər/', meaning: '發現；找到原本未知的事物',
    scene: '在遺跡牆後發現密室', sentence: 'The team hopes to ___ a hidden room behind the wall.',
    translation: '隊伍希望能在牆後發現一間密室。',
    relatedWords: [
      { word: 'uncover', meaning: '揭開；發現', relation: '常強調移開遮蓋物，或揭露先前隱藏的事。' },
      { word: 'invent', meaning: '發明', relation: 'discover 是找到已存在的事物；invent 是創造新事物。' },
    ],
    mnemonic: 'discover 是找到原本存在、但你還不知道的線索；不是憑空 invent 發明它。',
    choices: ['discover', 'invent', 'recover', 'uncover'], targetLanguage: 'en', locale: 'en-US', level: 'intermediate', region: 'ruins',
  },
  {
    id: 'ancient', word: 'ancient', phonetic: '/ˈeɪnʃənt/', meaning: '古代的；非常古老的',
    scene: '辨認石門上古老的文字', sentence: 'These symbols come from an ___ civilization.',
    translation: '這些符號來自一個古老文明。',
    relatedWords: [
      { word: 'antique', meaning: '古董的；古董', relation: 'antique 多用於有收藏或年代價值的物品。' },
      { word: 'former', meaning: '以前的；前任的', relation: 'former 指先前的，不一定年代久遠。' },
    ],
    mnemonic: 'ancient 描寫久遠的年代；想像 ancient ruins「古代遺跡」的石牆。',
    choices: ['ancient', 'antique', 'former', 'future'], targetLanguage: 'en', locale: 'en-US', level: 'intermediate', region: 'ruins',
  },
  {
    id: 'fragile', word: 'fragile', phonetic: '/ˈfrædʒaɪl/', meaning: '易碎的；脆弱的',
    scene: '小心搬動遺跡中的陶器', sentence: 'Handle the ___ pottery with both hands.',
    translation: '請用雙手小心拿取易碎的陶器。',
    relatedWords: [
      { word: 'delicate', meaning: '易損的；精緻的', relation: 'delicate 也可指容易受損，但還能形容精巧細緻。' },
      { word: 'stable', meaning: '穩固的；穩定的', relation: '意思相反：stable 不容易損壞或改變。' },
    ],
    mnemonic: '包裹易碎物品時常貼上 fragile 標籤，提醒大家輕拿輕放。',
    choices: ['fragile', 'delicate', 'damaged', 'stable'], targetLanguage: 'en', locale: 'en-US', level: 'intermediate', region: 'ruins',
  },
  {
    id: 'require', word: 'require', phonetic: '/rɪˈkwaɪr/', meaning: '需要；要求（作為必要條件）',
    scene: '啟動古老石門前確認條件', sentence: 'Opening the stone door will ___ a silver key.',
    translation: '要打開石門，就需要一把銀鑰匙。',
    relatedWords: [
      { word: 'need', meaning: '需要', relation: 'need 是常用說法；require 較正式，常指必要條件。' },
      { word: 'request', meaning: '請求；要求', relation: 'request 是提出請求，不一定代表對方必須提供。' },
    ],
    mnemonic: 'require 常用來說明「要完成某事，必須具備什麼」：require a key。',
    choices: ['require', 'request', 'acquire', 'need'], targetLanguage: 'en', locale: 'en-US', level: 'intermediate', region: 'ruins',
  },
  {
    id: 'despite', word: 'despite', phonetic: '/dɪˈspaɪt/', meaning: '儘管；不受……影響',
    scene: '風雨中仍繼續探索遺跡', sentence: 'The explorers continued their search ___ the heavy rain.',
    translation: '儘管下著大雨，探險隊仍繼續搜尋。',
    relatedWords: [
      { word: 'although', meaning: '雖然；儘管', relation: 'although 後面接子句；despite 後面接名詞或動名詞。' },
      { word: 'because', meaning: '因為', relation: 'because 表示原因；despite 表示結果與預期相反。' },
    ],
    mnemonic: 'despite 後面接名詞片語：despite the rain；想成「有雨，仍繼續」。',
    choices: ['despite', 'although', 'because', 'unless'], targetLanguage: 'en', locale: 'en-US', level: 'intermediate', region: 'ruins',
  },
  {
    id: 'avoid', word: 'avoid', phonetic: '/əˈvɔɪd/', meaning: '避開；避免',
    scene: '避開地板上的鬆動石塊', sentence: 'Try to ___ the loose stones near the entrance.',
    translation: '盡量避開入口附近鬆動的石塊。',
    relatedWords: [
      { word: 'prevent', meaning: '預防；阻止', relation: 'avoid 是自己避開；prevent 是阻止某件事發生。' },
      { word: 'escape', meaning: '逃脫；逃離', relation: 'escape 著重離開危險或被困的地方。' },
    ],
    mnemonic: 'avoid 後面常接名詞或動名詞：avoid the stones、avoid falling。',
    choices: ['avoid', 'prevent', 'escape', 'ignore'], targetLanguage: 'en', locale: 'en-US', level: 'intermediate', region: 'ruins',
  },
  {
    id: 'preserve', word: 'preserve', phonetic: '/prɪˈzɝːv/', meaning: '保存；維護（避免受損或消失）',
    scene: '保留遺跡牆上的壁畫', sentence: 'The museum works to ___ the ancient mural.',
    translation: '博物館致力保存這幅古代壁畫。',
    relatedWords: [
      { word: 'conserve', meaning: '保育；節約保存', relation: 'conserve 常用於資源、自然環境或能源的保育。' },
      { word: 'protect', meaning: '保護', relation: 'protect 著重防止傷害；preserve 著重讓原貌或狀態留存。' },
    ],
    mnemonic: 'preserve a memory 是留住回憶；preserve a mural 是保存壁畫。',
    choices: ['preserve', 'conserve', 'protect', 'restore'], targetLanguage: 'en', locale: 'en-US', level: 'intermediate', region: 'ruins',
  },
  {
    id: 'evidence', word: 'evidence', phonetic: '/ˈevɪdəns/', meaning: '證據；佐證',
    scene: '從刻痕中尋找古文明線索', sentence: 'The marks are ___ that people lived here long ago.',
    translation: '這些刻痕是人們很久以前曾住在此地的證據。',
    relatedWords: [
      { word: 'proof', meaning: '證明；證據', relation: 'proof 常指足以證明某事為真的證據。' },
      { word: 'clue', meaning: '線索', relation: 'clue 是協助推理的線索，不一定本身就能證明結論。' },
    ],
    mnemonic: 'evidence 是支持判斷的證據；clue 是幫你找到答案的線索。',
    choices: ['evidence', 'proof', 'clue', 'event'], targetLanguage: 'en', locale: 'en-US', level: 'intermediate', region: 'ruins',
  },
];

const japaneseBeginner: LanguageLesson[] = [
  {
    id: 'ja-arigatou', word: 'ありがとう', phonetic: 'arigatō', meaning: '謝謝',
    scene: '感謝村民幫忙找回地圖', sentence: '地図を見つけてくれて、___。',
    translation: '謝謝你幫我找到地圖。',
    relatedWords: [
      { word: 'どうも', meaning: '多謝；打招呼用語', relation: '較口語；也常和ありがとう連用表示感謝。' },
      { word: 'すみません', meaning: '不好意思；對不起', relation: '可用來道歉，也可在麻煩別人時先致意。' },
    ],
    mnemonic: 'ありがとう是日常感謝用語；正式場合可說「ありがとうございます」。',
    choices: ['ありがとう', 'こんにちは', 'すみません', 'さようなら'], targetLanguage: 'ja', locale: 'ja-JP', level: 'beginner', region: 'village',
  },
  {
    id: 'ja-sumimasen', word: 'すみません', phonetic: 'sumimasen', meaning: '不好意思；對不起；勞駕',
    scene: '在村口向旅人問路', sentence: '___、駅はどこですか。',
    translation: '不好意思，車站在哪裡？',
    relatedWords: [
      { word: 'ごめんなさい', meaning: '對不起', relation: '較直接的道歉說法；すみません也常用來引起注意。' },
      { word: 'ありがとう', meaning: '謝謝', relation: 'すみません有時也可帶有「不好意思，謝謝你」的語氣。' },
    ],
    mnemonic: '在日本向陌生人提問前，常先用すみません禮貌地引起注意。',
    choices: ['すみません', 'ありがとう', 'おはよう', 'お願いします'], targetLanguage: 'ja', locale: 'ja-JP', level: 'beginner', region: 'village',
  },
  {
    id: 'ja-mizu', word: '水', phonetic: 'mizu', meaning: '水',
    scene: '探索前向商人買水', sentence: 'のどが渇きました。___をください。',
    translation: '我口渴了，請給我水。',
    relatedWords: [
      { word: 'お茶', meaning: '茶', relation: '常見飲料；讀作 ocha。' },
      { word: '火', meaning: '火', relation: '讀作 hi；和水是不同的自然元素。' },
    ],
    mnemonic: '水讀作 mizu；「水をください」是「請給我水」。',
    choices: ['水', 'お茶', '火', '山'], targetLanguage: 'ja', locale: 'ja-JP', level: 'beginner', region: 'village',
  },
  {
    id: 'ja-neko', word: '猫', phonetic: 'neko', meaning: '貓',
    scene: '看見村莊屋簷上的小貓', sentence: 'あの___はかわいいです。',
    translation: '那隻貓很可愛。',
    relatedWords: [
      { word: '犬', meaning: '狗', relation: '常見寵物；讀作 inu。' },
      { word: '鳥', meaning: '鳥', relation: '讀作 tori；也是常見動物詞。' },
    ],
    mnemonic: '猫讀作 neko；看到屋簷上的貓，就記住 neko。',
    choices: ['猫', '犬', '鳥', '魚'], targetLanguage: 'ja', locale: 'ja-JP', level: 'beginner', region: 'village',
  },
  {
    id: 'ja-tabemasu', word: '食べます', phonetic: 'tabemasu', meaning: '吃（禮貌說法）',
    scene: '出發前吃一頓早餐', sentence: '朝ごはんを___。',
    translation: '吃早餐。',
    relatedWords: [
      { word: '飲みます', meaning: '喝（禮貌說法）', relation: '讀作 nomimasu；常接飲料。' },
      { word: '見ます', meaning: '看（禮貌說法）', relation: '讀作 mimasu；表示觀看。' },
    ],
    mnemonic: '食べます讀作 tabemasu；朝ごはん（早餐）を食べます。',
    choices: ['食べます', '飲みます', '見ます', '行きます'], targetLanguage: 'ja', locale: 'ja-JP', level: 'beginner', region: 'village',
  },
  {
    id: 'ja-mimasu', word: '見ます', phonetic: 'mimasu', meaning: '看；觀看（禮貌說法）',
    scene: '出發前查看任務地圖', sentence: '出発する前に地図を___。',
    translation: '出發前先看地圖。',
    relatedWords: [
      { word: '読みます', meaning: '讀（禮貌說法）', relation: '讀作 yomimasu；強調閱讀文字。' },
      { word: '聞きます', meaning: '聽；詢問（禮貌說法）', relation: '讀作 kikimasu；可指聽聲音或詢問。' },
    ],
    mnemonic: '見ます讀作 mimasu；出發前先看看地圖，確認方向。',
    choices: ['見ます', '読みます', '聞きます', '食べます'], targetLanguage: 'ja', locale: 'ja-JP', level: 'beginner', region: 'village',
  },
];

export const LANGUAGE_PACKS: Record<'en' | 'ja', LanguageLesson[]> = {
  en: [...LANGUAGE_LESSONS, ...forestBeginner, ...ruinsIntermediate],
  ja: japaneseBeginner,
};

export const ALL_LANGUAGE_LESSONS: LanguageLesson[] = Object.values(LANGUAGE_PACKS).flat();
