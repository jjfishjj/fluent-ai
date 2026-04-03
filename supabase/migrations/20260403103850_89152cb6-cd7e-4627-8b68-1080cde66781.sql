
-- 1. energy_points: 能量點數帳戶
CREATE TABLE public.energy_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  last_daily_login DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.energy_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own energy" ON public.energy_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own energy" ON public.energy_points FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own energy" ON public.energy_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all energy" ON public.energy_points FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all energy" ON public.energy_points FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_energy_points_updated_at BEFORE UPDATE ON public.energy_points
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. energy_transactions: 點數交易紀錄
CREATE TABLE public.energy_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('practice_reward','daily_login','task_complete','purchase','shop_redeem','match_cost')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.energy_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.energy_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.energy_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.energy_transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 3. user_interests: 兩層式興趣泡泡
CREATE TABLE public.user_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  target_language TEXT NOT NULL DEFAULT 'english',
  learning_goals TEXT[] NOT NULL DEFAULT '{}',
  interest_topics TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interests" ON public.user_interests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own interests" ON public.user_interests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interests" ON public.user_interests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can view all interests for matching" ON public.user_interests FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage interests" ON public.user_interests FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_user_interests_updated_at BEFORE UPDATE ON public.user_interests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. daily_matches: 每日配對
CREATE TABLE public.daily_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  matched_user_id UUID NOT NULL,
  compatibility_score INTEGER NOT NULL DEFAULT 0,
  match_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_free BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches" ON public.daily_matches FOR SELECT USING (auth.uid() = user_id OR auth.uid() = matched_user_id);
CREATE POLICY "Users can insert own matches" ON public.daily_matches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own matches" ON public.daily_matches FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = matched_user_id);
CREATE POLICY "Admins can view all matches" ON public.daily_matches FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_daily_matches_user_date ON public.daily_matches (user_id, match_date);

-- 5. friendships: 語伴關係 & 親密度
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a_id UUID NOT NULL,
  user_b_id UUID NOT NULL,
  intimacy_score INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '陌生人',
  chat_bg_color TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_a_id, user_b_id)
);
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships" ON public.friendships FOR SELECT USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);
CREATE POLICY "Users can insert friendships" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);
CREATE POLICY "Users can update own friendships" ON public.friendships FOR UPDATE USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);
CREATE POLICY "Admins can view all friendships" ON public.friendships FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. shop_items: 配配幣商城
CREATE TABLE public.shop_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('avatar_frame','chat_bg','article_style','physical')),
  duration_days INTEGER,
  stock INTEGER,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active items" ON public.shop_items FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);
CREATE POLICY "Admins can manage shop items" ON public.shop_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_shop_items_updated_at BEFORE UPDATE ON public.shop_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. user_purchases: 用戶購買紀錄
CREATE TABLE public.user_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shop_item_id UUID NOT NULL REFERENCES public.shop_items(id),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON public.user_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON public.user_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all purchases" ON public.user_purchases FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 8. Auto-create energy_points on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.energy_points (user_id, balance, lifetime_earned) VALUES (NEW.id, 50, 50);
  INSERT INTO public.user_interests (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$function$;

-- Enable realtime for matches and friendships
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
