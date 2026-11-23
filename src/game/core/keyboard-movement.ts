/** Maps WASD and arrow keys to the same camera-relative movement vector. */
export function getKeyboardMovement(keys: ReadonlySet<string>, yaw: number) {
  const forward = (keys.has('w') || keys.has('arrowup') ? 1 : 0)
    - (keys.has('s') || keys.has('arrowdown') ? 1 : 0);
  const strafe = (keys.has('d') || keys.has('arrowright') ? 1 : 0)
    - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
  if (!forward && !strafe) return { x: 0, z: 0 };

  // The camera sits behind the player at `yaw`, so "forward" points away from it.
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const rx = fz;
  const rz = -fx;
  return { x: fx * forward + rx * strafe, z: fz * forward + rz * strafe };
}
