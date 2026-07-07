import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, GraduationCap, Sparkles } from 'lucide-react';
import { loadGeniusType, geniusInfo, GeniusType } from '@/lib/genius-type';
import { SUBJECTS, Subject } from '@/lib/subjects';

export default function SubjectLab() {
  const navigate = useNavigate();
  const { user, isAdmin, signOut, profile } = useAuth();
  const [geniusType, setGeniusType] = useState<GeniusType | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);

  useEffect(() => { setGeniusType(loadGeniusType()); }, [user?.id]);
  const gi = geniusInfo(geniusType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50">
      <Header
        isLoggedIn={!!user}
        isAdmin={isAdmin}
        userName={profile?.display_name || user?.email?.split('@')[0] || 'User'}
        onLogin={() => navigate('/auth')}
        onLogout={signOut}
      />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" onClick={() => (subject ? setSubject(null) : navigate('/'))}>
          <ArrowLeft className="w-4 h-4 mr-2" /> {subject ? '所有科目' : 'Home'}
        </Button>

        {!subject ? (
          <>
            {/* Landing */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="w-6 h-6 text-sky-500" />
                <h1 className="text-2xl font-bold">學科訓練</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                把你的記憶天才型態用在更多科目上——每科都有你型態專屬的學習策略，AI 家教依你的型態調整教法。
              </p>
            </div>

            {gi ? (
              <div className="flex items-center gap-2 text-sm rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5">
                <span>{gi.emoji}</span>
                <span className="text-muted-foreground">以你的型態</span>
                <b className="text-indigo-700">{gi.nameZh}</b>
                <span className="text-muted-foreground">提供各科學習策略</span>
              </div>
            ) : (
              <a href="/quizzes/memory-genius-quiz/" className="flex items-center gap-2 text-sm rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-2.5 hover:shadow-sm transition-shadow">
                🧠 <span><b>先測記憶天才型態</b>，各科會給你型態專屬的學習策略</span>
                <span className="text-indigo-600 ml-auto">→</span>
              </a>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {SUBJECTS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSubject(s)}
                  className="text-left rounded-2xl border-2 border-slate-200 bg-white p-5 hover:shadow-md hover:border-sky-300 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{s.emoji}</span>
                    <div>
                      <div className="font-bold" style={{ color: s.color }}>{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.desc}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{s.tasks.length} 個 AI 家教課題</span>
                    <span className="font-medium" style={{ color: s.color }}>進入 →</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Subject detail */}
            <div className="flex items-center gap-3">
              <span className="text-4xl">{subject.emoji}</span>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: subject.color }}>{subject.name}</h1>
                <p className="text-sm text-muted-foreground">{subject.desc}</p>
              </div>
            </div>

            {/* Type strategy */}
            {gi ? (
              <Card style={{ borderColor: `${gi.color}55` }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-4 h-4" style={{ color: gi.color }} />
                    <span className="text-sm font-semibold" style={{ color: gi.color }}>
                      {gi.emoji} {gi.nameZh}的{subject.name}學習策略
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {subject.typeTips[geniusType!]}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <a href="/quizzes/memory-genius-quiz/" className="block text-sm rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 hover:shadow-sm transition-shadow">
                🧠 <b>測記憶天才型態</b>，看你該怎麼學{subject.name}最有效 →
              </a>
            )}

            {/* Tasks */}
            <div className="space-y-3">
              <p className="text-sm font-semibold">AI 家教課題</p>
              {subject.tasks.map((t, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{t.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0 text-white"
                      style={{ backgroundColor: subject.color }}
                      onClick={() => navigate(`/practice?lang=${subject.lang}&prompt=${encodeURIComponent(t.prompt)}`)}
                    >
                      用 AI 練習 →
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Badge variant="outline" className="text-xs text-muted-foreground">
              💡 學到的重點可在對話中按「＋ 記憶卡」，依你的型態節奏排進間隔複習
            </Badge>
          </>
        )}
      </div>
    </div>
  );
}
