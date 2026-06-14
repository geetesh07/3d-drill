import { Link } from "react-router-dom";
import { BrandMark } from "./BrandMark";
import { config } from "@/lib/config";

/** Split auth shell: form on the left, brand panel on the right. */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[100dvh] grid-cols-1 bg-background lg:grid-cols-2">
      <div className="flex flex-col px-5 py-8 md:px-12">
        <Link to="/" className="inline-flex w-fit">
          <BrandMark />
        </Link>
        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-sm py-12">
            <h1 className="text-3xl font-semibold tracking-tighter text-foreground">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-border bg-card/40 lg:block">
        <div className="bg-blueprint absolute inset-0" />
        <div className="absolute left-[-10%] top-1/3 h-[50vh] w-[50vh] rounded-full bg-primary/10 blur-[120px]" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <p className="kicker">{config.brand.name}</p>
          <p className="mt-4 max-w-[34ch] text-2xl font-medium leading-snug tracking-tight text-foreground">
            “Parameters in, a manufacturable cutting tool out — STEP and drawing included.”
          </p>
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  id,
  type = "text",
  placeholder,
  autoComplete,
  value,
  onChange,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-lg border border-input bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
