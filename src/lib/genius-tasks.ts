// Per-type English training tasks (課題). Each launches the AI practice partner
// with a scenario tailored to that memory-genius type's encode/retrieve style.
// Focus: memory + English.
import { GeniusType } from './genius-type';

export interface GeniusTask {
  title: string;
  desc: string;
  prompt: string; // kicks off the AI practice session (English)
}

export const GENIUS_TASKS: Record<GeniusType, GeniusTask[]> = {
  explorer: [
    { title: '機場情境角色扮演', desc: '在機場 check-in 的真實場景中把新單字用出來', prompt: "Let's role-play an airport check-in entirely in English. You are the check-in agent, I'm the traveler. Keep it at my level, introduce useful travel vocabulary naturally, and gently correct my mistakes." },
    { title: '咖啡廳點餐即興', desc: '進入場景、即席應對，把詞彙嵌進情境記憶', prompt: "Role-play ordering at a café in English. You're the barista. Improvise, ask follow-up questions, and feed me natural phrases as we go." },
    { title: '難忘旅行口說', desc: '把一段真實體驗用英文說成故事', prompt: "Ask me about a memorable trip and help me tell the whole story in English, giving me better vocabulary as I speak." },
  ],
  architect: [
    { title: '時態框架建立', desc: '先看見整體結構，再填入例句', prompt: "Teach me the English tense system as a clear structured framework first, then drill me with fill-in example sentences." },
    { title: '詞根家族擴展', desc: '用字根邏輯把詞彙組織成網路', prompt: "Pick one English word root and build its word family with me, explaining the logic of each derivation." },
    { title: '文法結構精讀', desc: '逐句分析一段文字的語法結構', prompt: "Give me a short English paragraph and let's analyze its grammar structure sentence by sentence." },
  ],
  melodist: [
    { title: 'Shadowing 跟讀', desc: '標出重音與節奏，跟讀到自然', prompt: "Give me a short natural English sentence, mark the stress and rhythm, have me shadow it, then check my intonation." },
    { title: '語調模仿', desc: '用不同情緒說同一句，模仿語調', prompt: "Say a few English phrases with different emotions; I'll mimic the intonation and you give me feedback." },
    { title: '歌詞發音學習', desc: '拆解一句歌詞的發音與連音', prompt: "Pick one simple English song line, break down its pronunciation, stress and linking, and teach me to say it naturally." },
  ],
  narrator: [
    { title: '故事複述', desc: '聽一段短故事，用自己的話重述', prompt: "Tell me a very short English story, then have me retell it in my own words while you help me with vocabulary." },
    { title: '生活故事口說', desc: '把最近發生的事說成有情緒的故事', prompt: "Ask me about something that happened to me recently and help me narrate it in English with feeling and detail." },
    { title: '情感詞彙場景', desc: '每個情緒詞配一個有人物的小場景', prompt: "Teach me English words for emotions by putting each one into a mini scene with a character and a feeling." },
  ],
  connector: [
    { title: '類比記單字', desc: '每個新詞連結到你已知的概念', prompt: "Teach me new English words by linking each one to something I already know through an analogy or metaphor." },
    { title: '雙語語感對比', desc: '對比中英表達的微妙差異', prompt: "Compare an English expression with its Chinese counterpart and discuss the nuance differences with me." },
    { title: '跨主題連結', desc: '從你的興趣延伸英文詞彙網', prompt: "Ask me about one of my interests, then teach English vocabulary from that domain, connecting across topics." },
  ],
  analyst: [
    { title: '錯誤原理分析', desc: '每個錯誤都講清楚背後的規則', prompt: "Have an English conversation with me, and whenever I make a mistake, explain the underlying rule and why it's wrong." },
    { title: '費曼解釋', desc: '把規則講回給 AI，找出理解缺口', prompt: "Give me an English grammar point; I'll explain it back to you, and you point out any gaps in my understanding." },
    { title: '易混用法辨析', desc: '辨析兩個易混詞背後的邏輯', prompt: "Teach me the difference between two commonly confused English words or phrases, with the logic behind each." },
  ],
  performer: [
    { title: '即興對話', desc: '不準備，在壓力下讓詞彙自然浮現', prompt: "Start an unscripted English conversation on a random everyday topic and keep me talking with quick prompts." },
    { title: '一分鐘演說', desc: '就一個題目連續說一分鐘', prompt: "Give me a simple topic and coach me to speak about it for one minute in English, then give feedback." },
    { title: '情境演練', desc: '角色扮演真實場景、即興發揮', prompt: "Role-play a lively real-life English scenario (job interview, meeting a friend) and improvise it with me." },
  ],
  visionary: [
    { title: '視覺化單字', desc: '每個詞配一個鮮明的畫面', prompt: "Teach me new English words by painting a vivid mental image for each; describe the scene so I can 'see' it." },
    { title: '場景描述', desc: '用英文描述一個畫面，練視覺詞彙', prompt: "Describe a scene to me in words and have me describe it back in English, feeding me visual vocabulary." },
    { title: '記憶宮殿', desc: '把今天的單字放進空間位置', prompt: "Help me place today's English words into rooms of a memory palace, describing each vivid image with me." },
  ],
};
