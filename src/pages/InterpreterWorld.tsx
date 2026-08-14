import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { GameShell } from '@/components/game/GameShell';
import { InterpreterBriefing } from '@/components/game/InterpreterBriefing';
import { useAuth } from '@/contexts/AuthContext';
import { loadGeniusType, type GeniusType } from '@/lib/genius-type';
import { loadCards } from '@/lib/memory-srs';
import { hasSave, loadProfile, saveProfile } from '@/game/core/save';
import { newProfile } from '@/game/core/world';
import { INTERPRETER_PACK, MISSION_LANGUAGE } from '@/game/data/interpreter/pack';
import { loadDeck, recordAnswer } from '@/game/bridge/review-bridge';
import { makeCyclingSource } from '@/game/bridge/srs-deck';
import type { EncounterQuestion } from '@/game/core/encounter';
import type { PlayerProfile } from '@/game/core/types';

/**
 * 通譯官 — the fluent-ai campaign.
 *
 * Same 3D engine as 仙境奇俠傳, but obstacles are resolved by answering rather
 * than by hitting, the class comes from the player's memory-genius quiz, and
 * the questions are their own spaced-repetition cards.
 */
export default function InterpreterWorld() {
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [saveExists, setSaveExists] = useState(false);
  const [geniusType, setGeniusType] = useState<GeniusType | null>(null);
  const [cardCount, setCardCount] = useState(0);

  useEffect(() => {
    setSaveExists(hasSave(INTERPRETER_PACK));
    setGeniusType(loadGeniusType());
    try {
      setCardCount(loadCards(userId).length);
    } catch {
      setCardCount(0);
    }
  }, [userId]);

  // Built once per run so a fight never reopens with the same word.
  const deckKey = profile ? `${profile.name}-${profile.level}` : 'idle';
  const questions = useMemo(() => {
    if (!profile) return undefined;
    const deck = loadDeck({ userId, language: MISSION_LANGUAGE, level: profile.level });
    return makeCyclingSource(deck);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, deckKey]);

  // Kept in a ref so the callback identity stays stable across renders.
  const geniusRef = useRef(geniusType);
  geniusRef.current = geniusType;
  const onAnswer = useCallback(
    (question: EncounterQuestion, correct: boolean) => {
      recordAnswer(userId, question, correct, geniusRef.current);
    },
    [userId],
  );

  const start = useCallback((name: string, type: GeniusType) => {
    const created = newProfile(name, type, INTERPRETER_PACK);
    saveProfile(created, INTERPRETER_PACK);
    setProfile(created);
  }, []);

  const resume = useCallback(() => {
    const saved = loadProfile(INTERPRETER_PACK);
    if (saved) setProfile(saved);
  }, []);

  const exit = useCallback(() => {
    setProfile(null);
    setSaveExists(hasSave(INTERPRETER_PACK));
  }, []);

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-slate-950 md:h-dvh">
      <Header />
      {profile ? (
        <GameShell
          pack={INTERPRETER_PACK}
          profile={profile}
          onExit={exit}
          questions={questions}
          onAnswer={onAnswer}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <InterpreterBriefing
            geniusType={geniusType}
            hasSave={saveExists}
            cardCount={cardCount}
            onStart={start}
            onContinue={resume}
          />
        </div>
      )}
    </div>
  );
}
