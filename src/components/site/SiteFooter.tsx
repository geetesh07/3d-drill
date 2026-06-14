import { Link } from "react-router-dom";
import { BrandMark } from "./BrandMark";
import { config } from "@/lib/config";

const COLS = [
  {
    title: "Product",
    links: [
      { label: "Drill Designer", to: "/app" },
      { label: "Pricing", to: "/pricing" },
      { label: "STEP & DXF export", to: "/#drawings" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Sign in", to: "/login" },
      { label: "Create account", to: "/register" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", to: "/terms" },
      { label: "Privacy", to: "/privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <BrandMark />
            <p className="mt-4 max-w-[28ch] text-sm leading-relaxed text-muted-foreground">
              {config.brand.tagline} Built for tool & cutter makers.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <h3 className="kicker">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <p className="font-mono">© {new Date().getFullYear()} {config.brand.name}. All rights reserved.</p>
          <p className="font-mono">Modeled on OpenCASCADE · Rendered in WebGL</p>
        </div>
      </div>
    </footer>
  );
}
