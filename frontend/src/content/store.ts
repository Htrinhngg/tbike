// NOI DUNG CUA HANG – sua o day la cap nhat toan bo website khach (song ngu VI/EN).
// Muc co "xacNhan: true" la noi dung pho bien cua dich vu cho thue xe nhung CHUA duoc chu cua hang xac nhan:
// hay doi chieu voi anh Thien truoc khi dua len ban that, roi dat xacNhan: false.
import type { Lang } from "../i18n";

export const STORE = {
  name: "T Bike – Dịch Vụ Cho Thuê Xe Máy Tại Đà Nẵng",
  address: { vi: "110 Trần Văn Dư, phường Mỹ An, Ngũ Hành Sơn, Đà Nẵng", en: "110 Tran Van Du, My An Ward, Ngu Hanh Son, Da Nang" },
  lat: 16.0425441,
  lng: 108.2476914,
  mapsUrl: "https://maps.app.goo.gl/k84dGYRV6k9qwNqj9", // trang dia diem tren Google Maps (xem & viet danh gia)
  hours: { vi: "Mở cửa 24/7, tất cả các ngày trong tuần", en: "Open 24/7, every day of the week" },
};

export const mapEmbedUrl = (lang: Lang) =>
  `https://maps.google.com/maps?q=${STORE.lat},${STORE.lng}&z=16&hl=${lang}&output=embed`;
export const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${STORE.lat},${STORE.lng}`;

/** Anh cua hang: dat file vao frontend/public/images/. Anh nao chua co se tu an. */
export const STORE_PHOTOS = [
  { src: "/images/cua-hang-1.jpg", alt: { vi: "Mặt tiền cửa hàng T-Bike, 110 Trần Văn Dư", en: "T-Bike store front, 110 Tran Van Du" } },
  { src: "/images/cua-hang-2.jpg", alt: { vi: "Đội ngũ T-Bike cùng dàn xe tay ga", en: "The T-Bike team with our scooters" } },
  { src: "/images/cua-hang-3.jpg", alt: { vi: "Xe giao cho khách kèm túi quà T-Bike", en: "Bikes ready for guests with T-Bike gift bags" } },
  { src: "/images/cua-hang-4.jpg", alt: { vi: "Khách nhận xe tại Đà Nẵng", en: "Guests picking up their bike in Da Nang" } },
  { src: "/images/cua-hang-5.jpg", alt: { vi: "Khách du lịch cùng xe T-Bike", en: "Travellers with their T-Bike scooter" } },
  { src: "/images/cua-hang-6.jpg", alt: { vi: "Nhóm khách quốc tế thuê xe tại T-Bike", en: "International guests renting with T-Bike" } },
];

type T2 = { vi: string; en: string };
export interface Included { icon: "helmet" | "rain" | "truck" | "phone" | "wrench" | "calendar"; title: T2; desc: T2; xacNhan: boolean }

export const INCLUDED: Included[] = [
  { icon: "helmet", title: { vi: "Mũ bảo hiểm", en: "Helmets" }, desc: { vi: "Kèm theo xe khi thuê, sạch sẽ, nhiều cỡ", en: "Included with every rental, clean, several sizes" }, xacNhan: true },
  { icon: "rain", title: { vi: "Áo mưa", en: "Raincoat" }, desc: { vi: "Cung cấp theo yêu cầu khi nhận xe", en: "Available on request at pick-up" }, xacNhan: true },
  { icon: "truck", title: { vi: "Giao xe tận nơi", en: "Delivery to you" }, desc: { vi: "Miễn phí trong bán kính 5 km; xa hơn báo phí khi xác nhận", en: "Free within 5 km; fee quoted when confirming if further" }, xacNhan: false },
  { icon: "calendar", title: { vi: "Gia hạn linh hoạt", en: "Flexible extension" }, desc: { vi: "Báo cửa hàng để gia hạn khi đang thuê, tiền thuê tính theo ngày", en: "Contact us to extend during your rental, charged per day" }, xacNhan: false },
  { icon: "wrench", title: { vi: "Xe bảo dưỡng định kỳ", en: "Regularly serviced" }, desc: { vi: "Mỗi xe được bảo dưỡng sau mỗi 2.000 km", en: "Every bike is serviced every 2,000 km" }, xacNhan: false },
  { icon: "phone", title: { vi: "Hỗ trợ 24/7", en: "24/7 support" }, desc: { vi: "Hotline, Zalo, WhatsApp – đặt xe và hỏi đáp nhanh", en: "Hotline, Zalo, WhatsApp – quick bookings and answers" }, xacNhan: false },
];

export interface PolicySection { id: string; title: T2; items: T2[] }

export const POLICY_UPDATED = { vi: "Cập nhật: 11/2026", en: "Updated: Nov 2026" };

export const POLICY: PolicySection[] = [
  { id: "dat-xe", title: { vi: "1. Đặt xe và xác nhận", en: "1. Booking and confirmation" }, items: [
    { vi: "Khách gửi yêu cầu thuê trên website, không cần tài khoản. Gửi yêu cầu chưa phải là xác nhận thuê.", en: "Send a request on the website, no account needed. A request is not yet a confirmed booking." },
    { vi: "Cửa hàng kiểm tra lịch xe và gọi lại để xác nhận. Đơn giá được chốt tại thời điểm xác nhận và không thay đổi trong suốt đơn thuê.", en: "The store checks availability and calls you to confirm. The daily price is locked at confirmation and does not change during the rental." },
    { vi: "Khách tra cứu trạng thái bằng mã yêu cầu và số điện thoại đã dùng khi đặt.", en: "Track your request with the request code and the phone number you booked with." },
  ]},
  { id: "giay-to", title: { vi: "2. Giấy tờ và bảo đảm", en: "2. Documents and deposit" }, items: [
    { vi: "Người lái xe cần có giấy phép lái xe phù hợp theo quy định pháp luật Việt Nam.", en: "Riders must hold a driving licence valid under Vietnamese law." },
    { vi: "Bảo đảm thuê xe: để lại CCCD/hộ chiếu bản gốc tại cửa hàng hoặc đặt cọc tiền mặt 1.000.000đ; mức cọc khác theo thỏa thuận.", en: "Deposit: leave your original ID card/passport at the store or a cash deposit of 1,000,000 VND; other amounts by agreement." },
    { vi: "Bảo đảm được hoàn trả đầy đủ khi trả xe, không tự trừ vào tiền thuê. Website không thu tiền trực tuyến.", en: "The deposit is returned in full at return and is not deducted from the rental. The website does not take online payments." },
  ]},
  { id: "tinh-tien", title: { vi: "3. Thời gian thuê và cách tính tiền", en: "3. Rental period and pricing" }, items: [
    { vi: "Giá thuê tính theo ngày theo loại xe: xe số 120.000đ/ngày, xe tay ga 150.000đ/ngày.", en: "Daily price by bike type: semi-automatic 120,000 VND/day, scooter 150,000 VND/day." },
    { vi: "Mỗi 24 giờ tính là 1 ngày; thời gian thuê lẻ được làm tròn lên 1 ngày, tối thiểu 1 ngày.", en: "Every 24 hours counts as one day; partial days are rounded up, minimum one day." },
  ]},
  { id: "tra-tre", title: { vi: "4. Trả xe trễ", en: "4. Late return" }, items: [
    { vi: "Trễ dưới 1 giờ: không tính phí. Trễ từ 1 đến 8 giờ: ½ ngày đơn giá. Trễ trên 8 giờ: 1 ngày đơn giá.", en: "Under 1 hour late: free. 1 to 8 hours: half a day's price. Over 8 hours: one day's price." },
    { vi: "Trễ từ 24 giờ trở lên: mỗi ngày bắt đầu tính tròn 1 ngày đơn giá.", en: "24 hours or more: each started day is charged as a full day." },
  ]},
  { id: "doi-lich", title: { vi: "5. Đổi lịch, gia hạn và hủy", en: "5. Changes, extensions and cancellation" }, items: [
    { vi: "Đổi lịch hoặc hủy: vui lòng báo trước qua hotline/Zalo/WhatsApp. Lịch mới phụ thuộc xe còn trống.", en: "To change or cancel, please tell us in advance via hotline/Zalo/WhatsApp. New dates depend on availability." },
    { vi: "Gia hạn khi đang thuê: liên hệ cửa hàng trước giờ trả; thời gian gia hạn tính tiền theo ngày.", en: "To extend, contact us before your return time; the extra time is charged per day." },
  ]},
  { id: "giao-nhan", title: { vi: "6. Giao và nhận xe", en: "6. Pick-up and return" }, items: [
    { vi: "Nhận xe tại 110 Trần Văn Dư, Ngũ Hành Sơn, Đà Nẵng, hoặc giao tận nơi miễn phí trong bán kính 5 km; xa hơn cửa hàng báo phí khi gọi xác nhận.", en: "Pick up at 110 Tran Van Du, Ngu Hanh Son, Da Nang, or free delivery within 5 km; further distances are quoted when we call to confirm." },
    { vi: "Khi giao và nhận, nhân viên ghi số km (ODO) và tình trạng xe cùng khách.", en: "At pick-up and return, staff record the odometer (ODO) and the bike's condition together with you." },
  ]},
  { id: "su-co", title: { vi: "7. Sử dụng xe và sự cố", en: "7. Using the bike and incidents" }, items: [
    { vi: "Khi xe gặp sự cố, liên hệ ngay hotline 24/7 để được hướng dẫn; không tự ý sửa chữa.", en: "If something goes wrong, call our 24/7 hotline for help; please do not repair the bike yourself." },
    { vi: "Chi phí hư hỏng (nếu có) được trao đổi và thống nhất trực tiếp tại cửa hàng.", en: "Any damage costs are discussed and agreed in person at the store." },
  ]},
  { id: "bao-mat", title: { vi: "8. Bảo mật thông tin", en: "8. Privacy" }, items: [
    { vi: "Cửa hàng chỉ thu thập họ tên, số điện thoại và địa chỉ giao xe (nếu có) để xử lý đơn thuê.", en: "We only collect your name, phone number and delivery address (if any) to process your rental." },
    { vi: "Thông tin tra cứu cần đúng cả mã yêu cầu và số điện thoại; tên khách được che khi hiển thị công khai.", en: "Tracking requires both the request code and phone number; names are masked on public pages." },
  ]},
];

// ---------------------------------------------------------------- Mo ta mau xe (section danh muc xe tren trang chu)
// Khoa = ma_mau trong database. Dung tich dong co la thong so pho bien cua tung dong xe – doi chieu voi doi xe that.
export interface ModelInfo { brand: string; category: T2; desc: T2; engine: string }

export const MODEL_INFO: Record<string, ModelInfo> = {
  "HONDA-VISION": { brand: "Honda", engine: "110cc", category: { vi: "Tay ga · Đô thị", en: "Scooter · City" },
    desc: { vi: "Nhỏ gọn, nhẹ và tiết kiệm xăng – dễ điều khiển trong phố, hợp cả người mới đi tay ga.", en: "Compact, light and fuel-efficient – easy to ride around town, great for first-time scooter riders." } },
  "HONDA-AIR-BLADE": { brand: "Honda", engine: "125cc", category: { vi: "Tay ga · Thể thao", en: "Scooter · Sport" },
    desc: { vi: "Mạnh mẽ, thiết kế thể thao, cốp rộng – thoải mái cho các cung đường Sơn Trà, Hải Vân.", en: "Powerful and sporty with a roomy trunk – comfortable on the Son Tra and Hai Van roads." } },
  "HONDA-LEAD-125": { brand: "Honda", engine: "125cc", category: { vi: "Tay ga · Tiện dụng", en: "Scooter · Practical" },
    desc: { vi: "Cốp siêu rộng, sàn để chân phẳng – tiện chở đồ và đi cả ngày không mỏi.", en: "Huge trunk and flat floorboard – easy to carry bags and ride all day." } },
  "YAMAHA-JANUS": { brand: "Yamaha", engine: "125cc", category: { vi: "Tay ga · Thời trang", en: "Scooter · Style" },
    desc: { vi: "Thiết kế thanh lịch, nhẹ và êm – hợp dạo phố biển và những buổi chụp ảnh.", en: "Elegant, light and smooth – perfect for beach-side cruising and photo stops." } },
  "HONDA-WAVE-ALPHA": { brand: "Honda", engine: "110cc", category: { vi: "Xe số · Phổ thông", en: "Semi-auto · Classic" },
    desc: { vi: "Bền bỉ, tiết kiệm xăng, dễ lái – lựa chọn kinh tế để đi khắp Đà Nẵng.", en: "Durable, economical and easy to ride – the budget way to explore Da Nang." } },
  "YAMAHA-SIRIUS": { brand: "Yamaha", engine: "110cc", category: { vi: "Xe số · Linh hoạt", en: "Semi-auto · Agile" },
    desc: { vi: "Nhẹ, linh hoạt, tăng tốc tốt – đi phố hay đường dài đều ổn.", en: "Light, agile and punchy – fine in the city or on longer rides." } },
  "HONDA-WAVE-RSX": { brand: "Honda", engine: "110cc", category: { vi: "Xe số · Thể thao", en: "Semi-auto · Sport" },
    desc: { vi: "Kiểu dáng thể thao, vận hành êm – phù hợp các chuyến tour ngắn ngày.", en: "Sporty look and smooth ride – ideal for short tours." } },
};

export function modelInfo(maMau: string, tenMau: string, loai: "Manual" | "Automatic"): ModelInfo {
  return MODEL_INFO[maMau] ?? {
    brand: tenMau.split(" ")[0],
    engine: "—",
    category: loai === "Automatic" ? { vi: "Tay ga", en: "Scooter" } : { vi: "Xe số", en: "Semi-auto" },
    desc: { vi: "Xe được bảo dưỡng định kỳ, sẵn sàng cho hành trình của bạn.", en: "Regularly serviced and ready for your trip." },
  };
}
