-- T-BIKE MVP | Migration BO SUNG #3 - CR-03: phi tre tinh theo SO NGAY tre.
-- Quy tac moi: moi 24 gio tre = 1 ngay don gia; phan du (< 24 gio) ap bac thang BRULE-01..03 nhu cu.
--   vd tre 26 gio = 1 ngay + 2 gio (1/2 ngay) => he so 1.5
-- Schema goc chi cho he_so_phi_tre_ap_dung thuoc {0, 0.5, 1} va numeric(3,2) (toi da 9.99)
-- -> noi rong: moi boi so 0.5, khong am, toi da 9999.99. Du lieu cu deu hop le voi rang buoc moi.

begin;

alter table public.yeu_cau_thue drop constraint ck_phi_tre_hop_le;

alter table public.yeu_cau_thue alter column he_so_phi_tre_ap_dung type numeric(6,2);

alter table public.yeu_cau_thue add constraint ck_phi_tre_hop_le check (
  so_gio_tre >= 0
  and phu_phi_tre_han_vnd >= 0
  and he_so_phi_tre_ap_dung >= 0
  and he_so_phi_tre_ap_dung * 2 = trunc(he_so_phi_tre_ap_dung * 2)
);

comment on column public.yeu_cau_thue.he_so_phi_tre_ap_dung is
  'So ngay don gia tinh phi tre = so ngay tron (moi 24 gio) + he so bac thang cua phan du (0 / 0.5 / 1)';

commit;
