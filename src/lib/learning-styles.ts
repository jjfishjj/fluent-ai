export type LearningStyle = 'visual' | 'auditory' | 'reading' | 'kinesthetic';

export interface QuizQuestion {
  id: number;
  question: string;
  options: { label: string; text: string; style: LearningStyle }[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: '你需要記住一個新的電話號碼，你會怎麼做？',
    options: [
      { label: 'A', text: '在腦海中想像數字的形狀和排列', style: 'visual' },
      { label: 'B', text: '大聲重複唸出號碼', style: 'auditory' },
      { label: 'C', text: '把號碼寫下來反覆閱讀', style: 'reading' },
      { label: 'D', text: '用手指在空中描繪數字', style: 'kinesthetic' },
    ],
  },
  {
    id: 2,
    question: '學習一個新的外語單字時，你偏好哪種方式？',
    options: [
      { label: 'A', text: '看圖片或圖表來聯想意思', style: 'visual' },
      { label: 'B', text: '聽母語者發音並跟讀', style: 'auditory' },
      { label: 'C', text: '閱讀單字的定義和例句', style: 'reading' },
      { label: 'D', text: '用這個單字造句或角色扮演', style: 'kinesthetic' },
    ],
  },
  {
    id: 3,
    question: '你要在一個陌生城市找路，你會優先：',
    options: [
      { label: 'A', text: '看地圖或導航的視覺路線', style: 'visual' },
      { label: 'B', text: '請人口頭指路給你聽', style: 'auditory' },
      { label: 'C', text: '閱讀文字版的路線指引', style: 'reading' },
      { label: 'D', text: '直接走走看，用身體感覺方向', style: 'kinesthetic' },
    ],
  },
  {
    id: 4,
    question: '準備考試時，你最有效的方法是：',
    options: [
      { label: 'A', text: '畫心智圖或做彩色筆記', style: 'visual' },
      { label: 'B', text: '把重點錄音反覆聽', style: 'auditory' },
      { label: 'C', text: '反覆閱讀課本和筆記', style: 'reading' },
      { label: 'D', text: '做練習題或實際操作', style: 'kinesthetic' },
    ],
  },
  {
    id: 5,
    question: '老師在課堂上講解一個概念，你最容易理解的方式是：',
    options: [
      { label: 'A', text: '老師畫圖或播放影片解釋', style: 'visual' },
      { label: 'B', text: '老師用清楚的語言講解', style: 'auditory' },
      { label: 'C', text: '自己閱讀教材上的說明', style: 'reading' },
      { label: 'D', text: '透過實驗或活動親身體驗', style: 'kinesthetic' },
    ],
  },
  {
    id: 6,
    question: '你想學會做一道新料理，你會：',
    options: [
      { label: 'A', text: '看 YouTube 烹飪影片', style: 'visual' },
      { label: 'B', text: '聽 Podcast 或朋友口述步驟', style: 'auditory' },
      { label: 'C', text: '閱讀食譜書上的詳細步驟', style: 'reading' },
      { label: 'D', text: '直接進廚房邊做邊學', style: 'kinesthetic' },
    ],
  },
  {
    id: 7,
    question: '開會或上課時，你的習慣是：',
    options: [
      { label: 'A', text: '在紙上畫圖或做視覺化筆記', style: 'visual' },
      { label: 'B', text: '專注聆聽，不太記筆記', style: 'auditory' },
      { label: 'C', text: '詳細地寫下每個重點', style: 'reading' },
      { label: 'D', text: '坐不住，喜歡動手或走動', style: 'kinesthetic' },
    ],
  },
  {
    id: 8,
    question: '你覺得最享受的休閒活動是：',
    options: [
      { label: 'A', text: '看電影、逛美術館、攝影', style: 'visual' },
      { label: 'B', text: '聽音樂、聊天、聽廣播', style: 'auditory' },
      { label: 'C', text: '閱讀小說、寫日記', style: 'reading' },
      { label: 'D', text: '運動、手作、戶外活動', style: 'kinesthetic' },
    ],
  },
  {
    id: 9,
    question: '當你需要向別人解釋一個複雜的想法時，你傾向：',
    options: [
      { label: 'A', text: '畫圖或用圖表來展示', style: 'visual' },
      { label: 'B', text: '用口語詳細解釋', style: 'auditory' },
      { label: 'C', text: '寫一份詳細的說明文件', style: 'reading' },
      { label: 'D', text: '用實際例子或比手畫腳來示範', style: 'kinesthetic' },
    ],
  },
  {
    id: 10,
    question: '練習外語對話時，你覺得最有幫助的方式是：',
    options: [
      { label: 'A', text: '看影片中的情境對話（有字幕）', style: 'visual' },
      { label: 'B', text: '和母語者進行口說練習', style: 'auditory' },
      { label: 'C', text: '閱讀對話範本並分析文法', style: 'reading' },
      { label: 'D', text: '在真實場景中直接使用（如點餐、問路）', style: 'kinesthetic' },
    ],
  },
];

export function calculateResult(answers: Record<number, LearningStyle>): {
  primary: LearningStyle;
  scores: Record<LearningStyle, number>;
} {
  const scores: Record<LearningStyle, number> = {
    visual: 0,
    auditory: 0,
    reading: 0,
    kinesthetic: 0,
  };

  Object.values(answers).forEach((style) => {
    scores[style]++;
  });

  const primary = (Object.entries(scores) as [LearningStyle, number][])
    .sort((a, b) => b[1] - a[1])[0][0];

  return { primary, scores };
}

export const STYLE_INFO: Record<LearningStyle, {
  name: string;
  nameEn: string;
  emoji: string;
  color: string;
  description: string;
  languageTips: Record<string, string>;
}> = {
  visual: {
    name: '視覺型學習者',
    nameEn: 'Visual Learner',
    emoji: '👁️',
    color: 'hsl(220, 90%, 55%)',
    description: '你透過圖像、圖表和視覺化方式學習最有效。你善於記住看到的東西，喜歡使用顏色和空間來組織資訊。',
    languageTips: {
      english: '建議使用圖片單字卡、看英語影片搭配字幕、用心智圖整理文法規則、利用顏色標記不同詞性。',
      german: '建議使用圖解德語文法表、觀看德語影片、用顏色區分德語三個詞性（der/die/das）、製作視覺化單字卡。',
      french: '建議觀看法語電影、用圖表整理動詞變位、利用顏色標記陰陽性、製作情境圖片對照單字。',
      spanish: '建議看西語影集、用顏色圖表學動詞變位、製作圖片聯想單字卡、利用心智圖學文法。',
      japanese: '建議用圖像記憶假名和漢字、看日劇日動畫、用顏色標記敬語層級、製作視覺化文法筆記。',
      korean: '建議用圖像記憶韓文字母、看韓劇學口語、用顏色區分格助詞、製作視覺化文法表格。',
    },
  },
  auditory: {
    name: '聽覺型學習者',
    nameEn: 'Auditory Learner',
    emoji: '👂',
    color: 'hsl(142, 70%, 45%)',
    description: '你透過聆聽和口說方式學習最有效。你善於記住聽到的內容，喜歡討論和語音解釋。',
    languageTips: {
      english: '建議多聽英語 Podcast、練習跟讀 Shadowing、參加英語對話俱樂部、用語音備忘錄複習單字。',
      german: '建議收聽德語廣播、練習德語朗讀、找語言交換夥伴口說練習、用語音記錄德語發音。',
      french: '建議聽法語歌曲和 Podcast、練習法語連音 Liaison、找法語母語者對話、用錄音練習發音。',
      spanish: '建議聽拉丁音樂、練習西語連讀、參加西語會話課、用語音方式複習單字。',
      japanese: '建議聽日語廣播、練習跟讀日語、用語音記錄假名發音、多聽日語歌曲學語感。',
      korean: '建議聽 K-Pop 學韓語、練習跟讀韓語新聞、用語音方式學收音（받침）、參加韓語會話課。',
    },
  },
  reading: {
    name: '讀寫型學習者',
    nameEn: 'Read/Write Learner',
    emoji: '📖',
    color: 'hsl(38, 92%, 50%)',
    description: '你透過閱讀和書寫方式學習最有效。你善於從文字中吸收資訊，喜歡做筆記和列清單。',
    languageTips: {
      english: '建議多閱讀英文文章和書籍、寫英語日記、做詳細的文法筆記、利用英英字典學單字。',
      german: '建議閱讀德語簡易讀物、寫德語日記、做動詞變位表筆記、利用德德字典深化理解。',
      french: '建議閱讀法語短篇故事、寫法語作文、做動詞變位筆記、列出常用慣用語清單。',
      spanish: '建議閱讀西語新聞和小說、寫西語日記、詳細記錄文法規則、製作單字例句筆記。',
      japanese: '建議閱讀日語分級讀物、練習寫漢字和假名、做文法筆記、利用日語教材做摘要。',
      korean: '建議閱讀韓語文章、練習寫韓文、做文法筆記並整理例句、利用韓語教材做重點摘要。',
    },
  },
  kinesthetic: {
    name: '動覺型學習者',
    nameEn: 'Kinesthetic Learner',
    emoji: '🤸',
    color: 'hsl(340, 80%, 55%)',
    description: '你透過實際操作和身體活動學習最有效。你喜歡動手做和實際體驗，在活動中學習最有效率。',
    languageTips: {
      english: '建議在真實場景中使用英語（點餐、旅行）、用角色扮演練對話、邊走路邊背單字、參加英語互動工作坊。',
      german: '建議去德國旅行實地練習、用角色扮演模擬日常場景、邊運動邊聽德語、參加德語文化活動。',
      french: '建議法語烹飪課學法語、用角色扮演練情境對話、邊活動邊聽法語、參加法語文化體驗。',
      spanish: '建議拉丁舞蹈課學西語、在西語環境中實地練習、用角色扮演模擬場景、邊運動邊聽西語。',
      japanese: '建議參加日本文化體驗活動、用角色扮演練敬語場景、在日本料理課學日語、邊活動邊練習。',
      korean: '建議學做韓式料理時練韓語、用角色扮演練日常場景、參加韓國文化體驗、邊活動邊學韓語。',
    },
  },
};
