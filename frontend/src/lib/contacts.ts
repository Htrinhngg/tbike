// Kenh lien he chinh thuc cua cua hang (dung chung cho nut noi, footer, trang tra cuu).
export const STORE_PHONE_LOCAL = "0816243243";
export const STORE_PHONE_DISPLAY = "081 624 3243";
export const STORE_PHONE_INTL = "+84816243243";
export const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=100063470564198&locale=vi_VN";

export type ContactKind = "zalo" | "whatsapp" | "facebook" | "call";

export interface ContactLink { kind: ContactKind; href: string; external: boolean }

/** wa.me yeu cau so quoc te khong dau "+" va khong so 0 dau: 0816243243 -> 84816243243 */
export function whatsappHref(localPhone: string, text?: string): string {
  const digits = localPhone.replace(/\D/g, "").replace(/^0/, "84");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Thu tu theo ngon ngu: khach Viet quen Zalo, khach nuoc ngoai quen WhatsApp. */
export function contactLinks(lang: "vi" | "en", greeting?: string): ContactLink[] {
  const zalo: ContactLink = { kind: "zalo", href: `https://zalo.me/${STORE_PHONE_LOCAL}`, external: true };
  const wa: ContactLink = { kind: "whatsapp", href: whatsappHref(STORE_PHONE_LOCAL, greeting), external: true };
  const fb: ContactLink = { kind: "facebook", href: FACEBOOK_URL, external: true };
  const call: ContactLink = { kind: "call", href: `tel:${STORE_PHONE_INTL}`, external: false };
  return lang === "vi" ? [zalo, fb, wa, call] : [wa, zalo, fb, call];
}
