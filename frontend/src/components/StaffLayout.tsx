import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useForceVietnamese } from "../i18n";
import { IconBike, IconClipboard, IconDashboard, IconLogOut, IconMenu, IconWrench, IconX } from "./Icons";
import { cx } from "./ui";

const NAV = [
  { to: "/nhan-vien", label: "Tổng quan", icon: IconDashboard, end: true },
  { to: "/nhan-vien/yeu-cau", label: "Yêu cầu & đơn thuê", icon: IconClipboard, match: ["/nhan-vien/yeu-cau", "/nhan-vien/don"] },
  { to: "/nhan-vien/xe", label: "Danh sách xe", icon: IconBike },
  { to: "/nhan-vien/bao-duong", label: "Bảo dưỡng", icon: IconWrench },
];

export function Logo({ className }: { className?: string }) {
  return (
    <img src="/images/logo.png" alt="T-Bike For Rent" className={cx("h-14 w-auto max-w-full shrink-0 self-start rounded object-contain", className)}
      onError={(e) => { const t = e.currentTarget; t.replaceWith(Object.assign(document.createElement("span"), { textContent: "T-BIKE", className: "inline-flex h-14 items-center rounded-xl btn-gradient px-3 text-xl font-bold text-white" })); }} />
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Điều hướng vận hành" className="flex h-full flex-col gap-8 border-r border-line bg-white px-6 py-6 text-ink-soft">
      <div className="space-y-4">
        <Link to="/nhan-vien" onClick={onNavigate}><Logo /></Link>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Không gian vận hành</p>
      </div>
      <ul className="space-y-2">
        {NAV.map(({ to, label, icon: Icon, end, match }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) => {
                const active = isActive || (match?.some((m) => window.location.pathname.startsWith(m)) ?? false);
                return cx(
                  "flex items-center gap-3 rounded-[10px] px-3 py-3 text-[13px] focus-visible:shadow-focus focus-visible:outline-none",
                  active ? "bg-brand-soft font-semibold text-primary ring-1 ring-primary-500/25 [&_svg]:text-accent" : "hover:bg-page hover:text-ink",
                );
              }}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="mt-auto border-t border-line pt-6">
        <p className="text-[13px] font-semibold text-ink">T-Bike Đà Nẵng</p>
        <p className="mt-2 text-xs">Thuê xe & vận hành • Phiên bản MVP</p>
      </div>
    </nav>
  );
}

export function StaffLayout({ breadcrumb, children }: { breadcrumb: string[]; children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  useForceVietnamese(); // khu van hanh luon tieng Viet
  const initials = (profile?.ho_ten ?? "?").split(" ").map((p) => p[0]).slice(-2).join("").toUpperCase();
  return (
    <div className="min-h-screen bg-page lg:flex">
      <aside className="hidden w-56 shrink-0 lg:block"><div className="sticky top-0 h-screen"><Sidebar /></div></aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64"><Sidebar onNavigate={() => setOpen(false)} /></div>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-line bg-white px-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button className="rounded p-2 text-ink lg:hidden" onClick={() => setOpen(true)} aria-label="Mở menu">{open ? <IconX /> : <IconMenu />}</button>
            <nav aria-label="Breadcrumb" className="truncate text-[13px] text-ink-muted">{["Vận hành", ...breadcrumb].join("  /  ")}</nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[13px] text-ink-muted sm:inline">{profile?.vai_tro === "ChuCuaHang" ? "Chủ cửa hàng" : "Nhân viên cửa hàng"}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{initials}</span>
            <span className="hidden text-[13px] font-semibold text-ink sm:inline">{profile?.ho_ten}</span>
            <span className="hidden h-6 w-px bg-line sm:block" />
            <button onClick={() => void signOut("manual")} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-ink-muted hover:bg-subtle focus-visible:shadow-focus focus-visible:outline-none">
              <IconLogOut size={16} /> <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1216px] space-y-6 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
