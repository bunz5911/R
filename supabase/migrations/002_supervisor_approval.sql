-- 커뮤니티 회원 승인·슈퍼바이저(bunz5911@gmail.com) 관리

create type public.community_member_status as enum (
  'pending',
  'approved',
  'rejected',
  'banned'
);

create table if not exists public.community_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  status public.community_member_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id)
);

create index if not exists community_profiles_status_created_idx
  on public.community_profiles (status, created_at desc);

alter table public.community_profiles enable row level security;

-- 슈퍼바이저 이메일 확인 (JWT email 기준)
create or replace function public.is_community_supervisor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') = 'bunz5911@gmail.com',
    false
  );
$$;

-- 승인된 회원만 글 작성 가능
create or replace function public.is_community_member_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_profiles
    where id = auth.uid()
      and status = 'approved'
  );
$$;

-- 신규 가입 시 프로필 자동 생성 (슈퍼바이저는 즉시 승인)
create or replace function public.handle_new_community_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member_status public.community_member_status;
  member_display_name text;
begin
  member_display_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    split_part(new.email, '@', 1)
  );

  if lower(new.email) = 'bunz5911@gmail.com' then
    member_status := 'approved';
  else
    member_status := 'pending';
  end if;

  insert into public.community_profiles (id, email, display_name, status)
  values (new.id, new.email, member_display_name, member_status)
  on conflict (id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_community on auth.users;

create trigger on_auth_user_created_community
  after insert on auth.users
  for each row
  execute function public.handle_new_community_user();

-- 기존 auth 사용자 백필
insert into public.community_profiles (id, email, display_name, status)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'display_name', split_part(u.email, '@', 1)),
  case
    when lower(u.email) = 'bunz5911@gmail.com' then 'approved'::public.community_member_status
    else 'pending'::public.community_member_status
  end
from auth.users u
where not exists (
  select 1 from public.community_profiles p where p.id = u.id
);

-- RLS: 본인 또는 슈퍼바이저 조회
drop policy if exists profiles_select_own_or_supervisor on public.community_profiles;
create policy profiles_select_own_or_supervisor
  on public.community_profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_community_supervisor());

-- RLS: 슈퍼바이저만 상태 변경 (승인·거절·강제 퇴거)
drop policy if exists profiles_update_supervisor on public.community_profiles;
create policy profiles_update_supervisor
  on public.community_profiles
  for update
  to authenticated
  using (public.is_community_supervisor())
  with check (public.is_community_supervisor());

-- 게시글 작성: 승인된 회원만
drop policy if exists community_posts_insert_authenticated on public.community_posts;
drop policy if exists community_posts_insert_approved on public.community_posts;

create policy community_posts_insert_approved
  on public.community_posts
  for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and public.is_community_member_approved()
  );
