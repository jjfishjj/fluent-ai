import type { QuestDef } from '../core/types';

/** A short main line that walks the player through every zone. */
export const QUESTS: Record<string, QuestDef> = {
  q0: {
    id: 'q0',
    name: '守林人的通行委託',
    giver: 'pathkeeper',
    zone: 'qingyun',
    reqLevel: 1,
    kind: 'challenge',
    target: 'bring',
    count: 1,
    summary: '讀懂守林人的英文指示；答對後取得竹林通行令，開啟前往迷霧竹林的道路。',
    challenge: {
      lessonId: 'bring',
      prompt: 'When you come to the shrine, ___ a lantern.',
      question: '守林人正等你到神殿。選出最符合這句英文指示的動詞。',
      answer: 'bring',
      choices: ['bring', 'take', 'carry', 'fetch'],
      wrongHints: {
        take: 'take 常從目前位置看，表示「帶走／帶去」。留意句子裡的 come to：這句在說朝目的地帶來物品。',
        carry: 'carry 強調「拿著、搬運」的動作，沒有明確指出方向；再想想句子指定的目的地。',
        fetch: 'fetch 是「去取來」，包含先去拿、再帶回的意思；句子要表達的是到神殿時帶著燈籠來。',
      },
      successMessage: 'bring 是「帶來、帶到共同目的地」；你讀懂了守林人的指示。竹林道路已開啟。',
    },
    reward: { exp: 50, silver: 30, items: [{ itemId: 'forestpass', qty: 1 }] },
  },
  q1: {
    id: 'q1',
    name: '初入竹林',
    giver: 'elder',
    zone: 'qingyun',
    reqLevel: 1,
    kind: 'kill',
    target: 'lingzhi',
    count: 8,
    summary: '在迷霧竹林討伐 8 隻靈芝精',
    reward: { exp: 180, silver: 220, items: [{ itemId: 'redpotion', qty: 5 }] },
    next: 'q2',
  },
  q2: {
    id: 'q2',
    name: '採藥人的請託',
    giver: 'hunter',
    zone: 'bamboo',
    reqLevel: 4,
    kind: 'collect',
    target: 'spiritgrass',
    count: 12,
    summary: '收集 12 株靈芝草交給老陳',
    reward: { exp: 520, silver: 480, items: [{ itemId: 'clothrobe', qty: 1 }, { itemId: 'bluepotion', qty: 5 }] },
    next: 'q3',
  },
  q3: {
    id: 'q3',
    name: '淬火之材',
    giver: 'blacksmith',
    zone: 'canyon',
    reqLevel: 12,
    kind: 'kill',
    target: 'flamewolf',
    count: 15,
    summary: '在赤炎峽谷擊殺 15 隻赤焰狼',
    reward: { exp: 2600, silver: 1600, items: [{ itemId: 'steelblade', qty: 1 }, { itemId: 'goldpill', qty: 2 }] },
    next: 'q4',
  },
  q4: {
    id: 'q4',
    name: '斬妖除魔',
    giver: 'monk',
    zone: 'abyss',
    reqLevel: 22,
    kind: 'kill',
    target: 'treelord',
    count: 1,
    summary: '討伐幽冥洞窟深處的千年樹妖王',
    reward: { exp: 12000, silver: 8000, items: [{ itemId: 'dragonplate', qty: 1 }, { itemId: 'goldpill', qty: 5 }] },
  },
};

export const QUEST_LIST = Object.values(QUESTS);

export function questDef(id: string): QuestDef | undefined {
  return QUESTS[id];
}
