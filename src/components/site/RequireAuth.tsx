import { Navigate, useLocation } from "react-router-dom";
import { SpinnerGap } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";

/** Gate a route behind authentication. Redirects to /login, preserving intent. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { enabled, ready, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!enabled) return <>{children}</>;

  if (!ready) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <SpinnerGap size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
