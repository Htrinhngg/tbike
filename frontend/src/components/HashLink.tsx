import { useEffect, type MouseEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

/** Cuon toi phan tu theo id (bu chieu cao header sticky bang scroll-margin tren section). */
export function scrollToId(id: string, smooth = true) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  return !!el;
}

/** Link toi 1 muc tren trang chu (vd "/#quy-trinh"): dang o trang chu thi cuon muot, khong tai lai trang. */
export function HashLink({ to, className, children, onClick }: { to: string; className?: string; children: ReactNode; onClick?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [path, hash] = to.split("#");
  function handle(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.();
    if (location.pathname === (path || "/") && hash) {
      e.preventDefault();
      scrollToId(hash);
      if (location.hash !== `#${hash}`) navigate({ pathname: path || "/", hash }, { replace: false });
    }
  }
  return <Link to={to} className={className} onClick={handle}>{children}</Link>;
}

/** Dat o trang dich: khi vao trang voi #hash (tu trang khac) thi cuon toi muc do sau khi render. */
export function useScrollToHash() {
  const { hash, key } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    // Doi noi dung (anh, danh sach xe) render xong roi moi cuon
    const t = window.setTimeout(() => scrollToId(id, false), 50);
    return () => window.clearTimeout(t);
  }, [hash, key]);
}
