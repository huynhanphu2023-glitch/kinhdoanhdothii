-- Public player avatars are readable by anyone who has the URL.
-- Authenticated players may upload/replace only their own avatar object.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'apx-avatars',
  'apx-avatars',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'apx_avatar_read_own_metadata'
  ) then
    create policy apx_avatar_read_own_metadata
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'apx-avatars'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'apx_avatar_insert_own'
  ) then
    create policy apx_avatar_insert_own
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'apx-avatars'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'apx_avatar_update_own'
  ) then
    create policy apx_avatar_update_own
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'apx-avatars'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      )
      with check (
        bucket_id = 'apx-avatars'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      );
  end if;
end;
$$;
