import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useScrollToHash } from "../../components/HashLink";
import { BlurBg } from "../../components/BlurBg";
import { FleetShowcase } from "../../components/FleetShowcase";
import { PricingSection, SectionHead, StoreSection } from "../../components/HomeSections";
import { PublicLayout } from "../../components/PublicLayout";
import { IconBike, IconKey, IconMapPin, IconRotate, IconSearch, IconSend, IconShield, IconTag } from "../../components/Icons";
import { Button, Field, inputClass } from "../../components/ui";
import { useI18n } from "../../i18n";
import type { Key } from "../../i18n/dict";
import { nowLocalInput } from "../../lib/format";

const BENEFITS: { icon: typeof IconTag; n: 1 | 2 | 3 | 4 }[] = [{ icon: IconTag, n: 1 }, { icon: IconBike, n: 2 }, { icon: IconShield, n: 3 }, { icon: IconMapPin, n: 4 }];
const STEPS: { icon: typeof IconTag; n: 1 | 2 | 3 | 4 }[] = [{ icon: IconSearch, n: 1 }, { icon: IconSend, n: 2 }, { icon: IconKey, n: 3 }, { icon: IconRotate, n: 4 }];
const PLACES = [
  { id: "mykhe", img: "/images/my-khe.jpg", url: "https://vnexpress.net/my-khe-vao-top-10-bai-bien-dep-nhat-chau-a-4576001.html", source: "VnExpress" },
  { id: "sontra", img: "/images/son-tra.jpg", url: "https://tuoitre.vn/nld/duoi-tan-cay-da-nghin-nam-o-son-tra-du-khach-nghe-rung-ke-chuyen-196260217105639617.htm", source: "Tuổi Trẻ" },
  { id: "haivan", img: "/images/hai-van.jpg", url: "https://tuoitre.vn/dulichtphcm/chinh-phuc-ae-nhat-hung-quan-voi-nhung-khuc-cua-tu-than-dep-me-hon-10710277.htm", source: "Tuổi Trẻ" },
] as const;

export function HomePage() {
  const navigate = useNavigate();
  const { t, money } = useI18n();
  useScrollToHash();
  const [tu, setTu] = useState(nowLocalInput(24 * 60).slice(0, 11) + "08:00");
  const [den, setDen] = useState(nowLocalInput(48 * 60).slice(0, 11) + "08:00");
  const [giao, setGiao] = useState("TaiCuaHang");
  const [error, setError] = useState("");

  function search(e: FormEvent) {
    e.preventDefault();
    if (!tu || !den || den <= tu) return setError(t("err.range"));
    navigate(`/thue-xe?${new URLSearchParams({ tu, den, giao })}`);
  }

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-ink">
        <img src="/images/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172Ad9] via-[#0F172A8c] to-[#0F172A4d] lg:bg-gradient-to-r lg:from-[#0F172Ad1] lg:via-[#0F172A59] lg:to-transparent" />
        <div className="relative mx-auto flex max-w-[1440px] flex-col gap-10 px-5 pb-8 pt-10 lg:min-h-[720px] lg:justify-between lg:px-[120px] lg:pb-12 lg:pt-28">
          <div className="max-w-[620px] space-y-5 text-white">
            <span className="inline-block rounded-full bg-white/15 px-3.5 py-1.5 text-eyebrow uppercase">{t("hero.chip")}</span>
            <h1 className="text-[36px] font-bold leading-[1.15] tracking-tight lg:text-hero">{t("hero.title")}</h1>
            <p className="text-base text-white/90 lg:text-lg">{t("hero.desc")}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/thue-xe" className="inline-flex h-12 items-center justify-center rounded-[10px] btn-gradient px-6 text-[15px] font-semibold text-white focus-visible:shadow-focus">{t("cta.rent")}</Link>
              <a href="#xe" className="inline-flex h-12 items-center justify-center rounded-[10px] border border-white/70 px-6 text-[15px] font-semibold text-white hover:bg-white/15">{t("hero.browse")}</a>
            </div>
          </div>
          <form onSubmit={search} className="grid gap-4 rounded-2xl bg-white p-4 shadow-2xl sm:p-6 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end" aria-label={t("search.aria")}>
            <Field label={t("search.pickup")} htmlFor="h-tu"><input id="h-tu" type="datetime-local" className={inputClass} value={tu} onChange={(e) => { setTu(e.target.value); setError(""); }} /></Field>
            <Field label={t("search.return")} htmlFor="h-den" error={error}><input id="h-den" type="datetime-local" className={inputClass} value={den} aria-invalid={!!error} onChange={(e) => { setDen(e.target.value); setError(""); }} /></Field>
            <Field label={t("search.option")} htmlFor="h-giao">
              <select id="h-giao" className={inputClass} value={giao} onChange={(e) => setGiao(e.target.value)}>
                <option value="TaiCuaHang">{t("search.optStore")}</option>
                <option value="GiaoTanNoi">{t("search.optDelivery")}</option>
              </select>
            </Field>
            <Button type="submit" size="lg">{t("search.submit")}</Button>
          </form>
        </div>
      </section>

      <div id="xe" className="scroll-mt-20">
        <FleetShowcase loai="Automatic" />
        <div className="bg-page"><FleetShowcase loai="Manual" /></div>
      </div>

      <PricingSection />

      <section>
        <div className="mx-auto max-w-[1440px] space-y-10 px-5 py-12 lg:px-[120px] lg:py-24">
          <SectionHead center eyebrow={t("why.eyebrow")} title={t("why.title")} />
          <div className="grid items-stretch gap-6 lg:grid-cols-2">
            <div className="relative min-h-[300px] overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              <img src="/images/store.jpg" alt={t("why.storeAlt")} className="absolute inset-0 h-full w-full object-cover object-center"
                onError={(e) => { const box = e.currentTarget.parentElement; if (box) box.style.display = "none"; }} />
            </div>
            <div className="grid auto-rows-fr gap-6 sm:grid-cols-2">
              {BENEFITS.map(({ icon: Icon, n }) => (
                <div key={n} className="card-pastel flex h-full flex-col p-7">
                  <span className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-brand-soft text-primary-500"><Icon size={24} /></span>
                  <h3 className="mt-4 text-xl font-semibold text-ink">{t(`why.${n}.t` as Key)}</h3>
                  <p className="mt-2 text-sm text-ink-muted">{t(`why.${n}.d` as Key, { manual: money(120000), auto: money(150000) })}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="quy-trinh" className="relative scroll-mt-20 overflow-hidden"><BlurBg src="/images/bg-bien-my-khe.jpg" /><div className="relative z-10 mx-auto max-w-[1440px] space-y-10 px-5 py-12 lg:px-[120px] lg:py-24">
        <SectionHead center eyebrow={t("steps.eyebrow")} title={t("steps.title")} />
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, n }) => (
            <li key={n} className="card-pastel p-7">
              <div className="flex items-center justify-between">
                <span className="btn-gradient flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">{n}</span>
                <Icon size={24} className="text-[#0EA5E9]" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-ink">{t(`steps.${n}.t` as Key)}</h3>
              <p className="mt-2 text-sm text-ink-muted">{t(`steps.${n}.d` as Key, { deposit: money(1000000) })}</p>
            </li>
          ))}
        </ol>
        <div className="text-center"><Link to="/thue-xe" className="btn-gradient inline-flex h-12 items-center rounded-[14px] px-7 text-[15px] font-semibold">{t("steps.cta")}</Link></div>
      </div></section>

      <section id="kham-pha" className="scroll-mt-20">
        <div className="mx-auto max-w-[1440px] space-y-10 px-5 py-12 lg:px-[120px] lg:py-24">
          <SectionHead center eyebrow={t("explore.eyebrow")} title={t("explore.title")} />
          <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0">
            {PLACES.map((p) => {
              const name = t(`place.${p.id}.n` as Key);
              return (
                <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" aria-label={t("explore.aria", { name, source: p.source })}
                  className="card-pastel group w-[290px] shrink-0 snap-start overflow-hidden focus-visible:shadow-focus lg:w-auto">
                  <div className="overflow-hidden">
                    <img src={p.img} alt={name} loading="lazy" className="h-[190px] w-full bg-line object-cover transition-transform duration-300 group-hover:scale-105 lg:h-64" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                  </div>
                  <div className="space-y-2 px-6 py-5">
                    <h3 className="text-xl font-semibold text-ink group-hover:text-primary">{name}</h3>
                    <p className="text-sm text-ink-muted">{t(`place.${p.id}.d` as Key)}</p>
                    <p className="pt-1 text-[13px] font-semibold text-primary">{t("explore.read", { source: p.source })}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <StoreSection />

      <section className="relative overflow-hidden">
        <BlurBg src="/images/bg-son-tra-hoang-hon.jpg" />
        <div className="relative z-10 mx-auto max-w-[1440px] px-5 py-12 lg:px-[120px] lg:py-24">
          <div className="cta-band flex flex-col gap-6 rounded-3xl px-6 py-10 shadow-lift lg:flex-row lg:items-center lg:px-16 lg:py-14">
            <div className="flex-1 space-y-3">
              <h2 className="text-[28px] font-bold text-white lg:text-h2">{t("cta.title")}</h2>
              <p className="text-base text-white/90 lg:text-lg">{t("cta.desc")}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/thue-xe" className="inline-flex h-12 items-center justify-center rounded-[14px] bg-white px-7 text-[15px] font-semibold text-[#047857] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#ECFDF5]">{t("cta.rent")}</Link>
              <a href="https://zalo.me/0816243243" target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center rounded-[14px] border-2 border-white/80 px-6 text-[15px] font-semibold text-white transition hover:bg-white/15">{t("cta.zalo")}</a>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
