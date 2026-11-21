"""Phi tre tai cac moc bien (BRULE-01..03), dung dung bo quy tac trong seed.sql."""
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest

from app.domain.late_fee import LateFeeConfigError, LateFeeRule, calculate_late_fee, find_rule, validate_rules

RULES = [
    LateFeeRule("BRULE-01", Decimal(0), True, Decimal(1), False, Decimal("0.00")),
    LateFeeRule("BRULE-02", Decimal(1), True, Decimal(8), True, Decimal("0.50")),
    LateFeeRule("BRULE-03", Decimal(8), False, None, False, Decimal("1.00")),
]
EXPECTED = datetime(2026, 10, 22, 8, 0, tzinfo=timezone(timedelta(hours=7)))


@pytest.mark.parametrize(
    "delay, price, fee, rule",
    [
        (timedelta(minutes=-30), 150000, 0, "BRULE-01"),   # tra som
        (timedelta(0), 150000, 0, "BRULE-01"),             # dung gio
        (timedelta(minutes=30), 150000, 0, "BRULE-01"),
        (timedelta(minutes=59), 150000, 0, "BRULE-01"),
        (timedelta(minutes=59, seconds=59), 150000, 0, "BRULE-01"),
        (timedelta(hours=1), 150000, 75000, "BRULE-02"),   # dung 1 gio = 50%
        (timedelta(hours=5), 120000, 60000, "BRULE-02"),
        (timedelta(hours=8), 150000, 75000, "BRULE-02"),   # dung 8 gio = 50%
        (timedelta(hours=8, seconds=1), 150000, 150000, "BRULE-03"),
        (timedelta(hours=8, minutes=1), 150000, 150000, "BRULE-03"),  # 8 gio 1 phut = 100%
        (timedelta(hours=13, minutes=30), 120000, 120000, "BRULE-03"),
        # CR-03: tu 24 gio tro di lam tron len theo ngay
        (timedelta(hours=23, minutes=59), 150000, 150000, "BRULE-03"),
        (timedelta(hours=24), 150000, 150000, "BRULE-03"),                    # tron 1 ngay
        (timedelta(hours=24, seconds=1), 150000, 300000, "BRULE-03"),         # sang ngay 2 -> 2 ngay
        (timedelta(hours=25), 150000, 300000, "BRULE-03"),
        (timedelta(hours=32, minutes=1), 150000, 300000, "BRULE-03"),
        (timedelta(hours=48), 150000, 300000, "BRULE-03"),                    # tron 2 ngay
        (timedelta(days=2, hours=10), 150000, 450000, "BRULE-03"),
        (timedelta(days=3, hours=2), 120000, 480000, "BRULE-03"),             # 4 x 120.000
    ],
)
def test_boundaries(delay, price, fee, rule):
    r = calculate_late_fee(RULES, price, EXPECTED, EXPECTED + delay)
    assert r.phu_phi_vnd == fee
    assert r.ma_quy_tac == rule


def test_sub_second_is_truncated():
    r = calculate_late_fee(RULES, 150000, EXPECTED, EXPECTED + timedelta(hours=8, microseconds=500000))
    assert r.phu_phi_vnd == 75000


def test_hours_rounded_to_4_decimals():
    r = calculate_late_fee(RULES, 150000, EXPECTED, EXPECTED + timedelta(hours=2, minutes=30))
    assert r.so_gio_tre == Decimal("2.5000")


def test_timezones_compare_by_instant():
    actual = datetime(2026, 10, 22, 2, 0, tzinfo=timezone.utc)  # = 09:00 +07 -> tre 1 gio
    assert calculate_late_fee(RULES, 150000, EXPECTED, actual).phu_phi_vnd == 75000


def test_naive_datetime_rejected():
    with pytest.raises(ValueError):
        calculate_late_fee(RULES, 150000, EXPECTED.replace(tzinfo=None), EXPECTED.replace(tzinfo=None))


def test_odd_price_rounds_half_up():
    assert calculate_late_fee(RULES, 125001, EXPECTED, EXPECTED + timedelta(hours=2)).phu_phi_vnd == 62501


def test_rules_from_seed_are_valid():
    validate_rules(RULES)


def test_gap_in_rules_detected():
    with pytest.raises(LateFeeConfigError):
        validate_rules(RULES[:2])


def test_overlap_in_rules_detected():
    bad = RULES[:2] + [LateFeeRule("X", Decimal(8), True, None, False, Decimal("1.00"))]
    with pytest.raises(LateFeeConfigError):
        find_rule(bad, 8 * 3600)


def test_describe():
    assert RULES[0].describe() == "Dưới 1 giờ"
    assert RULES[1].describe() == "Từ 1 đến hết 8 giờ"
    assert RULES[2].describe() == "Trên 8 giờ"


def test_multi_day_breakdown_fields():
    r = calculate_late_fee(RULES, 150000, EXPECTED, EXPECTED + timedelta(days=2, hours=3, minutes=15))
    assert (r.so_ngay_tron, r.so_giay_du) == (2, 3 * 3600 + 15 * 60)
    assert r.he_so_phan_du == Decimal("1.00") and r.he_so_ngay == Decimal("3.00")
    assert r.phu_phi_vnd == 450000
    assert r.mo_ta_muc == "2 ngày + phần dư làm tròn lên 1 ngày"
    exact = calculate_late_fee(RULES, 150000, EXPECTED, EXPECTED + timedelta(days=2))
    assert exact.he_so_ngay == Decimal("2.00") and exact.mo_ta_muc == "Tròn 2 ngày"


def test_long_delay_rounds_up():
    r = calculate_late_fee(RULES, 150000, EXPECTED, EXPECTED + timedelta(days=40, hours=9))
    assert r.he_so_ngay == Decimal("41.00") and r.phu_phi_vnd == 41 * 150000
