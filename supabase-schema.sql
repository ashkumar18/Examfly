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

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admin can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

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

CREATE POLICY "Users can read own results"
  ON test_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can read all results"
  ON test_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

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

CREATE POLICY "Users can read own mastery"
  ON mastery FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own mastery"
  ON mastery FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can read all mastery"
  ON mastery FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

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

CREATE POLICY "Users can read own streak"
  ON streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON streaks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can read all streaks"
  ON streaks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_test_results_user ON test_results(user_id);
CREATE INDEX idx_test_results_taken_at ON test_results(user_id, taken_at DESC);
CREATE INDEX idx_mastery_user ON mastery(user_id);
CREATE INDEX idx_mastery_user_question ON mastery(user_id, question_id);

-- ============================================================
-- ADMIN SETUP
-- After running this SQL:
-- 1. Create an admin user via Supabase Auth dashboard
--    (email: admin@sscprepzone.app, set a password)
-- 2. Then run:
--    INSERT INTO profiles (id, username, display_name, role, avatar)
--    VALUES ('<uuid-from-auth-dashboard>', 'admin', 'Admin', 'admin', 0);
-- ============================================================
