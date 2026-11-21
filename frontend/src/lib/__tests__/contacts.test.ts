import { describe, expect, it } from "vitest";
import { contactLinks, whatsappHref } from "../contacts";

describe("contact links", () => {
  it("builds WhatsApp links in international format", () => {
    expect(whatsappHref("081 624 3243")).toBe("https://wa.me/84816243243");
    expect(whatsappHref("0816243243", "Hi T-Bike")).toBe("https://wa.me/84816243243?text=Hi%20T-Bike");
  });
  it("orders channels by language", () => {
    expect(contactLinks("vi").map((c) => c.kind)).toEqual(["zalo", "facebook", "whatsapp", "call"]);
    expect(contactLinks("en").map((c) => c.kind)).toEqual(["whatsapp", "zalo", "facebook", "call"]);
  });
  it("uses official store channels", () => {
    const l = Object.fromEntries(contactLinks("vi").map((c) => [c.kind, c.href]));
    expect(l.zalo).toBe("https://zalo.me/0816243243");
    expect(l.call).toBe("tel:+84816243243");
    expect(l.facebook).toContain("id=100063470564198");
  });
});
