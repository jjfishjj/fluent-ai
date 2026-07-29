import { ArrowLeft, ChevronRight, CircleHelp, Lightbulb, MousePointerClick, ShieldCheck, Sparkles, Star, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';

const STEPS = [
  { n: '01', title: '選擇天份', text: '如果做過記憶天份測驗，系統會自動帶入；也可以在首頁自行切換 8 種角色。' },
  { n: '02', title: '選擇情境', text: '從咖啡店、旅行、面試、校園或社交地圖開始。LV.1 可先玩咖啡店與旅行。' },
  { n: '03', title: '閱讀左側任務', text: '先看角色說了什麼，再看中文任務。中文任務才是這一回合真正要完成的目標。' },
  { n: '04', title: '選擇策略卡', text: '卡牌代表思考與表達的方法，不是選擇題答案。天份加成卡會多給分，但仍要配合情境。' },
  { n: '05', title: '自己組成回應', text: '用卡牌句型當起手式，再加入情境需要的資訊。可打字、使用示範答案或點語音輸入。' },
  { n: '06', title: '送出並看回饋', text: '系統會依回答完整度、策略是否命中、天份加成計算 XP，並提供更自然的英文版本。' },
];

export default function TalentCardGameGuide() {
  const navigate = useNavigate();
  return <main className="min-h-screen bg-[#f4efe5] pb-24 text-[#173a34]">
    <header className="sticky top-0 z-30 border-b border-[#173a34]/10 bg-[#f4efe5]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <button onClick={() => navigate('/talent-card-game')} className="flex items-center gap-2 text-sm font-bold"><ArrowLeft className="h-4 w-4" /> 返回遊戲</button>
        <div className="font-black">MEMO<span className="text-[#e26a3b]">QUEST</span> GUIDE</div>
        <span className="text-xs font-black">玩法說明</span>
      </div>
    </header>

    <section className="mx-auto max-w-5xl px-4 py-10 md:py-16">
      <div className="rounded-[36px] bg-[#173a34] p-7 text-white md:p-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black"><CircleHelp className="h-4 w-4" /> 第一次玩，先看這裡</div>
        <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight md:text-6xl">選卡不是選答案，<br />而是選擇<span className="text-[#efb83b]">怎麼回答</span></h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/70">MemoQuest 會先給你一個真實情境。你選一張符合自己天份的策略卡，再用那張卡的思考方法組成英文回應。</p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">{STEPS.map(step => <article key={step.n} className="rounded-3xl border border-[#173a34]/10 bg-white p-6"><div className="text-xs font-black tracking-widest text-[#e26a3b]">STEP {step.n}</div><h2 className="mt-2 text-2xl font-black">{step.title}</h2><p className="mt-2 leading-relaxed text-[#57736e]">{step.text}</p></article>)}</div>

      <section className="mt-10 rounded-[32px] border border-[#173a34]/10 bg-white p-6 md:p-9">
        <p className="text-xs font-black tracking-widest text-[#6d5bd0]">SCREENSHOT EXAMPLE</p><h2 className="mt-2 text-3xl font-black">以「火車取消」這一題為例</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3"><div className="rounded-2xl bg-[#173a34] p-5 text-white"><div className="text-xs font-black text-white/50">角色問題</div><p className="mt-2 font-bold">Your train was cancelled. Would you like the next one?</p><p className="mt-3 text-sm text-white/65">火車取消了，你願意搭下一班嗎？</p></div><div className="rounded-2xl bg-[#f0ecfa] p-5"><div className="text-xs font-black text-[#6d5bd0]">選到的策略卡</div><p className="mt-2 text-xl font-black">🧭 行動探路</p><p className="mt-2 text-sm text-[#57736e]">`Let me give it a try.` 只是「先試試看」的起手式，沒有回答火車問題，所以不建議直接送出。</p></div><div className="rounded-2xl bg-[#dce9c7] p-5"><div className="text-xs font-black text-[#1f8a70]">較完整的回答</div><p className="mt-2 text-xl font-black">Yes, please. What time does the next train leave?</p><p className="mt-2 text-sm text-[#57736e]">好的，請幫我安排。下一班火車幾點開？</p></div></div>
        <div className="mt-5 flex gap-3 rounded-2xl bg-[#fff6de] p-4"><Lightbulb className="h-5 w-5 shrink-0 text-[#d18a29]" /><p className="text-sm leading-relaxed"><strong>簡單判斷方式：</strong>送出前問自己：「這句話有直接回應左邊角色的問題嗎？」如果沒有，就在提示句後面補上答案或問題。</p></div>
      </section>

      <section className="mt-10"><p className="text-xs font-black tracking-widest text-[#e26a3b]">WHAT THE BUTTONS MEAN</p><h2 className="mt-2 text-3xl font-black">畫面按鈕與數字</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Info icon={<MousePointerClick />} title="換一張卡" text="返回本回合的手牌，不會扣愛心。" /><Info icon={<Volume2 />} title="語音輸入" text="用英文說出回答，瀏覽器會轉成文字。" /><Info icon={<Star />} title="XP / Combo" text="回答完整、策略命中可得更多 XP；連續命中形成 Combo。" /><Info icon={<ShieldCheck />} title="愛心" text="回答太短時會失去愛心；愛心歸零則提早結算。" /></div></section>

      <section className="mt-10 rounded-[32px] bg-[#f6dfd5] p-7 md:p-9"><Sparkles className="h-7 w-7 text-[#e26a3b]" /><h2 className="mt-3 text-3xl font-black">新手最簡單的玩法</h2><ol className="mt-5 space-y-3 text-[#355b54]"><li>1. 先讀中文任務。</li><li>2. 選有「天份加成」的卡。</li><li>3. 不知道怎麼說時，點「使用示範答案」。</li><li>4. 大聲讀一次，再按「送出回應」。</li><li>5. 看回饋後，把修正版再說一次。</li></ol><div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => navigate('/talent-card-game?tutorial=1')} className="rounded-full bg-[#173a34] px-7">開始互動教學 <MousePointerClick className="ml-2 h-4 w-4" /></Button><Button onClick={() => navigate('/talent-card-game')} variant="outline" className="rounded-full">直接進入遊戲 <ChevronRight className="ml-1 h-4 w-4" /></Button></div></section>
    </section>
  </main>;
}

function Info({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl bg-white p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dce9c7]">{icon}</div><h3 className="mt-3 font-black">{title}</h3><p className="mt-1 text-sm leading-relaxed text-[#57736e]">{text}</p></div>;
}
