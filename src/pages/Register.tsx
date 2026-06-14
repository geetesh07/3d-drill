import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Warning, SpinnerGap } from "@phosphor-icons/react";
import { AuthLayout, Field } from "@/components/site/AuthLayout";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const { signUp, enabled } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      await signUp(name, email, password);
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start designing tools in minutes."
      footer={
        <>
          Already have one?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {!enabled && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-border bg-card px-3.5 py-3 text-sm text-muted-foreground">
          <Warning size={18} className="mt-0.5 shrink-0 text-primary" />
          <span>Sign-up isn't switched on yet. The designer is already free to use — <Link to="/app" className="text-primary hover:underline">open it here</Link>.</span>
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Full name" id="name" autoComplete="name" placeholder="Rahul Deshmukh" value={name} onChange={setName} />
        <Field label="Email" id="email" type="email" autoComplete="email" placeholder="you@studio.com" value={email} onChange={setEmail} />
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-lg border border-input bg-background px-3.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
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
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
