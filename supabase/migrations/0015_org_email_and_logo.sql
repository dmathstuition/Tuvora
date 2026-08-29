-- ============================================================================
-- 0015_org_email_and_logo.sql  (additive)
--
-- Adds a contact email to organizations and a public storage bucket for
-- academy logos. Logo uploads are performed server-side with the service role
-- (which bypasses storage RLS); the bucket is public so the resulting logo URL
-- can be rendered anywhere (sidebar org card, portal, etc.).
-- ============================================================================

alter table public.organizations add column if not exists email text;

insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true)
on conflict (id) do update set public = true;

-- Allow authenticated org members to read/list within the public bucket. (Public
-- read is already implied by public=true; this keeps signed listing working.)
drop policy if exists org_logos_read on storage.objects;
create policy org_logos_read on storage.objects
  for select using (bucket_id = 'org-logos');
