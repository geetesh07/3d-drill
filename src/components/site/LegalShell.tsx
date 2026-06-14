export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-5 pt-36 pb-24 md:px-8">
      <p className="kicker">Legal</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tighter text-foreground md:text-5xl">{title}</h1>
      <p className="mt-3 font-mono text-xs text-muted-foreground">Last updated {updated}</p>
      <div className="mt-10 space-y-8">{children}</div>
    </article>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-medium tracking-tight text-foreground">{heading}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a:hover]:underline">
        {children}
      </div>
    </section>
  );
}
