/** NTS brand mark — a precision/drill glyph + wordmark. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="0.5" y="0.5" width="23" height="23" rx="6" stroke="hsl(var(--foreground) / 0.18)" />
        <path d="M12 4.5 L12 19.5" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8.5 7 C 13.5 9, 13.5 11, 8.5 13 C 13.5 15, 13.5 17, 8.5 19" stroke="hsl(var(--foreground) / 0.7)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <path d="M12 19.5 L 9.6 17 M12 19.5 L 14.4 17" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className="font-mono text-sm font-medium tracking-[0.18em] text-foreground">NTS</span>
    </span>
  );
}
