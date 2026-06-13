-- Storynara 커뮤니티 게시판 스키마
-- Supabase Dashboard → SQL Editor에서 실행하거나 CLI로 적용합니다.

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  category text not null check (
    category in ('daily_korean', 'concerns', 'info_exchange', 'meeting_plaza')
  ),
  title text not null check (char_length(title) between 1 and 200),
  content text not null check (char_length(content) between 1 and 10000),
  author_id uuid not null references auth.users (id) on delete cascade,
  author_display_name text not null check (char_length(author_display_name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_category_created_idx
  on public.community_posts (category, created_at desc);

alter table public.community_posts enable row level security;

-- 비로그인 사용자도 글 목록·본문 읽기 가능
create policy "community_posts_select_public"
  on public.community_posts
  for select
  to anon, authenticated
  using (true);

-- 로그인한 사용자만 글 작성 (본인 author_id만)
create policy "community_posts_insert_authenticated"
  on public.community_posts
  for insert
  to authenticated
  with check (auth.uid() = author_id);

-- 작성자만 본인 글 수정
create policy "community_posts_update_own"
  on public.community_posts
  for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- 작성자만 본인 글 삭제
create policy "community_posts_delete_own"
  on public.community_posts
  for delete
  to authenticated
  using (auth.uid() = author_id);
