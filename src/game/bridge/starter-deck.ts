/**
 * Built-in vocabulary for players who arrive with an empty review deck.
 *
 * The public demo has no login, so most visitors have zero SRS cards — without
 * this the game would have no ammunition and simply not start. Anyone who does
 * have their own cards uses those first; this only fills the gap.
 *
 * The wording leans on the diplomatic / interpreting setting so the vocabulary
 * matches the fiction, and tier 3 of each deck is deliberately the material
 * that trips real interpreters up: phrases whose literal meaning and actual
 * meaning point in different directions.
 */
export interface StarterEntry {
  /** The target-language term. */
  term: string;
  /** What it means, in the player's language. */
  meaning: string;
  /** Revealed by a hint technique. */
  hint?: string;
  /** Shown after answering — the teaching beat. */
  note?: string;
  tier: 1 | 2 | 3;
  /** What this entry drills. Obstacles and boss stages ask for topics by
   *  name, so 佐藤大使 can spend a stage on keigo alone. Filled in from the
   *  entry's tier when not stated. */
  topics?: string[];
}

export const STARTER_DECK_EN: StarterEntry[] = [
  // tier 1 — the basics of being in the room
  { term: 'delegation', meaning: '代表團', hint: 'delegate 的名詞形', note: 'delegation 指整個代表團，delegate 是其中一位代表。', tier: 1 },
  { term: 'interpreter', meaning: '口譯員', hint: 'interpret 加 -er', note: 'interpreter 是口譯，translator 是筆譯，兩者不可混用。', tier: 1 },
  { term: 'embassy', meaning: '大使館', hint: '以 em- 開頭', note: 'embassy 是大使館，consulate 是領事館。', tier: 1 },
  { term: 'agenda', meaning: '議程', hint: '源自拉丁文「該做的事」', note: 'on the agenda 表示「列入議程」。', tier: 1 },
  { term: 'briefing', meaning: '簡報、情況說明', hint: 'brief 加 -ing', note: 'briefing 是會前說明，debriefing 是事後匯報。', tier: 1 },
  { term: 'courtesy', meaning: '禮貌、禮遇', hint: 'court（宮廷）的衍生字', note: 'a courtesy call 是禮貌性拜會，不是「客氣的電話」。', tier: 1 },
  { term: 'protocol', meaning: '禮賓、外交禮節', hint: '也有「協定」的意思', note: '外交場合的 protocol 指的是禮賓規範。', tier: 1 },
  { term: 'colleague', meaning: '同事', hint: '中間有兩個 l', note: '正式場合用 colleague，比 co-worker 得體。', tier: 1 },
  { term: 'sincerely', meaning: '誠摯地', hint: '書信結尾常見', note: 'Yours sincerely 用於知道對方姓名時。', tier: 1 },
  { term: 'schedule', meaning: '行程表', hint: '英式讀 SHED-yool', note: '英式與美式發音不同，口譯時要留意。', tier: 1 },
  { term: 'venue', meaning: '會場、地點', hint: '兩個音節', note: 'venue 特指活動舉辦的場地。', tier: 1 },
  { term: 'attendee', meaning: '與會者', hint: 'attend 加 -ee', note: '-ee 結尾表示動作的承受者，如 employee。', tier: 1 },
  { term: 'remarks', meaning: '致詞、談話', hint: '常用複數', note: 'opening remarks 是開場致詞。', tier: 1 },
  { term: 'hospitality', meaning: '款待、好客', hint: 'hospital 的同源字', note: 'Thank you for your hospitality 是道別的標準說法。', tier: 1 },
  { term: 'itinerary', meaning: '旅程安排', hint: '五個音節，重音在第二', note: 'itinerary 比 schedule 更強調路線與地點。', tier: 1 },
  { term: 'punctual', meaning: '準時的', hint: 'point 的同源字', note: 'be punctual 在多數外交場合是硬性期待。', tier: 1 },

  // tier 2 — the working vocabulary of a meeting
  { term: 'negotiate', meaning: '談判、協商', hint: '以 neg- 開頭', note: 'negotiate a deal 是談成一筆協議。', tier: 2 },
  { term: 'consensus', meaning: '共識', hint: 'sense 的同源字', note: 'reach a consensus 指達成共識，不需全體一致。', tier: 2 },
  { term: 'clarify', meaning: '澄清、說明', hint: 'clear 的動詞化', note: '口譯不確定時，說 Could you clarify? 是專業做法。', tier: 2 },
  { term: 'paraphrase', meaning: '換句話說', hint: 'para- + phrase', note: '口譯的核心技能：抓住意思而非逐字翻。', tier: 2 },
  { term: 'nuance', meaning: '細微差別', hint: '法文借字', note: 'lose the nuance 是口譯最常見的失誤。', tier: 2 },
  { term: 'implication', meaning: '言外之意', hint: 'imply 的名詞', note: 'implication 是暗示的內容，inference 是聽者的推論。', tier: 2 },
  { term: 'ambiguous', meaning: '模稜兩可的', hint: 'ambi- 表示「兩者」', note: '外交辭令常刻意 ambiguous，翻譯時不該擅自澄清。', tier: 2 },
  { term: 'concession', meaning: '讓步', hint: 'concede 的名詞', note: 'make a concession 是在談判中讓步。', tier: 2 },
  { term: 'reciprocal', meaning: '互惠的', hint: '以 re- 開頭', note: 'reciprocal arrangement 指雙方對等的安排。', tier: 2 },
  { term: 'mediate', meaning: '調停', hint: 'media（中間）同源', note: 'mediate 是居中調停，arbitrate 是仲裁裁決。', tier: 2 },
  { term: 'sovereignty', meaning: '主權', hint: 'sovereign 加 -ty', note: '極度敏感的詞，口譯時不可意譯。', tier: 2 },
  { term: 'bilateral', meaning: '雙邊的', hint: 'bi- 表示二', note: 'bilateral 是雙邊，multilateral 是多邊。', tier: 2 },
  { term: 'communiqué', meaning: '公報', hint: '法文借字，字尾有重音符', note: 'a joint communiqué 是聯合公報。', tier: 2 },
  { term: 'reservations', meaning: '保留意見', hint: '也有「預訂」的意思', note: 'have reservations about 表示對某事有疑慮。', tier: 2 },
  { term: 'endorse', meaning: '背書、支持', hint: 'dorse 來自「背部」', note: 'endorse a proposal 是公開表態支持。', tier: 2 },
  { term: 'defer', meaning: '推遲；順從', hint: '兩個意思差很多', note: 'defer to someone 是尊重對方的意見，不是拖延。', tier: 2 },

  // tier 3 — where literal and actual meaning part ways
  { term: 'with all due respect', meaning: '恕我直言', hint: '四個字的固定說法', note: '表面客氣，實際是準備反駁對方。', tier: 3 },
  { term: 'take it under advisement', meaning: '會納入考慮', hint: 'advisement 很少單獨使用', note: '外交辭令的「再說吧」，通常不代表會採納。', tier: 3 },
  { term: 'frank and candid', meaning: '坦率而直接', hint: '兩個近義詞並列', note: '外交公報裡出現這句，通常代表雙方談崩了。', tier: 3 },
  { term: 'agree to disagree', meaning: '各自保留立場', hint: '同一個動詞出現兩次', note: '承認分歧但不再爭論的體面說法。', tier: 3 },
  { term: 'on background', meaning: '不具名說明', hint: '記者會用語', note: '資訊可引用但不可指名來源。', tier: 3 },
  { term: 'read the room', meaning: '看場合、察言觀色', hint: '動詞 + the + 名詞', note: '口譯除了翻字，也要能 read the room。', tier: 3 },
  { term: 'a candid exchange of views', meaning: '坦誠交換意見', hint: '公報常見套語', note: '外交套話，實際常指「爭執激烈」。', tier: 3 },
  { term: 'without prejudice', meaning: '不影響既有立場', hint: '法律與外交通用', note: '表示此次讓步不構成先例。', tier: 3 },
  { term: 'at your earliest convenience', meaning: '請盡快（客氣說法）', hint: '五個字的書信套語', note: '比 as soon as possible 委婉但同樣是催促。', tier: 3 },
  { term: 'circle back', meaning: '稍後再談', hint: '兩個字的商務片語', note: '常用來把當下不想回答的問題推遲。', tier: 3 },
  { term: 'lost in translation', meaning: '翻譯中流失的意思', hint: '也是一部電影的片名', note: '口譯員最怕聽到的一句評語。', tier: 3 },
  { term: 'save face', meaning: '保住顏面', hint: '兩個字，動詞開頭', note: '東亞外交場合的關鍵概念，翻譯時務必保留。', tier: 3 },
];

export const STARTER_DECK_JA: StarterEntry[] = [
  // tier 1 — 場面の基本
  { term: '大使館', meaning: '常駐他國的最高外交機構', hint: 'たいしかん', note: '領事館是「領事館（りょうじかん）」，層級不同。', tier: 1 },
  { term: '通訳', meaning: '把口語即時轉成另一種語言的人', hint: 'つうやく', note: '口譯是「通訳」，筆譯是「翻訳（ほんやく）」。', tier: 1 },
  { term: '会議', meaning: '多人聚集討論的正式場合', hint: 'かいぎ', note: '「打ち合わせ」是較小型的碰頭會。', tier: 1 },
  { term: '資料', meaning: '會議上發放的紙本文件', hint: 'しりょう', note: '會議上發的紙本通常說「資料」而非「文書」。', tier: 1 },
  { term: '名刺', meaning: '名片', hint: 'めいし', note: '交換名片有固定禮節，雙手遞、先看再收。', tier: 1 },
  { term: '挨拶', meaning: '問候、致詞', hint: 'あいさつ', note: '開場的簡短致詞也叫「挨拶」。', tier: 1 },
  { term: '日程', meaning: '一段期間內的行程安排', hint: 'にってい', note: '「スケジュール」是外來語說法，兩者都通用。', tier: 1 },
  { term: '案内', meaning: '引導、帶路', hint: 'あんない', note: '「ご案内します」是「我為您帶路」。', tier: 1 },
  { term: '到着', meaning: '抵達', hint: 'とうちゃく', note: '相對詞是「出発（しゅっぱつ）」。', tier: 1 },
  { term: '準備', meaning: '事前的張羅與安排', hint: 'じゅんび', note: '「用意（ようい）」意思接近，語感更即時。', tier: 1 },
  { term: '確認', meaning: '再次核對以求無誤', hint: 'かくにん', note: '「確認させてください」是口譯要求再確認的標準說法。', tier: 1 },
  { term: '失礼します', meaning: '失禮了（進出、離席時）', hint: 'しつれいします', note: '進門、離席、掛電話都用得上。', tier: 1 },
  { term: 'よろしくお願いします', meaning: '請多指教、拜託了', hint: '最常用的萬用寒暄', note: '沒有直接對應的中文，依場合翻成「請多指教」或「麻煩您了」。', tier: 1 },
  { term: 'お世話になります', meaning: '承蒙關照', hint: '商務書信開頭', note: '幾乎所有商務郵件的第一句。', tier: 1 },
  { term: '恐れ入ります', meaning: '不好意思、勞駕', hint: 'おそれいります', note: '比「すみません」更正式的致歉／致謝。', tier: 1 },
  { term: '承知しました', meaning: '我明白了（謙讓）', hint: 'しょうちしました', note: '對上位者用「承知」，「了解しました」對上級略失禮。', tier: 1 },

  // tier 2 — 交渉の言葉
  { term: '交渉', meaning: '為達成協議而進行的往來', hint: 'こうしょう', note: '「折衝（せっしょう）」語感更硬。', tier: 2 },
  { term: '合意', meaning: '雙方談成的一致意見', hint: 'ごうい', note: '「合意に達する」是達成協議。', tier: 2 },
  { term: '検討', meaning: '仔細研究是否可行', hint: 'けんとう', note: '日本商務中「検討します」常是婉拒，見 tier 3。', tier: 2 },
  { term: '調整', meaning: '協調各方以互相配合', hint: 'ちょうせい', note: '「調整中です」意思是還在喬，別翻成「正在修理」。', tier: 2 },
  { term: '前向き', meaning: '積極正面的', hint: 'まえむき', note: '字面是「向前」，指態度積極。', tier: 2 },
  { term: '慎重', meaning: '小心而不輕率', hint: 'しんちょう', note: '「慎重に検討」通常代表不太樂觀。', tier: 2 },
  { term: '遺憾', meaning: '外交上表達不滿的正式用語', hint: 'いかん', note: '外交場合的「遺憾です」是明確的抗議，不是感嘆。', tier: 2 },
  { term: '懸念', meaning: '對可能的壞結果感到不安', hint: 'けねん', note: '「懸念を表明する」是正式表達關切。', tier: 2 },
  { term: '見解', meaning: '代表官方的正式看法', hint: 'けんかい', note: '比「意見」更正式、更代表官方立場。', tier: 2 },
  { term: '立場', meaning: '因身分而必須採取的位置', hint: 'たちば', note: '「立場上」表示「基於身分不得不」。', tier: 2 },
  { term: '譲歩', meaning: '在爭議中主動後退一步', hint: 'じょうほ', note: '「譲歩を引き出す」是逼對方讓步。', tier: 2 },
  { term: '建前', meaning: '場面話、對外的說法', hint: 'たてまえ', note: '與「本音」成對，是日本溝通的核心概念。', tier: 2 },
  { term: '本音', meaning: '真心話', hint: 'ほんね', note: '「建前」是說出口的，「本音」是真正想的。', tier: 2 },
  { term: '根回し', meaning: '事前疏通', hint: 'ねまわし', note: '原意是移植樹木前先整理根部；會議前先私下取得共識。', tier: 2 },
  { term: '忖度', meaning: '揣摩上意', hint: 'そんたく', note: '不必明說就主動配合對方的意向。', tier: 2 },
  { term: '一任', meaning: '把決定權全部交給對方', hint: 'いちにん', note: '「一任します」是把決定權交給對方。', tier: 2 },

  // tier 3 — 字面と本音が違う
  { term: '前向きに検討します', meaning: '會積極研究（多半是婉拒）', hint: '商務場合最常見的回應', note: '字面積極，實務上經常等於「不會做」。口譯要照字面翻，判斷留給聽者。', tier: 3 },
  { term: '難しいですね', meaning: '有點困難（等於不行）', hint: '五個字，以「難」開頭', note: '日本人極少直接說「できません」，這句就是拒絕。', tier: 3 },
  { term: '善処します', meaning: '會妥善處理（常等於不處理）', hint: 'ぜんしょします', note: '有名的外交模糊語，曾造成實際的國際誤會。', tier: 3 },
  { term: '空気を読む', meaning: '察言觀色', hint: '字面是「讀空氣」', note: '讀不出氣氛的人被稱為「KY」。', tier: 3 },
  { term: 'お手数をおかけします', meaning: '麻煩您了', hint: 'おてすうをおかけします', note: '請託前的固定緩衝語。', tier: 3 },
  { term: '大変申し訳ございません', meaning: '非常抱歉（最正式）', hint: '比すみません重得多', note: '正式場合的道歉，語氣份量遠高於「ごめんなさい」。', tier: 3 },
  { term: '一存では決めかねます', meaning: '我一個人無法決定', hint: 'いちぞん', note: '需要回去請示的委婉說法。', tier: 3 },
  { term: '持ち帰って検討します', meaning: '帶回去研究', hint: '「持ち帰る」原意是外帶', note: '會議中最常見的拖延語，代表當場不做決定。', tier: 3 },
];

export const STARTER_DECK_FR: StarterEntry[] = [
  // tier 1 — les bases
  { term: 'ambassade', meaning: '大使館', hint: '陰性名詞，une ambassade', note: '領事館是 un consulat。', tier: 1 },
  { term: 'interprète', meaning: '口譯員', hint: '陰陽同形，只看冠詞', note: 'un/une interprète 都對，冠詞決定性別。', tier: 1 },
  { term: 'réunion', meaning: '會議', hint: '陰性名詞，有 é', note: 'une réunion 是會議，un rendez-vous 是約見。', tier: 1 },
  { term: 'ordre du jour', meaning: '議程', hint: '三個字，字面是「當日順序」', note: 'à l’ordre du jour 表示「列入議程」。', tier: 1 },
  { term: 'accueil', meaning: '接待、迎賓', hint: '拼寫陷阱：cue 不是 ceu', note: 'le comité d’accueil 是接待委員會。', tier: 1 },
  { term: 'horaire', meaning: '時程表', hint: '陽性名詞，un horaire', note: 'heure（小時）的同源字。', tier: 1 },
  { term: 'collègue', meaning: '同事', hint: '有 è', note: '陰陽同形，un/une collègue。', tier: 1 },
  { term: 'document', meaning: '文件', hint: '陽性名詞', note: '複數 les documents，字尾 t 不發音。', tier: 1 },
  { term: 'bienvenue', meaning: '歡迎', hint: '兩個字合成', note: 'Soyez le bienvenu 是更正式的說法。', tier: 1 },
  { term: 'enchanté', meaning: '幸會', hint: '初次見面時說', note: '女性說 enchantée，多一個 e。', tier: 1 },
  { term: 'veuillez', meaning: '請（正式祈使）', hint: 'vouloir 的命令式', note: 'Veuillez patienter 是「請稍候」。', tier: 1 },
  { term: 'cordialement', meaning: '誠摯地（書信結尾）', hint: 'cœur（心）的同源字', note: '商務郵件最通用的結尾。', tier: 1 },
  { term: 'salle', meaning: '廳、會議室', hint: '陰性名詞，兩個 l', note: 'la salle de réunion 是會議室。', tier: 1 },
  { term: 'discours', meaning: '演說', hint: '單複數同形', note: 'prononcer un discours 是發表演說。', tier: 1 },
  { term: 'traduction', meaning: '翻譯（筆譯）', hint: '陰性名詞', note: '口譯是 interprétation，不可混用。', tier: 1 },
  { term: 'entretien', meaning: '會談、面談', hint: '陽性名詞', note: '也可指「維護保養」，看語境。', tier: 1 },

  // tier 2 — le vocabulaire de travail
  { term: 'négociation', meaning: '談判', hint: '陰性名詞', note: 'entamer des négociations 是展開談判。', tier: 2 },
  { term: 'consensus', meaning: '共識', hint: '拉丁借字，字尾 s 發音', note: 'dégager un consensus 是形成共識。', tier: 2 },
  { term: 'nuance', meaning: '細微差別', hint: '英文直接借了這個字', note: 'apporter une nuance 是補充一點細微差別。', tier: 2 },
  { term: 'souveraineté', meaning: '主權', hint: '以 souverain 為字根', note: '外交上極敏感，不可意譯。', tier: 2 },
  { term: 'concession', meaning: '讓步', hint: '與英文同形', note: 'faire une concession 是做出讓步。', tier: 2 },
  { term: 'bilatéral', meaning: '雙邊的', hint: 'bi- 表示二', note: 'multilatéral 是多邊的。', tier: 2 },
  { term: 'démarche', meaning: '交涉、步驟', hint: '陰性名詞', note: '外交上的 démarche 指正式交涉行動。', tier: 2 },
  { term: 'réserve', meaning: '保留（意見）', hint: '陰性名詞', note: 'émettre des réserves 是表達保留意見。', tier: 2 },
  { term: 'appui', meaning: '支持', hint: '陽性名詞', note: 'apporter son appui 是給予支持。', tier: 2 },
  { term: 'délai', meaning: '期限', hint: '陽性名詞，注意不是「延遲」', note: '常見誤譯：délai 是期限，retard 才是延遲。', tier: 2 },
  { term: 'compte rendu', meaning: '會議紀錄', hint: '兩個字，陽性', note: 'rédiger un compte rendu 是撰寫紀錄。', tier: 2 },
  { term: 'mise au point', meaning: '澄清、調整', hint: '三個字，陰性', note: 'faire une mise au point 是把話說清楚。', tier: 2 },
  { term: 'malentendu', meaning: '誤會', hint: 'mal + entendu（沒聽好）', note: 'dissiper un malentendu 是化解誤會。', tier: 2 },
  { term: 'souligner', meaning: '強調', hint: '字面是「在下面畫線」', note: 'je tiens à souligner 是「我要特別強調」。', tier: 2 },
  { term: 'préciser', meaning: '明確說明', hint: 'précis 的動詞', note: 'pourriez-vous préciser ? 是請對方講清楚。', tier: 2 },
  { term: 'aboutir', meaning: '達成、有結果', hint: 'bout（盡頭）的同源字', note: 'les négociations ont abouti 是談判有了結果。', tier: 2 },

  // tier 3 — les formules
  { term: 'sous réserve de', meaning: '在…的前提下', hint: '三個字的介系詞片語', note: '合約與公報常見，表示附帶條件。', tier: 3 },
  { term: 'prendre acte de', meaning: '予以記錄、注意到', hint: 'acte 是「行為、紀錄」', note: '外交上表示「知道了，但不表態同意」。', tier: 3 },
  { term: 'il va sans dire', meaning: '不言而喻', hint: '字面是「它不用說就走」', note: '常用來鋪陳接下來的但書。', tier: 3 },
  { term: 'dans les meilleurs délais', meaning: '盡快（正式）', hint: 'délai 的複數用法', note: '比 rapidement 更正式，公文常用。', tier: 3 },
  { term: 'sauf erreur de ma part', meaning: '若我沒弄錯的話', hint: '以 sauf 開頭', note: '口譯自我修正時的體面說法。', tier: 3 },
  { term: 'avoir voix au chapitre', meaning: '有發言權', hint: '字面是「在會議室裡有聲音」', note: '源自修道院的議事傳統。', tier: 3 },
  { term: 'faux amis', meaning: '假朋友（形似義異的詞）', hint: '兩個字，字面是「假的朋友」', note: '如 actuellement 是「目前」而非「實際上」。', tier: 3 },
  { term: 'langue de bois', meaning: '官話、空話', hint: '字面是「木頭語言」', note: '批評政治人物講空話的固定說法。', tier: 3 },
];

/**
 * Each tier maps to a default topic, so most entries need no tagging: tier 1
 * is the vocabulary of being in the room, tier 2 is the working language of a
 * meeting, tier 3 is where literal and actual meaning diverge.
 */
const TIER_TOPIC: Record<string, Record<1 | 2 | 3, string>> = {
  english: { 1: 'basics', 2: 'meeting', 3: 'idiom' },
  japanese: { 1: 'basics', 2: 'negotiation', 3: 'vagueness' },
  french: { 1: 'basics', 2: 'meeting', 3: 'formal' },
};

/** Entries whose topic is not the one their tier implies. */
const TOPIC_OVERRIDES: Record<string, string[]> = {
  // Japanese: the polite formulas are keigo wherever they sit.
  失礼します: ['keigo'],
  よろしくお願いします: ['keigo'],
  お世話になります: ['keigo'],
  恐れ入ります: ['keigo'],
  承知しました: ['keigo'],
  お手数をおかけします: ['keigo'],
  大変申し訳ございません: ['keigo'],
  一存では決めかねます: ['keigo', 'vagueness'],
  // …and the ones where what is said is not what is meant.
  建前: ['vagueness'],
  本音: ['vagueness'],
  根回し: ['vagueness'],
  忖度: ['vagueness'],
  検討: ['vagueness', 'negotiation'],
  // French: gendered nouns are their own trap.
  ambassade: ['gender', 'basics'],
  réunion: ['gender', 'basics'],
  horaire: ['gender', 'basics'],
  salle: ['gender', 'basics'],
  entretien: ['gender', 'basics'],
  interprète: ['gender', 'basics'],
  traduction: ['gender', 'basics'],
};

function withTopics(language: string, deck: StarterEntry[]): StarterEntry[] {
  const byTier = TIER_TOPIC[language] ?? TIER_TOPIC.english;
  return deck.map((entry) => ({
    ...entry,
    topics: entry.topics ?? TOPIC_OVERRIDES[entry.term] ?? [byTier[entry.tier]],
  }));
}

/** All starter decks, keyed by the language they teach, topics filled in. */
export const STARTER_DECKS: Record<string, StarterEntry[]> = {
  english: withTopics('english', STARTER_DECK_EN),
  japanese: withTopics('japanese', STARTER_DECK_JA),
  french: withTopics('french', STARTER_DECK_FR),
};

export function starterDeck(language: string): StarterEntry[] {
  return STARTER_DECKS[language] ?? STARTER_DECKS.english;
}
