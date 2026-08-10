import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatLine } from '@/game/core/types';
import { cn } from '@/lib/utils';

const CHANNELS = [
  { id: 'all', label: '全部' },
  { id: 'world', label: '世界' },
  { id: 'system', label: '系統' },
] as const;

const CHANNEL_COLOR: Record<string, string> = {
  system: 'text-amber-200/90',
  world: 'text-sky-200/90',
  combat: 'text-rose-200/90',
  party: 'text-emerald-200/90',
};

export interface ChatPanelHandle {
  focus: () => void;
}

export function ChatPanel({
  lines,
  onSend,
  inputRef,
}: {
  lines: ChatLine[];
  onSend: (text: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]['id']>('all');
  const [draft, setDraft] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => (channel === 'all' ? lines : lines.filter((l) => l.channel === channel)).slice(-60),
    [lines, channel],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [filtered.length]);

  return (
    <div className="pointer-events-auto w-[19rem] rounded-xl border border-white/15 bg-slate-950/70 backdrop-blur-md">
      <div className="flex items-center gap-1 border-b border-white/10 px-2 py-1">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            onClick={() => setChannel(c.id)}
            className={cn(
              'rounded px-2 py-0.5 text-[10px] transition',
              channel === c.id ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80',
            )}
          >
            {c.label}
          </button>
        ))}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="ml-auto rounded px-2 py-0.5 text-[10px] text-white/50 hover:text-white/80"
        >
          {collapsed ? '展開' : '收合'}
        </button>
      </div>

      {!collapsed && (
        <div ref={scrollRef} className="h-32 space-y-0.5 overflow-y-auto px-2 py-1.5 text-[11px] leading-snug">
          {filtered.map((l) => (
            <div key={l.id} className={cn('break-words', CHANNEL_COLOR[l.channel] ?? 'text-white/80')}>
              <span className="text-white/45">[{l.from}]</span> {l.text}
            </div>
          ))}
          {!filtered.length && <div className="text-white/35">目前沒有訊息。</div>}
        </div>
      )}

      <form
        className="flex gap-1 border-t border-white/10 p-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          const text = draft.trim();
          if (text) onSend(text);
          setDraft('');
          inputRef.current?.blur();
        }}
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Escape') {
              setDraft('');
              inputRef.current?.blur();
            }
          }}
          placeholder="按 Enter 發言…"
          maxLength={120}
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-white placeholder:text-white/30 focus:border-sky-400/60 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-sky-500/80 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-sky-400"
        >
          送出
        </button>
      </form>
    </div>
  );
}
