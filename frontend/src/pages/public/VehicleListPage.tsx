import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "../../components/PublicLayout";
import { VehiclePhoto } from "../../components/Domain";
import { IconSearch } from "../../components/Icons";
import { Alert, Badge, Button, cx, EmptyState, ErrorState, Field, inputClass, LoadingState } from "../../components/ui";
import { useI18n } from "../../i18n";
import type { Key } from "../../i18n/dict";
import { rentalDays, toApiDateTime } from "../../lib/format";
import type { LoaiXe } from "../../lib/types";
import { publicApi } from "../../services/publicApi";

/** C0 · Khach – Chon xe kha dung (theo MAU xe) */
export function VehicleListPage() {
  const { t, money, dt, err } = useI18n();
  const [params, setParams] = useSearchParams();
  const [tu, setTu] = useState(params.get("tu") ?? "");
  const [den, setDen] = useState(params.get("den") ?? "");
  const [rangeError, setRangeError] = useState("");
  const loai = (params.get("loai") ?? "") as LoaiXe | "";
  const appliedTu = params.get("tu") ?? "";
  const appliedDen = params.get("den") ?? "";

  const query = useQuery({
    queryKey: ["public-models", appliedTu, appliedDen, loai],
    queryFn: () => publicApi.models({
      tu: appliedTu ? toApiDateTime(appliedTu) : undefined,
      den: appliedDen ? toApiDateTime(appliedDen) : undefined,
      loai_xe: loai,
    }),
  });

  function apply(e: FormEvent) {
    e.preventDefault();
    if ((tu && !den) || (!tu && den)) return setRangeError(t("err.rangeIncomplete"));
    if (tu && den && den <= tu) return setRangeError(t("err.range"));
    setRangeError("");
    const next = new URLSearchParams(params);
    tu ? next.set("tu", tu) : next.delete("tu");
    den ? next.set("den", den) : next.delete("den");
    setParams(next);
  }
  function setLoai(v: LoaiXe | "") {
    const next = new URLSearchParams(params);
    v ? next.set("loai", v) : next.delete("loai");
    setParams(next);
  }

  // Khach chi thay MAU con xe trong; mau het xe gom vao 1 dong goi y doi thoi gian.
  const available = useMemo(() => query.data?.filter((m) => m.kha_dung) ?? [], [query.data]);
  const soldOut = useMemo(() => query.data?.filter((m) => !m.kha_dung) ?? [], [query.data]);
  const days = appliedTu && appliedDen ? rentalDays(toApiDateTime(appliedTu), toApiDateTime(appliedDen)) : null;
  const typeOptions: [LoaiXe | "", string][] = [["", t("fleet.all")], ["Manual", t("type.short.Manual")], ["Automatic", t("type.short.Automatic")]];

  return (
    <PublicLayout>
      <div className="mx-auto max-w-[1440px] space-y-6 px-5 py-8 lg:px-20 lg:py-10">
        <div>
          <p className="text-eyebrow uppercase text-ink-muted">{t("c0.eyebrow")}</p>
          <h1 className="mt-1.5 text-title text-ink">{t("c0.title")}</h1>
          <p className="mt-1.5 text-sm text-ink-muted">{t("c0.sub")}</p>
        </div>
        <form onSubmit={apply} className="rounded-panel border border-line bg-white p-6">
          <h2 className="mb-5 text-lg font-semibold text-ink">{t("c0.when")}</h2>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_336px_auto] lg:items-end">
            <Field label={t("search.pickup")} htmlFor="c0-tu"><input id="c0-tu" type="datetime-local" className={inputClass} value={tu} onChange={(e) => setTu(e.target.value)} /></Field>
            <Field label={t("search.return")} htmlFor="c0-den" error={rangeError}><input id="c0-den" type="datetime-local" className={inputClass} value={den} aria-invalid={!!rangeError} onChange={(e) => setDen(e.target.value)} /></Field>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-ink" id="c0-loai">{t("c0.type")}</span>
              <div role="radiogroup" aria-labelledby="c0-loai" className="flex rounded-lg border border-line bg-subtle p-1">
                {typeOptions.map(([v, l]) => (
                  <button key={l} type="button" role="radio" aria-checked={loai === v} onClick={() => setLoai(v)}
                    className={cx("h-9 flex-1 rounded-md text-[13px]", loai === v ? "bg-primary-soft font-semibold text-primary" : "text-ink-muted")}>{l}</button>
                ))}
              </div>
            </div>
            <Button type="submit" icon={<IconSearch size={16} />}>{t("c0.search")}</Button>
          </div>
        </form>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-lg font-semibold text-ink">{query.data ? t(appliedTu ? "c0.countAvail" : "c0.countAll", { n: available.length }) : t("c0.list")}</p>
          {appliedTu && appliedDen && <p className="text-[13px] text-ink-muted">{dt(toApiDateTime(appliedTu))} → {dt(toApiDateTime(appliedDen))} • {t("common.days", { n: days! })}</p>}
        </div>
        {query.isLoading && <LoadingState label={t("common.loadingBikes")} />}
        {query.isError && <ErrorState title={t("common.loadError")} retryLabel={t("common.retry")} message={err(query.error)} onRetry={() => query.refetch()} />}
        {query.data && available.length === 0 && (
          <EmptyState title={t(appliedTu ? "c0.emptyRange" : "c0.emptyAll")} description={t(appliedTu ? "c0.emptyRangeD" : "c0.emptyAllD")}
            action={loai ? <Button variant="secondary" onClick={() => setLoai("")}>{t("c0.clear")}</Button> : undefined} />
        )}
        {available.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((m) => {
              const link = `/thue-xe/${m.ma_mau}/dat?${new URLSearchParams({ ...(appliedTu && { tu: appliedTu }), ...(appliedDen && { den: appliedDen }), ...(params.get("giao") && { giao: params.get("giao")! }) })}`;
              return (
                <article key={m.ma_mau} className="card-pastel group overflow-hidden">
                  <div className="relative h-[220px] overflow-hidden bg-[radial-gradient(circle_at_50%_60%,#ECFDF5_0%,#F0F9FF_55%,#F8FAFC_100%)]">
                    <div className="absolute left-4 top-4 z-10 space-y-2"><p className="text-xs font-medium text-ink-muted">{t(`type.short.${m.loai_xe}` as Key)}</p>
                      {appliedTu ? <Badge tone={m.so_xe_trong <= 1 ? "warning" : "success"}>{m.so_xe_trong <= 1 ? t("c0.lastOne") : t("c0.left", { n: m.so_xe_trong })}</Badge> : <Badge tone="success">{t("fleet.renting")}</Badge>}
                    </div>
                    <div className="absolute inset-x-6 bottom-2 top-10 scale-[1.3] transition-transform duration-500 ease-out group-hover:scale-[1.45]">
                      <VehiclePhoto tenXe={m.ten_mau} className="h-full w-full drop-shadow-[0_14px_18px_rgba(15,23,42,0.16)]" />
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    <h3 className="text-lg font-semibold text-ink">{m.ten_mau}</h3>
                    <p className="text-[13px] text-ink-muted">{t(`type.${m.loai_xe}` as Key)}</p>
                    <p><span className="text-2xl font-bold text-gradient">{money(m.don_gia_ngay_vnd)}</span> <span className="text-[13px] text-ink-muted">{t("common.perDay")}</span></p>
                    <hr className="border-line" />
                    <p className={cx("text-xs", appliedTu ? "text-success" : "text-ink-muted")}>{t(appliedTu ? "c0.ready" : "c0.pickDates")}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ink-muted">{days ? t("c0.rentDays", { n: days }) : ""}</span>
                      <Link to={link} className="inline-flex h-11 items-center rounded-lg btn-gradient px-5 text-sm font-semibold text-white">{t("c0.book")}</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {appliedTu && soldOut.length > 0 && (
          <Alert tone="info" title={t("c0.soldOut", { n: soldOut.length })}>{t("c0.soldOutD", { names: soldOut.map((m) => m.ten_mau).join(", ") })}</Alert>
        )}
        <Alert tone="info" title={t("c0.note")}>{t("c0.noteD")}</Alert>
      </div>
    </PublicLayout>
  );
}
