import { GeniusType } from './genius-type';
import { GeniusPlan } from './genius-plan';
import { LearningStyle } from './learning-styles';

export type LearningGymTaskId =
  | 'scene_anchor'
  | 'data_to_table'
  | 'sound_shadow'
  | 'story_recall'
  | 'concept_web'
  | 'principle_output'
  | 'live_output'
  | 'memory_palace'
  | 'number_encoding'
  | 'similarity_split'
  | 'error_repair'
  | 'image_morph'
  | 'color_symbol_notes'
  | 'rap_word_beat'
  | 'podcast_host'
  | 'mnemonic_meme'
  | 'roleplay_quest'
  | 'body_anchor'
  | 'walking_room'
  | 'root_tree'
  | 'causal_map'
  | 'ai_debugger';

export type LearningGymTalentGroupId =
  | 'visual_dominant'
  | 'auditory_dominant'
  | 'kinesthetic_dominant'
  | 'logical_dominant';

export type LearningGymAbility =
  | 'sceneEncoding'
  | 'structureMapping'
  | 'soundLoop'
  | 'storyBinding'
  | 'conceptLinking'
  | 'principleReasoning'
  | 'liveOutput'
  | 'visualSpatial'
  | 'numberCoding'
  | 'contrastLogic'
  | 'errorRepair'
  | 'activeRecall';

export const LEARNING_GYM_ABILITY_LABELS: Record<LearningGymAbility, string> = {
  sceneEncoding: '情境編碼',
  structureMapping: '結構化',
  soundLoop: '音韻迴路',
  storyBinding: '故事綁定',
  conceptLinking: '跨域連結',
  principleReasoning: '原理解釋',
  liveOutput: '即時輸出',
  visualSpatial: '空間視覺',
  numberCoding: '數字轉碼',
  contrastLogic: '差異辨析',
  errorRepair: '錯誤修正',
  activeRecall: '主動回想',
};

export type LearningGymProgress = Record<LearningGymAbility, number>;

export interface LearningGymTask {
  id: LearningGymTaskId;
  title: string;
  subtitle: string;
  card: string;
  level: string;
  group: LearningGymTalentGroupId;
  vark: LearningStyle[];
  genius: GeniusType[];
  duration: string;
  outcome: string;
  abilityWeights: Partial<Record<LearningGymAbility, number>>;
  coachFocus: string[];
  prompt: string;
}

export interface TalentTrainingProfile {
  id: LearningGymTalentGroupId;
  name: string;
  nameEn: string;
  superpower: string;
  landmine: string;
  parentAdvice: string;
  taskIds: LearningGymTaskId[];
}

export interface GeniusIdentityTraining {
  genius: GeniusType;
  identityName: string;
  groupId: LearningGymTalentGroupId;
  mechanism: string;
  primaryTaskIds: LearningGymTaskId[];
  abilityFocus: LearningGymAbility[];
}

export const EMPTY_LEARNING_GYM_PROGRESS: LearningGymProgress = {
  sceneEncoding: 0,
  structureMapping: 0,
  soundLoop: 0,
  storyBinding: 0,
  conceptLinking: 0,
  principleReasoning: 0,
  liveOutput: 0,
  visualSpatial: 0,
  numberCoding: 0,
  contrastLogic: 0,
  errorRepair: 0,
  activeRecall: 0,
};

export const LEARNING_GYM_TASKS: LearningGymTask[] = [
  {
    id: 'scene_anchor',
    title: '情境鉤子卡',
    subtitle: '把詞彙或概念放進一個真實場景，再關掉提示回想',
    card: 'Explorer Core',
    level: 'Level 1 · 場景啟動',
    group: 'kinesthetic_dominant',
    vark: ['kinesthetic'],
    genius: ['explorer'],
    duration: '7 分鐘',
    outcome: '產生一段情境對話 + 一個可回想場景',
    abilityWeights: { sceneEncoding: 3, activeRecall: 2, liveOutput: 1 },
    coachFocus: ['要求使用者描述地點、對象、心情', '第二輪關掉提示，要求從場景回想詞彙', '用角色扮演而不是重看材料'],
    prompt:
      '啟動 Learning Gym：情境鉤子卡。請使用繁體中文。先給我一個真實或想像情境，讓我把 5 個新詞或新概念放進情境裡。請依序問我：在哪裡、跟誰、當時情緒、我會怎麼使用。第二輪請關掉提示，要求我重新演一遍這個場景並提取概念。',
  },
  {
    id: 'data_to_table',
    title: '資料轉表格訓練',
    subtitle: '把雜亂資料整理成欄位、分類、規則與摘要',
    card: 'Architect / Analyst Card',
    level: 'Level 2 · 結構整理',
    group: 'logical_dominant',
    vark: ['visual', 'reading'],
    genius: ['architect', 'analyst', 'connector', 'visionary'],
    duration: '8 分鐘',
    outcome: '輸出一張清楚表格 + 一段學習摘要',
    abilityWeights: { structureMapping: 3, contrastLogic: 1, visualSpatial: 1, activeRecall: 1 },
    coachFocus: ['先讓使用者命名欄位', '要求說明分類規則', '最後不看資料重建表格摘要'],
    prompt:
      '啟動 Learning Gym：資料轉表格訓練。請使用繁體中文。先給我一段雜亂資料，主題可在生活、商業、歷史、自然科學中擇一。請要求我整理成表格，包含欄位命名、分類、關鍵數字、規則與 3 句摘要。請一次只給一步，等我回答後再檢查。',
  },
  {
    id: 'sound_shadow',
    title: '聲音跟讀卡',
    subtitle: '用節奏、重音和遮稿複述建立音韻記憶',
    card: 'Melodist Core',
    level: 'Level 1 · 音韻編碼',
    group: 'auditory_dominant',
    vark: ['auditory'],
    genius: ['melodist'],
    duration: '6 分鐘',
    outcome: '完成三輪：純聽 → 跟讀 → 遮稿複述',
    abilityWeights: { soundLoop: 3, activeRecall: 2, liveOutput: 1 },
    coachFocus: ['標出重音和節奏', '要求使用者大聲跟讀', '最後遮住原句複述'],
    prompt:
      '啟動 Learning Gym：聲音跟讀卡。請使用繁體中文。給我一段短句或短段落，先標示重音、節奏與連音，再請我跟讀。第二輪請遮住原句，要求我憑聲音印象複述。請依照純聽、跟讀、遮稿複述三步驟進行。',
  },
  {
    id: 'story_recall',
    title: '情感故事卡',
    subtitle: '把新概念放進有人物、情緒和反應的故事',
    card: 'Narrator Core',
    level: 'Level 2 · 故事提取',
    group: 'auditory_dominant',
    vark: ['auditory', 'kinesthetic'],
    genius: ['narrator'],
    duration: '8 分鐘',
    outcome: '產生一段故事 + 口說/文字複述',
    abilityWeights: { storyBinding: 3, sceneEncoding: 1, liveOutput: 2 },
    coachFocus: ['建立角色與情緒', '要求自然嵌入新詞', '找出卡住的詞作為今日補強點'],
    prompt:
      '啟動 Learning Gym：情感故事卡。請使用繁體中文。請先給我 5 個詞或概念，讓我創造一個有人物、有情緒、有反應的短故事。請追問角色是誰、他為什麼說這句話、對方如何反應。最後要求我不看提示，把故事完整複述一次。',
  },
  {
    id: 'concept_web',
    title: '概念織網卡',
    subtitle: '用類比、隱喻和跨域連結建立知識網',
    card: 'Connector Core',
    level: 'Level 2 · 連結擴張',
    group: 'logical_dominant',
    vark: ['reading', 'auditory'],
    genius: ['connector'],
    duration: '7 分鐘',
    outcome: '建立一張概念地圖 + 解釋每條連結',
    abilityWeights: { conceptLinking: 3, structureMapping: 1, activeRecall: 1 },
    coachFocus: ['不要只問定義，要求使用者找類比', '要求解釋每個連結', '卡住的連結轉成補強任務'],
    prompt:
      '啟動 Learning Gym：概念織網卡。請使用繁體中文。請給我一組主題詞，要求我找出它們和已知概念的類比、隱喻或跨域連結。最後請我像教別人一樣解釋整張概念網，每個連結都要說明為什麼連得上。',
  },
  {
    id: 'principle_output',
    title: '費曼原理卡',
    subtitle: '先問為什麼，再用自己的話教給 AI',
    card: 'Analyst Core',
    level: 'Level 3 · 原理輸出',
    group: 'logical_dominant',
    vark: ['reading', 'kinesthetic'],
    genius: ['analyst'],
    duration: '9 分鐘',
    outcome: '完成一段可教人的原理解釋',
    abilityWeights: { principleReasoning: 3, errorRepair: 1, activeRecall: 2 },
    coachFocus: ['追問為什麼', '要求使用者用自己的話講', '指出解釋中的缺口和反例'],
    prompt:
      '啟動 Learning Gym：費曼原理卡。請使用繁體中文。請給我一個容易誤解的語言、數學、物理或商業概念。要求我先解釋「為什麼」，再用自己的話教給一個完全不懂的人。若我說不清楚，請指出缺口，要求我重講一次。',
  },
  {
    id: 'live_output',
    title: '即時輸出卡',
    subtitle: '不準備，直接說、演、示範，讓壓力變成記憶鉤子',
    card: 'Performer Core',
    level: 'Level 2 · 即興反應',
    group: 'kinesthetic_dominant',
    vark: ['kinesthetic', 'auditory'],
    genius: ['performer'],
    duration: '5 分鐘',
    outcome: '完成 3 回合即興輸出 + 一個修正版',
    abilityWeights: { liveOutput: 3, soundLoop: 1, errorRepair: 1 },
    coachFocus: ['少講規則，多讓使用者開口/輸出', '快速回饋', '把卡住點轉成下一輪挑戰'],
    prompt:
      '啟動 Learning Gym：即時輸出卡。請使用繁體中文。請直接給我一個題目或情境，不要讓我準備，要求我立刻說或寫 30 秒。回饋要短、快、具體，指出一個最該修正的地方，然後讓我重做一輪。',
  },
  {
    id: 'memory_palace',
    title: '記憶宮殿 3D 線上版',
    subtitle: '把公式、歷史或單字變成物件，放進熟悉空間再走一遍',
    card: 'Visionary Core',
    level: 'Level 3 · 空間提取',
    group: 'visual_dominant',
    vark: ['visual'],
    genius: ['visionary'],
    duration: '8 分鐘',
    outcome: '完成 10 個位置的圖像放置與空間回想',
    abilityWeights: { visualSpatial: 3, activeRecall: 2, sceneEncoding: 1 },
    coachFocus: ['要求使用者選熟悉空間或 3D 場景', '每個位置放誇張物件', '最後閉眼走一遍並提取'],
    prompt:
      '啟動 Learning Gym：記憶宮殿 3D 線上版。請使用繁體中文。請讓我選一個熟悉空間或虛擬場景（房間、教室、太空艙），然後給我 10 個詞、公式或歷史知識點，要求我把每一個變成誇張物件並放進 10 個位置。最後請我閉眼走一遍這個空間，依序回想內容。',
  },
  {
    id: 'number_encoding',
    title: '數字轉碼訓練',
    subtitle: '把年份、公式、代碼轉成可記憶的規則',
    card: 'Logic Bonus',
    level: 'Level 2 · 數字規則',
    group: 'logical_dominant',
    vark: ['reading', 'kinesthetic'],
    genius: ['analyst', 'architect', 'explorer'],
    duration: '6 分鐘',
    outcome: '建立一組數字記憶碼 + 立即提取測驗',
    abilityWeights: { numberCoding: 3, principleReasoning: 1, activeRecall: 1 },
    coachFocus: ['引導分段、規則、諧音或空間位置', '立即做回想測驗', '要求使用者說出轉碼規則'],
    prompt:
      '啟動 Learning Gym：數字轉碼訓練。請使用繁體中文。給我 6 組數字或公式片段，先示範一組如何轉成規則、分段、諧音、空間位置或故事碼，接著讓我替剩下的數字建立轉碼。每次我回答後，請檢查規則是否穩定並安排提取回想。',
  },
  {
    id: 'similarity_split',
    title: '相似概念拆解',
    subtitle: '拆相似單字、公式、概念，做差異表與聯想鉤子',
    card: 'Logic Bonus',
    level: 'Level 2 · 差異辨析',
    group: 'logical_dominant',
    vark: ['reading', 'visual'],
    genius: ['analyst', 'connector', 'narrator', 'architect'],
    duration: '7 分鐘',
    outcome: '輸出差異表 + 每組一個聯想鉤子',
    abilityWeights: { contrastLogic: 3, conceptLinking: 1, structureMapping: 1 },
    coachFocus: ['要求定義、情境、常見錯誤、記憶鉤子', '強迫說出判斷規則', '最後做混淆測驗'],
    prompt:
      '啟動 Learning Gym：相似概念拆解訓練。請使用繁體中文。請給我 4 組容易混淆的概念，可以包含相似英文單字、數學公式、物理觀念或商業名詞。要求我分出定義、使用情境、常見錯誤、記憶鉤子，最後做一題混淆測驗。',
  },
  {
    id: 'error_repair',
    title: '錯誤修正回路',
    subtitle: '故意犯錯、找原因、重做一次，形成肌肉記憶',
    card: 'Repair Bonus',
    level: 'Level 1 · 修正閉環',
    group: 'kinesthetic_dominant',
    vark: ['kinesthetic', 'auditory'],
    genius: ['explorer', 'performer', 'analyst'],
    duration: '5 分鐘',
    outcome: '完成一次錯誤診斷 + 修正版答案',
    abilityWeights: { errorRepair: 3, activeRecall: 1, liveOutput: 1 },
    coachFocus: ['看錯誤', '動手改', '重做一次', '口頭說規則'],
    prompt:
      '啟動 Learning Gym：錯誤修正回路。請使用繁體中文。請給我一題含有故意錯誤的解題、筆記或分類結果，讓我找出錯在哪裡、為什麼錯、怎麼修。請用「看錯誤 → 動手改 → 重做一次 → 口頭說規則」四步驟引導我。',
  },
  {
    id: 'image_morph',
    title: 'AI 圖像生成變形記',
    subtitle: '把難背內容變成荒謬、高彩度、可修改的視覺錨點',
    card: 'Visual Dominant A',
    level: 'Level 1 · 單字錨定',
    group: 'visual_dominant',
    vark: ['visual'],
    genius: ['visionary', 'connector'],
    duration: '7 分鐘',
    outcome: '產生一張誇張圖像 prompt + 自訂變形規則',
    abilityWeights: { visualSpatial: 3, storyBinding: 1, activeRecall: 1 },
    coachFocus: ['不要只給字義，要生成畫面', '要求使用者親手修改畫面元素', '把畫面變成下次回想線索'],
    prompt:
      '啟動 Learning Gym：AI 圖像生成變形記。請使用繁體中文。請讓我提供一個難背單字、公式或概念；你要把它轉成荒謬、高彩度、具體的圖像 prompt，像「眼神死的猴子在灰暗房間重複敲同一個鋼琴音」。接著請我改三個元素：顏色、角色、道具。最後要求我不看定義，只看腦中畫面說出原概念。',
  },
  {
    id: 'color_symbol_notes',
    title: '螢光色階與符號筆記術',
    subtitle: '用 3 色原則、符號和箭頭把課文變成藏寶圖',
    card: 'Visual Dominant C',
    level: 'Level 2 · 視覺標籤',
    group: 'visual_dominant',
    vark: ['visual', 'reading'],
    genius: ['visionary', 'architect', 'connector'],
    duration: '6 分鐘',
    outcome: '輸出一套顏色規則 + 一張符號化筆記',
    abilityWeights: { visualSpatial: 2, structureMapping: 2, contrastLogic: 1 },
    coachFocus: ['固定三色規則', '用幾何符號表示定義、常考、因果', '最後讓使用者重建筆記骨架'],
    prompt:
      '啟動 Learning Gym：螢光色階與符號筆記術。請使用繁體中文。請給我一段短課文，先建立 3 色規則：綠色定義、粉紅常考、黃色因果，再要求我用三角、圓圈、箭頭、星號把內容整理成視覺藏寶圖。最後請我不看原文，只看符號規則重建摘要。',
  },
  {
    id: 'rap_word_beat',
    title: 'Rap 節奏單字覆誦',
    subtitle: '把長單字或考點拆成節拍、重音和洗腦副歌',
    card: 'Auditory Dominant A',
    level: 'Level 1 · Beat Matching',
    group: 'auditory_dominant',
    vark: ['auditory'],
    genius: ['melodist', 'performer', 'narrator'],
    duration: '5 分鐘',
    outcome: '完成節奏拆音 + 影子跟讀',
    abilityWeights: { soundLoop: 3, liveOutput: 1, activeRecall: 1 },
    coachFocus: ['把音節拆成節拍', '標示重音和停頓', '要求使用者跟讀再遮稿複述'],
    prompt:
      '啟動 Learning Gym：Rap 節奏單字覆誦。請使用繁體中文。請給我 5 個長單字、片語或考點，將它們拆成有節拍的音節，標出重音與停頓，並給一個簡單 beat 口令。請要求我跟著節奏做 shadowing，最後遮住文字憑聲音複述。',
  },
  {
    id: 'podcast_host',
    title: 'Podcast 說書人任務',
    subtitle: '假裝廣播主持人，用 60 秒把知識講給聽眾聽',
    card: 'Auditory Dominant B',
    level: 'Level 2 · 語音費曼',
    group: 'auditory_dominant',
    vark: ['auditory', 'reading'],
    genius: ['melodist', 'narrator', 'connector', 'analyst'],
    duration: '8 分鐘',
    outcome: '完成一段 60 秒說書稿 + 關鍵字檢核',
    abilityWeights: { soundLoop: 2, principleReasoning: 2, liveOutput: 1 },
    coachFocus: ['設定主持人情境', '檢查關鍵字完整度', '用停頓、語調和順序修正理解'],
    prompt:
      '啟動 Learning Gym：Podcast 說書人任務。請使用繁體中文。請給我一個學科主題，例如光合作用、法國大革命、供需曲線。要求我假裝廣播主持人，用 60 秒講給聽眾聽。請列出必須出現的 4 個關鍵字，等我回答後檢查順序、停頓、語調和完整度。',
  },
  {
    id: 'mnemonic_meme',
    title: '諧音迷因與口訣創作家',
    subtitle: '把年份、單字、流程變成順口溜、冷笑話或迷因',
    card: 'Auditory Dominant C',
    level: 'Level 2 · 口訣創作',
    group: 'auditory_dominant',
    vark: ['auditory', 'visual'],
    genius: ['melodist', 'connector', 'narrator', 'visionary'],
    duration: '6 分鐘',
    outcome: '創作一組口訣 + 立即提取測驗',
    abilityWeights: { soundLoop: 2, conceptLinking: 2, activeRecall: 1 },
    coachFocus: ['找諧音或節奏', '允許荒謬和冷笑話', '最後反向從口訣提取原知識'],
    prompt:
      '啟動 Learning Gym：諧音迷因與口訣創作家。請使用繁體中文。請給我 5 個需要背的年份、術語或流程，帶我用諧音、押韻、冷笑話或迷因創作口訣。完成後請反向測驗：你說口訣，我要說出原本知識點。',
  },
  {
    id: 'roleplay_quest',
    title: '情境式 AI 劇本殺',
    subtitle: '把單字、歷史或概念包裝成角色扮演任務',
    card: 'Kinesthetic Dominant A',
    level: 'Level 2 · 沉浸對話',
    group: 'kinesthetic_dominant',
    vark: ['kinesthetic', 'auditory'],
    genius: ['explorer', 'performer', 'narrator'],
    duration: '9 分鐘',
    outcome: '完成 1 段角色扮演 + 5 個核心詞觸發劇情',
    abilityWeights: { sceneEncoding: 3, liveOutput: 2, storyBinding: 1 },
    coachFocus: ['給角色、壓力和目標', '指定 5 個核心詞或關鍵概念', '正確使用才推進劇情'],
    prompt:
      '啟動 Learning Gym：情境式 AI 劇本殺。請使用繁體中文。請把一組單字、歷史事件或學科概念包裝成 1 對 1 角色扮演。讓我扮演時空偵探、談判 PM 或任務角色。你要指定 5 個核心詞或關鍵概念，我必須在對話中自然用出來，才能觸發下一個劇情線索。',
  },
  {
    id: 'body_anchor',
    title: '微動作記憶法指南',
    subtitle: '把抽象概念綁定手勢、姿勢或小道具',
    card: 'Kinesthetic Dominant B',
    level: 'Level 1 · 身體錨定',
    group: 'kinesthetic_dominant',
    vark: ['kinesthetic'],
    genius: ['explorer', 'performer', 'analyst'],
    duration: '5 分鐘',
    outcome: '建立 5 個身體動作錨點 + 卡住提示',
    abilityWeights: { sceneEncoding: 1, liveOutput: 2, activeRecall: 2 },
    coachFocus: ['每個概念綁定一個微動作', '卡住時提示動作', '用動作反向喚醒概念'],
    prompt:
      '啟動 Learning Gym：微動作記憶法指南。請使用繁體中文。請給我 5 個概念或單字，幫我替每個概念設計一個微小身體動作，例如上升就手往上、拒絕就推開。接著做測驗：你只提示動作，我要回想概念；如果我卡住，請提醒我當時的動作。',
  },
  {
    id: 'walking_room',
    title: '番茄鐘走讀與空間轉換術',
    subtitle: '把不同學科分配到房間角落，用移動分類記憶',
    card: 'Kinesthetic Dominant C',
    level: 'Level 1 · 空間節奏',
    group: 'kinesthetic_dominant',
    vark: ['kinesthetic', 'visual'],
    genius: ['explorer', 'performer', 'visionary'],
    duration: '6 分鐘',
    outcome: '產生一份 20/5 走讀計畫 + 空間分類表',
    abilityWeights: { sceneEncoding: 2, visualSpatial: 1, activeRecall: 2 },
    coachFocus: ['規劃 20 分鐘讀 + 5 分鐘走', '替不同學科分配房間位置', '用位置回想重點'],
    prompt:
      '啟動 Learning Gym：番茄鐘走讀與空間轉換術。請使用繁體中文。請先問我今天要讀哪些科目，再幫我分配到房間不同角落，例如窗台英文、書桌數學、床頭歷史。請規劃 20 分鐘讀、5 分鐘走動的節奏，最後要求我用空間位置回想各科重點。',
  },
  {
    id: 'root_tree',
    title: '字根字首拆解樹',
    subtitle: '把長單字拆成 Prefix、Root、Suffix 的文字樂高',
    card: 'Logical Dominant A',
    level: 'Level 2 · 文字樂高',
    group: 'logical_dominant',
    vark: ['reading', 'visual'],
    genius: ['analyst', 'architect', 'connector'],
    duration: '7 分鐘',
    outcome: '完成一棵字根拆解樹 + 同根延伸',
    abilityWeights: { principleReasoning: 2, structureMapping: 2, contrastLogic: 1 },
    coachFocus: ['拆 prefix/root/suffix', '說出字源邏輯', '延伸同字根單字'],
    prompt:
      '啟動 Learning Gym：字根字首拆解樹。請使用繁體中文。請給我 5 個長單字或術語，帶我拆成 Prefix、Root、Suffix，像 un + pre + cede + nt + ed。每拆一個都要說出「為什麼這樣組合會得到這個意思」，最後延伸 3 個同字根單字。',
  },
  {
    id: 'causal_map',
    title: '知識地圖連連看',
    subtitle: '把破碎知識拖成因為 A 所以 B 的因果網絡',
    card: 'Logical Dominant B',
    level: 'Level 3 · 因果網絡',
    group: 'logical_dominant',
    vark: ['reading', 'visual'],
    genius: ['architect', 'connector', 'analyst'],
    duration: '9 分鐘',
    outcome: '完成一張因果鏈地圖 + 邏輯鏈檢查',
    abilityWeights: { structureMapping: 2, principleReasoning: 2, conceptLinking: 2 },
    coachFocus: ['給破碎知識點', '要求建立 A→B→C 因果鏈', '批改邏輯鏈是否合理'],
    prompt:
      '啟動 Learning Gym：知識地圖連連看。請使用繁體中文。請給我一組破碎知識點，可以是地理洋流、氣候、作物，或歷史條約與戰爭。要求我建立「因為 A，所以導致 B，最後產生 C」的因果網絡。請逐條檢查我的邏輯鏈是否合理。',
  },
  {
    id: 'ai_debugger',
    title: 'AI 挑錯與除錯專家任務',
    subtitle: '扮演抓漏專家，修正 AI 故意寫錯的摘要或解題',
    card: 'Logical Dominant C',
    level: 'Level 3 · 除錯評估',
    group: 'logical_dominant',
    vark: ['reading', 'kinesthetic'],
    genius: ['analyst', 'architect', 'connector', 'performer'],
    duration: '8 分鐘',
    outcome: '找出錯誤、說明原因、產生修正版',
    abilityWeights: { errorRepair: 3, principleReasoning: 2, contrastLogic: 1 },
    coachFocus: ['故意給錯誤摘要', '要求找錯、說原因、修正', '最後讓使用者口頭說規則'],
    prompt:
      '啟動 Learning Gym：AI 挑錯與除錯專家任務。請使用繁體中文。請故意給我一段含有邏輯漏洞、語法錯誤或事實矛盾的課文摘要或解題，讓我扮演抓漏專家。我要指出錯在哪裡、為什麼錯、正確版本是什麼。最後請要求我用一句規則總結這次修正。',
  },
];

export const TALENT_TRAINING_PROFILES: Record<LearningGymTalentGroupId, TalentTrainingProfile> = {
  visual_dominant: {
    id: 'visual_dominant',
    name: '影像造景師',
    nameEn: 'Visual Dominant',
    superpower: '擁有強大的大腦照相機，擅長把抽象文字轉成高彩度、高飽和度的動態畫面。',
    landmine: '不要把他們丟進密密麻麻、沒有插圖、只有純文字的筆記裡；大腦會直接進入保護色放空模式。',
    parentAdvice: '孩子讀書時畫圖、塗鴉、上色，不一定是分心；那可能是他在幫大腦照相機沖洗照片。',
    taskIds: ['image_morph', 'memory_palace', 'color_symbol_notes'],
  },
  auditory_dominant: {
    id: 'auditory_dominant',
    name: '旋律獵人',
    nameEn: 'Auditory Dominant',
    superpower: '擁有靈敏的聲音捕手，對節奏、語調、韻律極度敏感，常用腦中的聲音讀給自己聽。',
    landmine: '絕對安靜不一定適合他們；太安靜時，微小雜音反而會被放大，或讓大腦開始打瞌睡。',
    parentAdvice: '孩子碎碎念、跟讀、打節拍時，不一定是在吵；他正在把知識灌錄成自己的大腦 MP3。',
    taskIds: ['rap_word_beat', 'podcast_host', 'mnemonic_meme'],
  },
  kinesthetic_dominant: {
    id: 'kinesthetic_dominant',
    name: '戲劇行動派',
    nameEn: 'Kinesthetic Dominant',
    superpower: '具備肌肉與情境體感記憶，需要移動、操作或投入場景，才能真正消化知識。',
    landmine: '硬坐兩小時不動會耗盡意志力，讓大腦只剩控制身體不要動，沒有餘力記憶。',
    parentAdvice: '轉筆、抖腳、走來走去不一定是過動；對這類孩子來說，動能就是大腦發電機。',
    taskIds: ['roleplay_quest', 'body_anchor', 'walking_room'],
  },
  logical_dominant: {
    id: 'logical_dominant',
    name: '邏輯解密者',
    nameEn: 'Logical Dominant',
    superpower: '擁有嚴密的系統分析儀，新知識必須找到分類資料夾並與舊知識連線，才會留下來。',
    landmine: '不要叫他們不要問為什麼、硬背就好；這會直接關閉學習動機。',
    parentAdvice: '他們一直問為什麼不是故意找麻煩；那是他們把知識放進長期記憶資料庫的必要步驟。',
    taskIds: ['root_tree', 'causal_map', 'ai_debugger'],
  },
};

export const GENIUS_IDENTITY_TRAINING: Record<GeniusType, GeniusIdentityTraining> = {
  explorer: {
    genius: 'explorer',
    identityName: '情境探險家',
    groupId: 'kinesthetic_dominant',
    mechanism: '用角色、壓力、地點和身體動作，把抽象內容變成「我在那裡做過」的情境記憶。',
    primaryTaskIds: ['roleplay_quest', 'scene_anchor', 'walking_room', 'body_anchor'],
    abilityFocus: ['sceneEncoding', 'activeRecall', 'liveOutput'],
  },
  architect: {
    genius: 'architect',
    identityName: '框架建築師',
    groupId: 'logical_dominant',
    mechanism: '先建立分類架構和因果骨架，再把細節填進去；沒有結構的資訊先不背。',
    primaryTaskIds: ['data_to_table', 'causal_map', 'root_tree', 'similarity_split'],
    abilityFocus: ['structureMapping', 'principleReasoning', 'contrastLogic'],
  },
  melodist: {
    genius: 'melodist',
    identityName: '旋律獵人',
    groupId: 'auditory_dominant',
    mechanism: '用節奏、重音、口訣和語音複述，把知識變成可以在腦中播放的聲音檔。',
    primaryTaskIds: ['rap_word_beat', 'sound_shadow', 'podcast_host', 'mnemonic_meme'],
    abilityFocus: ['soundLoop', 'liveOutput', 'activeRecall'],
  },
  narrator: {
    genius: 'narrator',
    identityName: '情感說書人',
    groupId: 'auditory_dominant',
    mechanism: '把詞彙與概念放進有人物、聲音、情緒和轉折的故事；有感覺才留得住。',
    primaryTaskIds: ['story_recall', 'podcast_host', 'roleplay_quest', 'mnemonic_meme'],
    abilityFocus: ['storyBinding', 'soundLoop', 'sceneEncoding'],
  },
  connector: {
    genius: 'connector',
    identityName: '知識織網者',
    groupId: 'logical_dominant',
    mechanism: '用類比、跨域隱喻和因果網絡把新知識接到舊知識，讓每個節點都有路可回想。',
    primaryTaskIds: ['concept_web', 'causal_map', 'mnemonic_meme', 'data_to_table'],
    abilityFocus: ['conceptLinking', 'structureMapping', 'contrastLogic'],
  },
  analyst: {
    genius: 'analyst',
    identityName: '原理解密者',
    groupId: 'logical_dominant',
    mechanism: '先問為什麼、拆規則、找漏洞，再用自己的話輸出；理解完成才開始記憶。',
    primaryTaskIds: ['root_tree', 'ai_debugger', 'principle_output', 'causal_map'],
    abilityFocus: ['principleReasoning', 'errorRepair', 'activeRecall'],
  },
  performer: {
    genius: 'performer',
    identityName: '戲劇行動派',
    groupId: 'kinesthetic_dominant',
    mechanism: '用即興輸出、角色扮演和錯誤重做，把「說出口、做出來」的瞬間變成記憶錨點。',
    primaryTaskIds: ['live_output', 'roleplay_quest', 'body_anchor', 'error_repair'],
    abilityFocus: ['liveOutput', 'errorRepair', 'sceneEncoding'],
  },
  visionary: {
    genius: 'visionary',
    identityName: '影像造景師',
    groupId: 'visual_dominant',
    mechanism: '把內容轉成強烈畫面、顏色標籤和空間位置；先看見，才說得出來。',
    primaryTaskIds: ['image_morph', 'memory_palace', 'color_symbol_notes', 'data_to_table'],
    abilityFocus: ['visualSpatial', 'structureMapping', 'activeRecall'],
  },
};

export function getRecommendedGymTasks(
  geniusType: GeniusType | null,
  learningStyle: LearningStyle | null
): LearningGymTask[] {
  const identity = geniusType ? GENIUS_IDENTITY_TRAINING[geniusType] : null;
  return [...LEARNING_GYM_TASKS].sort((a, b) => {
    const aScore = (identity?.primaryTaskIds.includes(a.id) ? 8 : 0)
      + (identity?.groupId === a.group ? 2 : 0)
      + (geniusType && a.genius.includes(geniusType) ? 4 : 0)
      + (learningStyle && a.vark.includes(learningStyle) ? 2 : 0)
      + (a.card.includes('Bonus') ? 0 : 1);
    const bScore = (identity?.primaryTaskIds.includes(b.id) ? 8 : 0)
      + (identity?.groupId === b.group ? 2 : 0)
      + (geniusType && b.genius.includes(geniusType) ? 4 : 0)
      + (learningStyle && b.vark.includes(learningStyle) ? 2 : 0)
      + (b.card.includes('Bonus') ? 0 : 1);
    return bScore - aScore;
  });
}

export function getTalentTrainingProfile(groupId: LearningGymTalentGroupId | null | undefined) {
  return groupId ? TALENT_TRAINING_PROFILES[groupId] : null;
}

export function getGeniusIdentityTraining(geniusType: GeniusType | null | undefined) {
  return geniusType ? GENIUS_IDENTITY_TRAINING[geniusType] : null;
}

export function getLearningGymTaskById(taskId: LearningGymTaskId) {
  return LEARNING_GYM_TASKS.find((task) => task.id === taskId) || null;
}

const progressKey = (userId = 'guest') => `learning_gym_progress_${userId}`;

export function loadLearningGymProgress(userId = 'guest'): LearningGymProgress {
  try {
    const raw = localStorage.getItem(progressKey(userId));
    if (!raw) return { ...EMPTY_LEARNING_GYM_PROGRESS };
    return { ...EMPTY_LEARNING_GYM_PROGRESS, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_LEARNING_GYM_PROGRESS };
  }
}

export function saveLearningGymProgress(progress: LearningGymProgress, userId = 'guest') {
  try {
    localStorage.setItem(progressKey(userId), JSON.stringify(progress));
  } catch {
    /* ignore */
  }
}

export function applyGymTaskStart(
  progress: LearningGymProgress,
  task: LearningGymTask
): LearningGymProgress {
  const next = { ...progress };
  for (const [ability, weight] of Object.entries(task.abilityWeights) as [LearningGymAbility, number][]) {
    next[ability] = Math.min(100, next[ability] + Math.max(1, Math.round(weight)));
  }
  return next;
}

export function scoreLearningGymInput(
  progress: LearningGymProgress,
  input: string,
  task: LearningGymTask | null,
): { progress: LearningGymProgress; gained: Partial<Record<LearningGymAbility, number>> } {
  const text = input.toLowerCase();
  const gained: Partial<Record<LearningGymAbility, number>> = {};
  const next = { ...progress };
  const add = (ability: LearningGymAbility, points: number) => {
    gained[ability] = (gained[ability] || 0) + points;
    next[ability] = Math.min(100, next[ability] + points);
  };

  if (task) {
    for (const [ability, weight] of Object.entries(task.abilityWeights) as [LearningGymAbility, number][]) {
      add(ability, Math.max(1, Math.ceil(weight / 2)));
    }
  }
  if (/(場景|地點|情境|角色|心情|where|scene)/i.test(text)) add('sceneEncoding', 2);
  if (/(表格|分類|欄位|結構|規則|框架|tree|table)/i.test(text)) add('structureMapping', 2);
  if (/(聲音|節奏|重音|跟讀|聽|錄音|shadow)/i.test(text)) add('soundLoop', 2);
  if (/(rap|beat|口訣|諧音|押韻|podcast|主持人|廣播)/i.test(text)) add('soundLoop', 2);
  if (/(故事|角色|情緒|反應|日記|story)/i.test(text)) add('storyBinding', 2);
  if (/(類比|連結|隱喻|像|關係|concept)/i.test(text)) add('conceptLinking', 2);
  if (/(因果|網絡|節點|跨域|隱喻)/i.test(text)) add('conceptLinking', 2);
  if (/(為什麼|原理|原因|推導|邏輯|because|why|字根|字首|後綴)/i.test(text)) add('principleReasoning', 2);
  if (/(我會說|我會做|重做|演|輸出|練習|角色扮演|劇本殺)/i.test(text)) add('liveOutput', 1);
  if (/(圖|位置|空間|顏色|心智圖|宮殿|visual|螢光|符號|畫面|高彩度)/i.test(text)) add('visualSpatial', 2);
  if (/(數字|公式|代碼|年份|轉碼|number)/i.test(text)) add('numberCoding', 2);
  if (/(差異|比較|不同|相似|混淆|contrast)/i.test(text)) add('contrastLogic', 2);
  if (/(錯|修正|改|盲點|錯誤|error|除錯|debug|挑錯|漏洞)/i.test(text)) add('errorRepair', 2);
  if (/(回想|不看|遮住|憑記憶|recall)/i.test(text)) add('activeRecall', 2);

  return { progress: next, gained };
}

export function topLearningGymAbilities(progress: LearningGymProgress, limit = 3) {
  return (Object.entries(progress) as [LearningGymAbility, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export function buildLearningGymPrompt(
  task: LearningGymTask,
  plan: GeniusPlan,
  profileContext: string,
  progress: LearningGymProgress
) {
  const abilityText = Object.entries(task.abilityWeights)
    .map(([ability, weight]) => `${LEARNING_GYM_ABILITY_LABELS[ability as LearningGymAbility]} +${weight}`)
    .join('、');
  const progressText = topLearningGymAbilities(progress, 4)
    .map(([ability, value]) => `${LEARNING_GYM_ABILITY_LABELS[ability]} ${value}`)
    .join('、');

  return `${task.prompt}

使用者目前 profile：
${profileContext}

本型態正式訓練方案：
- 記憶特徵：${plan.signature}
- 編碼策略：${plan.encode.label}｜${plan.encode.hint}
- 提取策略：${plan.retrieve.label}｜${plan.retrieve.prompt}
- 間隔複習節奏：${plan.schedule.map((d) => `第${d}天`).join(' → ')}
${plan.weeklyTask ? `- 本週訓練建議：${plan.weeklyTask}` : ''}

本關卡設定：
- 卡牌：${task.card}
- 關卡：${task.level}
- 本關能力加成：${abilityText}
- 目前能力強項：${progressText || '尚未累積'}
- 教練重點：${task.coachFocus.join('；')}

請用「教練式對話」進行：
1. 先用 2 句話說明今天訓練目標。
2. 一次只出一個小任務，等使用者回答。
3. 每次回饋都要指出：使用者這次強化了哪個 VARK 通道、哪個記憶天賦能力。
4. 如果回答太空泛，要求補上具體場景、結構、聲音、故事、原理或修正版。
5. 最後用一句話提示如何把這次成果放進間隔複習。`;
}
