import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Warning, SpinnerGap } from "@phosphor-icons/react";
import { AuthLayout, Field } from "@/components/site/AuthLayout";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { signIn, enabled } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Pick up where you left off."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {!enabled && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-border bg-card px-3.5 py-3 text-sm text-muted-foreground">
          <Warning size={18} className="mt-0.5 shrink-0 text-primary" />
          <span>Accounts aren't switched on yet. The app is open — just <Link to="/app" className="text-primary hover:underline">open the designer</Link>.</span>
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Email" id="email" type="email" autoComplete="email" placeholder="you@studio.com" value={email} onChange={setEmail} />
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
            <span className="text-xs text-muted-foreground">Forgot?</span>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-lg border border-input bg-background px-3.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <Warning size={15} /> {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-transform active:translate-y-px disabled:opacity-60"
        >
          {busy ? <SpinnerGap size={16} className="animate-spin" /> : null}
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}
