-- Tao ho so nhan vien lien ket voi 1 user da tao trong Supabase Dashboard > Authentication > Users.
-- Chay bang psql:
--   psql "$DATABASE_URL" -v auth_user_id='<UUID tu Authentication>' -v ten_dang_nhap='letrang' \
--        -v ho_ten='Le Trang' -v vai_tro='NhanVien' -f supabase/scripts/create_staff_profile.sql
-- vai_tro: 'NhanVien' hoac 'ChuCuaHang'
insert into public.tai_khoan_nhan_vien (auth_user_id, ten_dang_nhap, ho_ten, vai_tro)
values (:'auth_user_id'::uuid, :'ten_dang_nhap', :'ho_ten', :'vai_tro'::public.vai_tro_nhan_vien_enum)
returning ma_nhan_vien, ten_dang_nhap, vai_tro;
