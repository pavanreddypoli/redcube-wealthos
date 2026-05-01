-- RedCube WealthOS — Migration 009
-- Adds RLS policies to assessments so advisors only see their own clients and unassigned leads

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to make this idempotent
DROP POLICY IF EXISTS "own_assessments"                  ON assessments;
DROP POLICY IF EXISTS "advisor_sees_own_and_unassigned"  ON assessments;
DROP POLICY IF EXISTS "advisor_updates_own_clients"      ON assessments;

-- SELECT: advisor sees rows they are selected/assigned to, plus fully unassigned leads
CREATE POLICY "advisor_sees_own_and_unassigned" ON assessments
  FOR SELECT USING (
    user_id = auth.uid()
    OR selected_advisor_id = auth.uid()
    OR assigned_advisor_id = auth.uid()
    OR (selected_advisor_id IS NULL AND assigned_advisor_id IS NULL)
  );

-- UPDATE: advisor can only update rows where they are the selected or assigned advisor
CREATE POLICY "advisor_updates_own_clients" ON assessments
  FOR UPDATE USING (
    selected_advisor_id = auth.uid()
    OR assigned_advisor_id = auth.uid()
  );

-- INSERT: any authenticated user can create an assessment (client submitting their own)
DROP POLICY IF EXISTS "users_insert_own_assessment" ON assessments;
CREATE POLICY "users_insert_own_assessment" ON assessments
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
