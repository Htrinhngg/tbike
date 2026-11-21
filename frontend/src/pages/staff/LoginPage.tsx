import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { useForceVietnamese } from "../../i18n";
import {
  IconArrowLeft, IconClipboard, IconCoins, IconEye, IconEyeOff, IconInfo, IconLoader, IconLock, IconMail, IconWrench,
} from "../../components/Icons";
import { Alert } from "../../components/ui";

const FEATURES = [
  { icon: IconClipboard, title: "Yêu cầu & đơn thuê tập trung", text: "Xác nhận, giao, nhận xe và theo dõi lịch trên một màn hình." },
  { icon: IconWrench, title: "ODO & bảo dưỡng tự động", text: "Ghi số km khi giao/nhận, cảnh báo khi xe đạt 2.000 km." },
  { icon: IconCoins, title: "Phụ phí trả trễ chính xác", text: "Hệ thống tự tính theo quy tắc cửa hàng, không tính tay." },
];

/** A1 · Dang nhap nhan vien (Supabase Auth) */
export function LoginPage() {
  const { status, signIn, configured, signOutReason } = useAuth();
  useForceVietnamese();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const expired = params.get("het_phien") === "1" || signOutReason === "expired" || signOutReason === "idle";
  const next = params.get("next") || "/nhan-vien";

  useEffect(() => setError(null), [email, password]);
  if (status === "ready") return <Navigate to={next.startsWith("/nhan-vien") ? next : "/nhan-vien"} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return setError("Nhập email và mật khẩu");
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đăng nhập được");
    } finally {
      setBusy(false);
    }
  }

  const field = "h-12 w-full rounded-xl border border-line bg-white pl-11 pr-4 text-[15px] text-ink placeholder:text-ink-muted/60 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 disabled:bg-subtle aria-[invalid=true]:border-danger";

  return (
    <div className="flex min-h-screen bg-page">
      {/* Panel thuong hieu */}
      <aside className="relative hidden w-[46%] max-w-[640px] overflow-hidden login-ombre lg:flex lg:flex-col">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#34D399]/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#38BDF8]/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="relative flex flex-1 flex-col justify-between p-12 xl:p-14">
          <div className="inline-flex self-start rounded-2xl bg-white px-5 py-3 shadow-lg shadow-black/10">
            <img src="/images/logo.png" alt="T-Bike For Rent" className="h-11 w-auto object-contain" />
          </div>
          <div className="max-w-md space-y-8">
            <div>
              <p className="text-eyebrow font-bold uppercase tracking-[0.18em] text-[#6EE7B7]">Không gian vận hành</p>
              <h1 className="mt-3 text-[34px] font-bold leading-tight tracking-tight">Vận hành cho thuê xe gọn hơn mỗi ngày</h1>
              <p className="mt-3 text-[15px] text-white/80">Dành cho chủ cửa hàng và nhân viên T-Bike Đà Nẵng.</p>
            </div>
            <ul className="space-y-5">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#6EE7B7] ring-1 ring-white/20 backdrop-blur"><Icon size={20} /></span>
                  <span><span className="block text-[15px] font-semibold">{title}</span><span className="text-sm text-white/75">{text}</span></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>110 Trần Văn Dư, Ngũ Hành Sơn, Đà Nẵng</span>
            <span>Phiên bản MVP</span>
          </div>
        </div>
      </aside>

      {/* Form */}
      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-6 py-5 sm:px-10">
          <img src="/images/logo.png" alt="T-Bike For Rent" className="h-10 w-auto object-contain lg:invisible" />
          <Link to="/" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-ink-muted hover:bg-white hover:text-primary">
            <IconArrowLeft size={16} /> Về trang khách
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-10">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl btn-gradient text-white shadow-brand"><IconLock size={22} /></span>
              <h2 className="mt-5 text-[28px] font-bold tracking-tight text-ink">Đăng nhập</h2>
              <p className="mt-1.5 text-[15px] text-ink-muted">Dùng tài khoản do chủ cửa hàng cấp để tiếp tục.</p>
            </div>
            <form onSubmit={onSubmit} noValidate className="space-y-5">
              {!configured && <Alert tone="danger" title="Chưa cấu hình Supabase">Đặt VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong frontend/.env rồi khởi động lại.</Alert>}
              {expired && !error && <Alert tone="warning" title="Phiên đăng nhập đã hết hạn">Đăng nhập lại để tiếp tục — dữ liệu đã lưu không bị mất.</Alert>}
              {error && <Alert tone="danger" title={error}>Kiểm tra lại email và mật khẩu.</Alert>}
              <div className="space-y-2">
                <label htmlFor="email" className="text-[13px] font-semibold text-ink">Email</label>
                <div className="relative">
                  <IconMail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input id="email" type="email" autoComplete="username" placeholder="ten@tbike.vn" className={field} value={email} disabled={busy} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-[13px] font-semibold text-ink">Mật khẩu</label>
                <div className="relative">
                  <IconLock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input id="password" type={show ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" className={`${field} pr-12`}
                    value={password} disabled={busy} aria-invalid={!!error} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted hover:bg-subtle hover:text-ink focus-visible:shadow-focus focus-visible:outline-none">
                    {show ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-ink-muted">Quên mật khẩu? Liên hệ chủ cửa hàng để được cấp lại.</p>
              </div>
              <button type="submit" disabled={busy || !configured}
                className="btn-gradient flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold focus-visible:shadow-focus focus-visible:outline-none">
                {busy && <IconLoader className="animate-spin" size={18} />}{busy ? "Đang đăng nhập…" : "Đăng nhập"}
              </button>
            </form>
            <div className="mt-8 flex items-start gap-2.5 rounded-xl border border-line bg-white p-4 text-[13px] text-ink-muted">
              <IconInfo size={16} className="mt-0.5 shrink-0 text-primary" />
              <span>Khách thuê xe không cần tài khoản — theo dõi yêu cầu tại trang <Link to="/tra-cuu" className="font-semibold text-primary underline">Tra cứu yêu cầu</Link>.</span>
            </div>
          </div>
        </div>
        <p className="pb-6 text-center text-xs text-ink-muted">© 2026 T-Bike Đà Nẵng</p>
      </main>
    </div>
  );
}
