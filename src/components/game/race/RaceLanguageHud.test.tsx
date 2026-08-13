import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GateFlash, GatePrompt, LanguageResult, MemoriseOverlay } from './RaceLanguageHud';
import type { GateQuestion } from '@/game/race/core/gates';
import type { RaceSnapshot } from '@/game/race/core/types';

const question: GateQuestion = {
  prompt: '「謝謝」怎麼說？',
  hint: '日本',
  lanes: [
    { text: 'ありがとう', sub: 'arigatou', correct: true },
    { text: 'こんにちは', sub: 'konnichiwa', correct: false },
    { text: 'さようなら', sub: 'sayounara', correct: false },
  ],
  answer: { native: 'ありがとう', roman: 'arigatou', meaning: '謝謝' },
};

function language(over: Partial<NonNullable<RaceSnapshot['language']>> = {}) {
  return {
    correct: 3,
    wrong: 1,
    missed: 0,
    total: 4,
    accuracy: 0.75,
    ...over,
  } as NonNullable<RaceSnapshot['language']>;
}

describe('GatePrompt', () => {
  it('shows the question and all three lanes in road order', () => {
    render(
      <GatePrompt language={language({ upcoming: { gateIndex: 0, distance: 30, question } })} />,
    );
    expect(screen.getByText('「謝謝」怎麼說？')).toBeInTheDocument();
    for (const lane of question.lanes) expect(screen.getByText(lane.text)).toBeInTheDocument();
    expect(screen.getByText('◀ 左')).toBeInTheDocument();
    expect(screen.getByText('▶ 右')).toBeInTheDocument();
  });

  it('renders nothing when no gate is in range', () => {
    const { container } = render(<GatePrompt language={language()} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('GateFlash', () => {
  it('keeps the answer secret on a correct pass and reveals it on a miss', () => {
    const { rerender, container } = render(
      <GateFlash language={language({ last: { outcome: 'correct', question, at: 1 } })} />,
    );
    expect(screen.getByText(/正確/)).toBeInTheDocument();
    expect(container.textContent).not.toContain('正解');

    rerender(<GateFlash language={language({ last: { outcome: 'wrong', question, at: 1 } })} />);
    expect(screen.getByText(/答錯/)).toBeInTheDocument();
    expect(screen.getByText(/正解：ありがとう/)).toBeInTheDocument();
  });
});

describe('MemoriseOverlay', () => {
  it('numbers the sequence so the recall gates can ask by position', () => {
    render(
      <MemoriseOverlay
        phrases={[
          { native: '水', roman: 'mizu', meaning: '水' },
          { native: '友達', roman: 'tomodachi', meaning: '朋友' },
        ]}
        secondsLeft={4.2}
      />,
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('友達')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

describe('LanguageResult', () => {
  const summary = {
    nationName: '🇯🇵 日本',
    cleared: true,
    isCampaign: true,
    credits: { placement: 90, language: 100, clearBonus: 90, total: 280 },
    promotedTo: '通譯官',
    unlockedNation: '🇫🇷 法國',
    missed: [{ native: 'さようなら', meaning: '再見' }],
    targetPlace: 3,
    targetAccuracy: 0.6,
  };

  it('breaks down credits, the promotion and the unlocked posting', () => {
    render(
      <LanguageResult language={language()} summary={summary} cardsAdded={0} onAddCards={() => {}} />,
    );
    expect(screen.getByText('+280')).toBeInTheDocument();
    expect(screen.getByText(/晉升為「通譯官」/)).toBeInTheDocument();
    expect(screen.getByText(/已解鎖：🇫🇷 法國/)).toBeInTheDocument();
    expect(screen.getByText('3/4')).toBeInTheDocument();
  });

  it('offers missed words to the memory deck once', () => {
    const onAddCards = vi.fn();
    const { rerender } = render(
      <LanguageResult language={language()} summary={summary} cardsAdded={0} onAddCards={onAddCards} />,
    );
    const button = screen.getByRole('button', { name: /加入記憶卡/ });
    button.click();
    expect(onAddCards).toHaveBeenCalledOnce();

    rerender(
      <LanguageResult language={language()} summary={summary} cardsAdded={1} onAddCards={onAddCards} />,
    );
    expect(screen.getByRole('button', { name: /已加入 1 張記憶卡/ })).toBeDisabled();
  });

  it('says the stage was not cleared when the targets were missed', () => {
    render(
      <LanguageResult
        language={language({ correct: 1, total: 4, accuracy: 0.25 })}
        summary={{ ...summary, cleared: false, promotedTo: undefined, unlockedNation: undefined }}
        cardsAdded={0}
        onAddCards={() => {}}
      />,
    );
    expect(screen.getByText(/未達通關門檻/)).toBeInTheDocument();
  });
});
