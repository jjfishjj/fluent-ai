-- qa_training_examples: 管理員手動輸入的問答訓練資料
-- chat function 會把符合語言 / 記憶天才型態的啟用中資料，當作 few-shot
-- 範例塞進 system prompt，藉此微調機器人回答風格，不需要真的 fine-tune 模型。
CREATE TABLE public.qa_training_examples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  language TEXT,
  genius_type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.qa_training_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage qa training examples" ON public.qa_training_examples
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_qa_training_examples_updated_at BEFORE UPDATE ON public.qa_training_examples
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_qa_training_examples_active ON public.qa_training_examples (is_active);
