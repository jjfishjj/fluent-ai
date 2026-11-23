import { useCallback, useEffect, useState } from 'react';
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

  // The game is a standalone full-screen experience without site navigation.
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-950">
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
