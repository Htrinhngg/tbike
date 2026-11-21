import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { PublicLayout } from "../../components/PublicLayout";
import { ProgressSteps } from "../../components/Domain";
import { Alert, Badge, Button, DetailRow, Field, inputClass, Panel } from "../../components/ui";
import { useI18n } from "../../i18n";
import type { Key } from "../../i18n/dict";
import { ApiError } from "../../lib/api";
import { loadRecent, removeRecent, STORE_PHONE_DISPLAY, STORE_ZALO, type RecentRequest } from "../../lib/recentRequests";
import { REQUEST_STATUS } from "../../lib/status";
import { publicApi } from "../../services/publicApi";

/** C4b · Khach – Tra cuu trang thai yeu cau (can ca ma yeu cau va so dien thoai) */
export function LookupPage() {
  const { t, dt, err } = useI18n();
  const [params] = useSearchParams();
  const [ma, setMa] = useState(params.get("ma") ?? "");
  const [sdt, setSdt] = useState("");
  const [recent, setRecent] = useState<RecentRequest[]>(() => loadRecent());
  const lookup = useMutation({ mutationFn: (v: { ma: string; sdt: string }) => publicApi.lookup({ ma_yeu_cau: v.ma.trim(), so_dien_thoai: v.sdt }) });
  const apiErr = lookup.error instanceof ApiError ? lookup.error : null;
  const r = lookup.data;

  useEffect(() => {
    const code = params.get("ma");
    const hit = code ? recent.find((x) => x.ma_yeu_cau === code.toUpperCase()) : undefined;
    if (hit) {
      setSdt(hit.so_dien_thoai);
      lookup.mutate({ ma: hit.ma_yeu_cau, sdt: hit.so_dien_thoai });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openRecent(x: RecentRequest) {
    setMa(x.ma_yeu_cau);
    setSdt(x.so_dien_thoai);
    lookup.mutate({ ma: x.ma_yeu_cau, sdt: x.so_dien_thoai });
  }
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (ma.trim() && sdt.trim()) lookup.mutate({ ma, sdt });
  }
  const status = (s: keyof typeof REQUEST_STATUS) => t(`status.${s}` as Key);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-[1280px] space-y-6 px-5 py-8 lg:py-10">
        <div>
          <p className="text-eyebrow uppercase text-ink-muted">{t("lk.eyebrow")}</p>
          <h1 className="mt-1.5 text-title text-ink">{t("lk.title")}</h1>
          <p className="mt-1.5 text-sm text-ink-muted">{t("lk.sub")}</p>
        </div>
        <form onSubmit={onSubmit} className="grid gap-4 rounded-panel border border-line bg-white p-6 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <Field label={t("lk.code")} required htmlFor="ma"><input id="ma" className={inputClass} value={ma} onChange={(e) => setMa(e.target.value.toUpperCase())} placeholder="REQ-XXXXXXXX" maxLength={12} /></Field>
          <Field label={t("lk.phone")} required htmlFor="sdt"><input id="sdt" inputMode="tel" className={inputClass} value={sdt} onChange={(e) => setSdt(e.target.value)} /></Field>
          <Button type="submit" loading={lookup.isPending}>{t("lk.submit")}</Button>
          <p className="text-xs text-ink-muted md:col-span-3">
            {t("lk.forgot")} <a href={STORE_ZALO} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">{t("lk.forgotLink", { phone: STORE_PHONE_DISPLAY })}</a> {t("lk.forgotTail")}
          </p>
        </form>
        {recent.length > 0 && (
          <Panel title={t("lk.recent")} caption={t("lk.recentCap")}>
            <ul className="divide-y divide-line">
              {recent.map((x) => (
                <li key={x.ma_yeu_cau} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-[200px] flex-1">
                    <p className="text-sm font-semibold text-ink">{x.ma_yeu_cau}{x.ten_mau ? ` • ${x.ten_mau}` : ""}</p>
                    <p className="text-xs text-ink-muted">{dt(x.thoi_gian_nhan_du_kien, true)} → {dt(x.thoi_gian_tra_du_kien, true)} • {t("lk.phoneShort", { phone: x.so_dien_thoai })}</p>
                  </div>
                  <Button size="sm" onClick={() => openRecent(x)}>{t("lk.view")}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setRecent(removeRecent(x.ma_yeu_cau))} aria-label={t("lk.removeAria", { code: x.ma_yeu_cau })}>{t("lk.remove")}</Button>
                </li>
              ))}
            </ul>
          </Panel>
        )}
        {apiErr && (
          <Alert tone={apiErr.status === 404 ? "warning" : "danger"} title={apiErr.status === 404 ? t("lk.notFound") : err(apiErr)}>
            {apiErr.status === 404
              ? <>{t("lk.notFoundD")} <a href={STORE_ZALO} target="_blank" rel="noopener noreferrer" className="font-semibold underline">{t("lk.notFoundLink")}</a> {t("lk.notFoundTail")}</>
              : apiErr.status === 429 ? t("lk.wait") : null}
          </Alert>
        )}
        {r && (
          <>
            <Panel title={r.ma_yeu_cau} caption={r.ma_don_thue ? t("lk.order", { code: r.ma_don_thue }) : t("lk.notOrder")}
              actions={<Badge tone={REQUEST_STATUS[r.trang_thai_xu_ly].tone}>{status(r.trang_thai_xu_ly)}</Badge>}>
              <div className="grid gap-x-12 md:grid-cols-2">
                <div>
                  <DetailRow label={t("lk.customer")}>{r.ho_ten_khach}</DetailRow>
                  <DetailRow label={t("lk.vehicle")}>{r.ten_xe} • {t(`type.short.${r.loai_xe}` as Key)}</DetailRow>
                  <DetailRow label={t("lk.option")}>{t(`delivery.${r.hinh_thuc_nhan_xe}` as Key)}</DetailRow>
                </div>
                <div>
                  <DetailRow label={t("lk.pickup")}>{dt(r.thoi_gian_nhan_du_kien)}</DetailRow>
                  <DetailRow label={t("lk.return")}>{dt(r.thoi_gian_tra_du_kien)}</DetailRow>
                  <DetailRow label={t("lk.sent")}>{dt(r.ngay_tao)}</DetailRow>
                </div>
              </div>
            </Panel>
            <Panel title={t("lk.progress")} caption={t(`lk.step.${r.trang_thai_xu_ly}` as Key)}>
              {r.trang_thai_xu_ly === "TuChoi"
                ? <Alert tone="danger" title={t("lk.rejected")}>{r.ly_do_tu_choi ?? t("lk.rejectedDefault")} {t("lk.rejectedTail")}</Alert>
                : <ProgressSteps status={r.trang_thai_xu_ly} labelOf={status} declinedLabel={t("lk.declinedBadge")} formatTime={(iso) => dt(iso)} />}
            </Panel>
            {r.trang_thai_xu_ly === "DaGui" && <Alert tone="info" title={t("lk.pending")}>{t("lk.pendingD")}</Alert>}
          </>
        )}
      </div>
    </PublicLayout>
  );
}
