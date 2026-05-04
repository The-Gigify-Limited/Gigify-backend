-- Creates the IDUpload storage bucket for KYC / identity verification
-- documents. Bucket is public-read so the resulting publicUrl can be
-- attached directly to identity_verifications records and shown back to
-- the user / Sumsub webhook without an extra signed-URL hop.
--
-- Backend writes via the service-role client (see
-- src/core/utils/imageUpload.ts) so write/delete RLS policies are not
-- strictly required, but we add owner-scoped INSERT / UPDATE / DELETE
-- policies for clients that talk to Supabase Storage directly.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'IDUpload',
    'IDUpload',
    true,
    20971520, -- 20 MB
    array[
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/heic',
        'application/pdf'
    ]
)
on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

-- Public read: anyone with the URL can fetch the file. RLS on storage.objects
-- is enabled by default, so we have to explicitly grant SELECT for public
-- access even though the bucket is marked public=true.
drop policy if exists "IDUpload: public read" on storage.objects;
create policy "IDUpload: public read"
on storage.objects for select
to public
using (bucket_id = 'IDUpload');

-- Authenticated users can upload only to their own folder
-- (`<bucket>/<auth.uid()>/<filename>`), matching the path layout that
-- imageUploadService.buildPath produces when `userId` is supplied.
drop policy if exists "IDUpload: own insert" on storage.objects;
create policy "IDUpload: own insert"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'IDUpload'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "IDUpload: own update" on storage.objects;
create policy "IDUpload: own update"
on storage.objects for update
to authenticated
using (
    bucket_id = 'IDUpload'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "IDUpload: own delete" on storage.objects;
create policy "IDUpload: own delete"
on storage.objects for delete
to authenticated
using (
    bucket_id = 'IDUpload'
    and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
