-- T-BIKE MVP | Migration BO SUNG #2 (additive) - CR-02: quan ly theo MAU XE, mot mau co nhieu xe.
-- Chay SAU 2 migration truoc. Khong xoa / doi ten cot nao.
--
-- Mo hinh:
--   mau_xe (1) ---- (n) xe        : moi dong xe van la MOT chiec xe that (ODO, bao duong rieng)
--   yeu_cau_thue.ma_xe giu nguyen  : don luon gan 1 chiec cu the -> exclusion constraint chong trung lich van dung
-- Khach chon MAU; backend tu chon 1 chiec trong (xem backend/app/services/rentals.py).
--
-- Tuong thich nguoc: cot xe.ten_xe / xe.loai_xe giu nguyen va duoc trigger dong bo theo mau.
-- seed.sql goc (insert xe chi co ten_xe + loai_xe) van chay duoc: trigger tu tao/gan mau.

begin;

create table public.mau_xe (
  ma_mau varchar(20) primary key,
  ten_mau varchar(50) not null unique,
  loai_xe public.loai_xe_enum not null references public.bang_gia_thue(loai_xe) on delete restrict,
  dang_kinh_doanh boolean not null default true,
  ngay_tao timestamptz not null default now(),
  constraint ck_ma_mau check (ma_mau ~ '^[A-Z0-9-]{2,20}$')
);

alter table public.mau_xe enable row level security;
revoke all on table public.mau_xe from anon, authenticated;

-- Ma mau sinh tu ten: 'Honda Air Blade' -> 'HONDA-AIR-BLADE'
create or replace function public.tbike_ma_mau_tu_ten(p_ten text)
returns varchar
language sql
immutable
set search_path = ''
as $$
  select left(trim(both '-' from upper(regexp_replace(p_ten, '[^A-Za-z0-9]+', '-', 'g'))), 20)::varchar
$$;

-- 1. Tao mau tu du lieu xe dang co
insert into public.mau_xe (ma_mau, ten_mau, loai_xe)
select distinct on (x.ten_xe) public.tbike_ma_mau_tu_ten(x.ten_xe), x.ten_xe, x.loai_xe
from public.xe x
order by x.ten_xe, x.ma_xe;

-- 2. Gan xe vao mau
alter table public.xe add column ma_mau varchar(20) references public.mau_xe(ma_mau) on delete restrict;
update public.xe x set ma_mau = m.ma_mau from public.mau_xe m where m.ten_mau = x.ten_xe;

-- 3. Trigger: luon co ma_mau; ten_xe / loai_xe luon khop mau
create or replace function public.tbike_gan_mau_xe()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_ma varchar(20);
  v_ten varchar(50);
  v_loai public.loai_xe_enum;
begin
  if new.ma_mau is null then
    select m.ma_mau into v_ma from public.mau_xe m where m.ten_mau = new.ten_xe;
    if v_ma is null then
      insert into public.mau_xe (ma_mau, ten_mau, loai_xe)
      values (public.tbike_ma_mau_tu_ten(new.ten_xe), new.ten_xe, new.loai_xe)
      returning ma_mau into v_ma;
    end if;
    new.ma_mau := v_ma;
  end if;
  select m.ten_mau, m.loai_xe into v_ten, v_loai from public.mau_xe m where m.ma_mau = new.ma_mau;
  if v_ten is not null then
    new.ten_xe := v_ten;
    new.loai_xe := v_loai;
  end if;
  return new;
end;
$$;

create trigger trg_xe_gan_mau
  before insert or update of ma_mau, ten_xe, loai_xe on public.xe
  for each row execute function public.tbike_gan_mau_xe();

alter table public.xe alter column ma_mau set not null;
create index idx_xe_ma_mau on public.xe (ma_mau, trang_thai);

revoke all on function public.tbike_gan_mau_xe() from public, anon, authenticated;
revoke all on function public.tbike_ma_mau_tu_ten(text) from public, anon, authenticated;

commit;
