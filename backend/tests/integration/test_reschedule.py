"""CR-05: dieu chinh lich, gia han, chan lich loi thoi, danh dau qua han, doi xe khi giao."""
from datetime import datetime

from .conftest import VN, auth


def iso(*a):
    return datetime(*a, tzinfo=VN).isoformat()


def resched(client, code, nhan, tra, ly_do="Khách gọi đổi lịch"):
    return client.post(f"/api/rental-requests/{code}/reschedule",
                       json={"thoi_gian_nhan_du_kien": nhan, "thoi_gian_tra_du_kien": tra, "ly_do": ly_do}, headers=auth())


def confirm_with_deposit(client, code):
    r = client.post(f"/api/rental-requests/{code}/confirm",
                    json={"ma_phuong_thuc_bao_dam": "TIEN_MAT", "trang_thai_bao_dam": "DaXacNhan"}, headers=auth())
    assert r.status_code == 200, r.text
    return r.json()["don"]["ma_don_thue"]


def add_vision(client, ma_xe="TB006", odo=5000):
    r = client.post("/api/vehicles", json={"ma_xe": ma_xe, "ma_mau": "HONDA-VISION", "odo_hien_tai": odo}, headers=auth("token-owner"))
    assert r.status_code == 201, r.text


# --- (2)(6) Lich qua han: danh dau + chan xac nhan --------------------------------------------
def test_expired_schedule_is_flagged_and_blocks_confirm(client, now):
    now.set(datetime(2026, 11, 2, 8, 0, tzinfo=VN))
    req = client.get("/api/rental-requests/REQ-00000001", headers=auth()).json()
    assert req["qua_han_nhan"] is True
    r = client.post("/api/rental-requests/REQ-00000001/confirm", json={}, headers=auth())
    assert r.status_code == 409 and r.json()["error"]["code"] == "SCHEDULE_EXPIRED"
    overdue = client.get("/api/rental-requests", params={"qua_han": "true"}, headers=auth()).json()
    assert sorted(x["ma_yeu_cau"] for x in overdue["items"]) == ["REQ-00000001", "REQ-00000003"]
    assert client.get("/api/dashboard/summary", headers=auth()).json()["yeu_cau_qua_han"] == 2


# --- (1)(5) Dieu chinh lich yeu cau DaGui + luu vet ---------------------------------------------
def test_reschedule_pending_request_then_confirm(client, now):
    now.set(datetime(2026, 11, 2, 8, 0, tzinfo=VN))
    assert resched(client, "REQ-00000001", iso(2026, 11, 3, 9), iso(2026, 11, 4, 9), " ").status_code == 422
    assert resched(client, "REQ-00000001", iso(2026, 11, 1, 9), iso(2026, 11, 4, 9)).json()["error"]["code"] == "PICKUP_IN_PAST"
    r = resched(client, "REQ-00000001", iso(2026, 11, 3, 9), iso(2026, 11, 5, 9))
    assert r.status_code == 200, r.text
    d = r.json()["don"]
    assert d["thoi_gian_nhan_du_kien"].startswith("2026-11-03T02:00") and d["so_ngay_thue"] == 2 and d["qua_han_nhan"] is False
    hist = client.get("/api/rental-requests/REQ-00000001/schedule-history", headers=auth()).json()
    assert len(hist) == 1 and hist[0]["ly_do"] == "Khách gọi đổi lịch" and hist[0]["ten_nguoi_dieu_chinh"] == "Le Trang"
    assert hist[0]["thoi_gian_nhan_cu"].startswith("2026-10-28T01:00")
    assert client.post("/api/rental-requests/REQ-00000001/confirm", json={}, headers=auth()).status_code == 200


def test_reschedule_moves_to_free_unit_or_rejects(client):
    # REQ-00000003 (TB002) doi sang khung van trung ORD-00000002 -> chi 1 xe Vision -> 409
    r = resched(client, "REQ-00000003", iso(2026, 10, 27, 13), iso(2026, 10, 28, 11))
    assert r.status_code == 409 and r.json()["error"]["code"] == "SCHEDULE_CONFLICT"
    add_vision(client)
    r = resched(client, "REQ-00000003", iso(2026, 10, 27, 13), iso(2026, 10, 28, 11))
    assert r.status_code == 200 and r.json()["don"]["ma_xe"] == "TB006"
    assert any("TB006" in w for w in r.json()["canh_bao"])


def test_cannot_reschedule_closed_or_declined(client):
    assert resched(client, "REQ-00000004", iso(2026, 11, 3, 9), iso(2026, 11, 4, 9)).json()["error"]["code"] == "INVALID_STATE"


# --- (2)(4) Giao lech gio nhan > 2 gio (muon hoac som) -> phai dieu chinh lich -----------------
def test_handover_far_from_pickup_requires_reschedule(client, now):
    ord_code = confirm_with_deposit(client, "REQ-00000001")      # nhan 28/10 08:00 -> tra 29/10 08:00
    r = client.post(f"/api/rental-orders/{ord_code}/handover", json={"odo_giao_xe": 12500}, headers=auth())  # 27/10 08:00: som 24h
    assert r.status_code == 409 and r.json()["error"]["code"] == "SCHEDULE_MISMATCH"
    now.set(datetime(2026, 10, 28, 9, 59, tzinfo=VN))            # muon 1h59 -> van cho giao
    assert client.post(f"/api/rental-orders/{ord_code}/late-fee-preview",
                       json={"thoi_gian_tra_thuc_te": iso(2026, 10, 29, 8)}, headers=auth()).status_code == 409  # chua thue
    now.set(datetime(2026, 10, 28, 11, 30, tzinfo=VN))           # muon 3h30 -> chan, kem goi y
    r = client.post(f"/api/rental-orders/{ord_code}/handover", json={"odo_giao_xe": 12500}, headers=auth())
    assert r.status_code == 409 and r.json()["error"]["code"] == "SCHEDULE_MISMATCH"
    hint = r.json()["error"]["details"]
    assert hint["goi_y_nhan"].startswith("2026-10-28T11:30") and hint["goi_y_tra"].startswith("2026-10-29T11:30")  # giu 24 gio
    assert resched(client, "REQ-00000001", hint["goi_y_nhan"], hint["goi_y_tra"], "Khách đến muộn").status_code == 200
    r = client.post(f"/api/rental-orders/{ord_code}/handover", json={"odo_giao_xe": 12500}, headers=auth())
    assert r.status_code == 200, r.text
    # Tra dung lich moi -> khong phi tre
    now.set(datetime(2026, 10, 29, 11, 0, tzinfo=VN))
    r = client.post(f"/api/rental-orders/{ord_code}/return", json={"odo_nhan_xe": 12600}, headers=auth())
    assert r.json()["phi_tre"]["phu_phi_vnd"] == 0


# --- (3) Gia han khi dang thue --------------------------------------------------------------------
def test_extend_active_rental(client, now):
    now.set(datetime(2026, 10, 28, 8, 0, tzinfo=VN))            # ORD-00000002: nhan 27/10 09:00, tra 28/10 09:00
    nhan = iso(2026, 10, 27, 9)
    assert resched(client, "REQ-00000002", nhan, iso(2026, 10, 28, 8)).json()["error"]["code"] == "EXTEND_ONLY"
    assert resched(client, "REQ-00000002", iso(2026, 10, 27, 10), iso(2026, 10, 30, 9)).json()["error"]["code"] == "PICKUP_LOCKED"
    r = resched(client, "REQ-00000002", nhan, iso(2026, 10, 30, 9), "Khách gia hạn 2 ngày")
    assert r.status_code == 200 and r.json()["don"]["so_ngay_thue"] == 3 and r.json()["don"]["tien_thue_du_kien_vnd"] == 450000
    # Don ke tiep tren TB002 -> khong gia han de len duoc
    r = client.post("/api/rental-requests", json={"ma_xe": "TB002", "ho_ten_khach": "Khach Sau", "so_dien_thoai": "0933333333",
                                                  "thoi_gian_nhan_du_kien": iso(2026, 10, 31, 9), "thoi_gian_tra_du_kien": iso(2026, 11, 1, 9)})
    assert client.post(f"/api/rental-requests/{r.json()['ma_yeu_cau']}/confirm", json={}, headers=auth()).status_code == 200
    r = resched(client, "REQ-00000002", nhan, iso(2026, 11, 1, 9))
    assert r.status_code == 409 and r.json()["error"]["code"] == "SCHEDULE_CONFLICT"
    # Tra truoc han moi -> khong phi tre
    now.set(datetime(2026, 10, 30, 8, 0, tzinfo=VN))
    r = client.post("/api/rental-orders/ORD-00000002/return", json={"odo_nhan_xe": 8500}, headers=auth())
    assert r.status_code == 200 and r.json()["phi_tre"]["phu_phi_vnd"] == 0
    assert resched(client, "REQ-00000002", nhan, iso(2026, 10, 31, 9)).json()["error"]["code"] == "ALREADY_RETURNED"
    assert len(client.get("/api/rental-requests/REQ-00000002/schedule-history", headers=auth()).json()) == 1


# --- (7) Xe duoc gan chua ve khi toi gio giao -> doi xe cung mau ------------------------------------
def test_handover_swaps_to_free_sibling_when_assigned_not_ready(client, now):
    add_vision(client, odo=5000)
    r = client.post("/api/rental-requests", json={"ma_xe": "TB002", "ho_ten_khach": "Khach Moi", "so_dien_thoai": "0944444444",
                                                  "thoi_gian_nhan_du_kien": iso(2026, 10, 28, 12), "thoi_gian_tra_du_kien": iso(2026, 10, 29, 12)})
    code = r.json()["ma_yeu_cau"]
    ord_code = confirm_with_deposit(client, code)
    now.set(datetime(2026, 10, 28, 12, 0, tzinfo=VN))            # ORD-00000002 tren TB002 chua tra (qua han)
    r = client.post(f"/api/rental-orders/{ord_code}/handover", json={"odo_giao_xe": 8200}, headers=auth())
    assert r.status_code == 409 and r.json()["error"]["code"] == "VEHICLE_NOT_READY"
    assert r.json()["error"]["details"]["xe_thay_the"] == ["TB006"]
    assert [v["ma_xe"] for v in client.get(f"/api/rental-orders/{ord_code}/replacement-vehicles", headers=auth()).json()] == ["TB006"]
    assert client.post(f"/api/rental-orders/{ord_code}/handover", json={"odo_giao_xe": 5000, "doi_sang_xe": "TB004"},
                       headers=auth()).json()["error"]["code"] == "REPLACEMENT_INVALID"
    assert client.post(f"/api/rental-orders/{ord_code}/handover", json={"odo_giao_xe": 4999, "doi_sang_xe": "TB006"},
                       headers=auth()).json()["error"]["code"] == "ODO_LT_CURRENT"
    r = client.post(f"/api/rental-orders/{ord_code}/handover", json={"odo_giao_xe": 5000, "doi_sang_xe": "TB006"}, headers=auth())
    assert r.status_code == 200 and r.json()["ma_xe"] == "TB006" and r.json()["trang_thai_xu_ly"] == "DangThue"
    hist = client.get(f"/api/rental-requests/{code}/schedule-history", headers=auth()).json()
    assert hist[0]["ma_xe_cu"] == "TB002" and hist[0]["ma_xe_moi"] == "TB006" and "Đổi xe khi giao" in hist[0]["ly_do"]
