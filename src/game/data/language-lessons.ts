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
];
