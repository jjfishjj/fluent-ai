import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GENIUS_INFO, type GeniusType } from '@/lib/genius-type';
import { INTERPRETER_CLASSES } from '@/game/data/interpreter/classes';
import { INTERPRETER_SKILLS } from '@/game/data/interpreter/skills';
import { cn } from '@/lib/utils';

/**
 * The pre-mission screen.
 *
 * The player does not pick a class here — their memory-genius type from the
 * app's quiz *is* their class. When they haven't taken it, we say so plainly,
 * link to the quiz, and let them try a default rather than blocking entry.
 */
export function InterpreterBriefing({
  geniusType,
  hasSave,
  cardCount,
  onStart,
  onContinue,
}: {
  geniusType: GeniusType | null;
  hasSave: boolean;
  cardCount: number;
  onStart: (name: string, type: GeniusType) => void;
  onContinue: () => void;
}) {
  const [name, setName] = useState('');
  const effective: GeniusType = geniusType ?? 'architect';
  const info = GENIUS_INFO[effective];
  const cls = INTERPRETER_CLASSES[effective];
  const firstSkill = INTERPRETER_SKILLS[cls.skills[0]];

  return (
    <div className="grid min-h-full place-items-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950/85 p-6 shadow-2xl">
        <div className="text-center">
          <div className="text-[11px] uppercase tracking-[0.3em] text-white/40">Fluent AI</div>
          <h1 className="mt-1 text-2xl font-bold tracking-wide text-white">通譯官</h1>
          <p className="mt-1 text-xs text-white/55">
            走訪各國，化解溝通障礙，取得每一位代表的信任
          </p>
        </div>

        {/* the class, taken from the quiz result */}
        <div
          className={cn(
            'mt-6 rounded-xl border p-4',
            geniusType ? 'border-amber-300/40 bg-amber-300/[0.06]' : 'border-white/15 bg-white/[0.03]',
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl"
              style={{ background: `${info.color}33` }}
            >
              {info.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-base font-semibold text-white">{info.nameZh}</span>
                <span className="text-[11px] text-amber-200/80">{cls.title}</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-white/60">{cls.description}</p>
              <div className="mt-2 text-[11px] text-white/50">
                起手技法：<span className="text-white/80">{firstSkill.icon} {firstSkill.name}</span>
                 — {firstSkill.description}
              </div>
            </div>
          </div>

          {geniusType ? (
            <div className="mt-3 rounded-lg bg-emerald-400/10 px-3 py-2 text-[11px] text-emerald-200">
              已讀取你的記憶天才測驗結果，角色即你的學習型態。
            </div>
          ) : (
            <div className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-[11px] text-white/60">
              還沒做過記憶天才測驗，先以「建築師」出發。
              <Link to="/quizzes/memory-genius-quiz/" className="ml-1 text-amber-300 underline">
                去測驗
              </Link>
              後重新進入，角色會換成你的真實型態。
            </div>
          )}
        </div>

        {/* where the questions come from */}
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs font-semibold text-white/80">你的彈藥</div>
          {cardCount > 0 ? (
            <p className="mt-1 text-[11px] leading-relaxed text-white/60">
              偵測到 <span className="font-semibold text-amber-300">{cardCount}</span> 張記憶卡。
              戰鬥中答對會真的把該張卡推進複習排程——打這場就是在複習。
            </p>
          ) : (
            <p className="mt-1 text-[11px] leading-relaxed text-white/60">
              你還沒有自己的記憶卡，這次會用內建的外交英語詞庫。
              之後在
              <Link to="/memory" className="mx-1 text-amber-300 underline">
                記憶實驗室
              </Link>
              建卡後，戰鬥就會直接用你自己的單字。
            </p>
          )}
        </div>

        <div className="mt-5">
          <label className="mb-1.5 block text-xs font-medium text-white/70">通譯官姓名</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
            placeholder="例如：陳語安"
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-amber-300/60 focus:outline-none"
          />
        </div>

        <div className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px] leading-relaxed text-white/60 sm:grid-cols-2">
          <div>
            <div className="mb-1 font-semibold text-white/80">怎麼玩</div>
            點地面移動，走近障礙自動開始對話<br />
            答對＝推進，答錯＝被反噬<br />
            連續答對會累積氣勢，傷害遞增
          </div>
          <div>
            <div className="mb-1 font-semibold text-white/80">記憶技法</div>
            消耗專注力，在對話中改變題目<br />
            刪去選項／顯示提示／傷害加倍／擋下反噬<br />
            每個天才型態的技法順序不同
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => onStart(name.trim() || '見習通譯', effective)}
            className="flex-1 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-amber-300"
          >
            接受任務：英國代表團
          </button>
          {hasSave && (
            <button
              onClick={onContinue}
              className="flex-1 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              繼續上次進度
            </button>
          )}
        </div>
        <p className="mt-3 text-center text-[10px] text-white/35">
          進度存在此瀏覽器；接受新任務會覆蓋舊存檔。
        </p>
      </div>
    </div>
  );
}
