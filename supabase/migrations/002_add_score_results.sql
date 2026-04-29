-- Add score_results JSONB column to assessments table
-- Stores: overall_score, sub_scores, risk_flags, recommendations

alter table assessments
  add column if not exists score_results jsonb;
