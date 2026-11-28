import { describe, expect, it } from "vitest";
import { formatLate, lateReturnMinutes } from "../status";

const due = "2026-11-26T18:00:00+07:00";
const at = (iso: string) => new Date(iso).getTime();

describe("lateReturnMinutes", () => {
  it("tinh so phut tre cua don dang thue chua nhan xe", () => {
    expect(lateReturnMinutes({ trang_thai_xu_ly: "DangThue", thoi_gian_tra_thuc_te: null, thoi_gian_tra_du_kien: due }, at("2026-11-26T21:00:00+07:00"))).toBe(180);
  });
  it("khong tre neu chua toi gio tra", () => {
    expect(lateReturnMinutes({ trang_thai_xu_ly: "DangThue", thoi_gian_tra_thuc_te: null, thoi_gian_tra_du_kien: due }, at("2026-11-26T17:59:00+07:00"))).toBeNull();
  });
  it("khong canh bao khi da nhan xe hoac don khong o trang thai dang thue", () => {
    expect(lateReturnMinutes({ trang_thai_xu_ly: "DangThue", thoi_gian_tra_thuc_te: "2026-11-26T21:00:00+07:00", thoi_gian_tra_du_kien: due }, at("2026-11-27T08:00:00+07:00"))).toBeNull();
    expect(lateReturnMinutes({ trang_thai_xu_ly: "HoanTat", thoi_gian_tra_thuc_te: null, thoi_gian_tra_du_kien: due }, at("2026-11-27T08:00:00+07:00"))).toBeNull();
  });
});

describe("formatLate", () => {
  it("hien thi gon theo phut, gio, ngay", () => {
    expect(formatLate(45)).toBe("45 phút");
    expect(formatLate(180)).toBe("3 giờ");
    expect(formatLate(95)).toBe("1 giờ 35 phút");
    expect(formatLate(1440)).toBe("1 ngày");
    expect(formatLate(2580)).toBe("1 ngày 19 giờ");
  });
});
