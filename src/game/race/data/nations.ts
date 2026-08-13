import type { TrackDef, TrackPalette, TrackProps } from '../core/types';
import { layout } from './layouts';

/**
 * How a nation's roadside gates quiz the player. The circuit escalates through
 * these: recognising written words, then listening, then the target language's
 * own numbers, then pure recall of a memorised sequence.
 */
export type ChallengeKind = 'word' | 'listen' | 'number' | 'recall' | 'mixed';

export const CHALLENGE_LABEL: Record<ChallengeKind, string> = {
  word: '認詞',
  listen: '聽力',
  number: '數字',
  recall: '記憶回想',
  mixed: '綜合考驗',
};

export const CHALLENGE_HINT: Record<ChallengeKind, string> = {
  word: '看中文，開進寫著正確外語的閘門。',
  listen: '聽到的外語是什麼意思？開進正確的中文閘門。',
  number: '把數字用當地語言讀出來 — 開進正確的說法。',
  recall: '起跑前記住詞語順序，途中會問你第幾個是什麼。',
  mixed: '前面四種考驗會輪流出現，隨機應變。',
};

export interface Phrase {
  /** The word or phrase in the target language. */
  native: string;
  /** Romanisation or reading, where the script needs one. */
  roman?: string;
  /** Traditional Chinese gloss. */
  meaning: string;
}

export interface NumberWord {
  value: number;
  native: string;
  roman?: string;
}

/** A nation's champion — the rival who leads their grid and stamps your passport. */
export interface Representative {
  /** Name as written at home. */
  name: string;
  /** Name as the circuit programme prints it. */
  displayName: string;
  title: string;
  birdId: string;
  /** Greeting in their own language, spoken when you reach their country. */
  greeting: string;
  greetingMeaning: string;
  blurb: string;
}

export interface NationDef {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  /** Matches an id in `src/lib/constants.ts` LANGUAGES. */
  languageId: string;
  /** BCP-47 tag for speech synthesis on listening gates. */
  speechLang: string;
  layoutId: string;
  laps: number;
  difficulty: 1 | 2 | 3;
  courseName: string;
  subtitle: string;
  palette: TrackPalette;
  props: TrackProps;
  rep: Representative;
  phrases: Phrase[];
  numbers: NumberWord[];
}

/**
 * Eight host nations. Phrases are the survival set every interpreter learns
 * first, so the same eight meanings recur across languages and the player ends
 * up contrasting them — which is the point of a circuit rather than a course.
 */
export const NATIONS: Record<string, NationDef> = {
  britain: {
    id: 'britain',
    name: '英國',
    nativeName: 'United Kingdom',
    flag: '🇬🇧',
    languageId: 'english',
    speechLang: 'en-GB',
    layoutId: 'openRing',
    laps: 3,
    difficulty: 1,
    courseName: '綠野郡道',
    subtitle: '外交部見習賽 · 寬闊高速',
    palette: {
      road: 0xa9a49c,
      roadEdge: 0xf2f4f7,
      ground: 0x6faa54,
      groundAlt: 0x8dc46b,
      rock: 0x8d9188,
      foliage: 0x3f8248,
      foliageAlt: 0xf2a7c3,
      skyTop: 0x5f9ede,
      skyBottom: 0xdfe9f2,
      fog: 0xd4e2ee,
      light: 0xfff6e2,
      ambient: 0x9fb9d6,
    },
    props: { trees: 120, rocks: 40, crowd: 60, kind: 'meadow' },
    rep: {
      name: 'Eleanor Vance',
      displayName: '艾蓮諾·凡斯',
      title: '白廳首席通譯',
      birdId: 'gold',
      greeting: 'Welcome to the circuit.',
      greetingMeaning: '歡迎來到巡迴賽。',
      blurb: '把每個字都咬得極準的老派通譯官，起步穩到像用尺量過。',
    },
    phrases: [
      { native: 'hello', meaning: '你好' },
      { native: 'thank you', meaning: '謝謝' },
      { native: 'goodbye', meaning: '再見' },
      { native: 'please', meaning: '請' },
      { native: 'sorry', meaning: '對不起' },
      { native: 'water', meaning: '水' },
      { native: 'friend', meaning: '朋友' },
      { native: 'yes', meaning: '是' },
    ],
    numbers: [
      { value: 1, native: 'one' },
      { value: 2, native: 'two' },
      { value: 3, native: 'three' },
      { value: 4, native: 'four' },
      { value: 5, native: 'five' },
      { value: 6, native: 'six' },
      { value: 7, native: 'seven' },
      { value: 8, native: 'eight' },
      { value: 9, native: 'nine' },
      { value: 10, native: 'ten' },
    ],
  },

  japan: {
    id: 'japan',
    name: '日本',
    nativeName: '日本',
    flag: '🇯🇵',
    languageId: 'japanese',
    speechLang: 'ja-JP',
    layoutId: 'woodland',
    laps: 3,
    difficulty: 1,
    courseName: '櫻花山道',
    subtitle: '連續中速彎 · 花見季夜間開放',
    palette: {
      road: 0x9c9aa2,
      roadEdge: 0xfff0f4,
      ground: 0x6ea65e,
      groundAlt: 0x93c47d,
      rock: 0x8b8b86,
      foliage: 0xf2a7c3,
      foliageAlt: 0xffd9e6,
      skyTop: 0x4f92d8,
      skyBottom: 0xffe4ec,
      fog: 0xf0d8e2,
      light: 0xfff2ea,
      ambient: 0xc0a8bb,
    },
    props: { trees: 140, rocks: 44, crowd: 70, kind: 'meadow' },
    rep: {
      name: '綾瀬 響',
      displayName: '綾瀨響',
      title: '桜花特使',
      birdId: 'azure',
      greeting: 'ようこそ、いい風が吹いていますね。',
      greetingMeaning: '歡迎，今天風不錯呢。',
      blurb: '走內線走到極致的技巧派，過彎幾乎貼著路緣石。',
    },
    phrases: [
      { native: 'こんにちは', roman: 'konnichiwa', meaning: '你好' },
      { native: 'ありがとう', roman: 'arigatou', meaning: '謝謝' },
      { native: 'さようなら', roman: 'sayounara', meaning: '再見' },
      { native: 'お願いします', roman: 'onegaishimasu', meaning: '拜託／請' },
      { native: 'すみません', roman: 'sumimasen', meaning: '對不起' },
      { native: '水', roman: 'mizu', meaning: '水' },
      { native: '友達', roman: 'tomodachi', meaning: '朋友' },
      { native: 'はい', roman: 'hai', meaning: '是' },
    ],
    numbers: [
      { value: 1, native: '一', roman: 'ichi' },
      { value: 2, native: '二', roman: 'ni' },
      { value: 3, native: '三', roman: 'san' },
      { value: 4, native: '四', roman: 'yon' },
      { value: 5, native: '五', roman: 'go' },
      { value: 6, native: '六', roman: 'roku' },
      { value: 7, native: '七', roman: 'nana' },
      { value: 8, native: '八', roman: 'hachi' },
      { value: 9, native: '九', roman: 'kyuu' },
      { value: 10, native: '十', roman: 'juu' },
    ],
  },

  france: {
    id: 'france',
    name: '法國',
    nativeName: 'France',
    flag: '🇫🇷',
    languageId: 'french',
    speechLang: 'fr-FR',
    layoutId: 'boulevard',
    laps: 3,
    difficulty: 2,
    courseName: '香榭大道',
    subtitle: '長直線與方角彎 · 聽力關卡登場',
    palette: {
      road: 0x8f8d94,
      roadEdge: 0xf4f4f8,
      ground: 0x7d9a68,
      groundAlt: 0xa8bd8a,
      rock: 0xa39c92,
      foliage: 0x4a7c4e,
      foliageAlt: 0xe8d9a0,
      skyTop: 0x4a86c8,
      skyBottom: 0xf2dcc0,
      fog: 0xdcd2c4,
      light: 0xfff1d8,
      ambient: 0xb0a898,
    },
    props: { trees: 96, rocks: 30, crowd: 80, kind: 'meadow' },
    rep: {
      name: 'Camille Roux',
      displayName: '卡蜜兒·魯',
      title: '外交部禮賓官',
      birdId: 'crimson',
      greeting: 'Bonjour, la route est à vous.',
      greetingMeaning: '你好，這條路交給你了。',
      blurb: '出彎加速最狠的一位，只要有直線就拉開距離。',
    },
    phrases: [
      { native: 'bonjour', meaning: '你好' },
      { native: 'merci', meaning: '謝謝' },
      { native: 'au revoir', meaning: '再見' },
      { native: "s'il vous plaît", meaning: '請' },
      { native: 'pardon', meaning: '對不起' },
      { native: 'eau', meaning: '水' },
      { native: 'ami', meaning: '朋友' },
      { native: 'oui', meaning: '是' },
    ],
    numbers: [
      { value: 1, native: 'un' },
      { value: 2, native: 'deux' },
      { value: 3, native: 'trois' },
      { value: 4, native: 'quatre' },
      { value: 5, native: 'cinq' },
      { value: 6, native: 'six' },
      { value: 7, native: 'sept' },
      { value: 8, native: 'huit' },
      { value: 9, native: 'neuf' },
      { value: 10, native: 'dix' },
    ],
  },

  spain: {
    id: 'spain',
    name: '西班牙',
    nativeName: 'España',
    flag: '🇪🇸',
    languageId: 'spanish',
    speechLang: 'es-ES',
    layoutId: 'coastline',
    laps: 3,
    difficulty: 2,
    courseName: '陽光海岸線',
    subtitle: '超長海岸彎 · 聽力關卡',
    palette: {
      road: 0xb8a184,
      roadEdge: 0xfff4e0,
      ground: 0xc9a86a,
      groundAlt: 0xe0c48e,
      rock: 0xb08050,
      foliage: 0x6f8f4a,
      foliageAlt: 0xf0c860,
      skyTop: 0x2f8ddc,
      skyBottom: 0xffe0b0,
      fog: 0xf0d8b4,
      light: 0xfff0d0,
      ambient: 0xd0b088,
    },
    props: { trees: 70, rocks: 90, crowd: 76, kind: 'desert' },
    rep: {
      name: 'Inés Márquez',
      displayName: '伊內絲·馬奎茲',
      title: '海岸巡迴賽冠軍',
      birdId: 'frost',
      greeting: '¡Hola! Vamos, la costa es larga.',
      greetingMeaning: '嗨！走吧，海岸線可長著呢。',
      blurb: '甩尾接甩尾的街頭派，長彎裡幾乎全程在滑。',
    },
    phrases: [
      { native: 'hola', meaning: '你好' },
      { native: 'gracias', meaning: '謝謝' },
      { native: 'adiós', meaning: '再見' },
      { native: 'por favor', meaning: '請' },
      { native: 'perdón', meaning: '對不起' },
      { native: 'agua', meaning: '水' },
      { native: 'amigo', meaning: '朋友' },
      { native: 'sí', meaning: '是' },
    ],
    numbers: [
      { value: 1, native: 'uno' },
      { value: 2, native: 'dos' },
      { value: 3, native: 'tres' },
      { value: 4, native: 'cuatro' },
      { value: 5, native: 'cinco' },
      { value: 6, native: 'seis' },
      { value: 7, native: 'siete' },
      { value: 8, native: 'ocho' },
      { value: 9, native: 'nueve' },
      { value: 10, native: 'diez' },
    ],
  },

  germany: {
    id: 'germany',
    name: '德國',
    nativeName: 'Deutschland',
    flag: '🇩🇪',
    languageId: 'german',
    speechLang: 'de-DE',
    layoutId: 'gorge',
    laps: 3,
    difficulty: 2,
    courseName: '黑森林環道',
    subtitle: '窄彎與髮夾 · 數字關卡登場',
    palette: {
      road: 0x86868e,
      roadEdge: 0xeef0f4,
      ground: 0x4c6b42,
      groundAlt: 0x6a8a54,
      rock: 0x77786f,
      foliage: 0x27492e,
      foliageAlt: 0x7ea862,
      skyTop: 0x3a6ea8,
      skyBottom: 0xc8d8dc,
      fog: 0xa8bcb8,
      light: 0xf0f4e8,
      ambient: 0x6c8080,
    },
    props: { trees: 170, rocks: 60, crowd: 50, kind: 'glacier' },
    rep: {
      name: 'Anselm Weber',
      displayName: '安瑟姆·韋伯',
      title: '聯邦議會通譯長',
      birdId: 'onyx',
      greeting: 'Guten Tag. Zahlen lügen nicht.',
      greetingMeaning: '午安。數字不會說謊。',
      blurb: '極速最高的直線之王，過彎會犯錯，但錯過就追不上了。',
    },
    phrases: [
      { native: 'hallo', meaning: '你好' },
      { native: 'danke', meaning: '謝謝' },
      { native: 'auf Wiedersehen', meaning: '再見' },
      { native: 'bitte', meaning: '請' },
      { native: 'Entschuldigung', meaning: '對不起' },
      { native: 'Wasser', meaning: '水' },
      { native: 'Freund', meaning: '朋友' },
      { native: 'ja', meaning: '是' },
    ],
    numbers: [
      { value: 1, native: 'eins' },
      { value: 2, native: 'zwei' },
      { value: 3, native: 'drei' },
      { value: 4, native: 'vier' },
      { value: 5, native: 'fünf' },
      { value: 6, native: 'sechs' },
      { value: 7, native: 'sieben' },
      { value: 8, native: 'acht' },
      { value: 9, native: 'neun' },
      { value: 10, native: 'zehn' },
    ],
  },

  korea: {
    id: 'korea',
    name: '韓國',
    nativeName: '대한민국',
    flag: '🇰🇷',
    languageId: 'korean',
    speechLang: 'ko-KR',
    layoutId: 'boulevard',
    laps: 4,
    difficulty: 3,
    courseName: '漢江夜線',
    subtitle: '夜間市街 · 記憶回想關卡',
    palette: {
      road: 0x5a5f70,
      roadEdge: 0xdfe8ff,
      ground: 0x2f3648,
      groundAlt: 0x424a60,
      rock: 0x5c6478,
      foliage: 0x2c4a52,
      foliageAlt: 0x7fd0e0,
      skyTop: 0x0d1734,
      skyBottom: 0x3c4f80,
      fog: 0x222c4c,
      light: 0xc8d8ff,
      ambient: 0x3a4668,
    },
    props: { trees: 80, rocks: 40, crowd: 90, kind: 'glacier' },
    rep: {
      name: '서지훈',
      displayName: '徐志勳',
      title: '青瓦臺隨行通譯',
      birdId: 'jade',
      greeting: '안녕하세요. 기억력 승부입니다.',
      greetingMeaning: '你好，這場比的是記憶力。',
      blurb: '體力條長得離譜，整場幾乎不放開衝刺。',
    },
    phrases: [
      { native: '안녕하세요', roman: 'annyeonghaseyo', meaning: '你好' },
      { native: '감사합니다', roman: 'gamsahamnida', meaning: '謝謝' },
      { native: '안녕히 가세요', roman: 'annyeonghi gaseyo', meaning: '再見' },
      { native: '부탁합니다', roman: 'butakhamnida', meaning: '拜託／請' },
      { native: '죄송합니다', roman: 'joesonghamnida', meaning: '對不起' },
      { native: '물', roman: 'mul', meaning: '水' },
      { native: '친구', roman: 'chingu', meaning: '朋友' },
      { native: '네', roman: 'ne', meaning: '是' },
    ],
    numbers: [
      { value: 1, native: '하나', roman: 'hana' },
      { value: 2, native: '둘', roman: 'dul' },
      { value: 3, native: '셋', roman: 'set' },
      { value: 4, native: '넷', roman: 'net' },
      { value: 5, native: '다섯', roman: 'daseot' },
      { value: 6, native: '여섯', roman: 'yeoseot' },
      { value: 7, native: '일곱', roman: 'ilgop' },
      { value: 8, native: '여덟', roman: 'yeodeol' },
      { value: 9, native: '아홉', roman: 'ahop' },
      { value: 10, native: '열', roman: 'yeol' },
    ],
  },

  arabia: {
    id: 'arabia',
    name: '沙烏地阿拉伯',
    nativeName: 'المملكة العربية السعودية',
    flag: '🇸🇦',
    languageId: 'arabic',
    speechLang: 'ar-SA',
    layoutId: 'gorge',
    laps: 4,
    difficulty: 3,
    courseName: '紅沙峽谷',
    subtitle: '沙暴窄道 · 記憶回想關卡',
    palette: {
      road: 0xc2996a,
      roadEdge: 0xffe9c4,
      ground: 0xd8a86a,
      groundAlt: 0xe8c48d,
      rock: 0xb4703f,
      foliage: 0x7a9a52,
      foliageAlt: 0xe8d18a,
      skyTop: 0x2f7fd0,
      skyBottom: 0xffd9a0,
      fog: 0xf2cf9d,
      light: 0xfff0cf,
      ambient: 0xd8b184,
    },
    props: { trees: 46, rocks: 130, crowd: 44, kind: 'desert' },
    rep: {
      name: 'ليلى النصر',
      displayName: '萊拉·納斯爾',
      title: '沙漠商路調停人',
      birdId: 'crimson',
      greeting: 'مرحبا، الطريق طويل.',
      greetingMeaning: '你好，路還很長。',
      blurb: '在沙地上也跑得住，出界懲罰對她幾乎沒用。',
    },
    phrases: [
      { native: 'مرحبا', roman: 'marhaban', meaning: '你好' },
      { native: 'شكرا', roman: 'shukran', meaning: '謝謝' },
      { native: 'مع السلامة', roman: "ma'a as-salama", meaning: '再見' },
      { native: 'من فضلك', roman: 'min fadlik', meaning: '請' },
      { native: 'آسف', roman: 'asif', meaning: '對不起' },
      { native: 'ماء', roman: "ma'", meaning: '水' },
      { native: 'صديق', roman: 'sadiq', meaning: '朋友' },
      { native: 'نعم', roman: "na'am", meaning: '是' },
    ],
    numbers: [
      { value: 1, native: 'واحد', roman: 'wahid' },
      { value: 2, native: 'اثنان', roman: 'ithnan' },
      { value: 3, native: 'ثلاثة', roman: 'thalatha' },
      { value: 4, native: 'أربعة', roman: "arba'a" },
      { value: 5, native: 'خمسة', roman: 'khamsa' },
      { value: 6, native: 'ستة', roman: 'sitta' },
      { value: 7, native: 'سبعة', roman: "sab'a" },
      { value: 8, native: 'ثمانية', roman: 'thamaniya' },
      { value: 9, native: 'تسعة', roman: "tis'a" },
      { value: 10, native: 'عشرة', roman: 'ashara' },
    ],
  },

  russia: {
    id: 'russia',
    name: '俄羅斯',
    nativeName: 'Россия',
    flag: '🇷🇺',
    languageId: 'russian',
    speechLang: 'ru-RU',
    layoutId: 'highland',
    laps: 4,
    difficulty: 3,
    courseName: '極夜冰河',
    subtitle: '低摩擦夜賽 · 綜合考驗',
    palette: {
      road: 0x8fa8c6,
      roadEdge: 0xe8f6ff,
      ground: 0xdce9f5,
      groundAlt: 0xb9d2e8,
      rock: 0x7f93ad,
      foliage: 0x2f5d6e,
      foliageAlt: 0xa9e6ff,
      skyTop: 0x0b1740,
      skyBottom: 0x4a6ba8,
      fog: 0x2c3f6b,
      light: 0xc9dcff,
      ambient: 0x3d5580,
    },
    props: { trees: 90, rocks: 70, crowd: 46, kind: 'glacier' },
    rep: {
      name: 'Дмитрий Волков',
      displayName: '德米特里·沃爾科夫',
      title: '極地談判特使',
      birdId: 'frost',
      greeting: 'Здравствуйте. Здесь лёд решает всё.',
      greetingMeaning: '你好。在這裡，冰決定一切。',
      blurb: '冰面上唯一還敢全油門的人，最後一關的守門者。',
    },
    phrases: [
      { native: 'привет', roman: 'privet', meaning: '你好' },
      { native: 'спасибо', roman: 'spasibo', meaning: '謝謝' },
      { native: 'до свидания', roman: 'do svidaniya', meaning: '再見' },
      { native: 'пожалуйста', roman: 'pozhaluysta', meaning: '請' },
      { native: 'извините', roman: 'izvinite', meaning: '對不起' },
      { native: 'вода', roman: 'voda', meaning: '水' },
      { native: 'друг', roman: 'drug', meaning: '朋友' },
      { native: 'да', roman: 'da', meaning: '是' },
    ],
    numbers: [
      { value: 1, native: 'один', roman: 'odin' },
      { value: 2, native: 'два', roman: 'dva' },
      { value: 3, native: 'три', roman: 'tri' },
      { value: 4, native: 'четыре', roman: 'chetyre' },
      { value: 5, native: 'пять', roman: 'pyat' },
      { value: 6, native: 'шесть', roman: 'shest' },
      { value: 7, native: 'семь', roman: 'sem' },
      { value: 8, native: 'восемь', roman: 'vosem' },
      { value: 9, native: 'девять', roman: 'devyat' },
      { value: 10, native: 'десять', roman: 'desyat' },
    ],
  },
};

export const NATION_IDS = Object.keys(NATIONS);

export function nation(id: string): NationDef {
  return NATIONS[id] ?? NATIONS.britain;
}

/** Dresses a shared layout with a nation's palette to make a raceable course. */
export function nationTrack(def: NationDef): TrackDef {
  const shape = layout(def.layoutId);
  return {
    id: def.id,
    name: `${def.flag} ${def.courseName}`,
    subtitle: def.subtitle,
    laps: def.laps,
    difficulty: def.difficulty,
    halfWidth: shape.halfWidth,
    points: shape.points,
    boosts: shape.boosts,
    hazards: shape.hazards,
    palette: def.palette satisfies TrackPalette,
    props: def.props satisfies TrackProps,
  };
}
