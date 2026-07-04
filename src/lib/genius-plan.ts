// Per-type memory training plan (app-side canonical version of the MemoBrain doc).
// Drives the type-adaptive encode template, retrieval mode, and the SRS schedule.
import { GeniusType } from './genius-type';

export interface EncodeMode {
  label: string;   // e.g. 場景編碼
  field: string;   // label for the encode payload input
  hint: string;    // placeholder / guidance
}
export type RetrieveInput = 'write' | 'speak' | 'visualize';
export interface RetrieveMode {
  label: string;   // e.g. 情境演出
  prompt: string;  // what the user does to actively retrieve during review
  input: RetrieveInput; // how the review card asks for recall
}
export interface GeniusPlan {
  signature: string;
  encode: EncodeMode;
  retrieve: RetrieveMode;
  schedule: number[]; // spaced-repetition intervals in days
}

export const GENIUS_PLAN: Record<GeniusType, GeniusPlan> = {
  explorer: {
    signature: '情境頓悟——你在一個真實或想像的場景裡「突然懂了」，死背對你最沒效率。',
    encode: { label: '場景編碼', field: '使用場景', hint: '我在哪裡會用到？跟誰說？當時心情是什麼？' },
    retrieve: { label: '情境演出', prompt: '關上資料，進入那個場景，把這個詞用一句話說出來。', input: 'speak' },
    schedule: [1, 3, 8, 20],
  },
  architect: {
    signature: '邏輯框架——資訊放進清晰結構後，你的記憶保留率最高。',
    encode: { label: '框架編碼', field: '結構 / 規則', hint: '它的上位概念是什麼？和你已知的哪條規則相關？' },
    retrieve: { label: '合書輸出', prompt: '不看筆記，從結構節點生出一個完整的英文句子。', input: 'write' },
    schedule: [1, 7, 21, 60],
  },
  melodist: {
    signature: '音韻共鳴——你記住的是聲音在耳邊迴響的感覺。',
    encode: { label: '聲音編碼', field: '發音 / 節奏', hint: '先唸音標三次，標出重音與節奏感。' },
    retrieve: { label: '跟讀複述', prompt: '唸一遍，遮住文字，憑聲音印象把它複述出來。', input: 'speak' },
    schedule: [1, 4, 10, 28],
  },
  narrator: {
    signature: '情感故事——有情感連結的詞才留得住。',
    encode: { label: '故事編碼', field: '故事 / 情緒', hint: '誰在說這句話？什麼心情？對方如何反應？' },
    retrieve: { label: '口說故事', prompt: '把這個詞自然嵌進一段有情緒的小故事，說出來。', input: 'speak' },
    schedule: [1, 5, 14, 35],
  },
  connector: {
    signature: '跨域連結——一個詞和已知概念連上，就很難忘。',
    encode: { label: '連結編碼', field: '類比 / 連結', hint: '這個詞讓我想到…（跨領域的類比或隱喻）' },
    retrieve: { label: '教學解釋', prompt: '像教別人一樣，解釋這個詞和你連結的概念是什麼。', input: 'write' },
    schedule: [1, 5, 15, 40],
  },
  analyst: {
    signature: '原理輸出——你不記住不理解的東西，弄懂後保留最久。',
    encode: { label: '原理編碼', field: '為什麼 / 原理', hint: '為什麼英語這樣說？和中文邏輯差在哪？' },
    retrieve: { label: '費曼解釋', prompt: '不看材料，用自己的話把這個規則從頭講一遍。', input: 'write' },
    schedule: [1, 7, 21, 60],
  },
  performer: {
    signature: '即時輸出——你記住的是「說出口的那一刻」。',
    encode: { label: '開口編碼', field: '口說句子', hint: '大聲造一個句子；想一個真實場景再說一遍。' },
    retrieve: { label: '即興輸出', prompt: '不準備，直接用這個詞即興說出一句話。', input: 'speak' },
    schedule: [1, 3, 9, 25],
  },
  visionary: {
    signature: '空間視覺——你的大腦以圖像和位置為記憶索引。',
    encode: { label: '圖像編碼', field: '畫面 / 位置', hint: '為它創造一個誇張具體的畫面，放進一個空間位置。' },
    retrieve: { label: '圖像重建', prompt: '先在腦中重建那個畫面，再從畫面裡說出這個詞。', input: 'visualize' },
    schedule: [1, 6, 18, 45],
  },
};

// Fallback for users who haven't taken the assessment — plain active recall.
export const DEFAULT_PLAN: GeniusPlan = {
  signature: '主動回想（active recall）+ 間隔複習，是對所有人都有效的記憶法。',
  encode: { label: '主動編碼', field: '記憶鉤子', hint: '給這個詞一個鉤子：場景、聯想或一個例句。' },
  retrieve: { label: '主動回想', prompt: '不看答案，先自己回想意思與用法，再翻開對照。', input: 'write' },
  schedule: [1, 3, 7, 16, 35],
};

export function planFor(type: GeniusType | null | undefined): GeniusPlan {
  return type ? GENIUS_PLAN[type] : DEFAULT_PLAN;
}
