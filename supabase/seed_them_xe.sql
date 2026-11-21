-- T-BIKE | DATA GIA DINH bo sung: nhieu xe cho moi mau (chi de dev/test, KHONG phai du lieu that).
-- Chay SAU seed.sql. Trigger tu tao mau moi (Honda Lead 125, Yamaha Janus) va gan ma_mau.
-- Chay lai lan 2 se bao loi trung ma_xe -> binh thuong, du lieu da co.
insert into public.xe (ma_xe, ten_xe, loai_xe, trang_thai, odo_hien_tai, odo_bao_duong_gan_nhat, ngay_bao_duong_gan_nhat) values
  ('TB006', 'Honda Vision',     'Automatic', 'KhaDung', 5400, 4800, '2026-09-20'),
  ('TB007', 'Honda Vision',     'Automatic', 'KhaDung', 11250, 10100, '2026-09-02'),
  ('TB008', 'Honda Air Blade',  'Automatic', 'KhaDung', 7020, 6500, '2026-10-01'),
  ('TB009', 'Honda Air Blade',  'Automatic', 'KhaDung', 15880, 14200, '2026-08-15'),
  ('TB010', 'Honda Wave Alpha', 'Manual',    'KhaDung', 21300, 19900, '2026-08-28'),
  ('TB011', 'Honda Wave Alpha', 'Manual',    'KhaDung', 3300, 2100, '2026-09-30'),
  ('TB012', 'Yamaha Sirius',    'Manual',    'KhaDung', 9800, 9000, '2026-10-05'),
  ('TB013', 'Honda Lead 125',   'Automatic', 'KhaDung', 6400, 5100, '2026-09-12'),
  ('TB014', 'Honda Lead 125',   'Automatic', 'CanBaoDuong', 14320, 12250, '2026-07-02'),
  ('TB015', 'Yamaha Janus',     'Automatic', 'KhaDung', 7400, 6900, '2026-10-10');

-- Kiem tra: so xe theo mau
select m.ma_mau, m.ten_mau, m.loai_xe, count(x.ma_xe) as so_xe
from public.mau_xe m left join public.xe x on x.ma_mau = m.ma_mau
group by m.ma_mau, m.ten_mau, m.loai_xe order by m.loai_xe, m.ten_mau;
