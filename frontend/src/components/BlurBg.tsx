/** Anh nen lam mo + lop man trang trong. Dat lam con dau tien cua 1 khoi "relative overflow-hidden". */
export function BlurBg({ src, veil }: { src: string; veil?: string }) {
  return (
    <div className="blur-bg" aria-hidden="true">
      <div className="blur-bg-img" style={{ backgroundImage: `url(${src})` }} />
      <div className="blur-bg-veil" style={veil ? { background: veil } : undefined} />
    </div>
  );
}
