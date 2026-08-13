import type { BirdDef } from '../core/types';

/**
 * Six mounts. Every stat trades against another one: the fastest bird steers
 * worst, the nimblest has the lowest top speed, and stamina decides how much
 * of a lap you can spend sprinting.
 */
export const BIRDS: Record<string, BirdDef> = {
  gold: {
    id: 'gold',
    name: '金羽',
    title: '全能型',
    topSpeed: 30,
    accel: 1.55,
    handling: 2.05,
    grip: 7.6,
    stamina: 100,
    body: 0xf5d264,
    accent: 0xfff3c4,
    beak: 0xff9c3c,
    blurb: '沒有弱點的入門座騎，適合先熟悉賽道。',
  },
  crimson: {
    id: 'crimson',
    name: '朱雀羽',
    title: '衝刺型',
    topSpeed: 32.5,
    accel: 1.85,
    handling: 1.75,
    grip: 6.6,
    stamina: 118,
    body: 0xe0553f,
    accent: 0xffb08a,
    beak: 0xffd166,
    blurb: '起步與衝刺都很猛，體力多，但彎道容易衝出去。',
  },
  azure: {
    id: 'azure',
    name: '青嵐羽',
    title: '操控型',
    topSpeed: 28.5,
    accel: 1.6,
    handling: 2.55,
    grip: 8.6,
    stamina: 92,
    body: 0x4aa8e0,
    accent: 0xcbeaff,
    beak: 0xffc75a,
    blurb: '抓地力最好，能用最短的路線過彎，直線稍慢。',
  },
  onyx: {
    id: 'onyx',
    name: '墨影羽',
    title: '極速型',
    topSpeed: 34.5,
    accel: 1.3,
    handling: 1.55,
    grip: 5.9,
    stamina: 86,
    body: 0x3b3f52,
    accent: 0x8f9bd0,
    beak: 0xc0c6e0,
    blurb: '直線之王，起步慢又難駕馭，長賽道才發揮得出來。',
  },
  jade: {
    id: 'jade',
    name: '翠玉羽',
    title: '耐力型',
    topSpeed: 29.5,
    accel: 1.5,
    handling: 2.1,
    grip: 7.9,
    stamina: 132,
    body: 0x5fbf7a,
    accent: 0xd6ffd9,
    beak: 0xffb347,
    blurb: '體力條特別長，幾乎可以整場開著衝刺。',
  },
  frost: {
    id: 'frost',
    name: '霜白羽',
    title: '甩尾型',
    topSpeed: 31,
    accel: 1.65,
    handling: 2.3,
    grip: 6.2,
    stamina: 96,
    body: 0xeaf1ff,
    accent: 0x9fd4ff,
    beak: 0xffa8c0,
    blurb: '滑得最開，甩尾蓄力最快，靠連續甩尾加速取勝。',
  },
};

export const BIRD_IDS = Object.keys(BIRDS);

export function birdDef(id: string): BirdDef {
  return BIRDS[id] ?? BIRDS.gold;
}

/** Rival riders, drawn in order for whichever birds the player did not take. */
export const RIVAL_NAMES = ['阿豆', '小雀', '飛廉', '雷奔', '風后', '青影', '赤浪', '雪泥'];
