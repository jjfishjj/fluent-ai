import { useState } from 'react';
import { CLASS_LIST } from '@/game/data/classes';
import type { ClassId } from '@/game/core/types';
import { cn } from '@/lib/utils';

export function CharacterCreate({
  hasSave,
  onStart,
  onContinue,
}: {
  hasSave: boolean;
  onStart: (name: string, classId: ClassId) => void;
  onContinue: () => void;
}) {
  const [name, setName] = useState('');
  const [classId, setClassId] = useState<ClassId>('sword');

  return (
    <div className="grid min-h-[70vh] place-items-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-wide text-white">仙境奇俠傳 3D</h1>
          <p className="mt-1 text-xs text-white/55">開放世界 · 即時戰鬥 · 四大職業 · 四張地圖</p>
        </div>

        <div className="mt-6">
          <label className="mb-1.5 block text-xs font-medium text-white/70">俠名</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
            placeholder="例如：踏雪尋梅"
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-amber-300/60 focus:outline-none"
          />
        </div>

        <div className="mt-5">
          <div className="mb-2 text-xs font-medium text-white/70">選擇職業</div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {CLASS_LIST.map((c) => {
              const active = c.id === classId;
              return (
                <button
                  key={c.id}
                  onClick={() => setClassId(c.id)}
                  className={cn(
                    'rounded-xl border p-3 text-left transition',
                    active
                      ? 'border-amber-300/70 bg-amber-300/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/25',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="grid h-9 w-9 place-items-center rounded-lg text-lg"
                      style={{ background: `#${c.color.toString(16).padStart(6, '0')}44` }}
                    >
                      {c.id === 'sword' ? '⚔️' : c.id === 'talisman' ? '🔥' : c.id === 'archer' ? '🏹' : '✨'}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white">{c.name}</div>
                      <div className="text-[10px] text-amber-200/80">{c.title}</div>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-white/60">{c.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-white/45">
                    <span>STR {c.baseStats.str}</span>
                    <span>AGI {c.baseStats.agi}</span>
                    <span>VIT {c.baseStats.vit}</span>
                    <span>INT {c.baseStats.int}</span>
                    <span>DEX {c.baseStats.dex}</span>
                    <span>LUK {c.baseStats.luk}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px] leading-relaxed text-white/60 sm:grid-cols-2">
          <div>
            <div className="mb-1 font-semibold text-white/80">電腦操作</div>
            左鍵點地面移動、點怪物選取目標<br />
            右鍵拖曳轉視角 · 滾輪縮放<br />
            WASD 移動 · 1–4 技能 · R/T 喝藥<br />
            Tab 換目標 · F 對話 · C 角色 · Enter 聊天
          </div>
          <div>
            <div className="mb-1 font-semibold text-white/80">手機操作</div>
            點一下地面移動、點怪物選取目標<br />
            單指拖曳轉視角 · 雙指縮放<br />
            下方按鈕放技能與喝藥<br />
            右側 🎯 換目標 · 💬 對話 · 🎒 角色
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => onStart(name.trim() || '無名俠客', classId)}
            className="flex-1 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-amber-300"
          >
            開始新的旅程
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
          進度會存在此瀏覽器；建立新角色會覆蓋舊存檔。
        </p>
      </div>
    </div>
  );
}
