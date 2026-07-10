create table if not exists public.short_links (
  code text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  campaign_key text not null,
  promo_code text not null,
  source text not null default 'whatsapp',
  created_at timestamptz not null default now()
);

grant select on public.short_links to anon, authenticated;
grant all on public.short_links to service_role;

alter table public.short_links enable row level security;

drop policy if exists "short_links public read" on public.short_links;
create policy "short_links public read"
on public.short_links
for select
to anon, authenticated
using (true);

drop policy if exists "short_links admin manage" on public.short_links;
create policy "short_links admin manage"
on public.short_links
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create index if not exists short_links_user_campaign_idx
  on public.short_links(user_id, campaign_key);