import type { AidEffect, SkillDef } from '../../core/types';

/**
 * Memory techniques, not attacks.
 *
 * Every skill here is an `aid`: it changes the question in front of you rather
 * than dealing damage directly. Damage comes from answering correctly, so
 * skills buy you information, protection or leverage — never a free win.
 *
 * Each class learns the same four effects but in a different order, so the
 * early game feels distinct: an 建築師 gets option-elimination first, while a
 * 敘事者 opens with the damage amplifier.
 */

interface AidSpec {
  id: string;
  name: string;
  technique: string;
  effect: AidEffect;
  description: string;
  reqLevel: number;
  spCost: number;
  cooldown: number;
  icon: string;
  fx: number;
}

const EFFECT_COLOR: Record<AidEffect, number> = {
  eliminate: 0x8ad0ff,
  hint: 0xffe08a,
  amplify: 0xff9a6b,
  shield: 0x9cf5a8,
  skip: 0xd8c8ff,
};

function aid(spec: AidSpec): SkillDef {
  return {
    id: spec.id,
    name: spec.name,
    kind: 'aid',
    description: spec.description,
    element: 'holy',
    power: 0,
    spCost: spec.spCost,
    cooldown: spec.cooldown,
    range: 0,
    reqLevel: spec.reqLevel,
    icon: spec.icon,
    fx: spec.fx,
    aidEffect: spec.effect,
    technique: spec.technique,
  };
}

const SPECS: AidSpec[] = [
  // ── 探索者 EXPLORER — 動覺 ─────────────────────────────────────────────
  { id: 'fieldnote', name: '實地筆記', technique: '情境記憶', effect: 'hint', description: '回想當初學到這個字的場景，顯示提示。', reqLevel: 1, spCost: 8, cooldown: 12, icon: '🗺️', fx: EFFECT_COLOR.hint },
  { id: 'pace', name: '踱步思考', technique: '動作編碼', effect: 'shield', description: '走動整理思緒，擋下一次答錯的反噬。', reqLevel: 4, spCost: 14, cooldown: 22, icon: '🚶', fx: EFFECT_COLOR.shield },
  { id: 'muscle', name: '肌肉記憶', technique: '重複動作', effect: 'eliminate', description: '身體比腦袋先反應，刪去多數錯誤選項。', reqLevel: 8, spCost: 16, cooldown: 20, icon: '💪', fx: EFFECT_COLOR.eliminate },
  { id: 'immersion', name: '全身浸入', technique: '沉浸式回憶', effect: 'amplify', description: '整個人進入情境，下一次答對傷害加倍。', reqLevel: 14, spCost: 22, cooldown: 26, icon: '🌊', fx: EFFECT_COLOR.amplify },

  // ── 建築師 ARCHITECT — 讀寫 ────────────────────────────────────────────
  { id: 'palace', name: '記憶宮殿', technique: '空間定位法', effect: 'eliminate', description: '走進宮殿取出正確的那一個，刪去多數錯誤選項。', reqLevel: 1, spCost: 10, cooldown: 14, icon: '🏛️', fx: EFFECT_COLOR.eliminate },
  { id: 'blueprint', name: '結構藍圖', technique: '層級拆解', effect: 'hint', description: '看清這個字的組成，顯示提示。', reqLevel: 4, spCost: 10, cooldown: 16, icon: '📐', fx: EFFECT_COLOR.hint },
  { id: 'index', name: '索引檢索', technique: '編號定位', effect: 'shield', description: '按編號取回資訊，擋下一次答錯的反噬。', reqLevel: 8, spCost: 16, cooldown: 22, icon: '🗂️', fx: EFFECT_COLOR.shield },
  { id: 'archive', name: '典藏調閱', technique: '長期記憶提取', effect: 'amplify', description: '從深層記憶調出資料，下一次答對傷害加倍。', reqLevel: 14, spCost: 24, cooldown: 28, icon: '📚', fx: EFFECT_COLOR.amplify },

  // ── 旋律人 MELODIST — 聽覺 ────────────────────────────────────────────
  { id: 'rhyme', name: '諧音聯想', technique: '聲音掛鉤', effect: 'hint', description: '用相近的聲音勾出答案，顯示提示。', reqLevel: 1, spCost: 8, cooldown: 12, icon: '🎵', fx: EFFECT_COLOR.hint },
  { id: 'cadence', name: '語調辨識', technique: '韻律記憶', effect: 'eliminate', description: '聽出不對勁的節奏，刪去多數錯誤選項。', reqLevel: 4, spCost: 14, cooldown: 18, icon: '🎼', fx: EFFECT_COLOR.eliminate },
  { id: 'echo', name: '回聲複誦', technique: '聽覺循環', effect: 'shield', description: '在腦中重播一次，擋下一次答錯的反噬。', reqLevel: 8, spCost: 16, cooldown: 22, icon: '🔊', fx: EFFECT_COLOR.shield },
  { id: 'chorus', name: '合唱共鳴', technique: '旋律強化', effect: 'amplify', description: '整段旋律浮現，下一次答對傷害加倍。', reqLevel: 14, spCost: 22, cooldown: 26, icon: '🎤', fx: EFFECT_COLOR.amplify },

  // ── 敘事者 NARRATOR — 聽覺＋動覺 ──────────────────────────────────────
  { id: 'story', name: '故事串聯', technique: '敘事鏈', effect: 'amplify', description: '把字串進故事線，下一次答對傷害加倍。', reqLevel: 1, spCost: 12, cooldown: 16, icon: '📖', fx: EFFECT_COLOR.amplify },
  { id: 'thread', name: '線索回溯', technique: '前後文推理', effect: 'hint', description: '從故事前段找線索，顯示提示。', reqLevel: 4, spCost: 10, cooldown: 14, icon: '🧵', fx: EFFECT_COLOR.hint },
  { id: 'cliffhanger', name: '懸念暫停', technique: '注意力鎖定', effect: 'shield', description: '暫停一拍穩住場面，擋下一次答錯的反噬。', reqLevel: 8, spCost: 16, cooldown: 22, icon: '⏸️', fx: EFFECT_COLOR.shield },
  { id: 'epilogue', name: '收束結局', technique: '整合複述', effect: 'eliminate', description: '故事只有一個合理結局，刪去多數錯誤選項。', reqLevel: 14, spCost: 20, cooldown: 24, icon: '📕', fx: EFFECT_COLOR.eliminate },

  // ── 織網者 CONNECTOR — 聽覺＋讀寫 ─────────────────────────────────────
  { id: 'etymology', name: '語源追溯', technique: '詞根分析', effect: 'hint', description: '拆到字根就看得懂，顯示提示。', reqLevel: 1, spCost: 9, cooldown: 13, icon: '🌱', fx: EFFECT_COLOR.hint },
  { id: 'web', name: '詞族織網', technique: '關聯記憶', effect: 'eliminate', description: '同族的字互相印證，刪去多數錯誤選項。', reqLevel: 4, spCost: 14, cooldown: 18, icon: '🕸️', fx: EFFECT_COLOR.eliminate },
  { id: 'cognate', name: '同源對照', technique: '跨語言連結', effect: 'shield', description: '從母語找到對應，擋下一次答錯的反噬。', reqLevel: 8, spCost: 16, cooldown: 22, icon: '🔗', fx: EFFECT_COLOR.shield },
  { id: 'synthesis', name: '融會貫通', technique: '知識整合', effect: 'amplify', description: '所有線索匯聚，下一次答對傷害加倍。', reqLevel: 14, spCost: 22, cooldown: 26, icon: '✨', fx: EFFECT_COLOR.amplify },

  // ── 分析師 ANALYST — 讀寫＋動覺 ───────────────────────────────────────
  { id: 'parse', name: '結構拆解', technique: '語法分析', effect: 'shield', description: '拆開句子就不會慌，擋下一次答錯的反噬。', reqLevel: 1, spCost: 10, cooldown: 14, icon: '🔬', fx: EFFECT_COLOR.shield },
  { id: 'rule', name: '規則推導', technique: '規律歸納', effect: 'eliminate', description: '不合規則的先排除，刪去多數錯誤選項。', reqLevel: 4, spCost: 14, cooldown: 18, icon: '📏', fx: EFFECT_COLOR.eliminate },
  { id: 'contrast', name: '對比辨析', technique: '最小差異比較', effect: 'hint', description: '比較近義詞的差別，顯示提示。', reqLevel: 8, spCost: 12, cooldown: 16, icon: '⚖️', fx: EFFECT_COLOR.hint },
  { id: 'proof', name: '推論驗證', technique: '邏輯確認', effect: 'amplify', description: '確認無誤才出手，下一次答對傷害加倍。', reqLevel: 14, spCost: 24, cooldown: 28, icon: '✅', fx: EFFECT_COLOR.amplify },

  // ── 表演者 PERFORMER — 動覺＋聽覺 ─────────────────────────────────────
  { id: 'shadowing', name: '影子跟讀', technique: '同步複述', effect: 'amplify', description: '跟著原音複述，下一次答對傷害加倍。', reqLevel: 1, spCost: 12, cooldown: 15, icon: '🗣️', fx: EFFECT_COLOR.amplify },
  { id: 'gesture', name: '手勢輔助', technique: '身體語言', effect: 'hint', description: '比劃一下就想起來，顯示提示。', reqLevel: 4, spCost: 9, cooldown: 13, icon: '👐', fx: EFFECT_COLOR.hint },
  { id: 'improv', name: '即興應對', technique: '臨場反應', effect: 'skip', description: '先跳過這題，換個話題再回來。', reqLevel: 8, spCost: 18, cooldown: 30, icon: '🎭', fx: EFFECT_COLOR.skip },
  { id: 'standing', name: '氣場全開', technique: '表達自信', effect: 'shield', description: '氣勢壓住場面，擋下一次答錯的反噬。', reqLevel: 14, spCost: 20, cooldown: 24, icon: '🌟', fx: EFFECT_COLOR.shield },

  // ── 圖像家 VISIONARY — 視覺 ───────────────────────────────────────────
  { id: 'imagery', name: '圖像編碼', technique: '視覺轉換', effect: 'hint', description: '把字變成畫面，顯示提示。', reqLevel: 1, spCost: 8, cooldown: 12, icon: '🖼️', fx: EFFECT_COLOR.hint },
  { id: 'colourcode', name: '色彩標記', technique: '顏色分類', effect: 'eliminate', description: '錯的選項顏色不對，刪去多數錯誤選項。', reqLevel: 4, spCost: 13, cooldown: 17, icon: '🎨', fx: EFFECT_COLOR.eliminate },
  { id: 'snapshot', name: '瞬間快照', technique: '照相記憶', effect: 'amplify', description: '整頁畫面重現，下一次答對傷害加倍。', reqLevel: 8, spCost: 20, cooldown: 24, icon: '📸', fx: EFFECT_COLOR.amplify },
  { id: 'panorama', name: '全景綜覽', technique: '整體視野', effect: 'shield', description: '看見全局就不會亂，擋下一次答錯的反噬。', reqLevel: 14, spCost: 18, cooldown: 22, icon: '🏞️', fx: EFFECT_COLOR.shield },
];

export const INTERPRETER_SKILLS: Record<string, SkillDef> = Object.fromEntries(
  SPECS.map((spec) => [spec.id, aid(spec)]),
);
