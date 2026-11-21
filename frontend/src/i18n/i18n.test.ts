import { describe, expect, it } from "vitest";
import { ApiError } from "../lib/api";
import { en, vi } from "./dict";
import { dateTime, detectLang, errorText, money, translate } from "./index";

describe("i18n", () => {
  it("has a non-empty English text for every Vietnamese key (and no extras)", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(vi).sort());
    for (const [k, v] of Object.entries(en)) expect(v.trim(), k).not.toBe("");
  });
  it("keeps the same {placeholders} in both languages", () => {
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
    for (const k of Object.keys(vi) as (keyof typeof vi)[]) expect(ph(en[k]), k).toBe(ph(vi[k]));
  });
  it("detects language: stored choice wins, otherwise browser language", () => {
    expect(detectLang("en", ["vi-VN"])).toBe("en");
    expect(detectLang(null, ["vi-VN", "en"])).toBe("vi");
    expect(detectLang(null, ["en-US"])).toBe("en");
    expect(detectLang(null, ["ko-KR"])).toBe("en");
    expect(detectLang(null, [])).toBe("vi");
  });
  it("interpolates variables", () => {
    expect(translate("en", "c0.left", { n: 3 })).toBe("3 bikes left");
    expect(translate("vi", "c0.left", { n: 3 })).toBe("Còn 3 xe trống");
  });
  it("formats money per language", () => {
    expect(money("vi", 150000)).toBe("150.000đ");
    expect(money("en", 150000)).toBe("150,000 VND");
  });
  it("formats dates in Da Nang time", () => {
    expect(dateTime("vi", "2026-11-05T02:00:00Z")).toBe("05/11/2026 09:00");
    expect(dateTime("en", "2026-11-05T02:00:00Z")).toBe("05 Nov 2026, 09:00");
  });
  it("translates backend errors by code, falls back sensibly", () => {
    const unavailable = new ApiError(409, "VEHICLE_UNAVAILABLE", "Mẫu xe này đã hết xe…");
    expect(errorText("en", unavailable)).toMatch(/^This model is fully booked/);
    const unknown = new ApiError(500, "SOMETHING_NEW", "Lỗi lạ");
    expect(errorText("vi", unknown)).toBe("Lỗi lạ");
    expect(errorText("en", unknown)).toBe("Something went wrong, please try again");
  });
});
