import { Link } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";
import { BrandMark } from "./BrandMark";

/** Slim chrome for the application (the designer) — distinct from marketing nav. */
export function AppLayout() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <Link to="/">
              <BrandMark />
            </Link>
            <span className="hidden font-mono text-xs text-muted-foreground sm:inline">/ drill designer</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/pricing" className="hidden rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
              Pricing
            </Link>
            <Link
              to="/login"
              className="group inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-foreground/5"
            >
              Account
              <ArrowUpRight size={14} weight="bold" />
            </Link>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
