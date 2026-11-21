/** Token mau/chu lay tu bo "T-Bike Tokens" trong Figma (QTDA - TBike - Figma). */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Bang mau pastel: xanh la #10B981 -> xanh duong #0EA5E9 (nut, tieu de, diem nhan)
        primary: { DEFAULT: "#059669", 500: "#10B981", hover: "#047857", soft: "#ECFDF5" }, // DEFAULT dam hon cho chu nho de doc
        accent: { DEFAULT: "#0EA5E9", 600: "#0284C7", soft: "#F0F9FF" },
        sidebar: { DEFAULT: "#FFFFFF", active: "#ECFDF5", muted: "#475569" },
        ink: { DEFAULT: "#0F172A", soft: "#475569", muted: "#64748B" },
        line: "#E2E8F0",
        page: "#F8FAFC",
        subtle: "#F8FAFC",
        success: { DEFAULT: "#047857", bg: "#ECFDF5" },
        warning: { DEFAULT: "#B45309", bg: "#FFF7ED" },
        danger: { DEFAULT: "#BE123C", bg: "#FFF1F2" },
        info: { DEFAULT: "#0369A1", bg: "#F0F9FF" },
        brand: { aqua: "#6DFBEF", green: "#10B981", blue: "#0EA5E9" },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)",
        "brand-gradient-hover": "linear-gradient(135deg, #059669 0%, #0284C7 100%)",
        "brand-soft": "linear-gradient(135deg, #ECFDF5 0%, #F0F9FF 100%)",
        "login-pastel": "linear-gradient(145deg, #D1FAE5 0%, #E0F2FE 55%, #CCFBF1 100%)",
        "footer-deep": "linear-gradient(135deg, #064E3B 0%, #0C4A6E 100%)",
        "hero-glow": "radial-gradient(circle at 12% 18%, rgba(110,231,183,.22) 0%, transparent 42%), radial-gradient(circle at 88% 22%, rgba(125,211,252,.25) 0%, transparent 45%)",
      },
      fontFamily: { sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "sans-serif"] },
      fontSize: {
        eyebrow: ["11px", { lineHeight: "1.3", letterSpacing: "1px", fontWeight: "600" }],
        title: ["28px", { lineHeight: "1.25", letterSpacing: "-0.6px", fontWeight: "700" }],
        kpi: ["40px", { lineHeight: "1.2", letterSpacing: "-0.8px", fontWeight: "700" }],
        hero: ["56px", { lineHeight: "1.12", letterSpacing: "-1.4px", fontWeight: "700" }],
        h2: ["36px", { lineHeight: "1.2", letterSpacing: "-0.8px", fontWeight: "700" }],
      },
      borderRadius: { panel: "12px" },
      keyframes: {
        reveal: { "0%": { opacity: "0", transform: "translateY(-14px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        zoomIn: { "0%": { opacity: "0", transform: "scale(.82)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        nudge: {
          "0%, 100%": { transform: "rotate(0) scale(1)" },
          "15%": { transform: "rotate(-12deg) scale(1.08)" },
          "30%": { transform: "rotate(10deg) scale(1.08)" },
          "45%": { transform: "rotate(-6deg) scale(1.04)" },
          "60%": { transform: "rotate(3deg)" },
        },
      },
      animation: {
        nudge: "nudge 1.2s ease-in-out 1",
        reveal: "reveal .6s cubic-bezier(.22,1,.36,1) both",
        "zoom-in": "zoomIn .7s cubic-bezier(.22,1,.36,1) both",
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
        lift: "0 14px 30px -8px rgba(16, 185, 129, 0.28), 0 8px 20px -6px rgba(14, 165, 233, 0.28)",
        brand: "0 4px 16px rgba(16, 185, 129, 0.32)",
        "brand-hover": "0 6px 22px rgba(14, 165, 233, 0.42)",
        focus: "0 0 0 3px rgba(56, 189, 248, 0.35)",
      },
    },
  },
  plugins: [],
};
