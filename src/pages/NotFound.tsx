import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-5 text-center">
      <p className="font-mono text-sm uppercase tracking-[0.3em] text-primary">404</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tighter text-foreground md:text-5xl">
        This part isn't in the library.
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The page you're after doesn't exist or moved. Let's get you back to the bench.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm text-foreground transition-colors hover:bg-foreground/5"
      >
        <ArrowLeft size={16} /> Back home
      </Link>
    </div>
  );
}
