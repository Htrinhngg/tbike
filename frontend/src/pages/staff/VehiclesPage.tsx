import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { Alert, Field, Modal } from "../../components/ui";
import { errorMessage, fieldErrors } from "../../lib/api";
import { todayVn } from "../../lib/format";
import { invalidateOperational } from "../../services/queryKeys";
import type { VehicleModel } from "../../lib/types";
import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { StaffLayout } from "../../components/StaffLayout";
import { Badge, Button, cx, EmptyState, ErrorState, inputClass, LoadingState, PageHeading, Pagination, ProgressBar } from "../../components/ui";
import { formatKm, formatVnd } from "../../lib/format";
import { VEHICLE_STATUS, VEHICLE_TYPE } from "../../lib/status";
import type { LoaiXe, TrangThaiXe } from "../../lib/types";
import { qk } from "../../services/queryKeys";
import { staffApi } from "../../services/staffApi";
import { vehiclesApi } from "../../services/vehiclesApi";

const PAGE_SIZE = 10;

/** Them 1 xe vao mau co san, hoac tao mau moi roi them xe (chi Chu cua hang). */
function AddVehicleModal({ open, onClose, models }: { open: boolean; onClose: () => void; models: VehicleModel[] }) {
  const client = useQueryClient();
  const [newModel, setNewModel] = useState(false);
  const [f, setF] = useState({ ma_xe: "", ma_mau: "", ten_mau: "", loai_xe: "Automatic" as LoaiXe, odo: "", odo_bd: "", ngay_bd: "" });
  const [done, setDone] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const save = useMutation({
    mutationFn: async () => {
      let maMau = f.ma_mau;
      if (newModel) maMau = (await vehiclesApi.createModel({ ten_mau: f.ten_mau, loai_xe: f.loai_xe })).ma_mau;
      return vehiclesApi.createVehicle({
        ma_xe: f.ma_xe, ma_mau: maMau, odo_hien_tai: Number(f.odo),
        odo_bao_duong_gan_nhat: f.odo_bd ? Number(f.odo_bd) : null, ngay_bao_duong_gan_nhat: f.ngay_bd || null,
      });
    },
    onSuccess: async (v) => {
      setDone(`Đã thêm ${v.ma_xe} • ${v.ten_xe} (${VEHICLE_STATUS[v.trang_thai].label}).`);
      setF((x) => ({ ...x, ma_xe: "", odo: "", odo_bd: "", ngay_bd: "" }));
      setNewModel(false);
      await Promise.all([invalidateOperational(client), client.invalidateQueries({ queryKey: ["vehicle-models"] })]);
    },
  });
  const fe = fieldErrors(save.error);
  const valid = /^[A-Za-z0-9-]{2,10}$/.test(f.ma_xe.trim()) && /^\d+$/.test(f.odo) && (newModel ? f.ten_mau.trim().length >= 2 : !!f.ma_mau)
    && (!f.odo_bd || (/^\d+$/.test(f.odo_bd) && Number(f.odo_bd) <= Number(f.odo)));
  return (
    <Modal open={open} title="Thêm xe vào đội xe" onClose={() => { setDone(null); save.reset(); onClose(); }}
      footer={<><Button variant="secondary" onClick={() => { setDone(null); save.reset(); onClose(); }}>Đóng</Button><Button loading={save.isPending} disabled={!valid} onClick={() => { setDone(null); save.mutate(); }}>Thêm xe</Button></>}>
      <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
        {done && <Alert tone="success" title={done}>Có thể nhập tiếp xe khác cùng mẫu.</Alert>}
        {save.isError && <Alert tone="danger" title={errorMessage(save.error)} />}
        <Field label="Mã xe" required htmlFor="nx-ma" helper="Mã nội bộ, ví dụ TB016 hoặc biển số rút gọn. Không trùng xe khác." error={fe.ma_xe}>
          <input id="nx-ma" className={inputClass} value={f.ma_xe} maxLength={10} onChange={(e) => setF((x) => ({ ...x, ma_xe: e.target.value.toUpperCase() }))} />
        </Field>
        {!newModel ? (
          <Field label="Mẫu xe" required htmlFor="nx-mau" helper={<button type="button" className="font-semibold text-primary underline" onClick={() => setNewModel(true)}>+ Mẫu mới chưa có trong danh sách</button>}>
            <select id="nx-mau" className={inputClass} value={f.ma_mau} onChange={set("ma_mau")}>
              <option value="">Chọn mẫu xe…</option>
              {models.map((m) => <option key={m.ma_mau} value={m.ma_mau}>{m.ten_mau} • {m.loai_xe} ({m.tong_so_xe} xe)</option>)}
            </select>
          </Field>
        ) : (
          <div className="space-y-3 rounded-[10px] bg-subtle p-3">
            <Field label="Tên mẫu mới" required htmlFor="nx-ten" helper={<button type="button" className="font-semibold text-primary underline" onClick={() => setNewModel(false)}>Chọn mẫu có sẵn</button>}>
              <input id="nx-ten" className={inputClass} value={f.ten_mau} onChange={set("ten_mau")} placeholder="Honda Lead 125" maxLength={50} />
            </Field>
            <Field label="Loại xe (quyết định đơn giá)" required htmlFor="nx-loai">
              <select id="nx-loai" className={inputClass} value={f.loai_xe} onChange={set("loai_xe")}><option value="Automatic">Automatic • Xe tay ga</option><option value="Manual">Manual • Xe số</option></select>
            </Field>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="ODO hiện tại (km)" required htmlFor="nx-odo" error={fe.odo_hien_tai}><input id="nx-odo" inputMode="numeric" className={inputClass} value={f.odo} onChange={(e) => setF((x) => ({ ...x, odo: e.target.value.replace(/\D/g, "") }))} /></Field>
          <Field label="ODO bảo dưỡng gần nhất" htmlFor="nx-odobd" helper="Bỏ trống = bằng ODO hiện tại"><input id="nx-odobd" inputMode="numeric" className={inputClass} value={f.odo_bd} onChange={(e) => setF((x) => ({ ...x, odo_bd: e.target.value.replace(/\D/g, "") }))} /></Field>
        </div>
        <Field label="Ngày bảo dưỡng gần nhất" htmlFor="nx-ngay"><input id="nx-ngay" type="date" max={todayVn()} className={inputClass} value={f.ngay_bd} onChange={set("ngay_bd")} /></Field>
        <p className="text-xs text-ink-muted">Nếu ODO hiện tại − ODO bảo dưỡng ≥ 2.000 km, xe được thêm ở trạng thái Cần bảo dưỡng.</p>
      </div>
    </Modal>
  );
}

/** B1 · Danh sach xe */
export function VehiclesPage() {
  const [params, setParams] = useSearchParams();
  const trang_thai = (params.get("trang_thai") ?? "") as TrangThaiXe | "";
  const loai_xe = (params.get("loai_xe") ?? "") as LoaiXe | "";
  const sort = (params.get("sort") ?? "gan_moc_bao_duong") as "ma_xe" | "gan_moc_bao_duong" | "odo";
  const page = Number(params.get("page") ?? 1);
  const [search, setSearch] = useState(params.get("q") ?? "");
  const q = params.get("q") ?? "";

  const list = useQuery({
    queryKey: [...qk.vehicles, { trang_thai, loai_xe, sort, page, q }],
    queryFn: () => vehiclesApi.list({ trang_thai, loai_xe, sort, page, page_size: PAGE_SIZE, q }),
    placeholderData: keepPreviousData,
  });
  const counts = useQuery({ queryKey: qk.dashboard, queryFn: staffApi.dashboard });
  const models = useQuery({ queryKey: ["vehicle-models"], queryFn: vehiclesApi.models });
  const { profile } = useAuth();
  const isOwner = profile?.vai_tro === "ChuCuaHang";
  const [adding, setAdding] = useState(false);

  function update(patch: Record<string, string>) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
    if (!("page" in patch)) next.delete("page");
    setParams(next);
  }
  const tabs: [TrangThaiXe | "", string, number | undefined][] = [
    ["", "Tất cả", counts.data?.tong_xe],
    ["KhaDung", "Khả dụng", counts.data?.xe_theo_trang_thai.KhaDung],
    ["DangThue", "Đang thuê", counts.data?.xe_theo_trang_thai.DangThue],
    ["CanBaoDuong", "Cần bảo dưỡng", counts.data?.xe_theo_trang_thai.CanBaoDuong],
  ];

  return (
    <StaffLayout breadcrumb={["Danh sách xe"]}>
      <PageHeading eyebrow="Đội xe" title="Danh sách xe" subtitle={`${counts.data?.tong_xe ?? "…"} xe • ${models.data?.length ?? "…"} mẫu • Theo dõi trạng thái, ODO và mốc bảo dưỡng của từng xe.`}
        actions={isOwner ? <Button onClick={() => setAdding(true)}>+ Thêm xe</Button> : undefined} />
      <div className="overflow-hidden rounded-panel border border-line bg-white">
        <div className="flex items-center justify-between px-5 pt-5"><h2 className="text-lg font-semibold">Số lượng theo mẫu xe</h2>{!isOwner && <span className="text-xs text-ink-muted">Chỉ Chủ cửa hàng được thêm xe</span>}</div>
        {models.isLoading && <div className="p-5"><LoadingState rows={2} /></div>}
        {models.isError && <div className="p-5"><ErrorState message={errorMessage(models.error)} onRetry={() => models.refetch()} /></div>}
        {models.data && (
          <div className="overflow-x-auto p-5"><table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="bg-subtle text-eyebrow uppercase text-ink-muted"><th className="px-4 py-2.5">Mẫu xe</th><th className="px-4 py-2.5">Loại • Giá</th><th className="px-4 py-2.5">Tổng</th><th className="px-4 py-2.5">Khả dụng</th><th className="px-4 py-2.5">Đang thuê</th><th className="px-4 py-2.5">Cần bảo dưỡng</th></tr></thead>
            <tbody>{models.data.map((m) => (
              <tr key={m.ma_mau} className="cursor-pointer border-t border-line hover:bg-subtle" onClick={() => { setSearch(m.ten_mau); update({ q: m.ten_mau }); }} title="Lọc danh sách xe theo mẫu này">
                <td className="px-4 py-2.5"><p className="font-semibold">{m.ten_mau}</p><p className="text-xs text-ink-muted">{m.ma_mau}</p></td>
                <td className="px-4 py-2.5">{m.loai_xe} • {formatVnd(m.don_gia_ngay_vnd)}</td>
                <td className="px-4 py-2.5 font-semibold">{m.tong_so_xe}</td>
                <td className="px-4 py-2.5 text-success">{m.so_kha_dung}</td><td className="px-4 py-2.5 text-info">{m.so_dang_thue}</td>
                <td className={cx("px-4 py-2.5", m.so_can_bao_duong ? "font-semibold text-warning" : "text-ink-muted")}>{m.so_can_bao_duong}</td>
              </tr>))}</tbody>
          </table></div>
        )}
      </div>
      <AddVehicleModal open={adding} onClose={() => setAdding(false)} models={models.data ?? []} />
      <div className="space-y-4 rounded-panel border border-line bg-white p-5">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lọc theo trạng thái">
          {tabs.map(([v, l, n]) => (
            <button key={l} role="tab" aria-selected={trang_thai === v} onClick={() => update({ trang_thai: v })}
              className={cx("flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold", trang_thai === v ? "btn-gradient text-white" : "border border-line bg-subtle text-ink")}>
              {l}<span className={cx("rounded-full px-2 text-xs font-normal", trang_thai === v ? "bg-primary-soft text-primary" : "bg-white text-ink-muted")}>{n ?? "…"}</span>
            </button>
          ))}
        </div>
        <form className="grid gap-4 md:grid-cols-[1fr_200px_220px_auto] md:items-end" onSubmit={(e) => { e.preventDefault(); update({ q: search.trim() }); }}>
          <label className="flex flex-col gap-2 text-[13px] font-semibold">Tìm kiếm<input className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Mã xe hoặc tên xe…" /></label>
          <label className="flex flex-col gap-2 text-[13px] font-semibold">Loại xe
            <select className={inputClass} value={loai_xe} onChange={(e) => update({ loai_xe: e.target.value })}><option value="">Tất cả loại xe</option><option value="Manual">Manual • Xe số</option><option value="Automatic">Automatic • Xe tay ga</option></select></label>
          <label className="flex flex-col gap-2 text-[13px] font-semibold">Sắp xếp
            <select className={inputClass} value={sort} onChange={(e) => update({ sort: e.target.value })}><option value="gan_moc_bao_duong">Gần mốc bảo dưỡng nhất</option><option value="ma_xe">Mã xe</option><option value="odo">ODO cao nhất</option></select></label>
          <Button type="submit" variant="secondary">Tìm</Button>
        </form>
      </div>
      <div className="overflow-hidden rounded-panel border border-line bg-white">
        {list.isLoading && <div className="p-5"><LoadingState label="Đang tải danh sách xe…" /></div>}
        {list.isError && <div className="p-5"><ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} /></div>}
        {list.data && list.data.items.length === 0 && (
          <EmptyState title="Không có xe nào khớp bộ lọc" description="Thử bỏ bớt bộ lọc." action={<Button variant="secondary" onClick={() => { setSearch(""); setParams(new URLSearchParams()); }}>Xóa bộ lọc</Button>} />
        )}
        {list.data && list.data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead><tr className="bg-subtle text-eyebrow uppercase text-ink-muted"><th className="px-5 py-3">Mã xe</th><th className="px-5 py-3">Xe</th><th className="px-5 py-3">Đơn giá / ngày</th><th className="px-5 py-3">ODO hiện tại</th><th className="px-5 py-3">Từ lần bảo dưỡng</th><th className="px-5 py-3">Trạng thái</th><th /></tr></thead>
              <tbody>
                {list.data.items.map((v) => (
                  <tr key={v.ma_xe} className={cx("border-t border-line", v.can_bao_duong && "bg-warning-bg")}>
                    <td className="px-5 py-3.5 font-semibold text-primary">{v.ma_xe}</td>
                    <td className="px-5 py-3.5"><p className="font-semibold">{v.ten_xe}</p><p className="text-xs text-ink-muted">{VEHICLE_TYPE[v.loai_xe]}</p></td>
                    <td className="px-5 py-3.5">{formatVnd(v.don_gia_ngay_vnd)}</td>
                    <td className="px-5 py-3.5">{formatKm(v.odo_hien_tai)}</td>
                    <td className="w-44 px-5 py-3.5"><ProgressBar value={v.km_tu_lan_bao_duong} max={v.nguong_km} tone={v.km_tu_lan_bao_duong >= v.nguong_km * 0.9 ? "warning" : "primary"} label={`${v.ma_xe} đã đi từ lần bảo dưỡng`} />
                      <p className={cx("mt-1.5 text-xs", v.can_bao_duong ? "text-warning" : "text-ink-muted")}>{v.km_tu_lan_bao_duong.toLocaleString("vi-VN").replace(/,/g, ".")} / {v.nguong_km.toLocaleString("vi-VN").replace(/,/g, ".")} km</p></td>
                    <td className="px-5 py-3.5"><Badge tone={VEHICLE_STATUS[v.trang_thai].tone}>{VEHICLE_STATUS[v.trang_thai].label}</Badge></td>
                    <td className="px-5 py-3.5 text-right"><Link to={`/nhan-vien/xe/${v.ma_xe}`} className="rounded-lg border border-line px-3 py-1.5 text-[13px] font-semibold text-primary">Chi tiết</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {list.data && <div className="border-t border-line px-4"><Pagination page={page} pageSize={PAGE_SIZE} total={list.data.total} label="xe" onPage={(p) => update({ page: String(p) })} /></div>}
      </div>
    </StaffLayout>
  );
}
