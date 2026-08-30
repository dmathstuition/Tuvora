-- ============================================================================
-- 0024 · Allowed homework submission formats
--
-- Lets a tutor choose how learners may answer a piece of homework — any mix of:
--   'type'   digital notebook (typed)
--   'upload' photos / PDFs / documents
--   'draw'   handwriting / drawing canvas
--   'voice'  spoken answer (audio)
-- Defaults to all four so existing assignments keep every option.
-- ============================================================================

alter table public.assignments
  add column if not exists allowed_formats text[] not null
    default array['type', 'upload', 'draw', 'voice']::text[];
