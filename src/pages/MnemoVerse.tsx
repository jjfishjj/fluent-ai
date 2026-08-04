/**
 * MNEMO・VERSE：數字轉生 — 獨立 3D 記憶遊戲頁（/mnemoverse）
 *
 * 刻意做成獨立頁面，不掛在 /practice 的訓練場流程底下：
 * - 不需要登入、不寫入 Learning Gym 進度，可以單獨分享給學生或當 demo 用
 * - 3D 場景注入 MnemoVerseScene（含後製堆疊），不影響「03 3D 空間戰」原本的畫面
 *
 * 企劃書：docs/mnemoverse-3d-game-design.md
 */
import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Orbit, Sparkles } from 'lucide-react';
// 兩者都 lazy：維持 SpatialNumberGame 原本的動態切塊，不讓它被併進主 bundle
const SpatialNumberGame = lazy(() => import('@/components/practice/SpatialNumberGame').then((module) => ({ default: module.SpatialNumberGame })));
const MnemoVerseScene = lazy(() => import('@/components/mnemoverse/MnemoVerseScene').then((module) => ({ default: module.MnemoVerseScene })));

export default function MnemoVerse() {
  const [lastRun, setLastRun] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#050a18] text-white">
      <header className="border-b border-white/10 bg-[#070d1f]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/practice" className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            返回訓練場
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-xs font-black tracking-[.18em] text-cyan-200">
            <Orbit className="h-3.5 w-3.5" />
            MNEMO・VERSE
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <section className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-violet-200">
            <Sparkles className="h-3.5 w-3.5" />
            數字轉生 · 3D 沉浸式記憶訓練
          </div>
          <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">
            讓數字在空間中<br />活成你記得住的東西
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
            十座編碼艙，每座給你一個 3D 數字。輸入你看見的畫面，數字就會當場變形。
            接著一道干擾關清空工作記憶，最後只看物件反推原始數字——測的是真的記住了，不是剛剛看過。
          </p>
          {lastRun && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-sm font-bold text-emerald-200">
              上一輪成績：{lastRun}
            </div>
          )}
        </section>

        <Suspense fallback={<div className="flex min-h-[620px] items-center justify-center rounded-[28px] border border-white/10 bg-[#070d1f] text-xs font-black tracking-[.22em] text-cyan-300"><span className="animate-pulse">LOADING MNEMO・VERSE…</span></div>}>
          <SpatialNumberGame scene={MnemoVerseScene} onComplete={setLastRun} />
        </Suspense>

        <p className="mt-6 text-center text-xs text-slate-600">
          高畫質模式啟用 Bloom / 景深 / 色差 / 暗角後製；省電模式會自動關閉，維持 30 FPS。
        </p>
      </main>
    </div>
  );
}
