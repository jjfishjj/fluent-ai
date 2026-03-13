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
const LEARNING_STYLES = ['visual', 'auditory', 'reading', 'kinesthetic'];

// Extended conversation templates per language (AI, User alternating) — each has 8-10 pairs = 16-20 messages
const CONV_TEMPLATES: Record<string, string[][]> = {
  english: [
    ['Hello! How can I help you today?', 'Hi, I want to practice ordering food at a restaurant.'],
    ['Sure! Let\'s begin. Welcome to our restaurant. What would you like to order?', 'I\'d like a Caesar salad and a glass of water, please.'],
    ['Great choice! Would you like any dressing on the side?', 'Yes, please. Can I also get some bread?'],
    ['Of course! Our fresh baked rolls are excellent. Anything else?', 'What do you recommend for the main course?'],
    ['Our grilled salmon is very popular. It comes with seasonal vegetables.', 'That sounds delicious. I\'ll have that, please.'],
    ['Excellent! How would you like it cooked?', 'Medium, please. And can I see the dessert menu?'],
    ['Certainly! Here\'s our dessert menu. We have tiramisu, cheesecake, and chocolate fondant.', 'I\'ll think about dessert later. How long will the food take?'],
    ['About 15-20 minutes. Would you like something to drink while you wait?', 'A glass of lemonade would be nice, thank you.'],
    ['Perfect! I\'ll put your order in right away.', 'Thank you so much! This has been great practice.'],
  ],
  german: [
    ['Hallo! Wie kann ich Ihnen heute helfen?', 'Hallo, ich möchte Deutsch üben.'],
    ['Natürlich! Wo möchten Sie anfangen?', 'Können wir über Reisen sprechen?'],
    ['Gerne! Wohin möchten Sie reisen?', 'Ich plane eine Reise nach München.'],
    ['München ist wunderschön! Waren Sie schon einmal in Deutschland?', 'Nein, das wird mein erstes Mal. Was sollte ich besuchen?'],
    ['Sie sollten unbedingt den Marienplatz und den Englischen Garten besuchen.', 'Das klingt toll! Wie komme ich am besten vom Flughafen in die Stadt?'],
    ['Sie können die S-Bahn nehmen. Das ist schnell und günstig.', 'Wie viel kostet ein Ticket?'],
    ['Ein Einzelticket kostet etwa 12 Euro. Aber eine Tageskarte ist günstiger.', 'Danke für den Tipp! Welche deutschen Gerichte sollte ich probieren?'],
    ['Probieren Sie unbedingt Weißwurst, Brezn und Schweinebraten.', 'Das klingt lecker! Ich freue mich sehr auf die Reise.'],
    ['Das freut mich! Sie sprechen übrigens schon sehr gut Deutsch.', 'Vielen Dank! Das motiviert mich sehr weiterzulernen.'],
  ],
  french: [
    ['Bonjour! Comment puis-je vous aider?', 'Bonjour, je voudrais pratiquer le français.'],
    ['Bien sûr! De quoi aimeriez-vous parler?', 'Parlons de la culture française, s\'il vous plaît.'],
    ['Avec plaisir! Connaissez-vous des traditions françaises?', 'Je connais un peu la fête du 14 juillet.'],
    ['Oui, le 14 juillet est notre fête nationale! Il y a des feux d\'artifice partout.', 'C\'est magnifique! Et qu\'est-ce qu\'on mange ce jour-là?'],
    ['On fait souvent des barbecues et on mange des tartes et des gâteaux.', 'J\'adore la cuisine française. Quel est votre plat préféré?'],
    ['J\'aime beaucoup le coq au vin. C\'est un plat traditionnel.', 'Je n\'ai jamais essayé. Comment le prépare-t-on?'],
    ['On fait cuire du poulet dans du vin rouge avec des légumes. C\'est délicieux!', 'Ça donne envie! Je vais essayer de le cuisiner.'],
    ['N\'hésitez pas! La cuisine est une excellente façon d\'apprendre une langue.', 'Vous avez raison. Merci beaucoup pour cette conversation!'],
    ['De rien! Votre français s\'améliore vraiment. Continuez comme ça!', 'Merci, à la prochaine!'],
  ],
  spanish: [
    ['¡Hola! ¿Cómo puedo ayudarte?', '¡Hola! Quiero practicar español.'],
    ['¡Perfecto! ¿De qué tema te gustaría hablar?', 'Me gustaría hablar sobre deportes.'],
    ['¡Genial! ¿Te gusta el fútbol?', 'Sí, me encanta. Soy fan del Real Madrid.'],
    ['¡Buen equipo! ¿Has visto algún partido en el estadio?', 'No, pero es mi sueño visitar el Santiago Bernabéu.'],
    ['Es una experiencia increíble. El ambiente es espectacular.', '¿Qué otros deportes son populares en España?'],
    ['El baloncesto y el tenis también son muy populares.', '¿Conoces a Rafael Nadal?'],
    ['¡Por supuesto! Es una leyenda del tenis español.', 'Me gustaría aprender a jugar al tenis algún día.'],
    ['¡Adelante! Es un deporte muy divertido y bueno para la salud.', 'Tienes razón. Gracias por la conversación.'],
    ['¡De nada! Tu español es muy bueno. ¡Sigue practicando!', '¡Muchas gracias! ¡Hasta luego!'],
  ],
  japanese: [
    ['こんにちは！今日はどのようにお手伝いしましょうか？', 'こんにちは、日本語を練習したいです。'],
    ['いいですね！何について話しましょうか？', '日本の食べ物について話したいです。'],
    ['素晴らしいテーマですね！好きな日本料理はありますか？', 'はい、ラーメンが大好きです。'],
    ['ラーメンは人気がありますね。どんな味が好きですか？', '味噌ラーメンが一番好きです。'],
    ['味噌ラーメンは北海道が有名ですよ。行ったことはありますか？', 'いいえ、でもいつか行ってみたいです。'],
    ['北海道は食べ物がとても美味しいです。海鮮もおすすめです。', 'お寿司も好きです。特にサーモンが好きです。'],
    ['サーモンは日本でもとても人気があります。他に好きな食べ物はありますか？', 'たこ焼きも大好きです。大阪で食べてみたいです。'],
    ['大阪はたこ焼きの本場ですからね。きっと気に入りますよ。', 'ありがとうございます！日本語の練習になりました。'],
    ['どういたしまして。日本語がとても上手ですよ！', 'ありがとうございます！また練習したいです。'],
  ],
  korean: [
    ['안녕하세요! 무엇을 도와드릴까요?', '안녕하세요, 한국어를 연습하고 싶어요.'],
    ['좋습니다! 어떤 주제로 이야기할까요?', '한국 문화에 대해 이야기하고 싶어요.'],
    ['좋은 주제네요! 한국 문화에 대해 무엇을 알고 계세요?', 'K-pop과 한국 드라마를 좋아해요.'],
    ['K-pop은 전 세계적으로 인기가 많죠! 좋아하는 그룹이 있나요?', '네, BTS를 정말 좋아해요.'],
    ['BTS는 대단한 그룹이죠! 한국에 가본 적이 있나요?', '아직 없어요. 하지만 꼭 가고 싶어요.'],
    ['서울에 가시면 명동과 강남을 방문해 보세요.', '한국 음식도 먹어보고 싶어요. 추천해 주세요!'],
    ['비빔밥과 불고기를 꼭 드셔보세요. 아주 맛있어요!', '맛있겠다! 매운 음식도 좋아해요.'],
    ['그러면 떡볶이도 추천해요! 매콤달콤해서 맛있어요.', '고마워요! 한국어 연습이 많이 됐어요.'],
    ['천만에요! 한국어를 아주 잘하세요. 계속 연습하세요!', '감사합니다! 다음에 또 연습할게요.'],
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

        // Generate 15-20 messages (7-10 pairs)
        const templates = CONV_TEMPLATES[language] || CONV_TEMPLATES.english;
        const numPairs = 7 + Math.floor(Math.random() * 3); // 7-9 pairs = 14-18 msgs
        const shuffled = [...templates].sort(() => Math.random() - 0.5);
        const selectedPairs = shuffled.slice(0, Math.min(numPairs, shuffled.length));
        
        // If not enough templates, repeat some
        while (selectedPairs.length < numPairs) {
          selectedPairs.push(templates[Math.floor(Math.random() * templates.length)]);
        }

        const baseTime = new Date(startedAt).getTime();
        const messagesToInsert = selectedPairs.flatMap((pair, pairIdx) => 
          pair.map((content, idx) => ({
            conversation_id: conv.id,
            role: idx % 2 === 0 ? 'assistant' : 'user',
            content,
            created_at: new Date(baseTime + (pairIdx * 2 + idx) * 30000).toISOString(),
          }))
        );

        await supabase.from('messages').insert(messagesToInsert);
      }

      toast.success(`已生成 ${count} 筆模擬對話數據（每筆 15-20 句）`);
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
        生成模擬的對話紀錄，每筆包含 15-20 句對話。這些數據將以匿名方式儲存，用於測試和展示。
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
