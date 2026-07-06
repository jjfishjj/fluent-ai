import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, MapPin, Footprints, ChevronLeft, ChevronRight, RotateCcw, Save, Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GeniusType } from '@/lib/genius-type';
import { addCard } from '@/lib/memory-srs';
import { generateImage } from '@/lib/image-service';
import { Locus as LocusType } from '@/lib/memory-palace';
import {
  Palace, loadPalace, savePalace, clearPalace, createPalace, newLocus, filledLoci, TEMPLATES,
} from '@/lib/memory-palace';

export function MemoryPalace({ uid, geniusType }: { uid: string; geniusType: GeniusType | null }) {
  const [palace, setPalace] = useState<Palace | null>(() => loadPalace(uid));
  const [openId, setOpenId] = useState<string | null>(null);
  const [newPlace, setNewPlace] = useState('');
  const [customName, setCustomName] = useState('');
  const [walkIdx, setWalkIdx] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [genId, setGenId] = useState<string | null>(null);

  useEffect(() => { setPalace(loadPalace(uid)); }, [uid]);

  const persist = (p: Palace): boolean => { const ok = savePalace(uid, p); setPalace({ ...p }); return ok; };
  const updateLocus = (id: string, patch: Partial<LocusType>): boolean => {
    if (!palace) return false;
    return persist({ ...palace, loci: palace.loci.map(l => (l.id === id ? { ...l, ...patch } : l)) });
  };

  const generate = async (l: LocusType) => {
    if (!l.english.trim()) { toast.error('先填入英文詞'); return; }
    setGenId(l.id);
    try {
      const prompt = `A surreal, exaggerated, unforgettable mental image for a memory palace. Location: ${l.place}. The English word "${l.english}" (meaning: ${l.meaning}) is vividly placed here.${l.image ? ' Scene idea: ' + l.image + '.' : ''} One bold focal object, bright cartoonish style, easy to remember.`;
      const res = await generateImage(prompt, 'english');
      if (res.error) { toast.error(res.error); }
      else if (res.imageUrl) {
        const ok = updateLocus(l.id, { imageUrl: res.imageUrl });
        if (ok) toast.success('畫面已生成');
        else toast('畫面已生成（較大，重整後可能需重生成）');
      } else { toast.error('沒有取得圖片'); }
    } catch {
      toast.error('生成失敗，稍後再試');
    } finally {
      setGenId(null);
    }
  };
  const addLocus = () => {
    if (!palace || !newPlace.trim()) return;
    persist({ ...palace, loci: [...palace.loci, newLocus(newPlace.trim())] });
    setNewPlace('');
  };
  const removeLocus = (id: string) => {
    if (!palace) return;
    persist({ ...palace, loci: palace.loci.filter(l => l.id !== id) });
  };
  const addAllToCards = () => {
    if (!palace) return;
    const f = filledLoci(palace);
    if (!f.length) { toast.error('先在位置放入詞彙'); return; }
    f.forEach(l => addCard(uid, { english: l.english, meaning: l.meaning, encodeNote: `記憶宮殿·${l.place}：${l.image}` }));
    toast.success(`已把 ${f.length} 個詞加進記憶卡（會依你的節奏複習）`);
  };

  const isVisionary = geniusType === 'visionary';

  // ---------- Template picker ----------
  if (!palace) {
    return (
      <div className="space-y-4 pt-2">
        <Card><CardContent className="p-4 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">🏛️ 記憶宮殿</p>
          <p className="text-sm text-muted-foreground">
            把要記的英文詞「放進」一個你熟悉的空間，靠位置和畫面記住它們。
            {isVisionary && <b className="text-orange-600">　這是你（圖像家）的天生強項。</b>}
          </p>
        </CardContent></Card>
        <p className="text-sm font-medium">選一個熟悉的空間開始：</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {TEMPLATES.map(t => (
            <button
              key={t.name}
              onClick={() => persist(createPalace(t.name, t.loci))}
              className="text-left rounded-xl border p-4 hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <div className="font-semibold text-sm">{t.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{t.loci.length} 個位置</div>
              <div className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{t.loci.join('、')}</div>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="或自訂空間名稱（例：奶奶家）" value={customName} onChange={e => setCustomName(e.target.value)} />
          <Button variant="outline" onClick={() => persist(createPalace(customName, ['位置 1', '位置 2', '位置 3']))}>建立</Button>
        </div>
      </div>
    );
  }

  // ---------- Walk-through ----------
  if (walkIdx !== null) {
    const walk = filledLoci(palace);
    const cur = walk[walkIdx];
    if (!cur) { setWalkIdx(null); return null; }
    return (
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>🚶 漫遊「{palace.name}」</span>
          <span>{walkIdx + 1} / {walk.length}</span>
        </div>
        <Card><CardContent className="p-6 space-y-4 text-center">
          <Badge className="bg-orange-500"><MapPin className="w-3 h-3 mr-1" /> {cur.place}</Badge>
          <p className="text-sm text-muted-foreground">回想你在這個位置放了什麼英文詞</p>
          {cur.imageUrl && <img src={cur.imageUrl} alt={cur.place} className="w-full max-w-xs mx-auto rounded-xl border" />}
          {cur.image && <div className="text-sm bg-orange-50 border border-orange-100 rounded-xl p-3 text-orange-800">🖼️ {cur.image}</div>}
          {!revealed ? (
            <Button variant="outline" className="w-full" onClick={() => setRevealed(true)}>顯示答案</Button>
          ) : (
            <div className="space-y-3">
              <div className="text-2xl font-bold">{cur.english}</div>
              <div className="text-muted-foreground">{cur.meaning}</div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" disabled={walkIdx === 0} onClick={() => { setWalkIdx(walkIdx - 1); setRevealed(false); }}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> 上一個
                </Button>
                {walkIdx < walk.length - 1 ? (
                  <Button onClick={() => { setWalkIdx(walkIdx + 1); setRevealed(false); }}>
                    下一個 <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setWalkIdx(null); setRevealed(false); }}>
                    完成漫遊 ✓
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent></Card>
      </div>
    );
  }

  // ---------- Editor ----------
  const filled = filledLoci(palace).length;
  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Input
          value={palace.name}
          onChange={e => persist({ ...palace, name: e.target.value })}
          className="max-w-[220px] font-semibold"
        />
        <button
          className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1"
          onClick={() => { if (confirm('清除這座宮殿？')) { clearPalace(uid); setPalace(null); } }}
        >
          <RotateCcw className="w-3.5 h-3.5" /> 重建
        </button>
      </div>

      {/* loci path */}
      <div className="space-y-2">
        {palace.loci.map((l, i) => {
          const open = openId === l.id;
          return (
            <Card key={l.id} className={open ? 'border-indigo-300' : ''}>
              <CardContent className="p-3">
                <button className="w-full flex items-center gap-3 text-left" onClick={() => setOpenId(open ? null : l.id)}>
                  <span className="shrink-0 w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-bold text-sm flex items-center justify-center">{i + 1}</span>
                  {l.imageUrl && <img src={l.imageUrl} alt="" className="shrink-0 w-9 h-9 rounded object-cover border" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{l.place}</div>
                    {l.english
                      ? <div className="text-xs text-muted-foreground truncate">{l.english} — {l.meaning}</div>
                      : <div className="text-xs text-muted-foreground">（空的 · 點擊放入詞彙）</div>}
                  </div>
                  {l.english && <Badge variant="secondary" className="text-xs shrink-0">已放</Badge>}
                </button>
                {open && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="English" value={l.english} onChange={e => updateLocus(l.id, { english: e.target.value })} />
                      <Input placeholder="中文意思" value={l.meaning} onChange={e => updateLocus(l.id, { meaning: e.target.value })} />
                    </div>
                    <Textarea
                      placeholder={`在「${l.place}」為這個詞想一個越誇張越好的畫面`}
                      value={l.image}
                      onChange={e => updateLocus(l.id, { image: e.target.value })}
                      rows={2}
                    />
                    {l.imageUrl && <img src={l.imageUrl} alt={l.place} className="w-full max-w-[220px] rounded-lg border" />}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
                      disabled={genId === l.id || !l.english.trim()}
                      onClick={() => generate(l)}
                    >
                      {genId === l.id
                        ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> 生成中…</>
                        : <><Wand2 className="w-3.5 h-3.5 mr-1" /> {l.imageUrl ? 'AI 重新生成畫面' : 'AI 生成畫面'}</>}
                    </Button>
                    <div className="flex justify-between">
                      <button className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1" onClick={() => removeLocus(l.id)}>
                        <Trash2 className="w-3.5 h-3.5" /> 移除位置
                      </button>
                      <Button size="sm" variant="ghost" onClick={() => setOpenId(null)}><Save className="w-3.5 h-3.5 mr-1" /> 完成</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* add locus */}
      <div className="flex gap-2">
        <Input placeholder="新增一個位置（例：陽台）" value={newPlace} onChange={e => setNewPlace(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addLocus(); }} />
        <Button variant="outline" onClick={addLocus}><Plus className="w-4 h-4" /></Button>
      </div>

      {/* actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="bg-orange-500 hover:bg-orange-600"
          disabled={filled === 0}
          onClick={() => { setWalkIdx(0); setRevealed(false); }}
        >
          <Footprints className="w-4 h-4 mr-1" /> 開始漫遊（{filled}）
        </Button>
        <Button variant="outline" disabled={filled === 0} onClick={addAllToCards}>
          <Plus className="w-4 h-4 mr-1" /> 加進記憶卡
        </Button>
      </div>
    </div>
  );
}
