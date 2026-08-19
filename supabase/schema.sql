-- 健身房约课小程序 schema
-- 匿名模式（无登录），所有表对 anon 角色放行 CRUD；以 member_id 字段维护属主关系。
-- 全部使用 idempotent、非破坏性 DDL。

-- 1) members：本地客户端生成的会员身份（无 auth.users 依赖）
create table if not exists public.members (
  id text primary key,
  name text not null,
  phone text,
  role text not null default 'member' check (role in ('member','admin')),
  created_at timestamptz not null default now()
);

-- 2) coaches：教练资料
create table if not exists public.coaches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text not null,
  bio text,
  available_slots jsonb not null default '[]'::jsonb,
  avatar text,
  created_at timestamptz not null default now()
);

-- 3) courses：团课课程表
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  coach_id uuid references public.coaches(id) on delete set null,
  day_of_week text not null,
  start_time text not null,
  end_time text not null,
  location text not null,
  max_capacity int not null default 20,
  difficulty text not null default '初级',
  created_at timestamptz not null default now()
);

-- 4) bookings：团课预约
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  member_name text not null,
  status text not null default 'booked' check (status in ('booked','cancelled')),
  created_at timestamptz not null default now(),
  unique (course_id, member_id)
);

-- 5) private_bookings：私教课预约
create table if not exists public.private_bookings (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  member_name text not null,
  slot text not null,
  note text,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  created_at timestamptz not null default now()
);

-- 索引
create index if not exists idx_courses_coach on public.courses(coach_id);
create index if not exists idx_courses_day on public.courses(day_of_week);
create index if not exists idx_bookings_course on public.bookings(course_id);
create index if not exists idx_bookings_member on public.bookings(member_id);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_private_bookings_coach on public.private_bookings(coach_id);
create index if not exists idx_private_bookings_member on public.private_bookings(member_id);

-- RLS：开启
alter table public.members enable row level security;
alter table public.coaches enable row level security;
alter table public.courses enable row level security;
alter table public.bookings enable row level security;
alter table public.private_bookings enable row level security;

-- Anonymous-App Baseline：所有表对 anon 角色开放 CRUD
-- （无登录流程，使用 client 生成的 member_id 维护属主；不暴露任何敏感数据）
drop policy if exists members_anon_all on public.members;
create policy members_anon_all on public.members
  for all to anon using (true) with check (true);

drop policy if exists coaches_anon_all on public.coaches;
create policy coaches_anon_all on public.coaches
  for all to anon using (true) with check (true);

drop policy if exists courses_anon_all on public.courses;
create policy courses_anon_all on public.courses
  for all to anon using (true) with check (true);

drop policy if exists bookings_anon_all on public.bookings;
create policy bookings_anon_all on public.bookings
  for all to anon using (true) with check (true);

drop policy if exists private_bookings_anon_all on public.private_bookings;
create policy private_bookings_anon_all on public.private_bookings
  for all to anon using (true) with check (true);

-- 显式授予 anon 模式访问权限（默认 schema 已 grant，但显式更稳）
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.members, public.coaches, public.courses, public.bookings, public.private_bookings to anon, authenticated;

-- ============ Seed 数据 ============
-- 教练
insert into public.coaches (name, specialty, bio, available_slots, avatar)
values
  ('陈教练', '力量训练 / 增肌减脂', '从业 8 年，ACE-CPT 认证，擅长功能性力量训练和体态矫正。', '[{"day":"周一","time":"10:00-11:00"},{"day":"周二","time":"14:00-15:00"},{"day":"周四","time":"19:00-20:00"},{"day":"周六","time":"09:00-10:00"}]'::jsonb, '💪'),
  ('林教练', '瑜伽 / 普拉提', '印度 RYT-500 瑜伽教师认证，专注阴瑜伽、流瑜伽与普拉提核心训练。', '[{"day":"周一","time":"08:00-09:00"},{"day":"周三","time":"20:00-21:00"},{"day":"周五","time":"10:00-11:00"},{"day":"周日","time":"09:00-10:00"}]'::jsonb, '🧘'),
  ('王教练', 'HIIT / 心肺耐力', '前职业足球运动员，擅长高强度间歇训练与体脂管理。', '[{"day":"周二","time":"19:00-20:00"},{"day":"周三","time":"18:00-19:00"},{"day":"周五","time":"18:30-19:30"},{"day":"周六","time":"16:00-17:00"}]'::jsonb, '🔥'),
  ('赵教练', '动感单车', 'Les Mills RPM 认证教练，节奏感与燃脂效率双重在线。', '[{"day":"周一","time":"19:00-19:45"},{"day":"周四","time":"18:00-18:45"},{"day":"周六","time":"10:00-10:45"}]'::jsonb, '🚴')
on conflict do nothing;

-- 团课课程表
insert into public.courses (name, coach_id, day_of_week, start_time, end_time, location, max_capacity, difficulty)
select '晨间燃脂 HIIT', id, '周一', '07:00', '08:00', '团课房 A', 25, '中级' from public.coaches where name='王教练' and not exists (select 1 from public.courses where name='晨间燃脂 HIIT' and day_of_week='周一' and start_time='07:00');
insert into public.courses (name, coach_id, day_of_week, start_time, end_time, location, max_capacity, difficulty)
select '动感单车', id, '周一', '19:00', '19:45', '单车房', 20, '中级' from public.coaches where name='赵教练' and not exists (select 1 from public.courses where name='动感单车' and day_of_week='周一' and start_time='19:00');
insert into public.courses (name, coach_id, day_of_week, start_time, end_time, location, max_capacity, difficulty)
select '力量基础', id, '周二', '10:00', '11:00', '力量区', 12, '初级' from public.coaches where name='陈教练' and not exists (select 1 from public.courses where name='力量基础' and day_of_week='周二' and start_time='10:00');
insert into public.courses (name, coach_id, day_of_week, start_time, end_time, location, max_capacity, difficulty)
select 'HIIT 燃脂', id, '周二', '19:00', '20:00', '团课房 A', 25, '高级' from public.coaches where name='王教练' and not exists (select 1 from public.courses where name='HIIT 燃脂' and day_of_week='周二' and start_time='19:00');
insert into public.courses (name, coach_id, day_of_week, start_time, end_time, location, max_capacity, difficulty)
select '流瑜伽', id, '周三', '20:00', '21:00', '瑜伽房', 18, '初级' from public.coaches where name='林教练' and not exists (select 1 from public.courses where name='流瑜伽' and day_of_week='周三' and start_time='20:00');
insert into public.courses (name, coach_id, day_of_week, start_time, end_time, location, max_capacity, difficulty)
select '动感单车', id, '周四', '18:00', '18:45', '单车房', 20, '中级' from public.coaches where name='赵教练' and not exists (select 1 from public.courses where name='动感单车' and day_of_week='周四' and start_time='18:00');
insert into public.courses (name, coach_id, day_of_week, start_time, end_time, location, max_capacity, difficulty)
select '普拉提核心', id, '周五', '10:00', '11:00', '瑜伽房', 16, '中级' from public.coaches where name='林教练' and not exists (select 1 from public.courses where name='普拉提核心' and day_of_week='周五' and start_time='10:00');
insert into public.courses (name, coach_id, day_of_week, start_time, end_time, location, max_capacity, difficulty)
select 'HIIT 心肺挑战', id, '周五', '18:30', '19:30', '团课房 A', 25, '高级' from public.coaches where name='王教练' and not exists (select 1 from public.courses where name='HIIT 心肺挑战' and day_of_week='周五' and start_time='18:30');
insert into public.courses (name, coach_id, day_of_week, start_time, end_time, location, max_capacity, difficulty)
select '周末晨间单车', id, '周六', '10:00', '10:45', '单车房', 20, '初级' from public.coaches where name='赵教练' and not exists (select 1 from public.courses where name='周末晨间单车' and day_of_week='周六' and start_time='10:00');
insert into public.courses (name, coach_id, day_of_week, start_time, end_time, location, max_capacity, difficulty)
select '阴瑜伽放松', id, '周日', '09:00', '10:00', '瑜伽房', 18, '初级' from public.coaches where name='林教练' and not exists (select 1 from public.courses where name='阴瑜伽放松' and day_of_week='周日' and start_time='09:00');
