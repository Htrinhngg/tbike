import { api } from "../lib/api";
import type { LoaiXe, MaintenanceCreated, MaintenanceRecord, Page, TrangThaiXe, Vehicle, VehicleDetail, VehicleModel } from "../lib/types";

export interface VehicleQuery {
  q?: string; loai_xe?: LoaiXe | ""; trang_thai?: TrangThaiXe | ""; sort?: "ma_xe" | "gan_moc_bao_duong" | "odo";
  page?: number; page_size?: number;
}

export const vehiclesApi = {
  list: (q: VehicleQuery) => api<Page<Vehicle>>("/api/vehicles", { query: { ...q } }),
  detail: (maXe: string) => api<VehicleDetail>(`/api/vehicles/${encodeURIComponent(maXe)}`),
  history: (maXe: string) => api<MaintenanceRecord[]>(`/api/vehicles/${encodeURIComponent(maXe)}/maintenance-history`),
  models: () => api<VehicleModel[]>("/api/vehicle-models"),
  createModel: (body: { ten_mau: string; loai_xe: LoaiXe; ma_mau?: string | null }) =>
    api<VehicleModel>("/api/vehicle-models", { method: "POST", body }),
  createVehicle: (body: { ma_xe: string; ma_mau: string; odo_hien_tai: number; odo_bao_duong_gan_nhat?: number | null; ngay_bao_duong_gan_nhat?: string | null }) =>
    api<Vehicle>("/api/vehicles", { method: "POST", body }),
  due: () => api<Vehicle[]>("/api/maintenance/due"),
  recordMaintenance: (maXe: string, body: { ngay_bao_duong: string; odo_luc_bao_duong: number; ghi_chu?: string | null }) =>
    api<MaintenanceCreated>(`/api/vehicles/${encodeURIComponent(maXe)}/maintenance-records`, { method: "POST", body }),
};
