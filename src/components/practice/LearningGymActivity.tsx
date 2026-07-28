import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  Eye,
  Info,
  MapPinned,
  RotateCcw,
  Sparkles,
  Table2,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  LEARNING_GYM_ABILITY_LABELS,
  LearningGymAbility,
  LearningGymProgress,
  LearningGymTask,
  scoreLearningGymInput,
  topLearningGymAbilities,
} from '@/lib/learning-gym';

interface LearningGymActivityProps {
  task: LearningGymTask;
  progress: LearningGymProgress;
  onProgressChange: (
    next: LearningGymProgress,
    gained: Partial<Record<LearningGymAbility, number>>,
    evidence: string
  ) => void;
  onBack: () => void;
}

const DEFAULT_TOPICS = [
  'monotonous / 單調乏味',
  '光合作用三步驟',
  '1815 維也納會議',
  '供需曲線變動',
  'increase / reject / transform',
];

const DATA_TABLE_TOPICS = [
  '三位學生的英語練習紀錄',
  '兩個旅遊方案比較',
  '產品銷售回饋整理',
  '歷史事件時間線',
  '自然科學實驗觀察資料',
];

const TASK_STARTERS: Partial<Record<LearningGymTask['id'], string[]>> = {
  scene_anchor: ['讀取任務目標', '輸入訓練材料', '設定場景與角色', '遮住提示做回想'],
  data_to_table: ['貼上原始資料', '設計欄位規則', '整理成表格摘要', '遮住原文重建'],
  image_morph: ['輸入一個難背單字或概念', '把它變成荒謬畫面', '改三個元素：顏色、角色、道具', '不看定義，從畫面回想'],
  memory_palace: ['選一個熟悉空間', '把 10 個知識點變成物件', '放進 10 個位置', '閉眼走一遍並回想'],
  color_symbol_notes: ['貼上一段課文', '建立三色規則', '用符號標記定義、常考、因果', '只看符號重建摘要'],
  rap_word_beat: ['輸入 5 個單字或考點', '拆成節奏音節', '跟 beat 複誦', '遮稿回想'],
  sound_shadow: ['讀一次原句', '標重音與停頓', '跟讀', '遮稿複述'],
  podcast_host: ['選一個學科主題', '列出 4 個關鍵字', '錄/寫 60 秒說書稿', '檢查漏掉的概念'],
  mnemonic_meme: ['輸入年份或流程', '找諧音/押韻', '創作口訣', '反向測驗'],
  roleplay_quest: ['選角色與任務', '指定 5 個核心詞', '在情境中用出來', '推進劇情線索'],
  body_anchor: ['輸入 5 個概念', '每個綁一個微動作', '用動作提示回想', '卡住時重做動作'],
  walking_room: ['列出今天科目', '分配到房間角落', '20 分鐘讀 + 5 分鐘走', '用位置回想重點'],
  root_tree: ['輸入長單字', '拆 prefix/root/suffix', '說明字源邏輯', '延伸同字根單字'],
  causal_map: ['輸入破碎知識點', '建立 A→B→C 因果鏈', '檢查每條連線', '重建完整摘要'],
  ai_debugger: ['讀一段錯誤摘要', '找錯', '說明為什麼錯', '產生修正版規則'],
};

const SCENE_ANCHOR_EXAMPLE = {
  topic: 'negotiate / 協商',
  scene:
    '地點：會議室\n角色：你是業務，對方是客戶採購主管\n情境：客戶覺得價格太高，想要求折扣\n心情：有點緊張，但想保住利潤\n任務：用英文提出「可以根據訂購數量協商價格」',
  recall:
    '不看前面的材料，回想：\n1. 我在哪裡？\n2. 我正在跟誰說話？\n3. 對方遇到什麼問題？\n4. 我用哪一句話使用 negotiate？\n5. 再造一句新的句子。',
  answer:
    'I am in a meeting room.\nThe client thinks the price is too high.\nI say: We can negotiate the price if the order is large.\nNew sentence: I need to negotiate the deadline with my manager.',
  check:
    '通過標準：能說出意思、使用場景、任務壓力，並自己造出一句新句子。\n如果只能說「negotiate = 協商」，還不算完成；要能進入場景並把句子用出來。',
};

const DATA_TABLE_EXAMPLE = {
  topic: '三位學生的英語練習紀錄',
  raw:
    'Amy 這週練了 4 天，每天大約 20 分鐘，主要練 shadowing，覺得發音進步但單字容易忘。\nBen 練了 2 天，每次 45 分鐘，主要寫文法題，正確率提高，但開口會緊張。\nCindy 練了 5 天，每次 15 分鐘，使用 Anki 複習單字，記憶穩定，但句子輸出不足。',
  columns:
    '欄位：姓名｜練習天數｜每次時間｜主要方法｜進步點｜卡住點｜下一步策略\n規則：每一個人一列；數字獨立成欄；優點和問題分開，最後把問題轉成下一步行動。',
  rows: [
    ['Amy', '4 天', '20 分鐘', 'shadowing', '發音進步', '單字容易忘', '加 5 張圖像單字卡'],
    ['Ben', '2 天', '45 分鐘', '文法題', '正確率提高', '開口緊張', '加 3 分鐘口說陪跑'],
    ['Cindy', '5 天', '15 分鐘', 'Anki', '記憶穩定', '句子輸出不足', '用單字造 3 句情境句'],
  ],
  summary:
    '1. Amy 適合把 shadowing 和圖像單字卡搭配。\n2. Ben 的理解不差，但需要低壓口說輸出。\n3. Cindy 有穩定複習節奏，下一步要把單字放進句子。',
  recall:
    '遮住原文後，先說出欄位名稱，再重建每位學生的「方法、進步點、卡住點、下一步」。最後用 3 句話說明你看到了什麼規律。',
  check:
    '通過標準：欄位能對齊、每列只放一個對象、數字清楚、分類規則說得出來，且能不看原文重建 70% 以上的表格和摘要。',
};

function topicExamplesForTask(task: LearningGymTask) {
  return task.id === 'data_to_table' ? DATA_TABLE_TOPICS : DEFAULT_TOPICS;
}

function abilityText(weights: LearningGymTask['abilityWeights']) {
  return Object.entries(weights)
    .map(([ability, value]) => `${LEARNING_GYM_ABILITY_LABELS[ability as LearningGymAbility]} +${value}`)
    .join('、');
}

function taskSteps(task: LearningGymTask) {
  return TASK_STARTERS[task.id] || [
    '讀取任務目標',
    '輸入你要訓練的材料',
    '完成編碼或整理',
    '不看提示做主動回想',
  ];
}

function SceneAnchorHelp() {
  return (
    <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
          <Info className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-bold">這張卡的用法：把知識變成一幕戲</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            不要只寫定義。請把材料放進「地點、角色、情緒、任務」裡，再遮住提示回想。這樣大腦會用場景當記憶鉤子。
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-background/80 p-3">
          <div className="text-sm font-semibold">場景/角色設定</div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            寫清楚在哪裡、跟誰、發生什麼事、你的目標是什麼。越具體越容易記。
          </p>
        </div>
        <div className="rounded-xl bg-background/80 p-3">
          <div className="text-sm font-semibold">遮住後主動回想</div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            不看材料，從剛剛的場景回想關鍵詞、角色、任務和可用句子。
          </p>
        </div>
        <div className="rounded-xl bg-background/80 p-3">
          <div className="text-sm font-semibold">回想檢核</div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            檢查是否能說出意思、場景、用法，並自己造出新的例句或應用。
          </p>
        </div>
      </div>
    </div>
  );
}

function SceneAnchorExample() {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <h3 className="font-bold">完整案例：negotiate</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        這個範例示範怎麼從材料一路走到場景化、遮提示回想與檢核。
      </p>
      <div className="mt-3 space-y-3 text-xs leading-relaxed">
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="font-semibold text-foreground">訓練主題</div>
          <p className="mt-1 whitespace-pre-line text-muted-foreground">{SCENE_ANCHOR_EXAMPLE.topic}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="font-semibold text-foreground">場景 / 動作 / 角色設定</div>
          <p className="mt-1 whitespace-pre-line text-muted-foreground">{SCENE_ANCHOR_EXAMPLE.scene}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="font-semibold text-foreground">遮住提示後的主動回想</div>
          <p className="mt-1 whitespace-pre-line text-muted-foreground">{SCENE_ANCHOR_EXAMPLE.recall}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="font-semibold text-foreground">使用者作答範例</div>
          <p className="mt-1 whitespace-pre-line text-muted-foreground">{SCENE_ANCHOR_EXAMPLE.answer}</p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="font-semibold text-foreground">回想檢核</div>
          <p className="mt-1 whitespace-pre-line text-muted-foreground">{SCENE_ANCHOR_EXAMPLE.check}</p>
        </div>
      </div>
    </div>
  );
}

function DataToTableHelp({ onUseExample }: { onUseExample: () => void }) {
  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-sky-100 p-2 text-sky-700">
            <Table2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold">這張卡的用法：把雜亂資料變成可回想的表格</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              先貼原始資料，再決定欄位。整理時不要急著摘要，先把「對象、數字、分類、問題、下一步」拆開。
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onUseExample} className="shrink-0 gap-2">
          <ClipboardList className="h-4 w-4" />
          套用案例
        </Button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-background/85 p-3">
          <div className="text-sm font-semibold">1. 原始資料</div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            貼上一段看起來有點亂的文字，保留名字、數字、時間、問題和結果。
          </p>
        </div>
        <div className="rounded-xl bg-background/85 p-3">
          <div className="text-sm font-semibold">2. 欄位設計</div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            先列欄位名稱，再寫分類規則。好欄位要能比較，不只是在複製文字。
          </p>
        </div>
        <div className="rounded-xl bg-background/85 p-3">
          <div className="text-sm font-semibold">3. 重建摘要</div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            遮住原文後，先背欄位，再用表格線索重建規律與三句摘要。
          </p>
        </div>
      </div>
    </div>
  );
}

function DataToTableExample() {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <h3 className="font-bold">完整案例：英語練習紀錄</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        這個案例示範怎麼把一段雜亂文字拆成欄位、表格、摘要和回想檢核。
      </p>
      <div className="mt-3 space-y-3 text-xs leading-relaxed">
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="font-semibold text-foreground">原始資料</div>
          <p className="mt-1 whitespace-pre-line text-muted-foreground">{DATA_TABLE_EXAMPLE.raw}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="font-semibold text-foreground">欄位與分類規則</div>
          <p className="mt-1 whitespace-pre-line text-muted-foreground">{DATA_TABLE_EXAMPLE.columns}</p>
        </div>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full border-collapse text-[11px]">
            <thead className="bg-muted/70 text-foreground">
              <tr>
                {['姓名', '天數', '時間', '方法', '進步', '卡住', '下一步'].map((header) => (
                  <th key={header} className="border-b px-2 py-2 text-left font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DATA_TABLE_EXAMPLE.rows.map((row) => (
                <tr key={row[0]} className="odd:bg-background even:bg-muted/30">
                  {row.map((cell) => (
                    <td key={`${row[0]}-${cell}`} className="border-b px-2 py-2 align-top text-muted-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="font-semibold text-foreground">三句摘要</div>
          <p className="mt-1 whitespace-pre-line text-muted-foreground">{DATA_TABLE_EXAMPLE.summary}</p>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
          <div className="font-semibold text-foreground">回想檢核</div>
          <p className="mt-1 whitespace-pre-line text-muted-foreground">{DATA_TABLE_EXAMPLE.check}</p>
        </div>
      </div>
    </div>
  );
}

export function LearningGymActivity({
  task,
  progress,
  onProgressChange,
  onBack,
}: LearningGymActivityProps) {
  const [topic, setTopic] = useState(() => topicExamplesForTask(task)[0]);
  const [notes, setNotes] = useState('');
  const [recall, setRecall] = useState('');
  const [round, setRound] = useState(1);
  const [selectedSpot, setSelectedSpot] = useState(0);
  const [spots, setSpots] = useState<string[]>(() => Array.from({ length: 10 }, (_, i) => `位置 ${i + 1}`));
  const [completed, setCompleted] = useState(false);

  const steps = useMemo(() => taskSteps(task), [task]);
  const topAbilities = topLearningGymAbilities(progress, 4);
  const isPalace = task.id === 'memory_palace';
  const isAudio = task.group === 'auditory_dominant';
  const isLogic = task.group === 'logical_dominant';
  const isKinesthetic = task.group === 'kinesthetic_dominant';
  const isSceneAnchor = task.id === 'scene_anchor';
  const isDataToTable = task.id === 'data_to_table';
  const topicExamples = topicExamplesForTask(task);

  const useDataTableExample = () => {
    setTopic(DATA_TABLE_EXAMPLE.raw);
    setNotes(`${DATA_TABLE_EXAMPLE.columns}\n\n三句摘要：\n${DATA_TABLE_EXAMPLE.summary}`);
    setRecall(DATA_TABLE_EXAMPLE.recall);
    setCompleted(false);
  };

  const submitEvidence = () => {
    const evidence = [
      `主題：${topic}`,
      `筆記：${notes}`,
      `回想：${recall}`,
      isPalace ? `空間位置：${spots.join(' / ')}` : '',
    ].filter(Boolean).join('\n');
    const scored = scoreLearningGymInput(progress, evidence, task);
    onProgressChange(scored.progress, scored.gained, evidence);
    setCompleted(true);
  };

  const resetRound = () => {
    setRound((value) => value + 1);
    setNotes('');
    setRecall('');
    setCompleted(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{task.title}</h1>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {task.level}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{task.subtitle}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground">
            <Timer className="h-3.5 w-3.5" />
            {task.duration}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <section className="mb-5 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-background to-cyan-50/70 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Dumbbell className="h-3.5 w-3.5" />
                {task.card}
              </div>
              <h2 className="mt-3 text-lg font-bold">本關目標：{task.outcome}</h2>
              <p className="mt-1 text-sm text-muted-foreground">這是本機互動練習，不需要等待聊天 API。完成後會寫入 Learning Gym 能力值。</p>
            </div>
            <div className="rounded-xl border bg-background/90 p-3 text-xs text-muted-foreground lg:w-80">
              <div className="font-semibold text-foreground mb-1">能力加成</div>
              {abilityText(task.abilityWeights)}
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
          <section className="space-y-5">
            {isSceneAnchor && <SceneAnchorHelp />}
            {isDataToTable && <DataToTableHelp onUseExample={useDataTableExample} />}

            <div className="grid gap-3 sm:grid-cols-4">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className={`rounded-xl border p-3 ${index + 1 <= Math.min(round, 4) ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}
                >
                  <div className="text-xs text-muted-foreground">Step {index + 1}</div>
                  <div className="mt-1 text-sm font-semibold">{step}</div>
                </div>
              ))}
            </div>

            {isPalace ? (
              <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
                <div className="rounded-2xl border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold">記憶宮殿 3D 房間</h3>
                      <p className="text-xs text-muted-foreground">點選位置，把知識點變成物件放進去。</p>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      位置 {selectedSpot + 1}
                    </span>
                  </div>
                  <div className="relative min-h-[360px] overflow-hidden rounded-xl border bg-[radial-gradient(circle_at_50%_20%,#fdfdfd,#dff7f4_48%,#cce7ff)] p-5 [perspective:1000px]">
                    <div className="absolute inset-x-10 bottom-6 top-24 rounded-lg border border-slate-300/70 bg-white/45 shadow-inner [transform:rotateX(58deg)]" />
                    <div className="absolute left-8 right-8 top-8 h-24 rounded-t-xl border bg-white/40" />
                    <div className="relative grid grid-cols-5 gap-3">
                      {spots.map((spot, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedSpot(index)}
                          className={`relative z-[1] min-h-24 rounded-xl border p-2 text-left shadow-sm transition-all hover:-translate-y-0.5 ${
                            selectedSpot === index ? 'border-primary bg-primary/10' : 'bg-white/85'
                          }`}
                        >
                          <MapPinned className="h-4 w-4 text-primary" />
                          <div className="mt-2 text-xs font-semibold">位置 {index + 1}</div>
                          <div className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{spot}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-card p-4">
                  <h3 className="font-bold">放置物件</h3>
                  <p className="mt-1 text-xs text-muted-foreground">把知識點寫成誇張、具體、可看見的物件。</p>
                  <Textarea
                    className="mt-3 min-h-36"
                    value={spots[selectedSpot]}
                    onChange={(event) => {
                      const next = [...spots];
                      next[selectedSpot] = event.target.value;
                      setSpots(next);
                    }}
                    placeholder="例：氫像一顆超輕氣球卡在天花板；氦是一個會害人跌倒的陷阱..."
                  />
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {spots.map((_, index) => (
                      <Button
                        key={index}
                        variant={selectedSpot === index ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedSpot(index)}
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border bg-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-bold">
                      {isAudio ? '聲音/節奏練習區' : isLogic ? '結構/解密練習區' : isKinesthetic ? '情境/動作練習區' : '視覺化練習區'}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">先輸入材料，再完成編碼與回想。</p>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">Round {round}</span>
                </div>

                <label className="mt-4 block text-sm font-medium">訓練主題</label>
                {isSceneAnchor && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    輸入一個你想記住的材料，例如單字、句型、公式、歷史事件或學科概念。右側有 negotiate 的完整案例可對照。
                  </p>
                )}
                {isDataToTable && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    直接貼一段原始資料。可以是學習紀錄、客戶回饋、歷史事件、實驗觀察或產品比較。重點是資料要能被拆成欄位。
                  </p>
                )}
                <Textarea
                  className={`mt-2 ${isDataToTable ? 'min-h-32' : 'min-h-20'}`}
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder={
                    isDataToTable
                      ? '貼上原始資料，例如：Amy 這週練了 4 天，每天 20 分鐘；Ben 練了 2 天，每次 45 分鐘...'
                      : '輸入單字、公式、歷史事件、學科概念或一段資料...'
                  }
                />

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">
                      {isDataToTable ? '欄位設計 / 表格整理 / 三句摘要' : isAudio ? '節奏/口訣/說書稿' : isLogic ? '拆解/因果/除錯筆記' : isKinesthetic ? '場景/動作/角色設定' : '畫面/顏色/符號設計'}
                    </label>
                    {isSceneAnchor && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        建議格式：地點、角色、情境、心情、任務。請避免只寫「意思」，要讓自己真的進入一個可回想的場景。
                      </p>
                    )}
                    {isDataToTable && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        建議格式：先列欄位名稱，再寫分類規則，接著整理表格內容，最後輸出 3 句摘要。
                      </p>
                    )}
                    <Textarea
                      className="mt-2 min-h-48"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder={
                        isDataToTable
                          ? '欄位：對象｜時間｜數字｜分類｜問題｜下一步\n規則：每個對象一列，數字獨立成欄，問題和策略分開\n表格：...\n三句摘要：...'
                          : task.coachFocus.join('\n')
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      {isDataToTable ? '遮住原文後重建表格' : '遮住提示後的主動回想'}
                    </label>
                    {isSceneAnchor && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        不看前面的材料，回想你在哪裡、跟誰說話、遇到什麼問題，以及你如何把關鍵詞用出來。
                      </p>
                    )}
                    {isDataToTable && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        不看原始資料，先背欄位名稱，再重建每一列的關鍵資訊，最後說出你整理後看見的規律。
                      </p>
                    )}
                    <Textarea
                      className="mt-2 min-h-48"
                      value={recall}
                      onChange={(event) => setRecall(event.target.value)}
                      placeholder={
                        isDataToTable
                          ? '不看原文，寫下：1. 欄位名稱 2. 每列重點 3. 三句摘要 4. 我最容易漏掉的欄位'
                          : '不看前面的材料，寫下你記得的內容、規則、口訣、畫面或修正版...'
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <h3 className="font-bold">回想檢核</h3>
              </div>
              {isSceneAnchor && (
                <div className="mt-3 rounded-xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
                  檢核標準：能說出材料的意思、使用場景、角色任務，並能自己造出一句新的例句或應用。只看懂或只背定義，還不算完成。
                </div>
              )}
              {isDataToTable && (
                <div className="mt-3 rounded-xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
                  檢核標準：欄位能對齊、分類規則說得出來、關鍵數字沒有混在文字裡，並能遮住原文重建表格摘要。只貼出一段重新改寫的文字，還不算完成。
                </div>
              )}
              <Textarea
                className="mt-3 min-h-28"
                value={recall}
                onChange={(event) => setRecall(event.target.value)}
                placeholder="完成最後一次回想：你記住了什麼？你用的是哪個鉤子？下次怎麼提取？"
              />
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button onClick={submitEvidence} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  完成並加能力值
                </Button>
                <Button variant="outline" onClick={resetRound} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  下一回合
                </Button>
              </div>
              {completed && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  已完成本回合。建議在第 1、3、7 天回來做一次不看提示回想。
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-bold">教練重點</h3>
              </div>
              <div className="mt-3 space-y-2">
                {task.coachFocus.map((item) => (
                  <div key={item} className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-4">
              <h3 className="font-bold">目前能力值</h3>
              <div className="mt-3 space-y-3">
                {topAbilities.map(([ability, value]) => (
                  <div key={ability}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span>{LEARNING_GYM_ABILITY_LABELS[ability]}</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                    <Progress value={value} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-4">
              <h3 className="font-bold">範例材料</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {topicExamples.map((item) => (
                  <button
                    key={item}
                    onClick={() => setTopic(item)}
                    className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {isSceneAnchor && <SceneAnchorExample />}
            {isDataToTable && <DataToTableExample />}
          </aside>
        </div>
      </main>
    </div>
  );
}
