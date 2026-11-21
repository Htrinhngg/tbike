import { api } from "../lib/api";
import type {
  CloseResult, ConfirmResult, RescheduleResult, ScheduleChange, Vehicle, DepositMethod, LateFeeBreakdown, Page, RentalRequest, ReturnResult, TrangThaiXuLy,
} from "../lib/types";

export interface RequestQuery { trang_thai?: TrangThaiXuLy[]; qua_han?: boolean; q?: string; tu?: string; den?: string; page?: number; page_size?: number }
const enc = encodeURIComponent;

export const rentalsApi = {
  list: (q: RequestQuery) => api<Page<RentalRequest>>("/api/rental-requests", { query: { ...q } }),
  get: (maYeuCau: string) => api<RentalRequest>(`/api/rental-requests/${enc(maYeuCau)}`),
  getOrder: (maDon: string) => api<RentalRequest>(`/api/rental-orders/${enc(maDon)}`),
  depositMethods: () => api<DepositMethod[]>("/api/deposit-methods"),
  confirm: (maYeuCau: string, body: { ma_phuong_thuc_bao_dam?: string | null; trang_thai_bao_dam?: "ChuaKiemTra" | "DaXacNhan" }) =>
    api<ConfirmResult>(`/api/rental-requests/${enc(maYeuCau)}/confirm`, { method: "POST", body }),
  reject: (maYeuCau: string, ly_do: string) =>
    api<RentalRequest>(`/api/rental-requests/${enc(maYeuCau)}/reject`, { method: "POST", body: { ly_do } }),
  updateDeposit: (maDon: string, body: { ma_phuong_thuc_bao_dam: string; trang_thai_bao_dam: "ChuaKiemTra" | "DaXacNhan" }) =>
    api<RentalRequest>(`/api/rental-orders/${enc(maDon)}/deposit`, { method: "PATCH", body }),
  handover: (maDon: string, body: { odo_giao_xe: number; thoi_diem_giao_xe?: string; doi_sang_xe?: string | null }) =>
    api<RentalRequest>(`/api/rental-orders/${enc(maDon)}/handover`, { method: "POST", body }),
  reschedule: (maYeuCau: string, body: { thoi_gian_nhan_du_kien: string; thoi_gian_tra_du_kien: string; ly_do: string }) =>
    api<RescheduleResult>(`/api/rental-requests/${enc(maYeuCau)}/reschedule`, { method: "POST", body }),
  scheduleHistory: (maYeuCau: string) => api<ScheduleChange[]>(`/api/rental-requests/${enc(maYeuCau)}/schedule-history`),
  replacementVehicles: (maDon: string) => api<Vehicle[]>(`/api/rental-orders/${enc(maDon)}/replacement-vehicles`),
  previewLateFee: (maDon: string, thoi_gian_tra_thuc_te: string) =>
    api<LateFeeBreakdown>(`/api/rental-orders/${enc(maDon)}/late-fee-preview`, { method: "POST", body: { thoi_gian_tra_thuc_te } }),
  returnVehicle: (maDon: string, body: { odo_nhan_xe: number; thoi_gian_tra_thuc_te?: string }) =>
    api<ReturnResult>(`/api/rental-orders/${enc(maDon)}/return`, { method: "POST", body }),
  close: (maDon: string, body: { da_thu_phu_phi: boolean; da_hoan_tra_bao_dam: boolean }) =>
    api<CloseResult>(`/api/rental-orders/${enc(maDon)}/close`, { method: "POST", body }),
};
