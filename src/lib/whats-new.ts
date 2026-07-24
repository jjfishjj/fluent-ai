export interface WhatsNewEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
}

// 新項目加在最前面（陣列第一筆 = 最新）。id 用日期+短名，不要重複使用舊 id。
export const WHATS_NEW: WhatsNewEntry[] = [
  {
    id: '2026-07-14-qa-training-admin',
    date: '2026-07-14',
    title: '📚 新增「訓練資料」管理後台',
    description: '/admin → 訓練資料，可自行新增問答範例，讓機器人回答時參考你輸入的風格與內容（可限定語言或記憶天才型態）。',
  },
  {
    id: '2026-07-12-gemini-default-fix',
    date: '2026-07-12',
    title: '🔧 修正 Gemini 預設模型',
    description: '新帳號改用 gemini-flash-latest，避免舊模型名在新帳號額度下打不通。',
  },
  {
    id: '2026-07-11-provider-agnostic-ai',
    date: '2026-07-11',
    title: '🤖 聊天機器人脫離 Lovable',
    description: '後端改為可設定供應商——支援 Google Gemini（免費額度）、Anthropic Claude，或任何 OpenAI 相容 API，不再綁定單一平台。',
  },
  {
    id: '2026-07-11-chat-error-surface',
    date: '2026-07-11',
    title: '⚠️ 機器人不再無聲卡住',
    description: '對話逾時或連線失敗時，會直接在對話中顯示看得懂的錯誤訊息，而不是打字點點一直轉。',
  },
];
