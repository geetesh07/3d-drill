import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { ArrowUpRight, Cube, Ruler, Wrench, ShieldCheck } from "@phosphor-icons/react";
import { HeroDrill } from "@/components/site/HeroDrill";
import { config } from "@/lib/config";

const fade: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 90, damping: 20, delay: i * 0.07 },
  }),
};

const MARQUEE = ["STEP / AP214", "DXF", "HSS", "Carbide", "Cobalt", "2 & 3 flute", "118° point", "Helix 0–60°", "Watertight B-rep", "OpenCASCADE"];

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-mono text-2xl text-foreground md:text-3xl">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="relative">
      {/* ---------------- Hero ---------------- */}
      <section className="relative min-h-[100dvh] overflow-hidden">
        <div className="bg-blueprint pointer-events-none absolute inset-0 [mask-image:radial-gradient(120%_80%_at_70%_0%,black,transparent)]" />
        <div className="absolute right-[-10%] top-[-10%] h-[60vh] w-[60vh] rounded-full bg-primary/10 blur-[120px]" />

        <div className="relative mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-8 px-5 pt-36 pb-16 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pt-40">
          <div>
            <motion.p variants={fade} initial="hidden" animate="show" className="kicker">
              NTS Tool Solutions · Drill Designer
            </motion.p>
            <motion.h1
              variants={fade}
              initial="hidden"
              animate="show"
              custom={1}
              className="mt-5 text-balance text-5xl font-semibold leading-[0.98] tracking-tighter text-foreground md:text-7xl"
            >
              Design cutting tools.<br />
              Get a real CAD model.
            </motion.h1>
            <motion.p
              variants={fade}
              initial="hidden"
              animate="show"
              custom={2}
              className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted-foreground"
            >
              Type in diameters, flutes, helix and point angle. NTS builds an exact, watertight
              solid on a real CAD kernel — then hands you a STEP file and a 2D drawing generated
              from the model itself. No desktop CAD.
            </motion.p>

            <motion.div variants={fade} initial="hidden" animate="show" custom={3} className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/app"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-transform active:translate-y-px"
              >
                Open the designer
                <ArrowUpRight size={16} weight="bold" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm text-foreground transition-colors hover:bg-foreground/5"
              >
                See pricing
              </Link>
            </motion.div>

            <motion.div variants={fade} initial="hidden" animate="show" custom={4} className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-border/70 pt-7">
              <Stat value="±1µm" label="Kernel tolerance" />
              <Stat value="2" label="Export formats" />
              <Stat value="0" label="Broken solids" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[44vh] min-h-[320px] lg:h-[72vh]"
          >
            <HeroDrill className="h-full w-full" />
          </motion.div>
        </div>

        {/* Kinetic marquee */}
        <div className="relative border-y border-border/70 py-4">
          <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
            <motion.div
              className="flex shrink-0 items-center gap-10 pr-10"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 28, ease: "linear", repeat: Infinity }}
            >
              {[...MARQUEE, ...MARQUEE].map((m, i) => (
                <span key={i} className="whitespace-nowrap font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {m}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---------------- Bento ---------------- */}
      <section id="product" className="mx-auto max-w-[1400px] px-5 py-24 md:px-8 md:py-32">
        <div className="max-w-2xl">
          <p className="kicker">Why it's different</p>
          <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tighter text-foreground md:text-5xl">
            A real CAD kernel, not a mesh trick.
          </h2>
          <p className="mt-4 max-w-[60ch] text-muted-foreground">
            Most browser tools fake geometry with triangles that leak and tear. NTS builds true
            boundary-representation solids — the same math desktop CAD uses.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          <BentoTile
            className="md:col-span-2"
            icon={<Cube size={22} weight="duotone" />}
            title="Exact solids that don't break"
            body="Shank, chamfer, fluted body and point are fused into one watertight B-rep solid. Change any parameter and it rebuilds cleanly — no gaps, no flipped normals."
          />
          <BentoTile
            icon={<ShieldCheck size={22} weight="duotone" />}
            title="Real STEP"
            body="Export an ISO-10303 STEP file that opens natively in SolidWorks, Fusion, and Mastercam — not a renamed text stub."
          />
          <BentoTile
            icon={<Ruler size={22} weight="duotone" />}
            title="2D drawings from the model"
            body="Side and end views are projected straight from the solid to DXF, so the drawing always matches the part."
          />
          <BentoTile
            className="md:col-span-2"
            icon={<Wrench size={22} weight="duotone" />}
            title="Helical flutes, fully parametric"
            body="Two- or three-flute geometry swept along a true helix — drive the helix angle, point angle, and flute length and watch the cutting edges follow."
          />
        </div>
      </section>

      {/* ---------------- Drawings ---------------- */}
      <section id="drawings" className="border-y border-border/70 bg-card/30">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 px-5 py-24 md:px-8 lg:grid-cols-2">
          <div>
            <p className="kicker">From 3D to the shop floor</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tighter text-foreground md:text-5xl">
              The drawing is generated, never drawn.
            </h2>
            <p className="mt-4 max-w-[55ch] text-muted-foreground">
              Hidden-line projection takes the exact solid and produces orthographic views — outline,
              flute profile, and cross-section — with centerlines and a title block. One source of
              truth, zero hand-drafting.
            </p>
            <Link
              to="/app"
              className="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary"
            >
              Generate a drawing
              <ArrowUpRight size={16} weight="bold" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <div className="rounded-3xl border border-border bg-background/60 p-6">
            <DrawingArt />
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="mx-auto max-w-[1400px] px-5 py-28 text-center md:px-8">
        <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tighter text-foreground md:text-6xl">
          Your next drill is a few parameters away.
        </h2>
        <Link
          to="/app"
          className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-transform active:translate-y-px"
        >
          Open the designer
          <ArrowUpRight size={16} weight="bold" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </section>
    </div>
  );
}

function BentoTile({
  icon,
  title,
  body,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <motion.div
      variants={fade}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className={`group rounded-3xl border border-border bg-card p-8 transition-colors hover:border-foreground/20 ${className}`}
    >
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-primary">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-medium tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-muted-foreground">{body}</p>
    </motion.div>
  );
}

/** Inline SVG line-art evoking a generated drill drawing (side + end view). */
function DrawingArt() {
  return (
    <svg viewBox="0 0 520 300" className="w-full" fill="none" role="img" aria-label="Drill engineering drawing">
      <defs>
        <pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M26 0H0V26" stroke="hsl(var(--foreground) / 0.05)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="520" height="300" fill="url(#grid)" />
      {/* Side view */}
      <line x1="40" y1="120" x2="330" y2="120" stroke="hsl(var(--primary))" strokeDasharray="10 3 2 3" strokeWidth="1" opacity="0.7" />
      <rect x="40" y="104" width="120" height="32" stroke="hsl(var(--foreground) / 0.8)" strokeWidth="1.4" />
      <rect x="160" y="100" width="120" height="40" stroke="hsl(var(--foreground) / 0.8)" strokeWidth="1.4" />
      <path d="M280 100 L320 120 L280 140" stroke="hsl(var(--foreground) / 0.8)" strokeWidth="1.4" fill="none" />
      {/* flute helix hints */}
      <path d="M166 102 C 190 118, 214 122, 238 138" stroke="hsl(var(--foreground) / 0.45)" strokeWidth="1" />
      <path d="M166 138 C 190 122, 214 118, 238 102" stroke="hsl(var(--foreground) / 0.45)" strokeWidth="1" />
      <text x="40" y="170" className="font-mono" fill="hsl(var(--muted-foreground))" fontSize="9" letterSpacing="2">SIDE VIEW</text>
      {/* End view */}
      <circle cx="430" cy="120" r="44" stroke="hsl(var(--foreground) / 0.8)" strokeWidth="1.4" />
      <line x1="430" y1="64" x2="430" y2="176" stroke="hsl(var(--primary))" strokeDasharray="10 3 2 3" strokeWidth="1" opacity="0.7" />
      <line x1="374" y1="120" x2="486" y2="120" stroke="hsl(var(--primary))" strokeDasharray="10 3 2 3" strokeWidth="1" opacity="0.7" />
      <path d="M430 120 L408 100 M430 120 L452 100" stroke="hsl(var(--foreground) / 0.55)" strokeWidth="1.2" />
      <text x="392" y="200" className="font-mono" fill="hsl(var(--muted-foreground))" fontSize="9" letterSpacing="2">END VIEW</text>
      {/* dim line */}
      <line x1="40" y1="240" x2="320" y2="240" stroke="hsl(var(--foreground) / 0.35)" strokeWidth="1" />
      <path d="M40 236 L40 244 M320 236 L320 244" stroke="hsl(var(--foreground) / 0.35)" strokeWidth="1" />
      <text x="170" y="234" className="font-mono" fill="hsl(var(--muted-foreground))" fontSize="9">Ø10 × 100</text>
    </svg>
  );
}
