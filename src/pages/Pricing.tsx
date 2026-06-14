import { Link } from "react-router-dom";
import { Check, ArrowUpRight } from "@phosphor-icons/react";

const TIERS = [
  {
    name: "Maker",
    price: "Free",
    note: "For trying it out",
    cta: "Open the app",
    to: "/app",
    highlight: false,
    features: ["Full parametric drill designer", "Live 3D preview", "STEP + DXF export", "Up to 5 saved designs"],
  },
  {
    name: "Workshop",
    price: "$24",
    period: "/mo",
    note: "For working tool rooms",
    cta: "Start Workshop",
    to: "/register",
    highlight: true,
    features: [
      "Everything in Maker",
      "Unlimited designs & revisions",
      "Tolerance & GD&T on drawings",
      "Batch export",
      "Priority email support",
    ],
  },
  {
    name: "Foundry",
    price: "Let's talk",
    note: "For manufacturers",
    cta: "Contact sales",
    to: "/register",
    highlight: false,
    features: ["Everything in Workshop", "ERP / PLM integration", "Custom tool families", "SSO & roles", "SLA"],
  },
];

export default function Pricing() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-36 pb-24 md:px-8">
      <div className="max-w-2xl">
        <p className="kicker">Pricing</p>
        <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tighter text-foreground md:text-6xl">
          Priced for one designer or a whole tool room.
        </h1>
        <p className="mt-4 text-muted-foreground">Start free. Upgrade when the drawings start shipping.</p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`flex flex-col rounded-3xl border p-8 ${
              t.highlight ? "border-primary/60 bg-card" : "border-border bg-card/50"
            }`}
          >
            {t.highlight && (
              <span className="mb-4 w-fit rounded-full border border-primary/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
                Most popular
              </span>
            )}
            <h2 className="text-lg font-medium tracking-tight text-foreground">{t.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.note}</p>
            <div className="mt-6 flex items-end gap-1">
              <span className="text-4xl font-semibold tracking-tighter text-foreground">{t.price}</span>
              {t.period && <span className="mb-1 text-sm text-muted-foreground">{t.period}</span>}
            </div>

            <ul className="mt-8 flex-1 space-y-3">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              to={t.to}
              className={`group mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-transform active:translate-y-px ${
                t.highlight
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-foreground hover:bg-foreground/5"
              }`}
            >
              {t.cta}
              <ArrowUpRight size={15} weight="bold" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
