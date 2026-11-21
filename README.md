# T-Bike MVP — Web-App cho thuê xe máy (React + FastAPI + Supabase)

```
frontend/  React 18 + TypeScript + Vite + Tailwind + React Query + Supabase JS (chỉ để đăng nhập)
backend/   FastAPI + psycopg 3 (kết nối PostgreSQL của Supabase, transaction + khóa dòng)
supabase/  migrations/ (bản gốc + bản bổ sung), seed.sql, smoke_queries.sql, scripts/, local/
```

Luồng: **Frontend → Backend API → Supabase PostgreSQL**. Supabase Auth chỉ dùng để nhân viên đăng nhập.
Trình duyệt gửi `Authorization: Bearer <access_token>`, backend xác minh token với Supabase Auth,
ánh xạ sang `tai_khoan_nhan_vien.auth_user_id` và lấy vai trò **từ DB**. Không có secret nào trong frontend.

## 1. Cơ sở dữ liệu

Thứ tự áp dụng (Supabase CLI tự chạy đúng thứ tự tên file):

1. `supabase/migrations/20261026170000_tbike_schema.sql` — **bản gốc, giữ nguyên**
2. `supabase/migrations/20261027090000_tbike_mvp_bo_sung.sql` — **bổ sung, chỉ thêm**:
   | Thay đổi | Lý do |
   |---|---|
   | `hinh_thuc_nhan_xe`, `dia_chi_giao_xe` (+ CHECK) | CR-01 giao xe tận nơi ≤ 5 km |
   | `ly_do_tu_choi` | C3 yêu cầu lý do từ chối để khách tra cứu (schema gốc không có cột) |
   | `ex_khong_trung_lich_xe` (btree_gist) | Chặn trùng lịch ở mức DB khi nhiều nhân viên xác nhận đồng thời |
   | Trigger `ngay_cap_nhat` | Schema gốc ghi chú cột này chưa tự cập nhật |
   | Trigger khóa đơn `HoanTat` (SQLSTATE `TB001`) | NFR-03: không sửa ODO/thời gian/phí sau khi đóng đơn |
3. `supabase/migrations/20261031100000_tbike_mau_xe.sql` — **CR-02: mẫu xe** (bảng `mau_xe`, cột `xe.ma_mau`,
   trigger tự gán mẫu và đồng bộ `ten_xe`/`loai_xe`). Mỗi dòng `xe` vẫn là một chiếc thật (ODO, bảo dưỡng riêng);
   đơn thuê vẫn gắn một chiếc cụ thể nên ràng buộc chống trùng lịch giữ nguyên. Dữ liệu cũ được tự gán mẫu.
4. `supabase/migrations/20261102090000_tbike_phi_tre_nhieu_ngay.sql` — **CR-03: phí trễ nhiều ngày**: nới
   `he_so_phi_tre_ap_dung` từ {0; 0,5; 1} thành mọi bội số 0,5 (numeric(6,2)) để lưu được 2, 3, 4… ngày.
5. `supabase/migrations/20261103090000_tbike_dieu_chinh_lich.sql` — **CR-05**: bảng `lich_su_dieu_chinh_lich`
   lưu vết mỗi lần điều chỉnh lịch / gia hạn / đổi xe khi giao (lịch cũ, lịch mới, xe cũ/mới, lý do bắt buộc, người làm).
6. `supabase/seed.sql` — dữ liệu giả định cho dev/test (giữ nguyên).
7. `supabase/seed_them_xe.sql` — (tùy chọn) thêm 10 xe giả định để thử nhiều xe/mẫu.

```bash
supabase db push            # hoặc: psql "$DATABASE_URL" -f <từng file theo thứ tự trên>
```

Tạo nhân viên: Supabase Dashboard → Authentication → Users → **Add user** (email + mật khẩu), copy UUID rồi:

```bash
psql "$DATABASE_URL" -v auth_user_id='<UUID>' -v ten_dang_nhap='anhthien' -v ho_ten='Anh Thiện' \
     -v vai_tro='ChuCuaHang' -f supabase/scripts/create_staff_profile.sql
```

## 2. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env                                   # điền DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY
uvicorn app.main:app --reload --port 8000              # tài liệu API: http://localhost:8000/docs
```

## 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env                                   # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev                                            # http://localhost:5173 (proxy /api -> :8000)
```

Ảnh (logo, ảnh xe, ảnh du lịch): xuất từ Figma vào `frontend/public/images/` theo `public/images/README.md`.
Thiếu ảnh thì giao diện tự hiện icon thay thế.

| Màn hình Figma | Route |
|---|---|
| Trang chủ website | `/` |
| C0 Chọn xe khả dụng | `/thue-xe` |
| C1 Gửi yêu cầu thuê | `/thue-xe/:maXe/dat` |
| C4b Tra cứu (mã yêu cầu **+** SĐT) | `/tra-cuu` |
| A1 Đăng nhập | `/nhan-vien/dang-nhap` |
| A2 Tổng quan | `/nhan-vien` |
| A3 Không có quyền / hết phiên | `/nhan-vien/khong-co-quyen`, tự chuyển khi 401/403 hoặc 30 phút không thao tác |
| B1 / B2 / B3 | `/nhan-vien/xe`, `/nhan-vien/xe/:maXe`, `/nhan-vien/bao-duong` |
| C2 / C3 / C4 | `/nhan-vien/yeu-cau`, `/nhan-vien/yeu-cau/:maYeuCau`, `/nhan-vien/don/:maDon` |
| D1 / D2+D3 / D3+D4 | `/nhan-vien/don/:maDon/giao-xe`, `/nhan-vien/don/:maDon/nhan-xe`, `/nhan-vien/don/:maDon/hoan-tat` |

## 4. API

Mọi lỗi trả `{"error": {"code", "message", "details"}}`. Thời gian ISO 8601 **bắt buộc có múi giờ**; tiền là số nguyên VND.

| Endpoint | Quyền | Ghi chú |
|---|---|---|
| `GET /api/rental-pricing` | công khai | |
| `GET /api/public/vehicle-models?tu&den&loai_xe` | công khai | CR-02 — số xe trống theo **mẫu**; giao diện khách dùng endpoint này |
| `GET /api/public/vehicles?tu&den&loai_xe` | công khai | theo từng xe (giữ để tương thích) |
| `POST /api/rental-requests` | công khai, giới hạn tần suất | gửi `ma_mau` → hệ thống tự chọn 1 xe trống của mẫu; mã `REQ-` ngẫu nhiên |
| `POST /api/public/rental-requests/lookup` | công khai, giới hạn tần suất | cần **cả** mã + SĐT; tên khách được che |
| `GET /api/me`, `GET /api/staff` | nhân viên / **chỉ Chủ cửa hàng** | |
| `GET /api/dashboard/summary` | nhân viên | |
| `GET /api/vehicles`, `GET /api/vehicles/{ma_xe}` | nhân viên | lọc, sắp xếp, phân trang; chi tiết kèm lịch sử ODO |
| `GET /api/vehicles/{ma_xe}/maintenance-history` | nhân viên | |
| `GET /api/vehicle-models` | nhân viên | số lượng xe theo mẫu và trạng thái |
| `POST /api/vehicle-models`, `POST /api/vehicles` | **chỉ Chủ cửa hàng** | thêm mẫu mới / thêm xe vào mẫu (xe đã quá ngưỡng → CanBaoDuong) |
| `GET /api/maintenance/due` | nhân viên | `odo_hien_tai − odo_bao_duong_gan_nhat ≥ nguong_km` |
| `POST /api/vehicles/{ma_xe}/maintenance-records` | nhân viên | ghi `lich_su_bao_duong`, cập nhật mốc, xe → KhaDung |
| `GET /api/rental-requests`, `GET /api/rental-requests/{ma}` | nhân viên | có cờ `co_trung_lich` |
| `POST /api/rental-requests/{ma}/confirm` / `reject` | nhân viên | khóa mọi xe cùng mẫu; xe gán bị trùng → **tự chuyển sang xe trống cùng mẫu** (có cảnh báo); chốt `don_gia_ap_dung_vnd` |
| `GET /api/deposit-methods`, `GET /api/rental-orders/{ma_don}` | nhân viên | thêm mới — phục vụ C3/C4 |
| `PATCH /api/rental-orders/{ma_don}/deposit` | nhân viên | chỉ khi `DaXacNhan`; `DaHoanTra` chỉ đặt khi đóng đơn |
| `POST /api/rental-orders/{ma_don}/handover` | nhân viên | yêu cầu bảo đảm `DaXacNhan`, xe `KhaDung`, ODO ≥ ODO xe |
| `POST /api/rental-requests/{ma}/reschedule` | nhân viên | CR-05 — Đã gửi/Đã xác nhận: đổi giờ nhận & trả (tự chuyển xe cùng mẫu nếu cần); Đang thuê: chỉ gia hạn giờ trả; lý do bắt buộc |
| `GET /api/rental-requests/{ma}/schedule-history` | nhân viên | lịch sử điều chỉnh |
| `GET /api/rental-orders/{ma_don}/replacement-vehicles` | nhân viên | xe cùng mẫu còn trống khi xe được gán chưa sẵn sàng |
| `POST /api/rental-orders/{ma_don}/late-fee-preview` | nhân viên | thêm mới — D3 hiển thị phí do backend tính |
| `POST /api/rental-orders/{ma_don}/return` | nhân viên | ODO nhận ≥ ODO giao; tính & lưu phí trễ |
| `POST /api/rental-orders/{ma_don}/close` | nhân viên | → `HoanTat`; xe → `CanBaoDuong` nếu đạt ngưỡng, ngược lại `KhaDung` |

Quy tắc CR-05: không xác nhận yêu cầu có giờ trả dự kiến đã qua (`SCHEDULE_EXPIRED`); không giao xe lệch giờ nhận
dự kiến quá 2 giờ, sớm hoặc muộn (`SCHEDULE_MISMATCH`, kèm gợi ý lịch mới giữ nguyên thời lượng thuê); xe được gán chưa
sẵn sàng → `VEHICLE_NOT_READY` + danh sách xe cùng mẫu để `doi_sang_xe`. Cờ `qua_han_nhan` và bộ lọc `qua_han=true`.

Vòng đời: `DaGui → DaXacNhan (confirm) → DangThue (handover) → [return: ghi ODO/phí, vẫn DangThue] → HoanTat (close)`; `DaGui → TuChoi`.

Phí trễ (CR-03), so sánh theo **giây nguyên**: trễ **dưới 24 giờ** áp bậc thang `quy_tac_phi_tre` (59 phút → 0;
đúng 1 giờ → ½; đúng 8 giờ → ½; 8 giờ 1 phút → 1 ngày). Trễ **từ 24 giờ** làm tròn lên theo ngày:
24 giờ → 1; 25 giờ → 2; 2 ngày 10 giờ → 3; 3 ngày 2 giờ → 4 ngày.

## 5. Kiểm thử

```bash
cd backend && pytest                       # unit + API (không cần DB)
# Tích hợp trên PostgreSQL THẬT, DB RỖNG riêng cho test (test sẽ xóa sạch schema public/auth):
createdb tbike_test
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tbike_test pytest
cd ../frontend && npm test && npm run build
```

Test tích hợp gồm quy trình đầy đủ (tạo → xác nhận → đặt cọc → giao → nhận → tính phí → đóng), giá đã chốt
không đổi khi bảng giá đổi, trùng lịch, xác nhận đồng thời (2 luồng, chỉ 1 thành công), ngưỡng bảo dưỡng
1.990 / 2.000 / 2.100 km, thao tác lặp, khóa đơn HoanTat, phân quyền với hồ sơ thật. Supabase Auth được thay
bằng bộ xác minh giả trong test; **TUYỆT ĐỐI không** trỏ `TEST_DATABASE_URL` vào Supabase đang dùng.

## 6. Giới hạn đã biết

- Giới hạn tần suất API công khai lưu trong bộ nhớ → chỉ đúng khi chạy 1 tiến trình backend.
- Schema không có cột người giao/nhận xe → lịch sử ODO hiển thị "—" ở cột người ghi cho sự kiện giao/nhận.
- Chủ cửa hàng chưa có chức năng điều chỉnh đơn đã HoanTat (trigger chặn mọi cập nhật); cần migration riêng nếu muốn mở.
- Đa ngôn ngữ (VI/EN) chỉ áp dụng cho **giao diện khách** (`frontend/src/i18n/`); khu vận hành giữ tiếng Việt.
  Dữ liệu nhập tay (lý do từ chối, tên hình thức bảo đảm) giữ nguyên ngôn ngữ gốc. Thêm câu chữ mới: thêm khóa vào
  `vi` trong `i18n/dict.ts` — TypeScript báo lỗi nếu quên bản `en`.
