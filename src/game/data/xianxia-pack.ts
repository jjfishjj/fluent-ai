import type { ContentPack } from '../core/content';
import { CLASSES } from './classes';
import { ITEMS, SHOP_STOCK } from './items';
import { MONSTERS } from './monsters';
import { QUESTS } from './quests';
import { SKILLS } from './skills';
import { ZONES } from './zones';

/** The original 仙境奇俠傳 campaign, served at /xianjing. */
export const XIANXIA_PACK: ContentPack = {
  id: 'xianxia',
  name: '仙境奇俠傳',
  classes: CLASSES,
  skills: SKILLS,
  monsters: MONSTERS,
  items: ITEMS,
  zones: ZONES,
  quests: QUESTS,
  start: { zone: 'qingyun', pos: { x: 0, z: -4 } },
  startingKit: [
    { itemId: 'redpotion', qty: 10 },
    { itemId: 'bluepotion', qty: 5 },
  ],
  startingSilver: 300,
  defaultClass: 'sword',
  currency: '銀兩',
  shop: SHOP_STOCK,
};
