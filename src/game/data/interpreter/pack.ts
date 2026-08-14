import type { ContentPack } from '../../core/content';
import { BARRIERS, INTERPRETER_ITEMS, INTERPRETER_SHOP } from './barriers';
import { INTERPRETER_CLASSES } from './classes';
import { INTERPRETER_SKILLS } from './skills';
import { INTERPRETER_QUESTS, INTERPRETER_ZONES } from './zones';

/**
 * 通譯官 — the fluent-ai campaign.
 *
 * Same engine as 仙境, but `turnBased` flips combat from realtime swings to
 * question exchanges, so progress comes from actually knowing the language.
 */
export const INTERPRETER_PACK: ContentPack = {
  id: 'interpreter',
  name: '通譯官',
  classes: INTERPRETER_CLASSES,
  skills: INTERPRETER_SKILLS,
  monsters: BARRIERS,
  items: INTERPRETER_ITEMS,
  zones: INTERPRETER_ZONES,
  quests: INTERPRETER_QUESTS,
  start: { zone: 'academy', pos: { x: 0, z: -2 } },
  startingKit: [
    { itemId: 'lozenge', qty: 8 },
    { itemId: 'coffee', qty: 4 },
  ],
  startingSilver: 250,
  defaultClass: 'architect',
  currency: '津貼',
  shop: INTERPRETER_SHOP,
  turnBased: true,
};

/** The language this campaign's first mission teaches. */
export const MISSION_LANGUAGE = 'english';
