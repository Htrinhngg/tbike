import { describe, expect, it } from "vitest";
import { loadRecent, removeRecent, saveRecent, shareText } from "../recentRequests";

class MemStorage implements Storage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.get(k) ?? null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, v); }
}
const item = (ma: string) => ({ ma_yeu_cau: ma, so_dien_thoai: "0949580502", ten_mau: "Honda Air Blade", thoi_gian_nhan_du_kien: "2026-11-05T09:00:00+07:00", thoi_gian_tra_du_kien: "2026-11-08T09:00:00+07:00" });

describe("recent requests (device only)", () => {
  it("saves newest first, dedupes and caps at 10", () => {
    const s = new MemStorage();
    for (let i = 0; i < 12; i++) saveRecent(item(`REQ-0000000${i % 10}${i}`.slice(0, 12)), s);
    saveRecent(item("REQ-AAAAAAAA"), s);
    saveRecent(item("REQ-AAAAAAAA"), s);
    const list = loadRecent(s);
    expect(list.length).toBe(10);
    expect(list[0].ma_yeu_cau).toBe("REQ-AAAAAAAA");
    expect(list.filter((x) => x.ma_yeu_cau === "REQ-AAAAAAAA").length).toBe(1);
  });
  it("removes an entry", () => {
    const s = new MemStorage();
    saveRecent(item("REQ-AAAAAAAA"), s);
    saveRecent(item("REQ-BBBBBBBB"), s);
    expect(removeRecent("REQ-AAAAAAAA", s).map((x) => x.ma_yeu_cau)).toEqual(["REQ-BBBBBBBB"]);
  });
  it("ignores corrupted storage", () => {
    const s = new MemStorage();
    s.setItem("tbike:yeu-cau-gan-day", "{not json");
    expect(loadRecent(s)).toEqual([]);
    s.setItem("tbike:yeu-cau-gan-day", JSON.stringify([{ foo: 1 }, item("REQ-CCCCCCCC")]));
    expect(loadRecent(s).map((x) => x.ma_yeu_cau)).toEqual(["REQ-CCCCCCCC"]);
  });
  it("builds a share message containing code and lookup link", () => {
    const t = shareText(item("REQ-JD9FDG8J"), "http://localhost:5173/tra-cuu?ma=REQ-JD9FDG8J");
    expect(t).toContain("REQ-JD9FDG8J");
    expect(t).toContain("/tra-cuu?ma=REQ-JD9FDG8J");
  });
});
