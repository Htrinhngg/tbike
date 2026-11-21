import { Link } from "react-router-dom";
import { useScrollToHash } from "../../components/HashLink";
import { IconFileText, IconPhone } from "../../components/Icons";
import { PublicLayout } from "../../components/PublicLayout";
import { POLICY, POLICY_UPDATED } from "../../content/store";
import { useI18n } from "../../i18n";
import { STORE_PHONE_DISPLAY, STORE_PHONE_INTL, whatsappHref } from "../../lib/contacts";

/** Trang Chinh sach thue xe (song ngu) – noi dung o src/content/store.ts */
export function PolicyPage() {
  const { t, lang } = useI18n();
  useScrollToHash();
  return (
    <PublicLayout>
      <div className="bg-page">
        <div className="mx-auto max-w-[1200px] px-5 py-10 lg:py-16">
          <div className="flex items-start gap-4">
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary sm:flex"><IconFileText size={24} /></span>
            <div>
              <p className="text-eyebrow uppercase text-primary">T-Bike Đà Nẵng • {POLICY_UPDATED[lang]}</p>
              <h1 className="mt-2 text-[32px] font-bold tracking-tight text-ink lg:text-h2">{t("policy.title")}</h1>
              <p className="mt-2 text-base text-ink-muted">{t("policy.sub")}</p>
            </div>
          </div>
          <div className="mt-10 grid gap-8 lg:grid-cols-[260px_1fr]">
            <nav aria-label={t("policy.toc")} className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-eyebrow uppercase text-ink-muted">{t("policy.toc")}</p>
              <ol className="mt-3 space-y-1 border-l border-line">
                {POLICY.map((s) => (
                  <li key={s.id}><a href={`#${s.id}`} className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-sm text-ink-muted hover:border-primary hover:text-primary">{s.title[lang]}</a></li>
                ))}
              </ol>
            </nav>
            <div className="space-y-5">
              {POLICY.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-24 card-pastel p-6 lg:p-8">
                  <h2 className="text-xl font-semibold text-ink">{s.title[lang]}</h2>
                  <ul className="mt-4 space-y-3">
                    {s.items.map((it, i) => (
                      <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gradient" aria-hidden="true" />{it[lang]}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              <div className="flex flex-col gap-4 cta-band rounded-2xl p-6 sm:flex-row sm:items-center lg:p-8">
                <div className="flex-1">
                  <p className="text-lg font-semibold">{t("policy.contact")}</p>
                  <p className="mt-1 text-sm text-white/85">{t("policy.contactD")}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a href={`tel:${STORE_PHONE_INTL}`} className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-white px-4 text-sm font-semibold text-primary"><IconPhone size={16} />{STORE_PHONE_DISPLAY}</a>
                  <a href="https://zalo.me/0816243243" target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-[10px] border border-white/70 px-4 text-sm font-semibold">Zalo</a>
                  <a href={whatsappHref("0816243243")} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-[10px] border border-white/70 px-4 text-sm font-semibold">WhatsApp</a>
                </div>
              </div>
              <p className="text-center"><Link to="/thue-xe" className="text-sm font-semibold text-primary underline">{t("cta.rent")}</Link></p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
