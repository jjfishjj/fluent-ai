export interface RelatedWord {
  word: string;
  meaning: string;
  relation: string;
}

export interface LanguageLesson {
  id: string;
  word: string;
  phonetic: string;
  meaning: string;
  scene: string;
  sentence: string;
  translation: string;
  relatedWords: RelatedWord[];
  mnemonic: string;
  choices: string[];
}

/** Short, story-linked beginner lessons for the Qingyun memory shrine. */
export const LANGUAGE_LESSONS: LanguageLesson[] = [
  {
    id: 'meet',
    word: 'meet',
    phonetic: '/miːt/',
    meaning: '遇見；碰面',
    scene: '在村口與嚮導會合',
    sentence: 'We ___ at the village gate before sunset.',
    translation: '日落前，我們在村口碰面。',
    relatedWords: [
      { word: 'meat', meaning: '肉', relation: '同音字：發音相同，意思不同。' },
      { word: 'greet', meaning: '問候', relation: '相近情境：先遇見 meet，再向對方問候 greet。' },
    ],
    mnemonic: 'meet 和 meat 同音：想像你 meet 到同伴，接著一起吃 meat。',
    choices: ['meet', 'meat', 'greet', 'wait'],
  },
  {
    id: 'right',
    word: 'right',
    phonetic: '/raɪt/',
    meaning: '右邊；正確的',
    scene: '沿著發光燈籠找路',
    sentence: 'Turn ___ after the old bridge.',
    translation: '經過老橋後向右轉。',
    relatedWords: [
      { word: 'write', meaning: '寫；寫下', relation: '同音字：發音相同，詞義與拼法不同。' },
      { word: 'light', meaning: '光；輕的', relation: '近音字：押韻相近，但開頭音不同。' },
    ],
    mnemonic: 'right 和 write 同音：向 right 轉彎後，把路線 write 在地圖上。',
    choices: ['right', 'write', 'light', 'bright'],
  },
  {
    id: 'hear',
    word: 'hear',
    phonetic: '/hɪr/',
    meaning: '聽見；聽到',
    scene: '在竹林聽見遠處鐘聲',
    sentence: 'I can ___ a bell from the bamboo forest.',
    translation: '我可以從竹林那頭聽見鐘聲。',
    relatedWords: [
      { word: 'here', meaning: '這裡；在這裡', relation: '常見英語口音中與 hear 同音，意思不同。' },
      { word: 'listen', meaning: '留心聽', relation: '相關動詞：hear 是聽到，listen 是主動留心聽。' },
    ],
    mnemonic: 'hear 和 here 常同音：人在 here（這裡），就能 hear（聽見）鐘聲。',
    choices: ['hear', 'here', 'listen', 'there'],
  },
  {
    id: 'borrow',
    word: 'borrow',
    phonetic: '/ˈbɑːroʊ/',
    meaning: '借入；向別人借',
    scene: '向旅人借一張地圖',
    sentence: 'May I ___ your map for this quest?',
    translation: '我可以為了這趟任務借你的地圖嗎？',
    relatedWords: [
      { word: 'lend', meaning: '借出；把東西借給別人', relation: '方向相反：borrow 是借進來，lend 是借出去。' },
      { word: 'loan', meaning: '借出；貸款', relation: '同一借貸情境；loan 常作名詞，也可作動詞。' },
    ],
    mnemonic: 'borrow 可用「抱來」作近似諧音鉤子：把借來的東西抱來，用完記得歸還。這只是記憶提示，不是標準發音。',
    choices: ['borrow', 'lend', 'bring', 'keep'],
  },
  {
    id: 'tell',
    word: 'tell',
    phonetic: '/tel/',
    meaning: '告訴；告知（某人）',
    scene: '向守門人傳達隊伍已集結',
    sentence: 'Please ___ the guard that we are ready.',
    translation: '請告訴守衛我們準備好了。',
    relatedWords: [
      { word: 'say', meaning: '說出；表達', relation: 'say 著重說出的內容，tell 常接聽者：tell someone something。' },
      { word: 'speak', meaning: '說話；演講', relation: 'speak 常指說話這個動作或語言能力。' },
    ],
    mnemonic: '把消息 tell 給某人時，聽者通常直接接在 tell 後面：tell the guard。',
    choices: ['tell', 'say', 'speak', 'talk'],
  },
  {
    id: 'bring',
    word: 'bring',
    phonetic: '/brɪŋ/',
    meaning: '帶來；帶到共同目的地',
    scene: '前往神殿時記得帶上燈籠',
    sentence: 'When you come to the shrine, ___ a lantern.',
    translation: '你來神殿時，帶一盞燈籠來。',
    relatedWords: [
      { word: 'take', meaning: '帶走；帶去', relation: '常從目前位置看方向：take it away，bring it here。' },
      { word: 'carry', meaning: '拿著；搬運', relation: '著重攜帶的動作，不特別指定方向。' },
    ],
    mnemonic: '來到大家約好的地方，就 bring 東西「帶來」；離開時再 take「帶走」。',
    choices: ['bring', 'take', 'carry', 'fetch'],
  },
  {
    id: 'dessert',
    word: 'dessert',
    phonetic: '/dɪˈzɝːt/',
    meaning: '餐後甜點',
    scene: '村民宴會後分甜點',
    sentence: 'After dinner, the villagers shared a chocolate ___.',
    translation: '晚餐後，村民們一起分享巧克力甜點。',
    relatedWords: [
      { word: 'desert', meaning: '沙漠；遺棄', relation: '名詞「沙漠」重音在前；dessert「甜點」重音在後。' },
      { word: 'sweet', meaning: '甜食；甜的', relation: '泛指糖果或甜食，也可作形容詞「甜的」。' },
    ],
    mnemonic: 'dessert 有兩個 s，想像甜點太好吃，還想再來一份 seconds。',
    choices: ['dessert', 'desert', 'candy', 'snack'],
  },
  {
    id: 'lose',
    word: 'lose',
    phonetic: '/luːz/',
    meaning: '失去；弄丟；輸掉',
    scene: '森林迷霧中保管好地圖',
    sentence: 'Keep the map safe so you do not ___ it in the forest.',
    translation: '把地圖收好，才不會在森林裡把它弄丟。',
    relatedWords: [
      { word: 'loose', meaning: '鬆的；不牢固的', relation: '多一個 o；形容繩結或衣物不夠緊。' },
      { word: 'miss', meaning: '錯過；想念', relation: 'miss the bus 是錯過公車，不是把物品弄丟。' },
    ],
    mnemonic: 'lose 少一個 o，是把東西弄丟；loose 多一個 o，形容東西鬆鬆的。',
    choices: ['lose', 'loose', 'miss', 'leave'],
  },
];

/** Return a shuffled copy so the same answer is not always in the same position. */
export function shuffleLessonChoices<T>(choices: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...choices];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}
