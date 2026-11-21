// Da ngon ngu cho giao dien KHACH (VI/EN). Phia nhan vien giu tieng Viet.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError } from "../lib/api";
import { formatDateTime, formatShortDateTime } from "../lib/format";
import { en, vi, type Key } from "./dict";

export type Lang = "vi" | "en";
const STORAGE_KEY = "tbike:lang";
const TZ = "Asia/Ho_Chi_Minh";
const DICTS: Record<Lang, Record<Key, string>> = { vi, en };

export function detectLang(stored: string | null, browserLangs: readonly string[]): Lang {
  if (stored === "vi" || stored === "en") return stored;
  const first = (browserLangs[0] ?? "vi").toLowerCase();
  return first.startsWith("vi") ? "vi" : "en";
}

export function translate(lang: Lang, key: Key, vars?: Record<string, string | number>): string {
  let s = DICTS[lang][key] ?? vi[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

export function money(lang: Lang, n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return lang === "vi" ? `${Math.round(n).toLocaleString("vi-VN").replace(/,/g, ".")}đ` : `${Math.round(n).toLocaleString("en-US")} VND`;
}

export function dateTime(lang: Lang, iso: string | null | undefined, short = false): string {
  if (!iso) return "—";
  if (lang === "vi") return short ? formatShortDateTime(iso) : formatDateTime(iso);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, day: "2-digit", month: "short", ...(short ? {} : { year: "numeric" }), hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(iso));
}

/** Thong bao loi theo ma loi backend; khong co ban dich thi dung thong diep goc. */
export function errorText(lang: Lang, err: unknown): string {
  if (err instanceof ApiError) {
    const key = `e.${err.code}` as Key;
    if (key in vi) return translate(lang, key);
    return lang === "vi" ? err.message : translate(lang, "e.generic");
  }
  return translate(lang, "e.generic");
}

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key, vars?: Record<string, string | number>) => string;
  money: (n: number | null | undefined) => string;
  dt: (iso: string | null | undefined, short?: boolean) => string;
  err: (e: unknown) => string;
}

const Ctx = createContext<I18n | null>(null);

function readStored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectLang(readStored(), typeof navigator !== "undefined" ? navigator.languages ?? [navigator.language] : []));
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* trinh duyet chan luu tru: van doi ngon ngu trong phien */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const value = useMemo<I18n>(() => ({
    lang, setLang,
    t: (k, v) => translate(lang, k, v),
    money: (n) => money(lang, n),
    dt: (iso, short) => dateTime(lang, iso, short),
    err: (e) => errorText(lang, e),
  }), [lang, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside LanguageProvider");
  return v;
}

/** Trang nhan vien: luon tieng Viet, tra lai thuoc tinh lang cua trang. */
export function useForceVietnamese() {
  useEffect(() => {
    const prev = document.documentElement.lang;
    document.documentElement.lang = "vi";
    return () => {
      document.documentElement.lang = prev;
    };
  }, []);
}

export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div role="group" aria-label={t("lang.label")} className={`inline-flex items-center rounded-lg border border-line p-0.5 text-sm ${className ?? ""}`}>
      {(["vi", "en"] as const).map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} lang={l} onClick={() => setLang(l)}
          className={`rounded-md px-2.5 py-1 focus-visible:shadow-focus focus-visible:outline-none ${lang === l ? "bg-primary-soft font-semibold text-primary" : "text-ink-muted hover:text-ink"}`}>
          {l === "vi" ? "VI" : "EN"}
        </button>
      ))}
    </div>
  );
}
