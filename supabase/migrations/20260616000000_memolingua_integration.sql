-- MemoLingua Integration: VARK + FSRS Memory System

-- VARK Questions
CREATE TABLE IF NOT EXISTS vark_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language    TEXT NOT NULL DEFAULT 'zh',
  context     TEXT,
  question_text TEXT NOT NULL,
  option_v    TEXT NOT NULL,
  option_a    TEXT NOT NULL,
  option_r    TEXT NOT NULL,
  option_k    TEXT NOT NULL,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- VARK Responses (per session)
CREATE TABLE IF NOT EXISTS vark_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id    UUID NOT NULL,
  question_id   UUID NOT NULL REFERENCES vark_questions(id) ON DELETE CASCADE,
  selected_type TEXT NOT NULL CHECK (selected_type IN ('visual','auditory','reading','kinesthetic')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- VARK Profiles (blended from quiz + behavior + EEG)
CREATE TABLE IF NOT EXISTS vark_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Quiz scores
  quiz_v        NUMERIC DEFAULT 0,
  quiz_a        NUMERIC DEFAULT 0,
  quiz_r        NUMERIC DEFAULT 0,
  quiz_k        NUMERIC DEFAULT 0,
  -- Behavior scores (from practice patterns)
  behavior_v    NUMERIC DEFAULT 0,
  behavior_a    NUMERIC DEFAULT 0,
  behavior_r    NUMERIC DEFAULT 0,
  behavior_k    NUMERIC DEFAULT 0,
  -- EEG scores (from Brain Lab)
  eeg_v         NUMERIC DEFAULT 0,
  eeg_a         NUMERIC DEFAULT 0,
  eeg_r         NUMERIC DEFAULT 0,
  eeg_k         NUMERIC DEFAULT 0,
  -- Blended (weighted average)
  blended_v     NUMERIC DEFAULT 0,
  blended_a     NUMERIC DEFAULT 0,
  blended_r     NUMERIC DEFAULT 0,
  blended_k     NUMERIC DEFAULT 0,
  dominant_type TEXT CHECK (dominant_type IN ('visual','auditory','reading','kinesthetic')),
  confidence    NUMERIC DEFAULT 0.64,
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Memory Items (vocabulary, phrases, grammar points)
CREATE TABLE IF NOT EXISTS memory_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content          TEXT NOT NULL,
  meaning          TEXT,
  encoding_context TEXT DEFAULT 'reading' CHECK (encoding_context IN ('visual','auditory','reading','kinesthetic')),
  -- FSRS fields
  fsrs_stability   NUMERIC DEFAULT 0,
  fsrs_difficulty  NUMERIC DEFAULT 0,
  fsrs_state       TEXT DEFAULT 'new' CHECK (fsrs_state IN ('new','learning','review','relearning')),
  repetitions      INTEGER DEFAULT 0,
  lapses           INTEGER DEFAULT 0,
  next_review_at   TIMESTAMPTZ DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Memory Reviews (history)
CREATE TABLE IF NOT EXISTS memory_reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_item_id    UUID NOT NULL REFERENCES memory_items(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quality           INTEGER NOT NULL CHECK (quality BETWEEN 1 AND 4),
  review_modality   TEXT,
  eeg_engagement    NUMERIC,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE vark_questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vark_responses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vark_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_reviews   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vark_questions_public_read" ON vark_questions FOR SELECT USING (true);

CREATE POLICY "vark_responses_user_all"  ON vark_responses  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vark_profiles_user_all"   ON vark_profiles   USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "memory_items_user_all"    ON memory_items    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "memory_reviews_user_all"  ON memory_reviews  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Function: calculate VARK quiz result and upsert profile
CREATE OR REPLACE FUNCTION calculate_vark_quiz(p_session_id UUID, p_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count NUMERIC; a_count NUMERIC; r_count NUMERIC; k_count NUMERIC; total NUMERIC;
  dom TEXT;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE selected_type = 'visual'),
    COUNT(*) FILTER (WHERE selected_type = 'auditory'),
    COUNT(*) FILTER (WHERE selected_type = 'reading'),
    COUNT(*) FILTER (WHERE selected_type = 'kinesthetic')
  INTO v_count, a_count, r_count, k_count
  FROM vark_responses
  WHERE session_id = p_session_id AND user_id = p_user_id;

  total := GREATEST(v_count + a_count + r_count + k_count, 1);

  -- Determine dominant type
  SELECT type FROM (
    VALUES ('visual', v_count), ('auditory', a_count), ('reading', r_count), ('kinesthetic', k_count)
  ) AS t(type, cnt) ORDER BY cnt DESC LIMIT 1 INTO dom;

  INSERT INTO vark_profiles (user_id, quiz_v, quiz_a, quiz_r, quiz_k, blended_v, blended_a, blended_r, blended_k, dominant_type, confidence)
  VALUES (p_user_id, v_count, a_count, r_count, k_count, v_count, a_count, r_count, k_count, dom, 0.64)
  ON CONFLICT (user_id) DO UPDATE SET
    quiz_v = EXCLUDED.quiz_v, quiz_a = EXCLUDED.quiz_a,
    quiz_r = EXCLUDED.quiz_r, quiz_k = EXCLUDED.quiz_k,
    blended_v = ROUND((vark_profiles.behavior_v * 0.3 + EXCLUDED.quiz_v * 0.7)::NUMERIC, 2),
    blended_a = ROUND((vark_profiles.behavior_a * 0.3 + EXCLUDED.quiz_a * 0.7)::NUMERIC, 2),
    blended_r = ROUND((vark_profiles.behavior_r * 0.3 + EXCLUDED.quiz_r * 0.7)::NUMERIC, 2),
    blended_k = ROUND((vark_profiles.behavior_k * 0.3 + EXCLUDED.quiz_k * 0.7)::NUMERIC, 2),
    dominant_type = dom,
    updated_at = now();
END;
$$;

-- Seed: 16 sample VARK questions (zh)
INSERT INTO vark_questions (language, question_text, option_v, option_a, option_r, option_k) VALUES
('zh', '你在學一個新單字時，最常用哪種方式？',
 '把單字寫成圖表或心智圖', '大聲朗讀或反覆聆聽', '寫在筆記本並閱讀', '在句子或故事情境中使用它'),
('zh', '當你記不起一個單字時，你會怎麼做？',
 '試著回想它的樣子或顏色', '在腦中播放它的發音', '回想筆記或書上的位置', '想起你在什麼場景用過它'),
('zh', '你喜歡哪種學習材料？',
 '有圖表、顏色標記的教材', '有聲書或播客', '文字豐富的教科書', '互動遊戲或角色扮演'),
('zh', '如何能讓你最快理解新文法規則？',
 '看圖解或結構圖', '聽老師口頭說明', '閱讀詳細規則說明', '直接在句子中練習使用'),
('zh', '你在準備口說考試時，最習慣用哪種方法？',
 '看圖片或影片描述練習', '和人對話或聽範例音檔', '寫下關鍵字和要點', '模擬真實場景練習'),
('zh', '你記憶片語最有效的方法是？',
 '把片語做成視覺卡片', '錄音後反覆聽', '手寫成清單', '用片語演個短情境'),
('zh', '最讓你投入的語言課是？',
 '有豐富視覺投影片的課', '有互動對話的口語課', '有講義與閱讀素材的課', '有模擬情境的任務型課'),
('zh', '你如何整理學過的詞彙？',
 '分類成圖表或色塊', '錄成語音備忘', '做成有例句的單字表', '把單字放進自己寫的小故事'),
('zh', '你在說話時忘詞，最常用什麼策略？',
 '比手畫腳或描述外觀', '用相近發音的詞替代', '換個更簡單的書面字', '用動作或情境繞過去'),
('zh', '什麼樣的回饋對你最有幫助？',
 '紅筆圈出的書面修改', '口頭即時糾正', '列出錯誤清單', '立刻重試一次'),
('zh', '你最喜歡哪種複習方式？',
 '用閃卡或圖像回憶', '聽錄音反覆跟讀', '重讀筆記或課文', '把內容說給別人聽'),
('zh', '你在學習新語言時最大的動力是？',
 '看懂外語影片或書', '能和外國人流暢對話', '讀懂原文書籍', '能在當地旅行或生活'),
('zh', '最適合你的考試形式是？',
 '有圖表或選圖的題型', '口試或聽力測驗', '閱讀測驗或填空', '角色扮演或任務完成'),
('zh', '你如何確認自己學會了一個單字？',
 '能在腦中想像它的畫面', '能正確讀出發音', '能寫出正確拼法', '能在對話中自然用出來'),
('zh', '你最能記住語言的情況是？',
 '看影片時看到字幕', '聽歌或廣播時', '閱讀文章時', '和外國朋友聊天時'),
('zh', '遇到不懂的句子，你第一個反應是？',
 '看看句子的結構圖', '念出來感受語感', '查字典找定義', '想想它在什麼情境下會說');
