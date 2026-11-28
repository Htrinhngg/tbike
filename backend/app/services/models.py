"""Mau xe (CR-02): mot mau co nhieu xe that. Them mau / them xe chi danh cho Chu cua hang."""
from datetime import datetime

from psycopg import Connection, errors as pg_errors

from ..domain.maintenance import needs_maintenance
from ..errors import conflict, invalid, not_found
from ..schemas import PublicVehicleModel, Vehicle, VehicleCreate, VehicleModel, VehicleModelCreate
from .vehicles import get_vehicle


def list_models(conn: Connection) -> list[VehicleModel]:
    with conn.cursor() as cur:
        cur.execute(
            """select m.ma_mau, m.ten_mau, m.loai_xe::text as loai_xe, g.don_gia_ngay_vnd, m.dang_kinh_doanh,
                      count(x.ma_xe) as tong_so_xe,
                      count(x.ma_xe) filter (where x.trang_thai = 'KhaDung') as so_kha_dung,
                      count(x.ma_xe) filter (where x.trang_thai = 'DangThue') as so_dang_thue,
                      count(x.ma_xe) filter (where x.trang_thai = 'CanBaoDuong') as so_can_bao_duong
               from public.mau_xe m
               join public.bang_gia_thue g on g.loai_xe = m.loai_xe
               left join public.xe x on x.ma_mau = m.ma_mau
               group by m.ma_mau, g.don_gia_ngay_vnd
               order by m.loai_xe, m.ten_mau"""
        )
        return [VehicleModel(**r) for r in cur.fetchall()]


def public_models(conn: Connection, tu: datetime | None, den: datetime | None, loai_xe: str | None) -> list[PublicVehicleModel]:
    """So xe trong theo mau. Khong co thoi gian -> dem xe co the cho thue (khong CanBaoDuong)."""
    if (tu is None) != (den is None):
        raise invalid("RANGE_INCOMPLETE", "Cần chọn cả thời gian nhận và trả xe")
    if tu and den and den <= tu:
        raise invalid("RANGE_INVALID", "Thời gian trả phải sau thời gian nhận xe")
    with conn.cursor() as cur:
        cur.execute(
            """select m.ma_mau, m.ten_mau, m.loai_xe::text as loai_xe, g.don_gia_ngay_vnd,
                      count(x.ma_xe) as tong_so_xe,
                      count(x.ma_xe) filter (where x.trang_thai <> 'CanBaoDuong' and (
                          %(tu)s::timestamptz is null or not exists (
                            select 1 from public.yeu_cau_thue o
                            where o.ma_xe = x.ma_xe and o.trang_thai_xu_ly in ('DaXacNhan', 'DangThue')
                              and o.thoi_gian_nhan_du_kien < %(den)s::timestamptz
                              and (case when o.trang_thai_xu_ly = 'DangThue' and o.thoi_gian_tra_thuc_te is null and o.thoi_gian_tra_du_kien <= coalesce(nullif(current_setting('tbike.now', true), '')::timestamptz, now()) then 'infinity'::timestamptz else o.thoi_gian_tra_du_kien end) > %(tu)s::timestamptz))) as so_xe_trong
               from public.mau_xe m
               join public.bang_gia_thue g on g.loai_xe = m.loai_xe
               join public.xe x on x.ma_mau = m.ma_mau
               where m.dang_kinh_doanh and (%(loai)s::text is null or m.loai_xe::text = %(loai)s::text)
               group by m.ma_mau, g.don_gia_ngay_vnd
               order by m.loai_xe, m.ten_mau""",
            {"tu": tu, "den": den, "loai": loai_xe},
        )
        rows = cur.fetchall()
    out = []
    for r in rows:
        ok = r["so_xe_trong"] > 0
        reason = None if ok else ("Hết xe trống trong thời gian bạn chọn" if tu else "Tạm ngừng cho thuê để bảo dưỡng")
        out.append(PublicVehicleModel(**r, kha_dung=ok, ly_do=reason))
    return out


def create_model(conn: Connection, body: VehicleModelCreate) -> VehicleModel:
    with conn.cursor() as cur:
        cur.execute("select public.tbike_ma_mau_tu_ten(%s) as m", (body.ten_mau,))
        code = body.ma_mau or cur.fetchone()["m"]
        if len(code) < 2:
            raise invalid("MODEL_CODE_INVALID", "Không tạo được mã mẫu từ tên, vui lòng nhập mã mẫu")
        try:
            with conn.transaction():
                cur.execute("insert into public.mau_xe (ma_mau, ten_mau, loai_xe) values (%s, %s, %s)",
                            (code, body.ten_mau, body.loai_xe))
        except pg_errors.UniqueViolation as exc:
            raise conflict("MODEL_EXISTS", "Mẫu xe (mã hoặc tên) đã tồn tại") from exc
    return next(m for m in list_models(conn) if m.ma_mau == code)


def create_vehicle(conn: Connection, body: VehicleCreate) -> Vehicle:
    with conn.cursor() as cur:
        cur.execute(
            """select m.ten_mau, m.loai_xe::text as loai_xe, m.dang_kinh_doanh, q.nguong_km
               from public.mau_xe m, public.quy_tac_bao_duong q where m.ma_mau = %s and q.ma_quy_tac = 'BRULE-04'""",
            (body.ma_mau,),
        )
        m = cur.fetchone()
        if m is None:
            raise not_found("Không tìm thấy mẫu xe")
        status = "CanBaoDuong" if needs_maintenance(body.odo_hien_tai, body.odo_bao_duong_gan_nhat, m["nguong_km"]) else "KhaDung"
        try:
            with conn.transaction():
                cur.execute(
                    """insert into public.xe (ma_xe, ma_mau, ten_xe, loai_xe, trang_thai, odo_hien_tai,
                                              odo_bao_duong_gan_nhat, ngay_bao_duong_gan_nhat)
                       values (%s, %s, %s, %s, %s, %s, %s, %s)""",
                    (body.ma_xe, body.ma_mau, m["ten_mau"], m["loai_xe"], status, body.odo_hien_tai,
                     body.odo_bao_duong_gan_nhat, body.ngay_bao_duong_gan_nhat),
                )
        except pg_errors.UniqueViolation as exc:
            raise conflict("VEHICLE_EXISTS", f"Mã xe {body.ma_xe} đã tồn tại") from exc
    return get_vehicle(conn, body.ma_xe)
