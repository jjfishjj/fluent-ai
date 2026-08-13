import { useCallback, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { RaceLobby, type RaceOptions } from '@/components/game/race/RaceLobby';
import { RaceView } from '@/components/game/race/RaceView';

/**
 * 陸行鳥外交巡迴賽 3D — a three.js racer wrapped around fluent-ai's learning
 * loop: each course is a host nation and the gates on it are language and
 * memory questions. The page owns the lobby; once a race starts, `RaceView`
 * owns the canvas, the simulation and the campaign bookkeeping.
 */
export default function ChocoboRace() {
  const [options, setOptions] = useState<RaceOptions | null>(null);

  const exit = useCallback(() => setOptions(null), []);

  // Locked to the viewport so the canvas never scrolls under the sticky header.
  // The extra 4rem on small screens is the mobile bottom nav.
  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-slate-950 md:h-dvh">
      <Header />
      {options ? (
        <RaceView options={options} onExit={exit} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <RaceLobby onStart={setOptions} />
        </div>
      )}
    </div>
  );
}
