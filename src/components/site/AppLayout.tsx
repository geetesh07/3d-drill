import { Link, Outlet, useNavigate } from "react-router-dom";
import { SignOut } from "@phosphor-icons/react";
import { BrandMark } from "./BrandMark";
import { useAuth } from "@/context/AuthContext";

/** Slim chrome for the application (the designer) — distinct from marketing nav. */
export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden items-center gap-2 sm:flex">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 font-mono text-xs font-medium text-primary">
                  {user.name.trim().charAt(0).toUpperCase()}
                </span>
                <span className="text-sm text-muted-foreground">{user.name.split(" ")[0]}</span>
              </div>
            )}
            <button
              onClick={() => {
                signOut();
                navigate("/");
              }}
              className="group inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-foreground/5"
            >
              <SignOut size={15} />
              Sign out
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
