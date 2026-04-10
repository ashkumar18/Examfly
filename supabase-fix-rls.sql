-- ============================================================
-- SSC PrepZone — Fix RLS policies  
-- Run this in Supabase Dashboard → SQL Editor
-- Fixes infinite recursion in admin SELECT policies
-- ============================================================

-- 1. Create a helper function to check admin status without hitting RLS
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

-- 2. Drop ALL existing SELECT policies to avoid duplicates
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own results" ON test_results;
DROP POLICY IF EXISTS "Admin can read all results" ON test_results;
DROP POLICY IF EXISTS "Users can read own mastery" ON mastery;
DROP POLICY IF EXISTS "Admin can read all mastery" ON mastery;
DROP POLICY IF EXISTS "Users can read own streak" ON streaks;
DROP POLICY IF EXISTS "Admin can read all streaks" ON streaks;

-- 3. Recreate clean SELECT policies (user reads own OR admin reads all)
CREATE POLICY "Select own or admin"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Select own or admin"
  ON test_results FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Select own or admin"
  ON mastery FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Select own or admin"
  ON streaks FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());
