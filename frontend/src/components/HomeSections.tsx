// Trang chu – Bang gia & dich vu kem theo; Cua hang (ban do, danh gia Google Maps, anh cua hang)
import { useEffect, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BlurBg } from "./BlurBg";
import { INCLUDED, STORE, STORE_PHOTOS, directionsUrl, mapEmbedUrl, type Included } from "../content/store";
import { useI18n } from "../i18n";
import type { Key } from "../i18n/dict";
import { STORE_PHONE_DISPLAY, STORE_PHONE_INTL, whatsappHref } from "../lib/contacts";
import type { LoaiXe } from "../lib/types";
import { publicApi } from "../services/publicApi";
import {
  IconCalendar, IconClock, IconCloudRain, IconExternal, IconHardHat, IconMapPin, IconPhone, IconStar, IconTruck, IconWrench,
} from "./Icons";
import { cx } from "./ui";

const INCLUDED_ICON: Record<Included["icon"], ComponentType<{ size?: number; className?: string }>> = {
  helmet: IconHardHat, rain: IconCloudRain, truck: IconTruck, phone: IconPhone, wrench: IconWrench, calendar: IconCalendar,
};

export function SectionHead({ eyebrow, title, sub, center }: { eyebrow: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-eyebrow font-bold uppercase"><span className="text-gradient">{eyebrow}</span></p>
      <h2 className="mt-3 text-[28px] font-bold leading-tight tracking-tight text-ink lg:text-h2">{title}</h2>
      {sub && <p className="mt-3 text-base text-ink-muted lg:text-lg">{sub}</p>}
    </div>
  );
}

export function PricingSection() {
  const { t, money, lang } = useI18n();
  const pricing = useQuery({ queryKey: ["public-pricing"], queryFn: publicApi.pricing });
  const models = useQuery({ queryKey: ["public-models-home"], queryFn: () => publicApi.models({}) });
  const rows: { loai: LoaiXe; price?: number; names: string }[] = (["Manual", "Automatic"] as const).map((loai) => ({
    loai,
    price: pricing.data?.find((p) => p.loai_xe === loai)?.don_gia_ngay_vnd,
    names: (models.data ?? []).filter((m) => m.loai_xe === loai).map((m) => m.ten_mau).join(", "),
  }));
  const fees: Key[] = ["price.fee1", "price.fee2", "price.fee3", "price.fee4"];
  return (
    <section id="bang-gia" className="relative scroll-mt-20 overflow-hidden">
      <BlurBg src="/images/bg-cau-tran-thi-ly.jpg" />
      <div className="relative z-10 mx-auto max-w-[1440px] space-y-10 px-5 py-12 lg:px-[120px] lg:py-24">
        <SectionHead center eyebrow={t("price.eyebrow")} title={t("price.title")} sub={t("price.sub")} />
        <div className="grid items-stretch gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-6">
            <div className="card-pastel overflow-hidden">
              <table className="w-full text-left">
                <thead><tr className="bg-subtle text-eyebrow uppercase text-ink-muted">
                  <th className="px-6 py-4">{t("price.colType")}</th><th className="hidden px-6 py-4 sm:table-cell">{t("price.colModels")}</th><th className="px-6 py-4 text-right">{t("price.colDay")}</th>
                </tr></thead>
                <tbody>{rows.map((r) => (
                  <tr key={r.loai} className="border-t border-line">
                    <td className="px-6 py-5"><p className="text-base font-semibold text-ink">{t(`type.short.${r.loai}` as Key)}</p><p className="text-xs text-ink-muted sm:hidden">{r.names}</p></td>
                    <td className="hidden px-6 py-5 text-sm text-ink-muted sm:table-cell">{r.names || "—"}</td>
                    <td className="px-6 py-5 text-right"><span className="text-2xl font-bold text-gradient">{r.price ? money(r.price) : "—"}</span></td>
                  </tr>))}</tbody>
              </table>
            </div>
            <div className="flex-1 card-pastel p-6">
              <p className="text-base font-semibold text-ink">{t("price.fees")}</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {fees.map((k) => <li key={k} className="flex items-start gap-2.5 text-sm text-ink"><IconClock size={16} className="mt-0.5 shrink-0 text-primary" />{t(k)}</li>)}
              </ul>
              <p className="mt-4 rounded-lg bg-primary-soft px-4 py-3 text-sm text-ink">{t("price.deposit", { deposit: money(1000000) })}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/thue-xe" className="btn-gradient inline-flex h-11 items-center rounded-[14px] px-5 text-sm font-semibold">{t("price.book")}</Link>
                <Link to="/chinh-sach" className="inline-flex h-11 items-center rounded-[10px] border border-line bg-white px-5 text-sm font-semibold text-primary hover:bg-primary-soft">{t("price.policy")}</Link>
              </div>
            </div>
          </div>
          <div className="card-pastel p-6">
            <p className="text-eyebrow font-bold uppercase"><span className="text-gradient">{t("price.included")}</span></p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {INCLUDED.map((it) => {
                const Icon = INCLUDED_ICON[it.icon];
                return (
                  <li key={it.title.vi} className="card-pastel flex gap-3 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-primary-500"><Icon size={20} /></span>
                    <span><span className="block text-sm font-semibold text-ink">{it.title[lang]}</span><span className="text-xs text-ink-muted">{it.desc[lang]}</span></span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Lightbox({ photos, index, onClose, onMove }: { photos: { src: string; alt: string }[]; index: number; onClose: () => void; onMove: (d: number) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") onMove(1); if (e.key === "ArrowLeft") onMove(-1); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose, onMove]);
  const p = photos[index];
  const nav = "absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white backdrop-blur transition hover:bg-white/30";
  return (
    <div role="dialog" aria-modal="true" aria-label={p.alt} className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/90 p-4" onClick={onClose}>
      <figure className="anim-zoom max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <img src={p.src} alt={p.alt} className="max-h-[82vh] w-auto rounded-2xl object-contain shadow-2xl" />
        <figcaption className="mt-3 text-center text-sm text-white/85">{p.alt} • {index + 1}/{photos.length}</figcaption>
      </figure>
      <button type="button" aria-label="Previous" onClick={(e) => { e.stopPropagation(); onMove(-1); }} className={`${nav} left-4`}>‹</button>
      <button type="button" aria-label="Next" onClick={(e) => { e.stopPropagation(); onMove(1); }} className={`${nav} right-4`}>›</button>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/30">×</button>
    </div>
  );
}

export function StoreSection() {
  const { t, lang } = useI18n();
  const [failed, setFailed] = useState<string[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const photos = STORE_PHOTOS.filter((p) => !failed.includes(p.src));
  const btn = "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-semibold focus-visible:shadow-focus focus-visible:outline-none";
  return (
    <section id="cua-hang" className="scroll-mt-20 bg-page">
      <div className="mx-auto max-w-[1440px] space-y-10 px-5 py-12 lg:px-[120px] lg:py-24">
        <SectionHead center eyebrow={t("store.eyebrow")} title={t("store.title")} />
        <div className="grid items-stretch gap-6 lg:grid-cols-[420px_1fr]">
          <div className="flex flex-col gap-6">
            <div className="card-pastel p-6">
              <p className="text-lg font-semibold text-ink">{STORE.name}</p>
              <dl className="mt-4 divide-y divide-line text-sm">
                {[
                  [IconMapPin, t("store.address"), STORE.address[lang]],
                  [IconClock, t("store.hours"), STORE.hours[lang]],
                  [IconPhone, t("store.contact"), `${STORE_PHONE_DISPLAY} • ${STORE_PHONE_INTL.replace("+84", "+84 ")}`],
                ].map(([Icon, label, value]) => {
                  const I = Icon as typeof IconMapPin;
                  return (
                    <div key={label as string} className="flex gap-3 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"><I size={18} /></span>
                      <div><dt className="text-eyebrow uppercase text-ink-muted">{label as string}</dt><dd className="mt-0.5 font-semibold text-ink">{value as string}</dd></div>
                    </div>
                  );
                })}
              </dl>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <a href={`tel:${STORE_PHONE_INTL}`} className={`${btn} btn-gradient text-white`}><IconPhone size={16} />{t("store.call")}</a>
                <a href="https://zalo.me/0816243243" target="_blank" rel="noopener noreferrer" className={`${btn} border border-line bg-white text-[#0068FF] hover:bg-subtle`}>Zalo</a>
                <a href={whatsappHref("0816243243")} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#1FA855] text-white hover:opacity-90`}>WhatsApp</a>
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className={`${btn} border border-line bg-white text-ink hover:bg-subtle`}><IconMapPin size={16} />{t("store.directions")}</a>
              </div>
            </div>
            <div className="flex-1 card-pastel p-6">
              <div className="flex items-center gap-2 text-[#F5A524]" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <IconStar key={i} size={18} className="fill-current" />)}</div>
              <p className="mt-3 text-base font-semibold text-ink">{t("store.reviews")}</p>
              <p className="mt-1 text-sm text-ink-muted">{t("store.reviewsD")}</p>
              <a href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer" className={`${btn} mt-4 w-full border border-line bg-white text-primary hover:bg-primary-soft`}>
                {t("store.reviewsCta")} <IconExternal size={15} />
              </a>
            </div>
          </div>
          <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-line bg-white shadow-card">
            <iframe title={t("store.mapTitle")} src={mapEmbedUrl(lang)} className="absolute inset-0 h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            <a href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer" className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[13px] font-semibold text-primary shadow-card">
              {t("store.openMaps")} <IconExternal size={14} />
            </a>
          </div>
        </div>
        {photos.length > 0 && (
          <div className="mx-auto max-w-[760px]">
            <p className="mb-4 text-base font-semibold text-ink">{t("store.photos")}</p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {photos.map((p, i) => (
                <button key={p.src} type="button" onClick={() => setOpen(i)} aria-label={p.alt[lang]}
                  className={cx("card-pastel group relative overflow-hidden !rounded-2xl", i === 0 ? "col-span-2 row-span-2 aspect-square lg:aspect-auto" : "aspect-square")}>
                  <img src={p.src} alt={p.alt[lang]} loading="lazy" onError={() => setFailed((f) => [...f, p.src])}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                  <span className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-[#0F172A]/75 to-transparent px-4 pb-3 pt-10 text-left text-[13px] font-medium text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {p.alt[lang]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        {open !== null && photos[open] && (
          <Lightbox photos={photos.map((p) => ({ src: p.src, alt: p.alt[lang] }))} index={open} onClose={() => setOpen(null)}
            onMove={(d) => setOpen((o) => (o === null ? o : (o + d + photos.length) % photos.length))} />
        )}
      </div>
    </section>
  );
}
