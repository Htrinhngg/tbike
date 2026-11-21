import { useMemo, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PublicLayout } from "../../components/PublicLayout";
import { VehiclePhoto } from "../../components/Domain";
import { IconCheckCircle, IconSend } from "../../components/Icons";
import { Alert, Badge, Button, cx, DetailRow, ErrorState, Field, inputClass, LoadingState, Panel } from "../../components/ui";
import { useI18n } from "../../i18n";
import type { Key } from "../../i18n/dict";
import { ApiError } from "../../lib/api";
import { rentalDays, toApiDateTime } from "../../lib/format";
import { copyText, saveRecent, shareText, STORE_PHONE_DISPLAY, STORE_ZALO } from "../../lib/recentRequests";
import type { HinhThucNhanXe, RentalRequestCreated } from "../../lib/types";
import { publicApi } from "../../services/publicApi";

/** C1 · Khach – Gui yeu cau thue (theo MAU xe) */
export function RequestFormPage() {
  const { t, money, err, lang } = useI18n();
  const { maMau = "" } = useParams();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    ho_ten_khach: "", so_dien_thoai: "", tu: params.get("tu") ?? "", den: params.get("den") ?? "",
    ghi_chu_yeu_cau: "", hinh_thuc_nhan_xe: (params.get("giao") === "GiaoTanNoi" ? "GiaoTanNoi" : "TaiCuaHang") as HinhThucNhanXe,
    dia_chi_giao_xe: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<RentalRequestCreated | null>(null);
  const [copied, setCopied] = useState<"" | "code" | "msg">("");

  const vehicles = useQuery({ queryKey: ["public-models", "all"], queryFn: () => publicApi.models({}) });
  const vehicle = vehicles.data?.find((m) => m.ma_mau === maMau);
  const days = form.tu && form.den && form.den > form.tu ? rentalDays(toApiDateTime(form.tu), toApiDateTime(form.den)) : null;
  const estimate = useMemo(() => (vehicle && days ? vehicle.don_gia_ngay_vnd * days : null), [vehicle, days]);

  const submit = useMutation({
    mutationFn: () => publicApi.createRequest({
      ma_mau: maMau, ho_ten_khach: form.ho_ten_khach, so_dien_thoai: form.so_dien_thoai,
      thoi_gian_nhan_du_kien: toApiDateTime(form.tu), thoi_gian_tra_du_kien: toApiDateTime(form.den),
      ghi_chu_yeu_cau: form.ghi_chu_yeu_cau || null, hinh_thuc_nhan_xe: form.hinh_thuc_nhan_xe,
      dia_chi_giao_xe: form.hinh_thuc_nhan_xe === "GiaoTanNoi" ? form.dia_chi_giao_xe : null,
    }),
    onSuccess: (res) => {
      setCreated(res);
      saveRecent({
        ma_yeu_cau: res.ma_yeu_cau, so_dien_thoai: form.so_dien_thoai.replace(/[\s.-]/g, ""), ten_mau: vehicle?.ten_mau ?? "",
        thoi_gian_nhan_du_kien: toApiDateTime(form.tu), thoi_gian_tra_du_kien: toApiDateTime(form.den),
      });
    },
  });

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (form.ho_ten_khach.trim().length < 2) e.ho_ten_khach = t("v.name");
    if (!/^0\d{9,10}$/.test(form.so_dien_thoai.replace(/[\s.-]/g, ""))) e.so_dien_thoai = t("v.phone");
    if (!form.tu) e.tu = t("v.pickup");
    if (!form.den) e.den = t("v.return");
    else if (form.tu && form.den <= form.tu) e.den = t("err.range");
    if (form.hinh_thuc_nhan_xe === "GiaoTanNoi" && !form.dia_chi_giao_xe.trim()) e.dia_chi_giao_xe = t("v.address");
    return e;
  }
  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) submit.mutate();
  }
  const set = (k: keyof typeof form) => (ev: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: ev.target.value }));
  const apiErr = submit.error instanceof ApiError ? submit.error : null;

  if (created) {
    const lookupUrl = `${window.location.origin}/tra-cuu?ma=${created.ma_yeu_cau}`;
    const msg = shareText({ ma_yeu_cau: created.ma_yeu_cau, so_dien_thoai: form.so_dien_thoai, ten_mau: vehicle?.ten_mau ?? "" }, lookupUrl, lang);
    const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
    async function copy(kind: "code" | "msg") {
      if (await copyText(kind === "code" ? created!.ma_yeu_cau : msg)) {
        setCopied(kind);
        window.setTimeout(() => setCopied(""), 2500);
      }
    }
    async function sendToZalo() {
      await copy("msg");
      window.open(STORE_ZALO, "_blank", "noopener,noreferrer");
    }
    return (
      <PublicLayout stickyCta={false}>
        <div className="mx-auto max-w-xl px-5 py-16">
          <div className="space-y-5 rounded-2xl border border-success/20 bg-success-bg p-6 sm:p-8">
            <div className="flex items-center gap-3"><IconCheckCircle className="text-success" size={26} /><h1 className="text-2xl font-semibold text-ink">{t("ok.title")}</h1></div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-5 py-4">
              <div><p className="text-xs text-ink-muted">{t("ok.code")}</p><span className="text-2xl font-bold tracking-wide text-ink" aria-live="polite">{created.ma_yeu_cau}</span></div>
              <div className="flex items-center gap-2"><Badge tone="info">{t("status.DaGui")}</Badge>
                <Button variant="secondary" size="sm" onClick={() => copy("code")}>{copied === "code" ? t("ok.copied") : t("ok.copy")}</Button></div>
            </div>
            <p className="text-sm text-ink">{t("ok.message")}</p>
            <Alert tone="warning" title={t("ok.save")}>{t("ok.saveD", { phone: form.so_dien_thoai })}</Alert>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={sendToZalo}>{copied === "msg" ? t("ok.zaloCopied") : t("ok.zalo")}</Button>
              {canShare
                ? <Button variant="secondary" onClick={() => navigator.share({ title: t("ok.shareTitle"), text: msg }).catch(() => undefined)}>{t("ok.share")}</Button>
                : <Button variant="secondary" onClick={() => copy("msg")}>{copied === "msg" ? t("ok.copied") : t("ok.copyMsg")}</Button>}
            </div>
            <p className="text-xs text-ink-muted">{t("ok.zaloHelp", { phone: STORE_PHONE_DISPLAY })}</p>
            <Link to={`/tra-cuu?ma=${created.ma_yeu_cau}`} className="inline-flex h-11 items-center rounded-lg border border-line bg-white px-5 text-sm font-semibold text-primary">{t("ok.lookup")}</Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout stickyCta={false}>
      <div className="mx-auto max-w-[1440px] space-y-6 px-5 py-8 lg:px-20 lg:py-10">
        <nav className="text-[13px] text-ink-muted" aria-label="Breadcrumb"><Link to="/thue-xe" className="hover:text-primary">{t("c1.crumbBack")}</Link> / {t("c1.crumb")}</nav>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h1 className="text-title text-ink">{t("c1.title")}</h1><p className="mt-1.5 text-sm text-ink-muted">{t("c1.sub")}</p></div>
          <Badge tone="info">{t("c1.badge")}</Badge>
        </div>
        {vehicles.isLoading && <LoadingState label={t("common.loadingBikes")} />}
        {vehicles.isError && <ErrorState title={t("common.loadError")} retryLabel={t("common.retry")} message={err(vehicles.error)} onRetry={() => vehicles.refetch()} />}
        {vehicles.data && !vehicle && <Alert tone="danger" title={t("c1.notFound")}><Link to="/thue-xe" className="underline">{t("c1.backToList")}</Link></Alert>}
        {vehicle && (
          <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_440px]">
            <div className="space-y-6">
              {apiErr && (
                <Alert tone={apiErr.code === "VEHICLE_UNAVAILABLE" ? "warning" : "danger"}
                  title={apiErr.code === "VEHICLE_UNAVAILABLE" ? t("c1.unavailTitle", { name: vehicle.ten_mau }) : err(apiErr)}
                  action={apiErr.code === "VEHICLE_UNAVAILABLE" ? <Link to="/thue-xe" className="text-sm font-semibold text-primary underline">{t("c1.otherModel")}</Link> : undefined}>
                  {apiErr.code === "VEHICLE_UNAVAILABLE" ? `${err(apiErr)}. ${t("c1.unavailKeep")}` : null}
                </Alert>
              )}
              <Panel title={t("c1.renter")} caption={t("c1.renterCap")}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("c1.name")} required htmlFor="ho_ten" error={errors.ho_ten_khach}><input id="ho_ten" className={inputClass} value={form.ho_ten_khach} onChange={set("ho_ten_khach")} aria-invalid={!!errors.ho_ten_khach} autoComplete="name" maxLength={100} /></Field>
                  <Field label={t("c1.phone")} required htmlFor="sdt" error={errors.so_dien_thoai} helper={t("c1.phoneHelp")}><input id="sdt" inputMode="tel" className={inputClass} value={form.so_dien_thoai} onChange={set("so_dien_thoai")} aria-invalid={!!errors.so_dien_thoai} autoComplete="tel" /></Field>
                </div>
                <div className="mt-5"><Alert tone="info" title={t("c1.notConfirmed")}>{t("c1.notConfirmedD")}</Alert></div>
              </Panel>
              <Panel title={t("c1.timeNote")}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("search.pickup")} required htmlFor="tu" error={errors.tu}><input id="tu" type="datetime-local" className={inputClass} value={form.tu} onChange={set("tu")} aria-invalid={!!errors.tu} /></Field>
                  <Field label={t("search.return")} required htmlFor="den" error={errors.den}><input id="den" type="datetime-local" className={inputClass} value={form.den} onChange={set("den")} aria-invalid={!!errors.den} /></Field>
                </div>
                <fieldset className="mt-5 space-y-3">
                  <legend className="text-[13px] font-semibold text-ink">{t("c1.option")} *</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {([["TaiCuaHang", "c1.optStore", "c1.optStoreD"], ["GiaoTanNoi", "c1.optDelivery", "c1.optDeliveryD"]] as const).map(([v, k1, k2]) => (
                      <label key={v} className={cx("flex cursor-pointer items-start gap-3 rounded-[10px] border px-4 py-3.5", form.hinh_thuc_nhan_xe === v ? "border-2 border-primary bg-primary-soft" : "border-line")}>
                        <input type="radio" name="giao" value={v} checked={form.hinh_thuc_nhan_xe === v} onChange={set("hinh_thuc_nhan_xe")} className="mt-1 accent-primary" />
                        <span><span className="block text-sm font-semibold text-ink">{t(k1)}</span><span className="text-xs text-ink-muted">{t(k2)}</span></span>
                      </label>
                    ))}
                  </div>
                  {form.hinh_thuc_nhan_xe === "GiaoTanNoi" && (
                    <Field label={t("c1.address")} required htmlFor="dia_chi" error={errors.dia_chi_giao_xe} helper={t("c1.addressHelp")}>
                      <input id="dia_chi" className={inputClass} value={form.dia_chi_giao_xe} onChange={set("dia_chi_giao_xe")} aria-invalid={!!errors.dia_chi_giao_xe} maxLength={255} />
                    </Field>
                  )}
                </fieldset>
                <div className="mt-5"><Field label={t("c1.note")} htmlFor="ghi_chu"><textarea id="ghi_chu" className={cx(inputClass, "h-24 py-2.5")} value={form.ghi_chu_yeu_cau} onChange={set("ghi_chu_yeu_cau")} maxLength={255} /></Field></div>
                <p className="mt-3 text-xs text-ink-muted">{t("c1.timeHelp")}{days ? t("c1.totalDays", { n: days }) : ""}</p>
              </Panel>
              <div className="flex items-center justify-between gap-3">
                <Link to="/thue-xe" className="inline-flex h-11 items-center rounded-lg border border-line px-4 text-sm font-semibold text-primary">{t("c1.backToList")}</Link>
                <Button type="submit" loading={submit.isPending} icon={<IconSend size={16} />}>{t("c1.submit")}</Button>
              </div>
              <p className="text-xs text-ink-muted">{t("c1.footer")}</p>
            </div>
            <aside className="space-y-6">
              <Panel title={t("c1.chosen")}>
                <div className="flex items-center gap-4">
                  <div className="h-[72px] w-[104px] rounded-lg bg-subtle"><VehiclePhoto tenXe={vehicle.ten_mau} className="h-full w-full" /></div>
                  <div><p className="text-xs text-ink-muted">{t(`type.${vehicle.loai_xe}` as Key)}</p><p className="text-sm font-semibold text-ink">{vehicle.ten_mau}</p></div>
                </div>
                <hr className="my-4 border-line" />
                <DetailRow label={t("c1.price")}>{money(vehicle.don_gia_ngay_vnd)} {t("common.perDay")}</DetailRow>
                <DetailRow label={t("c1.duration")}>{days ? t("common.days", { n: days }) : "—"}</DetailRow>
                <DetailRow label={t("c1.pickup")}>{form.hinh_thuc_nhan_xe === "GiaoTanNoi" ? t("c1.pickupDelivery") : t("c1.pickupStore")}</DetailRow>
                <DetailRow label={t("c1.estimate")}>{estimate ? money(estimate) : "—"}</DetailRow>
                <p className="mt-3 text-xs text-ink-muted">{t("c1.estimateNote")}</p>
              </Panel>
            </aside>
          </form>
        )}
      </div>
    </PublicLayout>
  );
}
