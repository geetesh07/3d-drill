import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { List, X, ArrowUpRight } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { BrandMark } from "./BrandMark";

const LINKS = [
  { label: "Product", to: "/#product" },
  { label: "Pricing", to: "/pricing" },
  { label: "Drawings", to: "/#drawings" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`mx-auto flex max-w-[1400px] items-center justify-between px-5 transition-all duration-300 md:px-8 ${
          scrolled ? "my-2.5" : "my-4"
        }`}
      >
        <div
          className={`flex w-full items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 ${
            scrolled ? "glass" : "border border-transparent"
          }`}
        >
          <Link to="/" className="shrink-0">
            <BrandMark />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.to}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              to="/login"
              className="rounded-lg px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              to="/app"
              className="group inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-transform active:translate-y-px"
            >
              Open the app
              <ArrowUpRight size={15} weight="bold" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className="mx-4 mt-1 rounded-2xl glass p-4 md:hidden"
          >
            <div className="flex flex-col gap-1">
              {LINKS.map((l) => (
                <a key={l.label} href={l.to} className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-foreground/5">
                  {l.label}
                </a>
              ))}
              <div className="my-2 h-px bg-border" />
              <Link to="/login" className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-foreground/5">
                Sign in
              </Link>
              <Link to="/app" className="mt-1 rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-foreground">
                Open the app
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
