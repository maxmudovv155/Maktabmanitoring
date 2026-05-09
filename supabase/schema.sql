/* Namangan School Monitoring System — production schema template */
begin;

create extension if not exists "uuid-ossp";

-- =====================================================================
-- PROFILES (Admin / Viewer rol)
-- =====================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now(),
  avatar_url text
);

-- Yangi auth foydalanuvchi uchun profil
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'admin');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================================
-- SCHOOLS
-- =====================================================================
create table public.schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  director text not null default '',
  phone text not null default '',
  address text,
  created_at timestamptz not null default now()
);

create index schools_name_idx on public.schools using gin (to_tsvector('simple', coalesce(name, '')));

-- =====================================================================
-- CLASSES (student_count trigger bilan yangilanadi)
-- =====================================================================
create table public.classes (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  student_count integer not null default 0 check (student_count >= 0),
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create index classes_school_idx on public.classes (school_id);

-- =====================================================================
-- STUDENTS
-- =====================================================================
create table public.students (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid not null references public.classes (id) on delete cascade,
  full_name text not null,
  jshshir text not null,
  passport text,
  birth_date date,
  phone text,
  parent_phone text not null default '',
  address text,
  gender text not null default 'unknown' check (gender in ('male', 'female', 'other', 'unknown')),
  image text,
  status text not null default 'active' check (status in ('active', 'inactive', 'transferred')),
  jshshir_normalized text generated always as (
    regexp_replace(lower(coalesce(jshshir, '')), '\D', '', 'g')
  ) stored,
  created_at timestamptz not null default now()
);

create index students_class_idx on public.students (class_id);
create unique index students_jsh_norm_unique on public.students (jshshir_normalized)
  where length(jshshir_normalized) = 14;
create index students_search_idx on public.students (
  lower(full_name),
  coalesce(lower(phone), ''),
  lower(jshshir_normalized)
);

-- =====================================================================
-- ACTIVITY LOGS
-- =====================================================================
create table public.activity_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

create index activity_logs_actor_idx on public.activity_logs (actor_id, created_at desc);

-- =====================================================================
-- student_count trigger
-- =====================================================================
create function public.refresh_class_student_count(p_class uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.classes c
    set student_count = (select count(*)::int from public.students s where s.class_id = p_class)
  where c.id = p_class;
$$;

create function public.on_students_student_count_fn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_c uuid := null;
  new_c uuid := null;
begin
  if tg_op = 'INSERT' then
    new_c := new.class_id;
    if new_c is not null then
      perform public.refresh_class_student_count(new_c);
    end if;
  elsif tg_op = 'UPDATE' then
    old_c := old.class_id;
    new_c := new.class_id;
    if old_c is distinct from null then
      perform public.refresh_class_student_count(old_c);
    end if;
    if new_c is distinct from null then
      perform public.refresh_class_student_count(new_c);
    end if;
  elsif tg_op = 'DELETE' then
    old_c := old.class_id;
    if old_c is not null then
      perform public.refresh_class_student_count(old_c);
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_student_count_aiud on public.students;
create trigger trg_student_count_aiud
  after insert or update or delete on public.students
  for each row execute procedure public.on_students_student_count_fn();

-- =====================================================================
-- RLS + Policies
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.schools enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.activity_logs enable row level security;

-- Profiles — o‘qish va tahrirlash faqat egasi
drop policy if exists "profiles_own_select" on public.profiles;
create policy "profiles_own_select"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_own_update" on public.profiles;
create policy "profiles_own_update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

-- Viewer: SELECT, Admin: FULL (schools/classes/students)
drop policy if exists "schools_read_auth" on public.schools;
create policy "schools_read_auth"
  on public.schools for select
  using (auth.role() = 'authenticated');

drop policy if exists "schools_write_admin" on public.schools;
create policy "schools_write_admin"
  on public.schools for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "classes_read_auth" on public.classes;
create policy "classes_read_auth"
  on public.classes for select
  using (auth.role() = 'authenticated');

drop policy if exists "classes_write_admin" on public.classes;
create policy "classes_write_admin"
  on public.classes for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "students_read_auth" on public.students;
create policy "students_read_auth"
  on public.students for select
  using (auth.role() = 'authenticated');

drop policy if exists "students_write_admin" on public.students;
create policy "students_write_admin"
  on public.students for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Activity logs — faqat authenticated + insert admin/viewer yozishi mumkin (viewer faqat notify)
drop policy if exists "logs_read_auth" on public.activity_logs;
create policy "logs_read_auth"
  on public.activity_logs for select
  using (auth.role() = 'authenticated');

drop policy if exists "logs_insert_auth" on public.activity_logs;
create policy "logs_insert_auth"
  on public.activity_logs for insert
  with check (
    auth.role() = 'authenticated'
    and actor_id = auth.uid()
  );

-- Realtime uchun (agar xato bermasa)
do $$
begin
  begin execute 'alter publication supabase_realtime add table public.schools'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.classes'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.students'; exception when duplicate_object then null; end;
end $$;

commit;
