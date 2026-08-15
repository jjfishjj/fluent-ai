import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { EmbassyHub } from '@/components/game/race/EmbassyHub';
import { RaceLobby, type RaceOptions } from '@/components/game/race/RaceLobby';
import { RaceView } from '@/components/game/race/RaceView';
import { CircuitNet } from '@/game/race/net/circuit';
import { loadProfile, rankFor } from '@/game/race/core/campaign';

type Screen = 'hub' | 'lobby' | 'race';

/**
 * 陸行鳥外交巡迴賽 3D — a three.js racer wrapped around fluent-ai's learning
 * loop: each course is a host nation and the gates on it are language and
 * memory questions.
 *
 * The page owns the screen you are on and the realtime connection, which has
 * to outlive a race so the hub roster and any race room survive the round
 * trip. `EmbassyHub` and `RaceView` own their own canvases.
 */
export default function ChocoboRace() {
  const [screen, setScreen] = useState<Screen>('hub');
  const [options, setOptions] = useState<RaceOptions | null>(null);
  const [birdId, setBirdId] = useState('gold');

  const netRef = useRef<CircuitNet | null>(null);
  if (!netRef.current) {
    const profile = loadProfile();
    netRef.current = new CircuitNet({ name: '你', birdId, rank: rankFor(profile.credits).name });
  }
  const net = netRef.current;

  useEffect(() => () => net.dispose(), [net]);

  const startRace = useCallback((next: RaceOptions) => {
    setBirdId(next.birdId);
    setOptions(next);
    setScreen('race');
  }, []);

  const exitRace = useCallback(() => {
    // Leaving a race also leaves its room; the hub is where you regroup.
    if (options?.roomId) net.leaveRoom();
    setOptions(null);
    setScreen('hub');
  }, [net, options]);

  const body = useMemo(() => {
    if (screen === 'race' && options) {
      return <RaceView options={options} net={options.roomId ? net : undefined} onExit={exitRace} />;
    }
    if (screen === 'lobby') {
      return (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <RaceLobby onStart={startRace} onBackToHub={() => setScreen('hub')} />
        </div>
      );
    }
    return (
      <EmbassyHub
        net={net}
        birdId={birdId}
        onStartRace={startRace}
        onOpenLobby={() => setScreen('lobby')}
      />
    );
  }, [screen, options, net, birdId, startRace, exitRace]);

  // Locked to the viewport so the canvas never scrolls under the sticky header.
  // The extra 4rem on small screens is the mobile bottom nav.
  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-slate-950 md:h-dvh">
      <Header />
      {body}
    </div>
  );
}
