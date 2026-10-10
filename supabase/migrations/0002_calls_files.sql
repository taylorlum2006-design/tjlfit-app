-- TJL Fit: calls and files. Run after 0001 in Supabase > SQL Editor.

-- Calls: what the client can see (summary only filled in when the coach shares it)
create table public.calls (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Coaching call',
  scheduled_at timestamptz not null default now(),
  meeting_link text not null default '',
  recording_link text not null default '',
  summary jsonb,
  client_visible boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.calls enable row level security;
create policy "client reads shared calls" on public.calls for select
  using ((client_id = auth.uid() and client_visible) or public.is_coach_of(client_id));
create policy "coach adds calls" on public.calls for insert with check (public.is_coach_of(client_id));
create policy "coach edits calls" on public.calls for update using (public.is_coach_of(client_id));
create policy "coach deletes calls" on public.calls for delete using (public.is_coach_of(client_id));

-- Coach-only side of a call: transcript, private notes, draft summary. Clients can never read this.
create table public.call_private (
  call_id uuid primary key references public.calls(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  transcript text not null default '',
  notes text not null default '',
  summary_draft jsonb,
  updated_at timestamptz not null default now()
);
alter table public.call_private enable row level security;
create policy "coach only" on public.call_private for all
  using (public.is_coach_of(client_id)) with check (public.is_coach_of(client_id));

-- Files (PDFs and similar) stored per client in the private "documents" bucket
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  storage_path text not null,
  size bigint not null default 0,
  client_visible boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.documents enable row level security;
create policy "client reads shared files" on public.documents for select
  using ((client_id = auth.uid() and client_visible) or public.is_coach_of(client_id));
create policy "coach adds files" on public.documents for insert with check (public.is_coach_of(client_id));
create policy "coach edits files" on public.documents for update using (public.is_coach_of(client_id));
create policy "coach deletes files" on public.documents for delete using (public.is_coach_of(client_id));

insert into storage.buckets (id, name, public, file_size_limit) values ('documents', 'documents', false, 52428800)
  on conflict (id) do nothing;
create policy "coach uploads client files" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and public.is_coach_of(((storage.foldername(name))[1])::uuid));
create policy "coach removes client files" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and public.is_coach_of(((storage.foldername(name))[1])::uuid));
create policy "read shared or coached files" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and (
    public.is_coach_of(((storage.foldername(name))[1])::uuid)
    or exists (select 1 from public.documents d where d.storage_path = name and d.client_id = auth.uid() and d.client_visible)
  ));
