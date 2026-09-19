import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MAX_SKILL_LEVEL } from '@/game/core/world';
import { statCost } from '@/game/core/formulas';
import type { HudSnapshot, Stats } from '@/game/core/types';
import { cn } from '@/lib/utils';

const STAT_LABELS: { key: keyof Stats; label: string; hint: string }[] = [
  { key: 'str', label: '力量 STR', hint: '物理攻擊' },
  { key: 'agi', label: '敏捷 AGI', hint: '攻速 / 迴避 / 移速' },
  { key: 'vit', label: '體質 VIT', hint: '生命 / 防禦' },
  { key: 'int', label: '靈性 INT', hint: '法傷 / 靈力' },
  { key: 'dex', label: '技巧 DEX', hint: '命中 / 物攻' },
  { key: 'luk', label: '運氣 LUK', hint: '爆擊率' },
];

const RARITY_CLASS: Record<string, string> = {
  common: 'text-white/80',
  fine: 'text-emerald-300',
  rare: 'text-sky-300',
  epic: 'text-amber-300',
};

export function CharacterSheet({
  open,
  onOpenChange,
  hud,
  onSpendStat,
  onLearnSkill,
  onUseItem,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  hud: HudSnapshot;
  onSpendStat: (stat: keyof Stats) => void;
  onLearnSkill: (skillId: string) => void;
  onUseItem: (itemId: string) => void;
}) {
  const equipped = new Set(Object.values(hud.equipment).filter(Boolean) as string[]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto border-white/15 bg-slate-950/95 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {hud.name}
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-normal text-white/70">
              {hud.className} Lv.{hud.level}
            </span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="stats">
          <TabsList className="grid w-full grid-cols-3 bg-white/5">
            <TabsTrigger value="stats">屬性{hud.statPoints > 0 ? ` (${hud.statPoints})` : ''}</TabsTrigger>
            <TabsTrigger value="skills">技能{hud.skillPoints > 0 ? ` (${hud.skillPoints})` : ''}</TabsTrigger>
            <TabsTrigger value="bag">背包</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-3 pt-3 focus-visible:outline-none focus-visible:ring-0">
            <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-[11px] text-white/70">
              可分配點數：<span className="font-semibold text-amber-300">{hud.statPoints}</span>
            </div>
            <div className="space-y-1.5">
              {STAT_LABELS.map(({ key, label, hint }) => {
                const value = hud.stats[key];
                const cost = statCost(value);
                const affordable = hud.statPoints >= cost;
                return (
                  <div key={key} className="flex items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium">{label}</div>
                      <div className="text-[10px] text-white/45">{hint}</div>
                    </div>
                    <span className="w-8 text-right text-sm font-semibold tabular-nums">{value}</span>
                    <button
                      onClick={() => onSpendStat(key)}
                      disabled={!affordable}
                      className={cn(
                        'grid h-6 w-6 place-items-center rounded-md text-sm font-bold',
                        affordable ? 'bg-amber-400 text-slate-900 hover:bg-amber-300' : 'bg-white/10 text-white/30',
                      )}
                      title={`消耗 ${cost} 點`}
                    >
                      +
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-white/70">
              <Derived label="物理攻擊" value={hud.derived.atk} />
              <Derived label="法術攻擊" value={hud.derived.matk} />
              <Derived label="防禦" value={hud.derived.def} />
              <Derived label="命中" value={hud.derived.hit} />
              <Derived label="迴避" value={hud.derived.flee} />
              <Derived label="爆擊率" value={`${hud.derived.crit}%`} />
              <Derived label="攻速" value={`${hud.derived.aspd.toFixed(2)}/s`} />
              <Derived label="移速" value={hud.derived.moveSpeed.toFixed(1)} />
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-2 pt-3 focus-visible:outline-none focus-visible:ring-0">
            <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-[11px] text-white/70">
              技能點：<span className="font-semibold text-amber-300">{hud.skillPoints}</span>
            </div>
            {hud.skills.map((s) => {
              const canLearn =
                hud.skillPoints > 0 && s.level < MAX_SKILL_LEVEL && hud.level >= s.reqLevel;
              return (
                <div key={s.id} className="flex items-start gap-2.5 rounded-lg border border-white/10 p-2.5">
                  <span className="text-xl">{s.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold">{s.name}</span>
                      {s.technique && (
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-white/60">
                          {s.technique}
                        </span>
                      )}
                      <span className="text-[10px] text-white/45">
                        Lv.{s.level}/{MAX_SKILL_LEVEL} · 需 Lv.{s.reqLevel}
                      </span>
                    </div>
                    <div className="text-[10px] leading-tight text-white/55">{s.description}</div>
                    <div className="mt-0.5 text-[10px] text-white/40">
                      {hud.turnBased ? '專注' : '靈力'} {s.spCost} · 冷卻 {s.cooldown}s
                    </div>
                  </div>
                  <button
                    onClick={() => onLearnSkill(s.id)}
                    disabled={!canLearn}
                    className={cn(
                      'shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold',
                      canLearn ? 'bg-amber-400 text-slate-900 hover:bg-amber-300' : 'bg-white/10 text-white/30',
                    )}
                  >
                    {s.level >= MAX_SKILL_LEVEL ? '已滿' : s.level > 0 ? '升級' : '習得'}
                  </button>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="bag" className="space-y-2 pt-3 focus-visible:outline-none focus-visible:ring-0">
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2 text-[11px] text-white/70">
              <span>{hud.currency}：<span className="font-semibold text-amber-300">{hud.silver.toLocaleString()}</span></span>
              <span>{hud.inventory.length} / 40 格</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(['weapon', 'armor', 'accessory'] as const).map((slot) => {
                const id = hud.equipment[slot];
                const def = id ? hud.itemIndex[id] : undefined;
                const label = slot === 'weapon' ? '武器' : slot === 'armor' ? '防具' : '飾品';
                return (
                  <button
                    key={slot}
                    onClick={() => id && onUseItem(id)}
                    disabled={!id}
                    title={def ? `點擊卸下 ${def.name}` : undefined}
                    className={cn(
                      'rounded-lg border p-2 text-center transition',
                      def ? 'border-amber-300/40 bg-amber-300/5 hover:border-amber-300' : 'border-dashed border-white/10',
                    )}
                  >
                    <div className="text-lg">{def?.icon ?? '·'}</div>
                    <div className="truncate text-[10px] text-white/60">{def?.name ?? label}</div>
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {hud.inventory.map((slot) => {
                const isEquipped = equipped.has(slot.itemId);
                const actionable = slot.kind !== 'material';
                return (
                  <button
                    key={slot.itemId}
                    onClick={() => actionable && onUseItem(slot.itemId)}
                    disabled={!actionable}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border p-2 text-left transition',
                      actionable
                        ? 'border-white/10 hover:border-amber-300/50 hover:bg-white/5'
                        : 'border-white/5 opacity-70',
                    )}
                  >
                    <span className="text-lg">{slot.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className={cn('truncate text-xs font-medium', RARITY_CLASS[slot.rarity])}>
                        {slot.name} ×{slot.qty}
                      </div>
                      <div className="truncate text-[10px] text-white/45">{slot.description}</div>
                    </div>
                    {isEquipped && (
                      <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] text-emerald-300">
                        裝備中
                      </span>
                    )}
                  </button>
                );
              })}
              {!hud.inventory.length && <div className="text-[11px] text-white/40">背包是空的。</div>}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Derived({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 px-2 py-1">
      <span className="text-white/50">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
