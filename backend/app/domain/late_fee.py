"""Tinh phu phi tra xe tre - logic thuan, khong phu thuoc DB.

CR-03 (chot): 
  Tre < 24 gio -> bac thang trong quy_tac_phi_tre (BRULE-01..03):
      < 1 gio -> 0 | 1 gio..dung 8 gio -> 0.5 ngay | > 8 gio -> 1 ngay
  Tre >= 24 gio -> LAM TRON LEN theo ngay: moi ngay bat dau tinh tron 1 ngay (ceil(tre / 24 gio)).
      vd 24 gio = 1 ngay; 25 gio = 2 ngay; 3 ngay 2 gio = 4 ngay. Ma quy tac luu: BRULE-03.
So sanh duoc thuc hien bang SO GIAY NGUYEN (bo phan le duoi 1 giay) de khong sai o moc bien:
59 phut -> 0; dung 1 gio -> 50%; dung 8 gio -> 50%; 8 gio 1 phut -> 100%.
"""
from dataclasses import dataclass
from datetime import datetime
from decimal import ROUND_HALF_UP, Decimal


class LateFeeConfigError(Exception):
    """Bang quy tac phi tre bi chong lan hoac co khoang trong."""


@dataclass(frozen=True)
class LateFeeRule:
    ma_quy_tac: str
    tu_gio_tre: Decimal
    gom_moc_duoi: bool
    den_gio_tre: Decimal | None
    gom_moc_tren: bool
    he_so_ngay: Decimal

    def matches(self, delay_seconds: int) -> bool:
        lower = self.tu_gio_tre * 3600
        if delay_seconds < lower or (delay_seconds == lower and not self.gom_moc_duoi):
            return False
        if self.den_gio_tre is None:
            return True
        upper = self.den_gio_tre * 3600
        return delay_seconds < upper or (delay_seconds == upper and self.gom_moc_tren)

    def describe(self) -> str:
        def fmt(h: Decimal) -> str:
            return f"{h.normalize():f}"
        if self.den_gio_tre is None:
            return f"{'Từ' if self.gom_moc_duoi else 'Trên'} {fmt(self.tu_gio_tre)} giờ"
        if self.tu_gio_tre == 0:
            return f"{'Đến hết' if self.gom_moc_tren else 'Dưới'} {fmt(self.den_gio_tre)} giờ"
        left = f"{'Từ' if self.gom_moc_duoi else 'Trên'} {fmt(self.tu_gio_tre)}"
        right = f"{'đến hết' if self.gom_moc_tren else 'dưới'} {fmt(self.den_gio_tre)} giờ"
        return f"{left} {right}"


DAY_SECONDS = 24 * 3600


@dataclass(frozen=True)
class LateFeeResult:
    so_giay_tre: int
    so_gio_tre: Decimal  # lam tron 4 chu so - khop numeric(12,4)
    so_ngay_tron: int  # so 24 gio tre tron
    so_giay_du: int  # phan du sau khi tru cac ngay tron
    ma_quy_tac: str  # quy tac ap cho phan du
    mo_ta_muc: str
    he_so_phan_du: Decimal
    he_so_ngay: Decimal  # tong = so_ngay_tron + he_so_phan_du
    don_gia_ngay_vnd: int
    phu_phi_vnd: int


def delay_seconds(expected_return: datetime, actual_return: datetime) -> int:
    if expected_return.tzinfo is None or actual_return.tzinfo is None:
        raise ValueError("Thời gian phải có múi giờ")
    seconds = int((actual_return - expected_return).total_seconds())
    return max(0, seconds)


def find_rule(rules: list[LateFeeRule], seconds: int) -> LateFeeRule:
    matched = [r for r in rules if r.matches(seconds)]
    if len(matched) != 1:
        raise LateFeeConfigError(
            f"Cấu hình phí trễ không hợp lệ: {len(matched)} quy tắc khớp với {seconds} giây trễ"
        )
    return matched[0]


def validate_rules(rules: list[LateFeeRule]) -> None:
    """Kiem tra cac quy tac phu kin [0, vo cuc) va khong chong lan tai cac moc."""
    if not rules:
        raise LateFeeConfigError("Chưa cấu hình quy tắc phí trễ")
    probes = {0}
    for r in rules:
        for h in (r.tu_gio_tre, r.den_gio_tre):
            if h is not None:
                s = int(h * 3600)
                probes.update({max(0, s - 1), s, s + 1})
    probes.add(DAY_SECONDS - 1)
    for s in sorted(probes):
        find_rule(rules, s)


def calculate_late_fee(
    rules: list[LateFeeRule],
    don_gia_ngay_vnd: int,
    expected_return: datetime,
    actual_return: datetime,
) -> LateFeeResult:
    if don_gia_ngay_vnd <= 0:
        raise ValueError("Đơn giá áp dụng phải lớn hơn 0")
    seconds = delay_seconds(expected_return, actual_return)
    full_days, remainder = divmod(seconds, DAY_SECONDS)
    if full_days == 0:
        rule = find_rule(rules, remainder)
        code, remainder_factor, label = rule.ma_quy_tac, rule.he_so_ngay, rule.describe()
    else:
        over = next((r for r in rules if r.den_gio_tre is None), None)  # quy tac mo (BRULE-03)
        if over is None:
            raise LateFeeConfigError("Thiếu quy tắc phí trễ không giới hạn trên (BRULE-03)")
        code = over.ma_quy_tac
        remainder_factor = Decimal("1.00") if remainder else Decimal("0.00")
        label = f"{full_days} ngày + phần dư làm tròn lên 1 ngày" if remainder else f"Tròn {full_days} ngày"
    total = Decimal(full_days) + remainder_factor
    fee = (total * Decimal(don_gia_ngay_vnd)).quantize(Decimal(1), rounding=ROUND_HALF_UP)
    hours = (Decimal(seconds) / Decimal(3600)).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    return LateFeeResult(
        so_giay_tre=seconds,
        so_gio_tre=hours,
        so_ngay_tron=full_days,
        so_giay_du=remainder,
        ma_quy_tac=code,
        mo_ta_muc=label,
        he_so_phan_du=remainder_factor,
        he_so_ngay=total,
        don_gia_ngay_vnd=don_gia_ngay_vnd,
        phu_phi_vnd=int(fee),
    )
