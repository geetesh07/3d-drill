import { createContext, useContext, useState, type ReactNode } from "react";
import { config } from "@/lib/config";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  enabled: boolean;
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export const useAuth = (): AuthState => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};

/**
 * Auth provider. The signIn/signUp methods are SEAMS — when a backend is wired,
 * implement them here and set config.authEnabled = true. Until then they throw a
 * clear "not enabled" error that the auth pages surface gracefully.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const notEnabled = async (): Promise<never> => {
    throw new Error("Accounts aren't enabled yet — this is coming soon.");
  };

  const value: AuthState = {
    enabled: config.authEnabled,
    user,
    isAuthenticated: !!user,
    signIn: config.authEnabled ? notEnabled : notEnabled,
    signUp: config.authEnabled ? notEnabled : notEnabled,
    signOut: () => setUser(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
