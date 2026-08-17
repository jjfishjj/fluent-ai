import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { AlertTriangle, BarChart3, CalendarDays, CheckCircle2, Clock3, Cloud, CloudOff, Edit3, GraduationCap, LoaderCircle, Pause, Play, Plus, Radio, Target, Trash2, Upload, Users } from 'lucide-react';
import { codeRiskRanking, motionDifferenceInsight, motionModeComparison, motionTrendByAttempt, readNumberAttempts, replaceNumberAttempts } from '@/lib/number-training-analytics';
import { deleteClassroomStudent, parseClassroomCsv, readClassroom, replaceClassroom, saveClassroomStudent, setActiveStudent, updateClassroomStudent, type ClassroomStudent, type TestGroup } from '@/lib/number-classroom';
import { ClassroomWriteConflict, deleteCloudClassroomStudent, loadCloudClassroom, subscribeClassroom, syncClassroom, upsertCloudClassroomStudent } from '@/lib/number-classroom-supabase';
import { loadCloudNumberAttempts, subscribeNumberAttempts, syncNumberAttempts } from '@/lib/number-training-supabase';

const DEMO_ATTEMPTS = [
  { id: 'demo-1', student: '王小明（示範）', completedAt: Date.now() - 3_600_000, correct: 7, total: 10, averageResponseMs: 4200, results: [{ code: '04', correct: false, responseMs: 7100, animationEnabled: false }, { code: '18', correct: true, responseMs: 2600, animationEnabled: true }, { code: '31', correct: false, responseMs: 6800, animationEnabled: false }, { code: '43', correct: true, responseMs: 3100, animationEnabled: true }, { code: '77', correct: false, responseMs: 6400, animationEnabled: false }] },
  { id: 'demo-2', student: '陳怡君（示範）', completedAt: Date.now() - 86_400_000, correct: 9, total: 10, averageResponseMs: 3100, results: [{ code: '04', correct: true, responseMs: 2900, animationEnabled: true }, { code: '18', correct: true, responseMs: 2400, animationEnabled: true }, { code: '31', correct: false, responseMs: 5600, animationEnabled: false }, { code: '43', correct: true, responseMs: 2800, animationEnabled: true }, { code: '77', correct: true, responseMs: 3000, animationEnabled: false }] },
  { id: 'demo-3', student: '王小明（示範）', completedAt: Date.now() - 3 * 86_400_000, correct: 6, total: 10, averageResponseMs: 5100, results: [{ code: '04', correct: true, responseMs: 4200, animationEnabled: true }, { code: '18', correct: false, responseMs: 6500, animationEnabled: false }, { code: '31', correct: true, responseMs: 3900, animationEnabled: true }, { code: '43', correct: false, responseMs: 7000, animationEnabled: false }] },
  { id: 'demo-4', student: '王小明（示範）', completedAt: Date.now() - 7 * 86_400_000, correct: 5, total: 10, averageResponseMs: 5900, results: [{ code: '04', correct: false, responseMs: 7200, animationEnabled: false }, { code: '18', correct: true, responseMs: 4100, animationEnabled: true }, { code: '31', correct: false, responseMs: 6900, animationEnabled: false }, { code: '43', correct: true, responseMs: 4300, animationEnabled: true }] },
];

type SyncState = 'local' | 'syncing' | 'synced' | 'error';

export function NumberTeacherDashboard({ userId }: { userId?: string }) {
  const [savedAttempts, setSavedAttempts] = useState(readNumberAttempts);
  const attempts = savedAttempts.length ? savedAttempts : DEMO_ATTEMPTS;
  const students = useMemo(() => ['全部學生', ...new Set(attempts.map((item) => item.student))], [attempts]);
  const [student, setStudent] = useState('全部學生');
  const [classroom, setClassroom] = useState(readClassroom);
  const [className, setClassName] = useState('記憶 A 班');
  const [studentName, setStudentName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [testGroup, setTestGroup] = useState<TestGroup>('alternating');
  const [rosterMessage, setRosterMessage] = useState('');
  const [syncState, setSyncState] = useState<SyncState>(userId ? 'syncing' : 'local');
  const [conflictMessage, setConflictMessage] = useState('');
  const filtered = student === '全部學生' ? attempts : attempts.filter((item) => item.student === student);
  const ranking = codeRiskRanking(filtered);
  const accuracy = filtered.length ? filtered.reduce((sum, item) => sum + item.correct / item.total, 0) / filtered.length : 0;
  const response = filtered.length ? filtered.reduce((sum, item) => sum + item.averageResponseMs, 0) / filtered.length : 0;
  const [dynamicMode, staticMode] = motionModeComparison(filtered);
  const trend = motionTrendByAttempt(filtered);
  const insight = motionDifferenceInsight(filtered);

  useEffect(() => {
    if (!userId) { setSyncState('local'); return; }
    let active = true;
    setSyncState('syncing');
    Promise.all([syncClassroom(userId, readClassroom()), syncNumberAttempts(userId, readNumberAttempts())]).then(([roster, cloudAttempts]) => {
      if (!active) return;
      replaceClassroom(roster.students);
      replaceNumberAttempts(cloudAttempts);
      setClassroom(roster.students);
      setSavedAttempts(cloudAttempts);
      if (roster.conflicts.length) setConflictMessage(`偵測到 ${roster.conflicts.length} 筆跨裝置衝突，已保留最後更新版本。`);
      setSyncState('synced');
    }).catch(() => active && setSyncState('error'));
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const refreshRoster = () => { void loadCloudClassroom(userId).then((students) => { replaceClassroom(students); setClassroom(students); }).catch(() => setSyncState('error')); };
    const refreshAttempts = () => { void loadCloudNumberAttempts(userId).then((items) => { replaceNumberAttempts(items); setSavedAttempts(items); }).catch(() => setSyncState('error')); };
    const stopRoster = subscribeClassroom(userId, refreshRoster);
    const stopAttempts = subscribeNumberAttempts(userId, refreshAttempts);
    return () => { stopRoster(); stopAttempts(); };
  }, [userId]);

  const addStudent = async (event: FormEvent) => {
    event.preventDefault();
    if (!className.trim() || !studentName.trim() || !/^[A-Za-z0-9-]{3,12}$/.test(studentCode)) { setRosterMessage('請填班級、姓名，學生代碼需為 3–12 位英數字或連字號。'); return; }
    const newStudent = { id: `student-${Date.now()}`, className: className.trim(), name: studentName.trim(), studentCode: studentCode.toUpperCase(), testGroup, createdAt: Date.now() };
    const result = saveClassroomStudent(newStudent);
    setClassroom(result.students); setRosterMessage(result.error || '學生已建立，可直接指定開始測驗。');
    if (!result.error) {
      setStudentName(''); setStudentCode('');
      if (userId) {
        setSyncState('syncing');
        try { await upsertCloudClassroomStudent(userId, newStudent); setSyncState('synced'); }
        catch { setSyncState('error'); setRosterMessage('學生已保存在本機；雲端同步失敗，稍後會自動重試。'); }
      }
    }
  };

  const editStudent = async (student: ClassroomStudent) => {
    const name = window.prompt('學生姓名', student.name)?.trim();
    if (!name) return;
    const nextClass = window.prompt('班級／轉入班級', student.className)?.trim();
    if (!nextClass) return;
    const rawGroup = window.prompt('測驗組別：dynamic、static 或 alternating', student.testGroup)?.trim();
    if (!rawGroup || !['dynamic', 'static', 'alternating'].includes(rawGroup)) { setRosterMessage('測驗組別格式不正確。'); return; }
    const updated = { ...student, name, className: nextClass, testGroup: rawGroup as TestGroup, updatedAt: Date.now() };
    setClassroom(updateClassroomStudent(updated));
    setRosterMessage(`已更新 ${name}，跨裝置同步中。`);
    if (userId) {
      setSyncState('syncing');
      try { await upsertCloudClassroomStudent(userId, updated, student.updatedAt); setSyncState('synced'); }
      catch (error) {
        if (error instanceof ClassroomWriteConflict) {
          const latest = await loadCloudClassroom(userId);
          replaceClassroom(latest); setClassroom(latest);
          setConflictMessage(`「${student.name}」已在另一台裝置更新，本次修改未覆蓋雲端版本。`);
          setSyncState('synced');
        } else { setSyncState('error'); setRosterMessage('修改已保存在本機，雲端稍後重試。'); }
      }
    }
  };

  const removeStudent = async (student: ClassroomStudent) => {
    if (!window.confirm(`確定刪除 ${student.name}（${student.studentCode}）？`)) return;
    setClassroom(deleteClassroomStudent(student.id));
    setRosterMessage(`已刪除 ${student.name}。`);
    if (userId) {
      try { await deleteCloudClassroomStudent(userId, student); }
      catch { setSyncState('error'); setRosterMessage('本機已刪除；雲端刪除失敗，請稍後重試。'); }
    }
  };

  const importCsv = async (file: File) => {
    try {
      const imported = parseClassroomCsv(await file.text());
      const known = new Set(classroom.map((item) => item.studentCode));
      const added = imported.filter((item) => !known.has(item.studentCode));
      const next = [...classroom, ...added];
      replaceClassroom(next); setClassroom(next);
      if (userId) await Promise.all(added.map((item) => upsertCloudClassroomStudent(userId, item)));
      setRosterMessage(`CSV 匯入完成：新增 ${added.length} 筆，略過 ${imported.length - added.length} 筆重複代碼。`);
    } catch (error) { setRosterMessage(error instanceof Error ? error.message : 'CSV 匯入失敗'); }
  };

  return <section className="mt-6 rounded-[28px] bg-[#081226] p-6 text-white shadow-xl md:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-xs font-black tracking-[.2em] text-cyan-300"><GraduationCap className="h-5 w-5" />TEACHER ANALYTICS</div><h2 className="mt-2 text-3xl font-black">數字轉碼學習儀表板</h2><p className="mt-2 text-sm text-slate-400">依真實回想紀錄追蹤學生、日期、正確率、反應時間與高風險編碼。</p>{!savedAttempts.length && <span className="mt-3 inline-block rounded-full bg-amber-300/10 px-3 py-1 text-[11px] font-bold text-amber-200">目前顯示示範資料 · 完成測驗後自動切換</span>}</div><select aria-label="篩選學生" value={student} onChange={(event) => setStudent(event.target.value)} className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm font-bold">{students.map((name) => <option key={name}>{name}</option>)}</select></div>
    {!filtered.length ? <div className="mt-8 rounded-2xl border border-dashed border-white/15 p-10 text-center"><Target className="mx-auto h-10 w-10 text-slate-600" /><h3 className="mt-3 font-black">尚無學生測驗紀錄</h3><p className="mt-2 text-sm text-slate-500">完成一次「3D 空間戰」後，資料會自動出現在這裡。</p></div> : <>
      <div className="mt-7 grid gap-3 sm:grid-cols-3"><Metric icon={<Target />} label="平均正確率" value={`${Math.round(accuracy * 100)}%`} /><Metric icon={<Clock3 />} label="平均反應時間" value={`${(response / 1000).toFixed(1)} 秒`} /><Metric icon={<CalendarDays />} label="完成測驗" value={`${filtered.length} 次`} /></div>
      <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-5"><div className="flex flex-wrap items-end justify-between gap-2"><div><h3 className="font-black">動態組 vs 靜態組</h3><p className="mt-1 text-xs text-slate-400">依每一組模型編碼時的動畫開關，交叉比較延遲回想正確率與反應時間。</p></div><span className="text-xs text-slate-500">共 {dynamicMode.answers + staticMode.answers} 筆模型回想</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><ModeCard icon={<Play />} label="動態組" summary={dynamicMode} accent="cyan" /><ModeCard icon={<Pause />} label="靜態組" summary={staticMode} accent="violet" /></div></div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_.65fr]"><MotionTrend points={trend} /><div className="rounded-2xl border border-amber-300/15 bg-amber-300/5 p-5"><h3 className="flex items-center gap-2 font-black"><BarChart3 className="h-4 w-4 text-amber-300" />統計差異提示</h3><div className="mt-4 text-3xl font-black text-amber-100">{Math.abs(Math.round(insight.difference * 100))}<span className="ml-1 text-base">百分點</span></div><p className="mt-2 text-sm leading-6 text-slate-300">{insight.leader === 'tie' ? '目前兩組差異很小。' : insight.leader === 'dynamic' ? '目前動態組回想率較高。' : '目前靜態組回想率較高。'} {!insight.enoughData ? '兩組各累積 10 筆前僅視為早期訊號。' : '樣本量已達初步比較門檻，仍不代表因果效果。'}</p><div className="mt-4 rounded-xl bg-black/20 px-3 py-2 text-xs text-slate-500">樣本 {insight.totalAnswers} 筆 · 僅比較同一篩選學生</div></div></div>
      <div className="mt-7 grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><h3 className="font-black">最近學習紀錄</h3><div className="mt-4 space-y-2">{filtered.slice(0, 8).map((item) => <div key={item.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl bg-black/20 p-3 text-sm"><div><div className="font-bold">{item.student}</div><div className="text-xs text-slate-500">{new Date(item.completedAt).toLocaleString('zh-TW')}</div></div><div className="font-mono font-black text-cyan-200">{item.correct}/{item.total}</div><div className="text-xs text-slate-400">{(item.averageResponseMs / 1000).toFixed(1)}s</div></div>)}</div></div><div className="rounded-2xl border border-rose-300/15 bg-rose-300/5 p-5"><h3 className="flex items-center gap-2 font-black"><AlertTriangle className="h-4 w-4 text-rose-300" />高風險編碼排行</h3><div className="mt-4 space-y-3">{ranking.slice(0, 6).map((item, index) => <div key={item.code}><div className="flex items-center justify-between text-sm"><span><b className="mr-2 text-rose-200">#{index + 1}</b><span className="font-mono font-black">{item.code}</span></span><span className="text-xs text-slate-400">錯誤 {Math.round(item.errorRate * 100)}% · {(item.averageResponseMs / 1000).toFixed(1)}s</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-rose-400" style={{ width: `${Math.max(5, item.riskScore * 100)}%` }} /></div></div>)}</div></div></div>
    </>}
    {conflictMessage && <div role="alert" className="mt-7 flex items-center justify-between gap-3 rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"><span>{conflictMessage}</span><button type="button" onClick={() => setConflictMessage('')} className="font-black">知道了</button></div>}
    <div className="mt-7 flex justify-end"><SyncBadge state={syncState} /></div>
    <div className="mt-7 rounded-2xl border border-violet-300/15 bg-violet-300/5 p-5"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-violet-300" /><div><h3 className="font-black">班級與測驗指派</h3><p className="text-xs text-slate-400">建立學生代碼，指定動態、靜態或交錯 A/B 組。</p></div></div><form onSubmit={addStudent} className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_.8fr_1fr_auto]"><input aria-label="班級名稱" value={className} onChange={(event) => setClassName(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm" placeholder="班級" /><input aria-label="學生姓名" value={studentName} onChange={(event) => setStudentName(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm" placeholder="學生姓名" /><input aria-label="學生代碼" value={studentCode} onChange={(event) => setStudentCode(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 font-mono text-sm uppercase" placeholder="A001" /><select aria-label="指定測驗組別" value={testGroup} onChange={(event) => setTestGroup(event.target.value as TestGroup)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"><option value="alternating">交錯 A/B 組</option><option value="dynamic">動態組</option><option value="static">靜態組</option></select><button className="inline-flex items-center justify-center gap-1 rounded-xl bg-violet-300 px-4 py-2 text-sm font-black text-slate-950"><Plus className="h-4 w-4" />建立</button></form>{rosterMessage && <p role="status" className="mt-2 text-xs text-violet-200">{rosterMessage}</p>}<div className="mt-4 grid gap-2 md:grid-cols-2">{classroom.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-black/20 p-3"><div><div className="font-bold">{item.name} <span className="font-mono text-xs text-violet-200">{item.studentCode}</span></div><div className="text-xs text-slate-500">{item.className} · {groupLabel(item.testGroup)}</div></div><button type="button" onClick={() => { setActiveStudent(item); setRosterMessage(`已指定 ${item.name} 進入${groupLabel(item.testGroup)}`); }} className="rounded-lg border border-violet-300/20 px-3 py-1.5 text-xs font-bold text-violet-200">指定測驗</button></div>)}{!classroom.length && <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-xs text-slate-500 md:col-span-2">尚未建立學生；上方輸入後即可產生第一筆班級名單。</div>}</div></div>
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">名單管理</h3><p className="text-xs text-slate-400">編輯、刪除、轉班，或用 CSV 批次匯入。</p></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-cyan-300/20 px-3 py-2 text-xs font-black text-cyan-200"><Upload className="h-4 w-4" />CSV 匯入<input type="file" accept=".csv,text/csv" className="sr-only" aria-label="CSV 匯入" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); event.currentTarget.value = ''; }} /></label></div>
      <div className="mt-4 grid gap-2 md:grid-cols-2">{classroom.map((item) => <div key={`manage-${item.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-black/20 p-3"><div><div className="font-bold">{item.name} <span className="font-mono text-xs text-violet-200">{item.studentCode}</span></div><div className="text-xs text-slate-500">{item.className} · {groupLabel(item.testGroup)}</div></div><div className="flex gap-1"><button type="button" aria-label={`編輯 ${item.name}`} onClick={() => void editStudent(item)} className="rounded-lg border border-white/10 p-2 text-slate-300"><Edit3 className="h-4 w-4" /></button><button type="button" aria-label={`刪除 ${item.name}`} onClick={() => void removeStudent(item)} className="rounded-lg border border-rose-300/20 p-2 text-rose-200"><Trash2 className="h-4 w-4" /></button></div></div>)}</div>
      <div className="mt-4 flex items-center gap-2 text-xs text-emerald-200"><Radio className="h-4 w-4" />{userId ? 'Realtime 已啟用：其他裝置的名單與成績會自動更新。' : '登入教師帳號後啟用 Realtime 跨裝置更新。'}</div>
    </div>
  </section>;
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-300 [&>svg]:h-4 [&>svg]:w-4">{icon}</div><div className="mt-3 text-xs text-slate-500">{label}</div><div className="mt-1 text-2xl font-black">{value}</div></div>; }

function ModeCard({ icon, label, summary, accent }: { icon: ReactNode; label: string; summary: ReturnType<typeof motionModeComparison>[number]; accent: 'cyan' | 'violet' }) { const color = accent === 'cyan' ? 'text-cyan-200 bg-cyan-300/10' : 'text-violet-200 bg-violet-300/10'; return <div className="rounded-xl border border-white/10 bg-black/20 p-4"><div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-black ${color}`}><span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>{label}</div><div className="mt-3 flex items-end justify-between gap-4"><div><div className="text-3xl font-black">{summary.answers ? Math.round(summary.correctRate * 100) : '—'}{summary.answers ? '%' : ''}</div><div className="text-xs text-slate-500">延遲回想正確率</div></div><div className="text-right"><div className="font-mono font-black">{summary.answers ? `${(summary.averageResponseMs / 1000).toFixed(1)}s` : '—'}</div><div className="text-xs text-slate-500">{summary.answers} 筆 · 平均反應</div></div></div></div>; }

function MotionTrend({ points }: { points: ReturnType<typeof motionTrendByAttempt> }) { return <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="flex items-center justify-between"><h3 className="font-black">同一學生 A/B 趨勢</h3><div className="flex gap-3 text-[10px] font-bold"><span className="text-cyan-200">● 動態</span><span className="text-violet-200">● 靜態</span></div></div><div className="mt-5 flex h-40 items-end gap-3 border-b border-white/10">{points.slice(-8).map((point, index) => <div key={point.id} className="flex h-full min-w-0 flex-1 items-end justify-center gap-1"><TrendBar value={point.dynamicRate} color="bg-cyan-300" label={`第 ${index + 1} 次動態`} /><TrendBar value={point.staticRate} color="bg-violet-300" label={`第 ${index + 1} 次靜態`} /></div>)}</div><div className="mt-2 flex justify-between text-[10px] text-slate-600"><span>較早</span><span>最近</span></div></div>; }
function TrendBar({ value, color, label }: { value: number | null; color: string; label: string }) { return <div aria-label={`${label} ${value === null ? '無資料' : `${Math.round(value * 100)}%`}`} title={value === null ? '無資料' : `${Math.round(value * 100)}%`} className={`w-3 rounded-t-sm transition-all ${value === null ? 'h-1 bg-white/10' : color}`} style={value === null ? undefined : { height: `${Math.max(5, value * 100)}%` }} />; }
function groupLabel(group: TestGroup) { return group === 'dynamic' ? '動態組' : group === 'static' ? '靜態組' : '交錯 A/B 組'; }

function SyncBadge({ state }: { state: SyncState }) {
  const content = state === 'syncing'
    ? { icon: <LoaderCircle className="h-3.5 w-3.5 animate-spin" />, label: '正在同步班級資料' }
    : state === 'synced'
      ? { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: '已跨裝置同步' }
      : state === 'error'
        ? { icon: <CloudOff className="h-3.5 w-3.5" />, label: '同步失敗 · 已保存在本機' }
        : { icon: <Cloud className="h-3.5 w-3.5" />, label: '登入後可跨裝置同步' };
  return <span role="status" className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-xs font-bold text-violet-100">{content.icon}{content.label}</span>;
}
