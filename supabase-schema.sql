-- ============================================================
-- SSC PrepZone — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================
--
-- BEFORE running this SQL, go to:
--   Authentication → Providers → Email
--   and turn OFF "Confirm email" + "Secure email change"
--
-- ============================================================

-- 0. ADMIN HELPER (SECURITY DEFINER bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 1. PROFILES
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select own or admin"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Anyone can insert own profile on signup"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. TEST RESULTS
CREATE TABLE test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  score FLOAT,
  correct INT DEFAULT 0,
  wrong INT DEFAULT 0,
  unattempted INT DEFAULT 0,
  accuracy FLOAT DEFAULT 0,
  total_questions INT DEFAULT 0,
  time_taken_seconds INT DEFAULT 0,
  subject_breakdown JSONB DEFAULT '{}',
  question_data JSONB DEFAULT '[]',
  selected_answers JSONB DEFAULT '{}',
  taken_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own results"
  ON test_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Select own or admin"
  ON test_results FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- 3. MASTERY (per-question tracking)
CREATE TABLE mastery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  subject TEXT,
  subtopic TEXT,
  right_count INT DEFAULT 0,
  wrong_count INT DEFAULT 0,
  correct_streak INT DEFAULT 0,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own mastery"
  ON mastery FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Select own or admin"
  ON mastery FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own mastery"
  ON mastery FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. STREAKS
CREATE TABLE streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_active_date DATE
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own streak"
  ON streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Select own or admin"
  ON streaks FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own streak"
  ON streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_test_results_user ON test_results(user_id);
CREATE INDEX idx_test_results_taken_at ON test_results(user_id, taken_at DESC);
CREATE INDEX idx_mastery_user ON mastery(user_id);
CREATE INDEX idx_mastery_user_question ON mastery(user_id, question_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- This function runs with elevated privileges (SECURITY DEFINER)
-- so it can insert into profiles even with RLS enabled.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, role, avatar)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'user',
    COALESCE((new.raw_user_meta_data ->> 'avatar')::int, 0)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ADMIN SETUP
-- After running this SQL:
-- 1. Sign up as "admin" through the app with any password
-- 2. Then run:
--    UPDATE profiles SET role = 'admin' WHERE username = 'admin';
-- ============================================================
