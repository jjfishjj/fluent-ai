import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { CharacterCreate } from '@/components/game/CharacterCreate';
import { XianjingGame } from '@/components/game/XianjingGame';
import { hasSave, loadProfile, saveProfile } from '@/game/core/save';
import { newProfile } from '@/game/core/world';
import type { ClassId, PlayerProfile } from '@/game/core/types';

/**
 * 仙境奇俠傳 3D — a Ragnarok-style action MMORPG running on three.js.
 * The page owns character selection; `XianjingGame` owns the running world.
 */
export default function XianjingWorld() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [saveExists, setSaveExists] = useState(false);

  useEffect(() => {
    setSaveExists(hasSave());
  }, []);

  const start = useCallback((name: string, classId: ClassId) => {
    const created = newProfile(name, classId);
    saveProfile(created);
    setProfile(created);
  }, []);

  const resume = useCallback(() => {
    const saved = loadProfile();
    if (saved) setProfile(saved);
  }, []);

  const exit = useCallback(() => {
    setProfile(null);
    setSaveExists(hasSave());
  }, []);

  // Locked to the viewport: the game must never let the page scroll underneath
  // the sticky header. The extra 4rem on small screens is the mobile bottom nav.
  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-slate-950 md:h-dvh">
      <Header />
      {profile ? (
        <XianjingGame profile={profile} onExit={exit} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <CharacterCreate hasSave={saveExists} onStart={start} onContinue={resume} />
        </div>
      )}
    </div>
  );
}
