import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { LanguageSwitch, useI18n } from "../i18n";
import type { Key } from "../i18n/dict";
import { FloatingContact } from "./FloatingContact";
import { HashLink } from "./HashLink";
import { whatsappHref } from "../lib/contacts";
import { IconMenu, IconX } from "./Icons";
import { Logo } from "./StaffLayout";
import { cx } from "./ui";

const FB = "https://www.facebook.com/profile.php?id=100063470564198&locale=vi_VN";
const LINKS: { to: string; key: Key }[] = [
  { to: "/", key: "nav.home" },
  { to: "/thue-xe", key: "nav.vehicles" },
  { to: "/#bang-gia", key: "nav.pricing" },
  { to: "/#quy-trinh", key: "nav.process" },
  { to: "/#kham-pha", key: "nav.explore" },
  { to: "/#lien-he", key: "nav.contact" },
  { to: "/tra-cuu", key: "nav.lookup" },
];

export function PublicLayout({ children, stickyCta = true }: { children: ReactNode; stickyCta?: boolean }) {
  const [open, setOpen] = useState(false);
  const { t, money } = useI18n();
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-5 py-3 lg:px-[120px]">
          <Link to="/" aria-label={t("nav.homeAria")} className="shrink-0"><Logo className="h-14 sm:h-16" /></Link>
          <nav aria-label={t("nav.main")} className="hidden items-center gap-6 xl:flex">
            {LINKS.map((l) => l.to.includes("#") ? (
              <HashLink key={l.to} to={l.to} className="nav-link text-[15px] font-medium text-ink-soft hover:text-ink">{t(l.key)}</HashLink>
            ) : (
              <NavLink key={l.to} to={l.to} end className={({ isActive }) => cx("nav-link text-[15px]", isActive ? "font-semibold text-ink" : "font-medium text-ink-soft hover:text-ink")}>{t(l.key)}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <Link to="/thue-xe" className="btn-gradient hidden h-11 items-center rounded-[14px] px-6 text-[15px] font-semibold focus-visible:shadow-focus sm:inline-flex">{t("cta.rent")}</Link>
            <button className="rounded p-2 xl:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={t("nav.openMenu")}>{open ? <IconX size={26} /> : <IconMenu size={26} />}</button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-line px-5 py-3 xl:hidden" aria-label={t("nav.mobile")}>
            {LINKS.map((l) => l.to.includes("#")
              ? <HashLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="block py-2.5 text-[15px] text-ink">{t(l.key)}</HashLink>
              : <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block py-2.5 text-[15px] text-ink">{t(l.key)}</Link>)}
          </nav>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer id="lien-he" className="footer-ombre scroll-mt-20">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-[120px] lg:py-16">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-white/80">{t("footer.desc")}</p>
          </div>
          <div className="space-y-3 text-[13px] text-white/75">
            <p className="text-sm font-semibold text-white">{t("footer.contact")}</p>
            <p>{t("footer.address")}</p>
            <p>Zalo: <a className="underline" href="https://zalo.me/0816243243" target="_blank" rel="noopener noreferrer">081 624 3243</a></p>
            <p>{t("footer.whatsapp")}: <a className="underline" href={whatsappHref("0816243243")} target="_blank" rel="noopener noreferrer">+84 81 624 3243</a></p>
            <p><a className="underline" href="mailto:tbikedn@gmail.com">tbikedn@gmail.com</a></p>
            <p><a className="underline" href={FB} target="_blank" rel="noopener noreferrer">Facebook: T-Bike Đà Nẵng</a></p>
          </div>
          <div className="space-y-3 text-[13px] text-white/75">
            <p className="text-sm font-semibold text-white">{t("footer.links")}</p>
            <p><Link to="/thue-xe">{t("nav.vehicles")}</Link></p>
            <p><HashLink to="/#bang-gia">{t("nav.pricing")}</HashLink></p>
            <p><HashLink to="/#cua-hang">{t("nav.store")}</HashLink></p>
            <p><Link to="/chinh-sach" className="font-semibold text-white underline">{t("nav.policy")}</Link></p>
            <p><HashLink to="/#quy-trinh">{t("nav.process")}</HashLink></p>
            <p><HashLink to="/#kham-pha">{t("nav.explore")}</HashLink></p>
            <p><Link to="/tra-cuu">{t("nav.lookup")}</Link></p>
          </div>
          <div className="space-y-3 text-[13px] text-white/75">
            <p className="text-sm font-semibold text-white">{t("footer.hours")}</p>
            <p>{t("footer.hoursPre")} <a className="underline" href={FB} target="_blank" rel="noopener noreferrer">T-Bike DaNang</a>{" "}
              {t("footer.hoursPost").split("24/7").map((part, i, arr) => <span key={i}>{part}{i < arr.length - 1 && <b className="text-white">24/7</b>}</span>)}</p>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1440px] justify-between border-t border-white/15 px-5 py-6 text-xs text-white/60 lg:px-[120px]">
          <span>{t("footer.copyright")}</span>
          <LanguageSwitch className="border-white/20 [&_button]:text-white/70" />
        </div>
      </footer>
      <FloatingContact aboveStickyBar={stickyCta} />
      {stickyCta && (
        <div className="sticky bottom-0 z-20 flex items-center gap-3 border-t border-line bg-white px-5 py-3 sm:hidden">
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">{t("sticky.from", { price: money(120000) })}</p>
            <p className="text-xs text-ink-muted">{t("sticky.delivery")}</p>
          </div>
          <Link to="/thue-xe" className="inline-flex h-11 items-center rounded-[10px] btn-gradient px-5 text-[15px] font-semibold text-white">{t("cta.rent")}</Link>
        </div>
      )}
    </div>
  );
}
