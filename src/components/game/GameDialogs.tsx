import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ITEMS, SHOP_STOCK } from '@/game/data/items';
import { QUESTS } from '@/game/data/quests';
import type { HudSnapshot, NpcDef } from '@/game/core/types';
import { cn } from '@/lib/utils';

export interface NpcTalk {
  npc: NpcDef;
}

export function NpcDialog({
  talk,
  hud,
  onClose,
  onAcceptQuest,
  onCompleteQuest,
  onHeal,
  onOpenShop,
}: {
  talk: NpcTalk | null;
  hud: HudSnapshot;
  onClose: () => void;
  onAcceptQuest: (questId: string) => void;
  onCompleteQuest: (questId: string) => void;
  onHeal: () => void;
  onOpenShop: () => void;
}) {
  const npc = talk?.npc;
  const quest = npc?.questId ? QUESTS[npc.questId] : undefined;
  const state = quest ? hud.quests.find((q) => q.id === quest.id) : undefined;
  const alreadyDone = quest ? hud.questsDone.includes(quest.id) : false;

  return (
    <Dialog open={!!talk} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md border-white/15 bg-slate-950/95 text-white">
        <DialogHeader>
          <DialogTitle className="text-base">{npc?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5 rounded-lg border border-white/10 bg-white/5 p-3 text-sm leading-relaxed text-white/85">
          {npc?.lines.map((line, i) => (
            <p key={i}>「{line}」</p>
          ))}
        </div>

        {quest && (
          <div className="rounded-lg border border-amber-300/25 bg-amber-400/10 p-3">
            <div className="text-xs font-semibold text-amber-200">{quest.name}</div>
            <div className="mt-0.5 text-[11px] text-white/70">{quest.summary}</div>
            <div className="mt-1 text-[11px] text-white/50">
              獎勵：{quest.reward.exp} 經驗 · {quest.reward.silver} 銀兩
              {quest.reward.items?.length
                ? ` · ${quest.reward.items.map((i) => `${ITEMS[i.itemId]?.name ?? i.itemId}×${i.qty}`).join('、')}`
                : ''}
            </div>

            <div className="mt-2">
              {alreadyDone && <div className="text-center text-xs text-emerald-300">此任務已完成</div>}
              {!state && !alreadyDone && (
                <button
                  onClick={() => onAcceptQuest(quest.id)}
                  className="w-full rounded-md bg-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-amber-300"
                >
                  接受任務（需 Lv.{quest.reqLevel}）
                </button>
              )}
              {state?.status === 'active' && (
                <div className="text-center text-xs text-white/60">
                  進度 {state.progress} / {state.count}
                </div>
              )}
              {state?.status === 'complete' && (
                <button
                  onClick={() => onCompleteQuest(quest.id)}
                  className="w-full rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  回報並領取獎勵
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {npc?.role === 'shop' && (
            <button
              onClick={onOpenShop}
              className="flex-1 rounded-md bg-sky-500 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-400"
            >
              打開商店
            </button>
          )}
          {npc?.role === 'healer' && (
            <button
              onClick={onHeal}
              className="flex-1 rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
            >
              調息（回復全部生命與靈力）
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/5"
          >
            離開
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ShopDialog({
  open,
  onOpenChange,
  hud,
  onBuy,
  onSell,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  hud: HudSnapshot;
  onBuy: (itemId: string) => void;
  onSell: (itemId: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto border-white/15 bg-slate-950/95 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-base">
            <span>雜貨鋪</span>
            <span className="text-xs font-normal text-amber-300">{hud.silver.toLocaleString()} 銀兩</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="buy">
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger value="buy">購買</TabsTrigger>
            <TabsTrigger value="sell">販售</TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-1.5 pt-3">
            {SHOP_STOCK.map((id) => {
              const def = ITEMS[id];
              const affordable = hud.silver >= def.price;
              return (
                <div key={id} className="flex items-center gap-2.5 rounded-lg border border-white/10 p-2">
                  <span className="text-lg">{def.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium">{def.name}</div>
                    <div className="truncate text-[10px] text-white/50">{def.description}</div>
                  </div>
                  <button
                    onClick={() => onBuy(id)}
                    disabled={!affordable}
                    className={cn(
                      'shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold',
                      affordable ? 'bg-amber-400 text-slate-900 hover:bg-amber-300' : 'bg-white/10 text-white/30',
                    )}
                  >
                    {def.price} 銀
                  </button>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="sell" className="space-y-1.5 pt-3">
            {hud.inventory.map((slot) => {
              const def = ITEMS[slot.itemId];
              const price = Math.max(1, Math.floor((def?.price ?? 1) * 0.4));
              return (
                <div key={slot.itemId} className="flex items-center gap-2.5 rounded-lg border border-white/10 p-2">
                  <span className="text-lg">{slot.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium">
                      {slot.name} ×{slot.qty}
                    </div>
                  </div>
                  <button
                    onClick={() => onSell(slot.itemId)}
                    className="shrink-0 rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/20"
                  >
                    賣 {price} 銀
                  </button>
                </div>
              );
            })}
            {!hud.inventory.length && <div className="text-[11px] text-white/40">沒有可販售的物品。</div>}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
