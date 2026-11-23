import { describe, expect, it } from 'vitest';
import { getKeyboardMovement } from '@/game/core/keyboard-movement';

describe('仙境鍵盤移動', () => {
  const yaw = 0.73;

  it('將方向鍵對應到既有的 WASD 方向', () => {
    const aliases = [
      ['arrowup', 'w'],
      ['arrowdown', 's'],
      ['arrowleft', 'a'],
      ['arrowright', 'd'],
    ];

    for (const [arrow, wasd] of aliases) {
      expect(getKeyboardMovement(new Set([arrow]), yaw))
        .toEqual(getKeyboardMovement(new Set([wasd]), yaw));
    }
  });

  it('允許同時按下方向鍵進行斜向移動', () => {
    expect(getKeyboardMovement(new Set(['arrowup', 'arrowleft']), yaw))
      .toEqual(getKeyboardMovement(new Set(['w', 'a']), yaw));
  });

  it('沒有按下移動鍵時回傳零向量', () => {
    expect(getKeyboardMovement(new Set(), yaw)).toEqual({ x: 0, z: 0 });
  });
});
