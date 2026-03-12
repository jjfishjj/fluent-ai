import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Database, Loader2 } from 'lucide-react';

interface Props {
  onDataGenerated: () => void;
}

const LANGUAGES = ['english', 'german', 'french', 'spanish', 'japanese', 'korean'];
const SCENARIOS = ['daily', 'workplace', 'travel', 'academic', 'medical'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const MODES = ['practice', 'test'];

const SAMPLE_MESSAGES: Record<string, string[][]> = {
  english: [
    ['Hello! How can I help you today?', 'Hi, I want to practice ordering food at a restaurant.'],
    ['Sure! Let\'s begin. Welcome to our restaurant. What would you like to order?', 'I\'d like a Caesar salad and a glass of water, please.'],
  ],
  german: [
    ['Hallo! Wie kann ich Ihnen heute helfen?', 'Hallo, ich möchte Deutsch üben.'],
    ['Natürlich! Wo möchten Sie anfangen?', 'Können wir über Reisen sprechen?'],
  ],
  french: [
    ['Bonjour! Comment puis-je vous aider?', 'Bonjour, je voudrais pratiquer le français.'],
  ],
  spanish: [
    ['¡Hola! ¿Cómo puedo ayudarte?', '¡Hola! Quiero practicar español.'],
  ],
  japanese: [
    ['こんにちは！今日はどのようにお手伝いしましょうか？', 'こんにちは、日本語を練習したいです。'],
  ],
  korean: [
    ['안녕하세요! 무엇을 도와드릴까요?', '안녕하세요, 한국어를 연습하고 싶어요.'],
  ],
};

export function AdminMockDataTab({ onDataGenerated }: Props) {
  const [count, setCount] = useState(10);
  const [generating, setGenerating] = useState(false);

  const generateMockData = async () => {
    setGenerating(true);
    try {
      for (let i = 0; i < count; i++) {
        const language = LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)];
        const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
        const difficulty = DIFFICULTIES[Math.floor(Math.random() * DIFFICULTIES.length)];
        const mode = MODES[Math.floor(Math.random() * MODES.length)];
        const daysAgo = Math.floor(Math.random() * 30);
        const startedAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

        // Create conversation (user_id null = anonymous mock)
        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .insert({
            language,
            scenario,
            difficulty,
            mode,
            started_at: startedAt,
            is_anonymized: true,
            user_id: null,
          })
          .select('id')
          .single();

        if (convErr || !conv) continue;

        // Add sample messages
        const langMsgs = SAMPLE_MESSAGES[language] || SAMPLE_MESSAGES.english;
        const msgPairs = langMsgs[Math.floor(Math.random() * langMsgs.length)];
        
        const messagesToInsert = msgPairs.map((content, idx) => ({
          conversation_id: conv.id,
          role: idx % 2 === 0 ? 'assistant' : 'user',
          content,
        }));

        await supabase.from('messages').insert(messagesToInsert);
      }

      toast.success(`已生成 ${count} 筆模擬對話數據`);
      onDataGenerated();
    } catch (err) {
      toast.error('生成失敗');
      console.error(err);
    }
    setGenerating(false);
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Database className="w-5 h-5 text-primary" />
        生成模擬數據
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        生成模擬的對話紀錄，包含多種語言和情境。這些數據將以匿名方式儲存，用於測試和展示。
      </p>

      <div className="flex items-end gap-4">
        <div>
          <Label>生成筆數</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="mt-1 w-32"
          />
        </div>
        <Button onClick={generateMockData} disabled={generating} variant="gradient">
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              生成中...
            </>
          ) : (
            '開始生成'
          )}
        </Button>
      </div>
    </div>
  );
}
