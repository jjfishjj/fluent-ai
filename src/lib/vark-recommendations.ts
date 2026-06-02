import { LearningStyle } from './learning-styles';

// Short tips shown during practice conversations
export const VARK_PRACTICE_TIPS: Record<LearningStyle, string[]> = {
  visual: [
    '試著開啟「圖片模式」，讓 AI 在對話中生成情境圖片，加深視覺記憶',
    '請 AI 用條列式或圖表整理今天學到的文法規則',
    '把新單字和一個鮮明的圖像連結起來，你會記得更久',
    '可以請 AI 詳細描述一個場景，試著在腦中「看」這個畫面',
  ],
  auditory: [
    '點擊 AI 訊息旁的「播放」鍵，練習跟讀，感受語言的節奏和語調',
    '試著用麥克風語音輸入，聽覺型學習者多開口說進步最快',
    '請 AI 用不同語調重複同一句話，感受正式與口語風格的差異',
    '把今天練習的對話朗讀出來，睡前在腦中回想，記憶效果加倍',
  ],
  reading: [
    '請 AI 把剛才的對話整理成書面例句，方便你之後複習筆記',
    '試著把今天學的新句型抄寫一遍，讀寫型學習者手寫記憶效果最好',
    '可以請 AI 詳細解釋文法規則，並提供 5 個不同情境的書面例句',
    '練習完後用目標語言寫幾句話記錄心得，鞏固今天所學',
  ],
  kinesthetic: [
    '試著把對話場景設定得更真實，假裝你現在真的在點餐或問路！',
    '換個不同場景繼續練，動覺型學習者在多變的環境中學得最快',
    '用今天學的詞彙描述你現在正在做的事，讓語言和實際行動結合',
    '找個真實場合使用今天練習的語言，比如用外語點外送或問店員',
  ],
};

export function getRandomTip(style: LearningStyle): string {
  const tips = VARK_PRACTICE_TIPS[style];
  return tips[Math.floor(Math.random() * tips.length)];
}

// Detailed recommendations shown on Profile page
export const VARK_DEEP_RECS: Record<LearningStyle, { tips: string[]; fluent_features: string[] }> = {
  visual: {
    tips: [
      '使用「圖片模式」讓 AI 生成情境圖，邊看邊學',
      '請 AI 用表格或條列整理文法，視覺化結構最適合你',
      '用不同顏色標記詞性（名詞/動詞/形容詞），增強記憶',
      '善用字幕影片學習，眼睛看著文字同時聽音訊效果最好',
    ],
    fluent_features: ['圖片模式', '影片分析', '條列式文法說明'],
  },
  auditory: {
    tips: [
      '多使用麥克風語音輸入，強迫自己開口說',
      'AI 每次回覆後都點播放練習跟讀（Shadowing）',
      '請 AI 示範同一句話的正式、半正式、口語版本',
      '練習收聽目標語言的 Podcast 或廣播節目',
    ],
    fluent_features: ['語音輸入', 'AI 播放功能', '語調對比練習'],
  },
  reading: {
    tips: [
      '每次練習結束前請 AI 整理今日學習重點的書面摘要',
      '養成用目標語言寫對話練習訊息的習慣',
      '多請 AI 提供詳細文法解析和例句，建立系統筆記',
      '練習後寫 3 句外語日記，把當天所學融入真實表達',
    ],
    fluent_features: ['書面文法解析', '例句大全', '連結分析功能'],
  },
  kinesthetic: {
    tips: [
      '選擇生活場景（日常、旅遊、餐廳）做情境對話練習',
      '每週嘗試 3 種不同場景，保持學習的新鮮感',
      '找語言交換夥伴，在真實互動中學習最有感',
      '把今天練習的語言用在真實生活，比如用外語買東西',
    ],
    fluent_features: ['多場景選擇', '角色扮演模式', '語伴配對功能'],
  },
};
