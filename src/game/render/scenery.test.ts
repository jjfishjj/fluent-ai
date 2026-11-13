import { describe, expect, it } from 'vitest';
import { ZONES } from '../data/zones';
import { buildZoneScene } from './scenery';

describe('Qingyun language-learning shrine', () => {
  it('adds eight animated flashcards to Qingyun and keeps other zones unchanged', () => {
    const qingyun = buildZoneScene(ZONES.qingyun);
    const shrine = qingyun.root.getObjectByName('language-learning-shrine');
    expect(shrine).toBeDefined();
    expect(shrine?.children.filter((child) => child.name.startsWith('floating-memory-card-'))).toHaveLength(8);

    const firstCard = shrine?.getObjectByName('floating-memory-card-0');
    expect(firstCard).toBeDefined();
    const startX = firstCard?.position.x;
    qingyun.update(3);
    expect(firstCard?.position.x).not.toBe(startX);
    qingyun.dispose();

    const bamboo = buildZoneScene(ZONES.bamboo);
    expect(bamboo.root.getObjectByName('language-learning-shrine')).toBeUndefined();
    bamboo.dispose();
  });
});
