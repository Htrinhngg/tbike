// CR-05: Dieu chinh lich (Da gui / Da xac nhan) hoac Gia han (Dang thue). Moi lan luu bat buoc nhap ly do.
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { errorMessage, fieldErrors } from "../lib/api";
import { formatDateTime, formatVnd, nowLocalInput, rentalDays, toApiDateTime, toLocalInput } from "../lib/format";
import type { RentalRequest, RescheduleResult } from "../lib/types";
import { invalidateOperational } from "../services/queryKeys";
import { rentalsApi } from "../services/rentalsApi";
import { Alert, Button, cx, Field, inputClass, Modal } from "./ui";

export function RescheduleModal({ open, onClose, order, suggested, onDone }: {
  open: boolean;
  onClose: () => void;
  order: RentalRequest;
  suggested?: { nhan: string; tra: string; ly_do?: string };
  onDone?: (r: RescheduleResult) => void;
}) {
  const client = useQueryClient();
  const extend = order.trang_thai_xu_ly === "DangThue";
  const [nhan, setNhan] = useState("");
  const [tra, setTra] = useState("");
  const [lyDo, setLyDo] = useState("");
  const [local, setLocal] = useState("");

  useEffect(() => {
    if (!open) return;
    setNhan(toLocalInput(suggested?.nhan ?? order.thoi_gian_nhan_du_kien));
    setTra(toLocalInput(suggested?.tra ?? order.thoi_gian_tra_du_kien));
    setLyDo(suggested?.ly_do ?? "");
    setLocal("");
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: () => rentalsApi.reschedule(order.ma_yeu_cau, {
      thoi_gian_nhan_du_kien: extend ? order.thoi_gian_nhan_du_kien : toApiDateTime(nhan),
      thoi_gian_tra_du_kien: toApiDateTime(tra),
      ly_do: lyDo.trim(),
    }),
    onSuccess: async (r) => {
      await Promise.all([invalidateOperational(client), client.invalidateQueries({ queryKey: ["schedule-history"] })]);
      onDone?.(r);
      onClose();
    },
  });

  function submit() {
    if (lyDo.trim().length < 3) return setLocal("Vui lòng nhập lý do điều chỉnh (ví dụ: Khách gọi đổi lịch).");
    if (!extend && nhan < nowLocalInput(-120)) return setLocal("Giờ nhận mới không được sớm hơn hiện tại quá 2 giờ.");
    if (tra <= (extend ? toLocalInput(order.thoi_gian_nhan_du_kien) : nhan)) return setLocal("Giờ trả phải sau giờ nhận.");
    if (extend && tra <= toLocalInput(order.thoi_gian_tra_du_kien)) return setLocal("Khi đang thuê chỉ được gia hạn (dời giờ trả về sau).");
    setLocal("");
    save.mutate();
  }

  const start = extend ? order.thoi_gian_nhan_du_kien : (nhan ? toApiDateTime(nhan) : null);
  const days = start && tra && /T\d{2}:\d{2}$/.test(tra) && toApiDateTime(tra) > start ? rentalDays(start, toApiDateTime(tra)) : null;
  const price = order.don_gia_ap_dung_vnd ?? order.don_gia_hien_hanh_vnd;
  const fe = fieldErrors(save.error);

  return (
    <Modal open={open} title={extend ? `Gia hạn ${order.ma_don_thue}` : `Điều chỉnh lịch ${order.ma_don_thue ?? order.ma_yeu_cau}`} onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button loading={save.isPending} onClick={submit}>{extend ? "Lưu gia hạn" : "Lưu lịch mới"}</Button></>}>
      <div className="space-y-4">
        <div className="rounded-lg bg-subtle p-3 text-[13px]">
          <p className="text-ink-muted">Lịch hiện tại</p>
          <p className="font-semibold">{formatDateTime(order.thoi_gian_nhan_du_kien)} → {formatDateTime(order.thoi_gian_tra_du_kien)} • {order.so_ngay_thue} ngày • {order.ma_xe}</p>
        </div>
        {extend
          ? <p className="text-[13px] text-ink-muted">Đơn đang thuê: chỉ dời <b>giờ trả</b> về sau. Hệ thống kiểm tra xe {order.ma_xe} không có đơn kế tiếp bị trùng.</p>
          : <Field label="Giờ nhận mới" required htmlFor="rs-nhan" error={fe.thoi_gian_nhan_du_kien}><input id="rs-nhan" type="datetime-local" className={inputClass} value={nhan} onChange={(e) => setNhan(e.target.value)} /></Field>}
        <Field label={extend ? "Giờ trả mới" : "Giờ trả mới"} required htmlFor="rs-tra" error={fe.thoi_gian_tra_du_kien}>
          <input id="rs-tra" type="datetime-local" className={inputClass} value={tra} onChange={(e) => setTra(e.target.value)} />
        </Field>
        <Field label="Lý do điều chỉnh" required htmlFor="rs-lydo" helper="Lưu vào lịch sử để đối chiếu khi có khiếu nại." error={fe.ly_do}>
          <input id="rs-lydo" className={inputClass} maxLength={255} value={lyDo} onChange={(e) => setLyDo(e.target.value)} placeholder="Khách gọi đổi lịch / Khách đến muộn / Khách gia hạn" />
        </Field>
        {days !== null && (
          <div className={cx("rounded-lg p-3 text-[13px]", days === order.so_ngay_thue ? "bg-primary-soft" : "bg-warning-bg")}>
            Tiền thuê dự kiến mới: <b>{days} ngày × {formatVnd(price)} = {formatVnd(days * price)}</b>
            {days !== order.so_ngay_thue && <> (trước: {order.so_ngay_thue} ngày)</>}. {order.don_gia_ap_dung_vnd ? "Đơn giá đã chốt giữ nguyên." : ""}
          </div>
        )}
        {!extend && <p className="text-xs text-ink-muted">Nếu xe {order.ma_xe} không trống trong khung giờ mới, hệ thống tự chuyển sang xe khác cùng mẫu.</p>}
        {local && <Alert tone="danger" title={local} />}
        {save.isError && !Object.keys(fe).length && <Alert tone="danger" title={errorMessage(save.error)} />}
      </div>
    </Modal>
  );
}

export function ScheduleHistoryList({ items }: { items: { ma_dieu_chinh: number; thoi_diem: string; ten_nguoi_dieu_chinh: string; ly_do: string; ma_xe_cu: string; ma_xe_moi: string; thoi_gian_nhan_cu: string; thoi_gian_tra_cu: string; thoi_gian_nhan_moi: string; thoi_gian_tra_moi: string }[] }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-3 border-t border-line pt-3 text-[13px]">
      {items.map((h) => (
        <li key={h.ma_dieu_chinh}>
          <p><span className="text-ink-muted">{formatDateTime(h.thoi_diem)}</span> • {h.ten_nguoi_dieu_chinh}: <b>{h.ly_do}</b></p>
          <p className="text-xs text-ink-muted">
            {formatDateTime(h.thoi_gian_nhan_cu)} → {formatDateTime(h.thoi_gian_tra_cu)} ⟶ {formatDateTime(h.thoi_gian_nhan_moi)} → {formatDateTime(h.thoi_gian_tra_moi)}
            {h.ma_xe_cu !== h.ma_xe_moi && <> • Xe {h.ma_xe_cu} → {h.ma_xe_moi}</>}
          </p>
        </li>
      ))}
    </ul>
  );
}
