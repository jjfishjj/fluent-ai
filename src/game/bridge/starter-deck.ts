/**
 * Built-in vocabulary for players who arrive with an empty review deck.
 *
 * The public demo has no login, so most visitors have zero SRS cards — without
 * this pack the game would have no ammunition and simply not start. Anyone who
 * does have their own cards uses those first; this only fills the gap.
 *
 * The wording leans on the diplomatic / interpreting setting so the vocabulary
 * matches the fiction rather than feeling like a generic word list.
 */
export interface StarterEntry {
  en: string;
  zh: string;
  /** Revealed by the 諧音 / hint technique. */
  hint?: string;
  /** Shown after answering — the teaching beat. */
  note?: string;
  tier: 1 | 2 | 3;
}

export const STARTER_DECK_EN: StarterEntry[] = [
  // ── tier 1 — greetings and the basics of being polite ────────────────
  { en: 'delegation', zh: '代表團', hint: 'delegate 的名詞形', note: 'delegation 指整個代表團，delegate 是其中一位代表。', tier: 1 },
  { en: 'interpreter', zh: '口譯員', hint: 'interpret 加 -er', note: 'interpreter 是口譯，translator 是筆譯，兩者不可混用。', tier: 1 },
  { en: 'embassy', zh: '大使館', hint: '以 em- 開頭', note: 'embassy 是大使館，consulate 是領事館。', tier: 1 },
  { en: 'agenda', zh: '議程', hint: '源自拉丁文「該做的事」', note: 'on the agenda 表示「列入議程」。', tier: 1 },
  { en: 'briefing', zh: '簡報、情況說明', hint: 'brief 加 -ing', note: 'briefing 是會前說明，debriefing 是事後匯報。', tier: 1 },
  { en: 'courtesy', zh: '禮貌、禮遇', hint: 'court（宮廷）的衍生字', note: 'a courtesy call 是禮貌性拜會，不是「客氣的電話」。', tier: 1 },
  { en: 'protocol', zh: '禮賓、外交禮節', hint: '也有「協定」的意思', note: '外交場合的 protocol 指的是禮賓規範。', tier: 1 },
  { en: 'colleague', zh: '同事', hint: '中間有兩個 l', note: '正式場合用 colleague，比 co-worker 得體。', tier: 1 },
  { en: 'sincerely', zh: '誠摯地', hint: '書信結尾常見', note: 'Yours sincerely 用於知道對方姓名時。', tier: 1 },
  { en: 'schedule', zh: '行程表', hint: '英式讀 SHED-yool', note: '英式與美式發音不同，口譯時要留意。', tier: 1 },
  { en: 'venue', zh: '會場、地點', hint: '兩個音節', note: 'venue 特指活動舉辦的場地。', tier: 1 },
  { en: 'attendee', zh: '與會者', hint: 'attend 加 -ee', note: '-ee 結尾表示動作的承受者，如 employee。', tier: 1 },
  { en: 'remarks', zh: '致詞、談話', hint: '常用複數', note: 'opening remarks 是開場致詞。', tier: 1 },
  { en: 'hospitality', zh: '款待、好客', hint: 'hospital 的同源字', note: 'Thank you for your hospitality 是道別的標準說法。', tier: 1 },
  { en: 'itinerary', zh: '旅程安排', hint: '五個音節，重音在第二', note: 'itinerary 比 schedule 更強調路線與地點。', tier: 1 },
  { en: 'punctual', zh: '準時的', hint: 'point 的同源字', note: 'be punctual 在多數外交場合是硬性期待。', tier: 1 },

  // ── tier 2 — the working vocabulary of a meeting ──────────────────────
  { en: 'negotiate', zh: '談判、協商', hint: '以 neg- 開頭', note: 'negotiate a deal 是談成一筆協議。', tier: 2 },
  { en: 'consensus', zh: '共識', hint: 'sense 的同源字', note: 'reach a consensus 指達成共識，不需全體一致。', tier: 2 },
  { en: 'clarify', zh: '澄清、說明', hint: 'clear 的動詞化', note: '口譯不確定時，說 Could you clarify? 是專業做法。', tier: 2 },
  { en: 'paraphrase', zh: '換句話說', hint: 'para- + phrase', note: '口譯的核心技能：抓住意思而非逐字翻。', tier: 2 },
  { en: 'nuance', zh: '細微差別', hint: '法文借字', note: 'lose the nuance 是口譯最常見的失誤。', tier: 2 },
  { en: 'implication', zh: '言外之意', hint: 'imply 的名詞', note: 'implication 是暗示的內容，inference 是聽者的推論。', tier: 2 },
  { en: 'ambiguous', zh: '模稜兩可的', hint: 'ambi- 表示「兩者」', note: '外交辭令常刻意 ambiguous，翻譯時不該擅自澄清。', tier: 2 },
  { en: 'concession', zh: '讓步', hint: 'concede 的名詞', note: 'make a concession 是在談判中讓步。', tier: 2 },
  { en: 'reciprocal', zh: '互惠的', hint: '以 re- 開頭', note: 'reciprocal arrangement 指雙方對等的安排。', tier: 2 },
  { en: 'mediate', zh: '調停', hint: 'media（中間）同源', note: 'mediate 是居中調停，arbitrate 是仲裁裁決。', tier: 2 },
  { en: 'sovereignty', zh: '主權', hint: 'sovereign 加 -ty', note: '極度敏感的詞，口譯時不可意譯。', tier: 2 },
  { en: 'bilateral', zh: '雙邊的', hint: 'bi- 表示二', note: 'bilateral 是雙邊，multilateral 是多邊。', tier: 2 },
  { en: 'communiqué', zh: '公報', hint: '法文借字，字尾有重音符', note: 'a joint communiqué 是聯合公報。', tier: 2 },
  { en: 'reservations', zh: '保留意見', hint: '也有「預訂」的意思', note: 'have reservations about 表示對某事有疑慮。', tier: 2 },
  { en: 'endorse', zh: '背書、支持', hint: 'dorse 來自「背部」', note: 'endorse a proposal 是公開表態支持。', tier: 2 },
  { en: 'defer', zh: '推遲；順從', hint: '兩個意思差很多', note: 'defer to someone 是尊重對方的意見，不是拖延。', tier: 2 },

  // ── tier 3 — the phrases that separate fluent from correct ────────────
  { en: 'with all due respect', zh: '恕我直言', hint: '四個字的固定說法', note: '表面客氣，實際是準備反駁對方。', tier: 3 },
  { en: 'take it under advisement', zh: '會納入考慮', hint: 'advisement 很少單獨使用', note: '外交辭令的「再說吧」，通常不代表會採納。', tier: 3 },
  { en: 'frank and candid', zh: '坦率而直接', hint: '兩個近義詞並列', note: '外交公報裡出現這句，通常代表雙方談崩了。', tier: 3 },
  { en: 'agree to disagree', zh: '各自保留立場', hint: '同一個動詞出現兩次', note: '承認分歧但不再爭論的體面說法。', tier: 3 },
  { en: 'on background', zh: '不具名說明', hint: '記者會用語', note: '資訊可引用但不可指名來源。', tier: 3 },
  { en: 'read the room', zh: '看場合、察言觀色', hint: '動詞 + the + 名詞', note: '口譯除了翻字，也要能 read the room。', tier: 3 },
  { en: 'a candid exchange of views', zh: '坦誠交換意見', hint: '公報常見套語', note: '外交套話，實際常指「爭執激烈」。', tier: 3 },
  { en: 'without prejudice', zh: '不影響既有立場', hint: '法律與外交通用', note: '表示此次讓步不構成先例。', tier: 3 },
  { en: 'at your earliest convenience', zh: '請盡快（客氣說法）', hint: '五個字的書信套語', note: '比 as soon as possible 委婉但同樣是催促。', tier: 3 },
  { en: 'circle back', zh: '稍後再談', hint: '兩個字的商務片語', note: '常用來把當下不想回答的問題推遲。', tier: 3 },
  { en: 'lost in translation', zh: '翻譯中流失的意思', hint: '也是一部電影的片名', note: '口譯員最怕聽到的一句評語。', tier: 3 },
  { en: 'save face', zh: '保住顏面', hint: '兩個字，動詞開頭', note: '東亞外交場合的關鍵概念，翻譯時務必保留。', tier: 3 },
];

/** All starter decks, keyed by the language they teach. */
export const STARTER_DECKS: Record<string, StarterEntry[]> = {
  english: STARTER_DECK_EN,
};

export function starterDeck(language: string): StarterEntry[] {
  return STARTER_DECKS[language] ?? STARTER_DECK_EN;
}
