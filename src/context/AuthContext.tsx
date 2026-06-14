import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { config } from "@/lib/config";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  enabled: boolean;
  ready: boolean;
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

/*
 * Functional CLIENT-SIDE auth (localStorage) so the SAAS gate works today.
 * This is NOT secure — passwords live in the browser. It's a drop-in seam:
 * replace loadUsers/saveUsers/signIn/signUp with a real backend (Supabase,
 * Clerk, Auth.js) when ready. The rest of the app already depends only on the
 * AuthState shape below.
 */
const USERS_KEY = "nts_users";
const SESSION_KEY = "nts_session";

type StoredUser = AuthUser & { pwd: string };

const obfuscate = (s: string) => btoa(unescape(encodeURIComponent(s))); // demo only
const loadUsers = (): Record<string, StoredUser> => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
};
const saveUsers = (u: Record<string, StoredUser>) => localStorage.setItem(USERS_KEY, JSON.stringify(u));
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  // Restore session on load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const persist = (u: AuthUser) => {
    setUser(u);
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
  };

  const signUp = async (name: string, email: string, password: string) => {
    await delay(450);
    const key = email.trim().toLowerCase();
    if (!key || !name.trim()) throw new Error("Please fill in every field.");
    const users = loadUsers();
    if (users[key]) throw new Error("An account with that email already exists.");
    const u: StoredUser = { id: crypto.randomUUID(), name: name.trim(), email: key, pwd: obfuscate(password) };
    users[key] = u;
    saveUsers(users);
    persist({ id: u.id, name: u.name, email: u.email });
  };

  const signIn = async (email: string, password: string) => {
    await delay(450);
    const key = email.trim().toLowerCase();
    const users = loadUsers();
    const u = users[key];
    if (!u || u.pwd !== obfuscate(password)) throw new Error("Wrong email or password.");
    persist({ id: u.id, name: u.name, email: u.email });
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const value: AuthState = {
    enabled: config.authEnabled,
    ready,
    user,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
