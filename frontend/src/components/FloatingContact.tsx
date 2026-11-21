// Nut lien he noi (chi trang khach): 1 nut tron -> bam mo 4 kenh. Chi "rung nhe" 1 lan, ton trong giam chuyen dong.
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n";
import type { Key } from "../i18n/dict";
import { contactLinks, type ContactKind } from "../lib/contacts";
import { IconPhone, IconX } from "./Icons";
import { cx } from "./ui";

const STYLE: Record<ContactKind, { bg: string; label: Key }> = {
  zalo: { bg: "bg-[#0068FF]", label: "fab.zalo" },
  whatsapp: { bg: "bg-[#1FA855]", label: "fab.whatsapp" },
  facebook: { bg: "bg-[#1877F2]", label: "fab.facebook" },
  call: { bg: "bg-brand-gradient", label: "fab.call" },
};

function ChatIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export function FloatingContact({ aboveStickyBar }: { aboveStickyBar: boolean }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Gay chu y DUNG 1 LAN sau 4 giay, moi phien trinh duyet
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("tbike:fab-nudged") === "1"; } catch { /* bo qua */ }
    if (seen) return;
    const id = window.setTimeout(() => {
      setNudge(true);
      try { sessionStorage.setItem("tbike:fab-nudged", "1"); } catch { /* bo qua */ }
    }, 4000);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onClick); };
  }, [open]);

  const links = contactLinks(lang, t("fab.greeting"));
  return (
    <div ref={ref} className={cx("fixed right-4 z-40 flex flex-col items-end gap-3 sm:right-6", aboveStickyBar ? "bottom-[88px] sm:bottom-6" : "bottom-4 sm:bottom-6")}>
      {open && (
        <div id="fab-menu" role="menu" aria-label={t("fab.title")} className="w-[248px] rounded-2xl border border-line bg-white p-3 shadow-2xl">
          <p className="px-2 pb-1 text-sm font-semibold text-ink">{t("fab.title")}</p>
          <p className="px-2 pb-2 text-xs text-ink-muted">{t("fab.hours")}</p>
          <ul className="space-y-1">
            {links.map((c) => (
              <li key={c.kind}>
                <a role="menuitem" href={c.href} {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-ink hover:bg-subtle focus-visible:shadow-focus focus-visible:outline-none">
                  <span className={cx("flex h-9 w-9 items-center justify-center rounded-full text-white", STYLE[c.kind].bg)}>
                    {c.kind === "call" ? <IconPhone size={18} /> : <ChatIcon size={18} />}
                  </span>
                  <span className="font-semibold">{t(STYLE[c.kind].label)}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button type="button" onClick={() => { setOpen((o) => !o); setNudge(false); }} aria-expanded={open} aria-controls="fab-menu"
        aria-label={open ? t("fab.close") : t("fab.open")}
        className={cx("flex h-14 w-14 items-center justify-center fab-gradient rounded-full transition-transform hover:scale-105 focus-visible:shadow-focus focus-visible:outline-none",
          nudge && "motion-safe:animate-nudge")}
        onAnimationEnd={() => setNudge(false)}>
        {open ? <IconX size={24} /> : <ChatIcon size={26} />}
      </button>
    </div>
  );
}
