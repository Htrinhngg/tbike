"""CR-02: mau xe, nhieu xe/mau, tu chon xe trong, tu chuyen xe khi xac nhan, them xe (Chu cua hang)."""
from datetime import datetime

from .conftest import VN, auth


def iso(*a):
    return datetime(*a, tzinfo=VN).isoformat()


def add_vision(client, ma_xe="TB006", odo=5000):
    r = client.post("/api/vehicles", json={"ma_xe": ma_xe, "ma_mau": "HONDA-VISION", "odo_hien_tai": odo}, headers=auth("token-owner"))
    assert r.status_code == 201, r.text
    return r.json()


def test_seed_backfilled_into_models(client):
    models = client.get("/api/vehicle-models", headers=auth()).json()
    assert {m["ma_mau"]: m["tong_so_xe"] for m in models} == {
        "HONDA-AIR-BLADE": 1, "HONDA-VISION": 1, "HONDA-WAVE-ALPHA": 1, "HONDA-WAVE-RSX": 1, "YAMAHA-SIRIUS": 1}
    v = client.get("/api/vehicles/TB002", headers=auth()).json()
    assert v["ma_mau"] == "HONDA-VISION"


def test_only_owner_can_add_models_and_vehicles(client):
    body = {"ma_xe": "TB006", "ma_mau": "HONDA-VISION", "odo_hien_tai": 5000}
    assert client.post("/api/vehicles", json=body, headers=auth("token-nv")).status_code == 403
    assert client.post("/api/vehicle-models", json={"ten_mau": "Honda Lead 125", "loai_xe": "Automatic"}, headers=auth("token-nv")).status_code == 403
    r = client.post("/api/vehicle-models", json={"ten_mau": "Honda Lead 125", "loai_xe": "Automatic"}, headers=auth("token-owner"))
    assert r.status_code == 201 and r.json()["ma_mau"] == "HONDA-LEAD-125" and r.json()["tong_so_xe"] == 0
    assert client.post("/api/vehicle-models", json={"ten_mau": "Honda Lead 125", "loai_xe": "Automatic"}, headers=auth("token-owner")).status_code == 409


def test_add_vehicle_rules(client):
    v = add_vision(client)
    assert v["ten_xe"] == "Honda Vision" and v["loai_xe"] == "Automatic" and v["trang_thai"] == "KhaDung"
    r = client.post("/api/vehicles", json={"ma_xe": "TB006", "ma_mau": "HONDA-VISION", "odo_hien_tai": 1}, headers=auth("token-owner"))
    assert r.status_code == 409 and r.json()["error"]["code"] == "VEHICLE_EXISTS"
    r = client.post("/api/vehicles", json={"ma_xe": "TB007", "ma_mau": "KHONG-CO", "odo_hien_tai": 1}, headers=auth("token-owner"))
    assert r.status_code == 404
    # Xe moi da vuot nguong bao duong -> vao thang CanBaoDuong
    r = client.post("/api/vehicles", json={"ma_xe": "TB008", "ma_mau": "HONDA-VISION", "odo_hien_tai": 9000,
                                            "odo_bao_duong_gan_nhat": 7000}, headers=auth("token-owner"))
    assert r.status_code == 201 and r.json()["trang_thai"] == "CanBaoDuong"
    m = next(x for x in client.get("/api/vehicle-models", headers=auth()).json() if x["ma_mau"] == "HONDA-VISION")
    assert (m["tong_so_xe"], m["so_kha_dung"], m["so_dang_thue"], m["so_can_bao_duong"]) == (3, 1, 1, 1)


def test_public_availability_counts_units(client):
    window = {"tu": iso(2026, 10, 27, 20), "den": iso(2026, 10, 28, 8)}   # TB002 dang thue trong khoang nay
    vision = lambda: next(m for m in client.get("/api/public/vehicle-models", params=window).json() if m["ma_mau"] == "HONDA-VISION")
    v = vision()
    assert (v["tong_so_xe"], v["so_xe_trong"], v["kha_dung"]) == (1, 0, False)
    add_vision(client)
    v = vision()
    assert (v["tong_so_xe"], v["so_xe_trong"], v["kha_dung"]) == (2, 1, True)
    # Mau chi co xe CanBaoDuong -> khong dat duoc
    rsx = next(m for m in client.get("/api/public/vehicle-models").json() if m["ma_mau"] == "HONDA-WAVE-RSX")
    assert rsx["kha_dung"] is False and rsx["ly_do"] == "Tạm ngừng cho thuê để bảo dưỡng"


def test_request_by_model_picks_free_unit_and_sells_out(client):
    def req(phone):
        return client.post("/api/rental-requests", json={
            "ma_mau": "HONDA-VISION", "ho_ten_khach": "Khach Mau", "so_dien_thoai": phone,
            "thoi_gian_nhan_du_kien": iso(2026, 10, 27, 20), "thoi_gian_tra_du_kien": iso(2026, 10, 28, 8)})
    assert req("0911000001").json()["error"]["code"] == "VEHICLE_UNAVAILABLE"   # chi co TB002 dang thue
    add_vision(client)
    r = req("0911000002")
    assert r.status_code == 201
    code = r.json()["ma_yeu_cau"]
    assert client.get(f"/api/rental-requests/{code}", headers=auth()).json()["ma_xe"] == "TB006"
    assert client.post(f"/api/rental-requests/{code}/confirm", json={}, headers=auth()).status_code == 200
    assert req("0911000003").json()["error"]["code"] == "VEHICLE_UNAVAILABLE"   # TB006 da duoc xac nhan


def test_confirm_reassigns_to_free_unit_of_same_model(client):
    # REQ-00000003 dang gan TB002 (trung ORD-00000002). Them TB006 cung mau -> khong con la "trung lich".
    assert client.get("/api/rental-requests/REQ-00000003", headers=auth()).json()["co_trung_lich"] is True
    add_vision(client)
    assert client.get("/api/rental-requests/REQ-00000003", headers=auth()).json()["co_trung_lich"] is False
    assert client.get("/api/dashboard/summary", headers=auth()).json()["yeu_cau_trung_lich"] == 0
    r = client.post("/api/rental-requests/REQ-00000003/confirm", json={}, headers=auth())
    assert r.status_code == 200, r.text
    assert r.json()["don"]["ma_xe"] == "TB006"
    assert any("TB006" in w for w in r.json()["canh_bao"])
