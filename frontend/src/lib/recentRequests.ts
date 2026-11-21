// Ghi nho cac yeu cau khach da gui TREN CHINH THIET BI NAY (localStorage cua trinh duyet).
// Khong gui len may chu. Doi may / xoa du lieu trinh duyet thi mat -> van con duong lui: nhan Zalo cua hang.
export interface RecentRequest {
  ma_yeu_cau: string;
  so_dien_thoai: string;
  ten_mau: string;
  thoi_gian_nhan_du_kien: string;
  thoi_gian_tra_du_kien: string;
  saved_at: string;
}

const KEY = "tbike:yeu-cau-gan-day";
const MAX = 10;

function store(s?: Storage): Storage | null {
  try {
    return s ?? (typeof window !== "undefined" ? window.localStorage : null);
  } catch {
    return null; // trinh duyet chan localStorage (che do rieng tu)
  }
}

export function loadRecent(s?: Storage): RecentRequest[] {
  const st = store(s);
  if (!st) return [];
  try {
    const data = JSON.parse(st.getItem(KEY) ?? "[]");
    return Array.isArray(data) ? data.filter((x) => x && typeof x.ma_yeu_cau === "string" && typeof x.so_dien_thoai === "string") : [];
  } catch {
    return [];
  }
}

export function saveRecent(item: Omit<RecentRequest, "saved_at">, s?: Storage, now = new Date()): RecentRequest[] {
  const st = store(s);
  const next = [{ ...item, saved_at: now.toISOString() }, ...loadRecent(st ?? undefined).filter((x) => x.ma_yeu_cau !== item.ma_yeu_cau)].slice(0, MAX);
  try {
    st?.setItem(KEY, JSON.stringify(next));
  } catch {
    /* het dung luong / bi chan: bo qua, khong anh huong luong chinh */
  }
  return next;
}

export function removeRecent(ma: string, s?: Storage): RecentRequest[] {
  const st = store(s);
  const next = loadRecent(st ?? undefined).filter((x) => x.ma_yeu_cau !== ma);
  try {
    st?.setItem(KEY, JSON.stringify(next));
  } catch {
    /* bo qua */
  }
  return next;
}

/** Noi dung tin nhan de khach luu / gui cho cua hang */
export function shareText(r: Pick<RecentRequest, "ma_yeu_cau" | "so_dien_thoai" | "ten_mau">, lookupUrl: string, lang: "vi" | "en" = "vi"): string {
  if (lang === "en") return `T-Bike Da Nang - Rental request code: ${r.ma_yeu_cau}\nBike: ${r.ten_mau}\nPhone: ${r.so_dien_thoai}\nTrack: ${lookupUrl}`;
  return `T-Bike Đà Nẵng - Mã yêu cầu thuê xe: ${r.ma_yeu_cau}\nXe: ${r.ten_mau}\nSĐT đặt xe: ${r.so_dien_thoai}\nTra cứu: ${lookupUrl}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* thu cach du phong */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

export const STORE_ZALO = "https://zalo.me/0816243243";
export const STORE_PHONE_DISPLAY = "081 624 3243";
