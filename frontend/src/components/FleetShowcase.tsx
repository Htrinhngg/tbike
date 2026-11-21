// Danh muc xe dang "the mo rong": 1 xe lon (chi tiet) + cac xe thu gon. Bam xe thu gon -> the gian ra muot,
// anh phong to, chu hien tu tren xuong (so le). Ton trong che do giam chuyen dong (index.css).
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { modelInfo } from "../content/store";
import { useI18n } from "../i18n";
import type { Key } from "../i18n/dict";
import type { LoaiXe, PublicVehicleModel } from "../lib/types";
import { publicApi } from "../services/publicApi";
import { VehiclePhoto } from "./Domain";
import { IconArrowRight, IconPhone } from "./Icons";
import { ErrorState, LoadingState, cx } from "./ui";

const delay = (i: number): CSSProperties => ({ animationDelay: `${i * 70}ms` });
const shortName = (ten: string) => ten.split(" ").slice(1).join(" ").toUpperCase() || ten.toUpperCase();

function ChatIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function Expanded({ m }: { m: PublicVehicleModel }) {
  const { t, money, lang } = useI18n();
  const info = modelInfo(m.ma_mau, m.ten_mau, m.loai_xe);
  const tiles: [string, string][] = [
    [info.engine, t("show.engine")],
    [t("show.licenseVal"), t("show.license")],
    [`${m.so_xe_trong}/${m.tong_so_xe}`, t("show.ready")],
    [t("show.deliveryVal"), t("show.delivery")],
  ];
  return (
    <div key={m.ma_mau} className="relative grid h-full gap-5 overflow-hidden p-6 sm:p-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:p-9">
      <span aria-hidden="true" className="watermark-text absolute -bottom-2 right-5 z-0 text-[72px] sm:text-[100px] lg:text-[120px]">
        {shortName(m.ten_mau)}
      </span>
      <div className="relative z-20 order-2 space-y-3.5 lg:order-1">
        <span className="inline-flex anim-reveal rounded-full border border-primary-500/40 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary" style={delay(0)}>
          {info.category[lang]}
        </span>
        <h3 className="anim-reveal text-[26px] font-extrabold uppercase leading-[1.1] tracking-tight text-ink sm:text-[32px]" style={delay(1)}>
          {m.ten_mau}
        </h3>
        <p className="line-clamp-2 max-w-md anim-reveal text-[14px] leading-relaxed text-ink-soft" style={delay(2)}>{info.desc[lang]}</p>
        <div className="grid max-w-md anim-reveal grid-cols-2 gap-2.5" style={delay(3)}>
          {tiles.map(([v, l]) => (
            <div key={l} className="rounded-xl border border-primary-500/25 bg-brand-soft px-3 py-2">
              <p className="text-[15px] font-bold text-primary">{v}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">{l}</p>
            </div>
          ))}
        </div>
        <div className="anim-reveal" style={delay(4)}>
          <p><span className="text-gradient text-[32px] font-extrabold leading-none">{money(m.don_gia_ngay_vnd)}</span> <span className="text-sm text-ink-muted">{t("common.perDay")}</span></p>
          <p className="mt-1 text-xs text-ink-muted">{t("show.dayNote")}</p>
        </div>
        <div className="flex anim-reveal items-center gap-3 pt-1" style={delay(5)}>
          <a href="https://zalo.me/0816243243" target="_blank" rel="noopener noreferrer" aria-label={t("show.chat")} title={t("show.chat")}
            className="flex h-12 w-12 items-center justify-center rounded-[14px] border-2 border-primary-500/50 text-primary transition hover:border-primary-500 hover:bg-brand-soft">
            <ChatIcon />
          </a>
          {m.kha_dung ? (
            <Link to={`/thue-xe/${m.ma_mau}/dat`} className="btn-gradient inline-flex h-12 items-center gap-2 rounded-[14px] px-6 text-[15px] font-bold uppercase tracking-wide">
              <IconPhone size={18} />{t("show.book")}
            </Link>
          ) : (
            <span className="inline-flex h-12 items-center rounded-[14px] bg-line px-6 text-sm font-semibold text-ink-muted">{t("show.soldOut")}</span>
          )}
        </div>
      </div>
      <div className="relative z-10 order-1 flex h-[240px] items-center justify-center sm:h-[300px] lg:order-2 lg:h-full">
        <div aria-hidden="true" className="absolute inset-x-4 bottom-10 top-10 rounded-full bg-[radial-gradient(circle,rgba(110,231,183,.35)_0%,rgba(125,211,252,.25)_45%,transparent_70%)] blur-xl" />
        <div className="relative h-full w-full scale-[1.2] lg:origin-left lg:scale-[1.3]">
          <VehiclePhoto tenXe={m.ten_mau} className="anim-zoom h-full w-full drop-shadow-[0_18px_24px_rgba(15,23,42,0.18)]" />
        </div>
      </div>
    </div>
  );
}

function Collapsed({ m, onSelect, compact }: { m: PublicVehicleModel; onSelect: () => void; compact?: boolean }) {
  const { t, money, lang } = useI18n();
  const info = modelInfo(m.ma_mau, m.ten_mau, m.loai_xe);
  return (
    <button type="button" onClick={onSelect} aria-label={t("show.select", { name: m.ten_mau })}
      className={cx("group flex h-full w-full flex-col overflow-hidden text-left", compact && "w-[200px] shrink-0 snap-start")}>
      <div className={cx("relative flex flex-1 items-center justify-center overflow-hidden bg-white", compact ? "h-[140px]" : "min-h-0")}>
        <div className="h-full w-full scale-[1.45] transition-transform duration-500 ease-out group-hover:scale-[1.7]">
          <VehiclePhoto tenXe={m.ten_mau} className="h-full w-full" />
        </div>
      </div>
      <div className="space-y-1 bg-brand-soft px-4 py-4">
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-primary">{info.category[lang]}</p>
        <p className="truncate text-[11px] uppercase text-ink-muted">{info.brand}</p>
        <p className="truncate text-[15px] font-bold uppercase text-ink">{m.ten_mau.replace(`${info.brand} `, "")}</p>
        <span aria-hidden="true" className="!my-2.5 block h-[3px] w-6 rounded-full bg-brand-gradient transition-all duration-300 group-hover:w-12" />
        <p className="truncate"><span className="text-gradient text-xl font-extrabold">{money(m.don_gia_ngay_vnd)}</span> <span className="text-[11px] text-ink-muted">{t("common.perDay")}</span></p>
      </div>
    </button>
  );
}

export function FleetShowcase({ loai, id }: { loai: LoaiXe; id?: string }) {
  const { t } = useI18n();
  const key = loai === "Automatic" ? "auto" : "manual";
  const q = useQuery({ queryKey: ["public-models-home"], queryFn: () => publicApi.models({}) });
  const models = useMemo(() => (q.data ?? []).filter((m) => m.loai_xe === loai)
    .sort((a, b) => Number(b.kha_dung) - Number(a.kha_dung) || b.don_gia_ngay_vnd - a.don_gia_ngay_vnd || a.ten_mau.localeCompare(b.ten_mau)), [q.data, loai]);
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => { if (!active && models.length) setActive(models[0].ma_mau); }, [models, active]);
  const current = models.find((m) => m.ma_mau === active) ?? models[0];

  return (
    <section id={id} className="scroll-mt-20 mx-auto max-w-[1440px] space-y-8 px-5 py-12 lg:px-[120px] lg:py-20">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
        <p className="order-2 max-w-xl text-[15px] leading-relaxed text-ink-soft lg:order-1">{t(`show.${key}.desc` as Key)}</p>
        <div className="order-1 lg:order-2 lg:text-right">
          <p className="inline-flex items-center gap-2 text-eyebrow font-bold uppercase tracking-[0.2em] text-ink-muted">
            {t(`show.${key}.eyebrow` as Key)} <span className="h-2 w-2 rounded-full bg-brand-gradient" aria-hidden="true" />
          </p>
          <h2 className="mt-2 text-[32px] font-extrabold uppercase tracking-tight text-ink lg:text-[44px]">{t(`show.${key}.title` as Key)}</h2>
        </div>
      </div>

      {q.isLoading && <LoadingState label={t("common.loadingBikes")} />}
      {q.isError && <ErrorState title={t("common.loadError")} retryLabel={t("common.retry")} message="" onRetry={() => q.refetch()} />}

      {current && (
        <>
          {/* Desktop: the gian ra / thu lai */}
          <div className="hidden h-[600px] gap-4 lg:flex">
            {models.map((m) => {
              const isActive = m.ma_mau === current.ma_mau;
              return (
                <div key={m.ma_mau}
                  className={cx("card-pastel min-w-0 overflow-hidden !rounded-[24px] transition-[flex-grow,transform,box-shadow] duration-700 ease-[cubic-bezier(.22,1,.36,1)]",
                    isActive && "card-pastel-active")}
                  style={{ flexGrow: isActive ? (models.length > 3 ? 4.6 : 4) : 1, flexBasis: 0 }}>
                  {isActive ? <Expanded m={m} /> : <Collapsed m={m} onSelect={() => setActive(m.ma_mau)} />}
                </div>
              );
            })}
          </div>

          {/* Mobile / tablet: the lon + dai xe thu gon vuot ngang */}
          <div className="space-y-4 lg:hidden">
            <div className="card-pastel card-pastel-active overflow-hidden !rounded-[24px]"><Expanded m={current} /></div>
            {models.length > 1 && (
              <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
                {models.filter((m) => m.ma_mau !== current.ma_mau).map((m) => (
                  <div key={m.ma_mau} className="card-pastel shrink-0 overflow-hidden"><Collapsed compact m={m} onSelect={() => setActive(m.ma_mau)} /></div>
                ))}
              </div>
            )}
          </div>
          <div className="text-right">
            <Link to={`/thue-xe?loai=${loai}`} className="nav-link inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              {t("show.checkDates")} <IconArrowRight size={16} />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
