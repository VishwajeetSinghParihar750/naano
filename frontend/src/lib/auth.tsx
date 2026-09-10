import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, api } from "./api";

export type Role = "creator" | "brand";

export type User = {
  id: string;
  email: string;
  role: Role;
};

export type AuthStatus = "loading" | "authed" | "anon";

type RegisterInput = {
  email: string;
  password: string;
  role: Role;
  name?: string;
};

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    api
      .get<{ user: User }>("/me")
      .then((data) => {
        if (cancelled) return;
        setUser(data.user);
        setStatus("authed");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // 401 is the normal "not signed in" case — never a visible error.
        if (!(err instanceof ApiError) || err.status !== 401) {
          console.warn("Failed to load session", err);
        }
        setUser(null);
        setStatus("anon");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: next } = await api.post<{ user: User }>("/auth/login", {
      email,
      password,
    });
    setUser(next);
    setStatus("authed");
    return next;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { user: next } = await api.post<{ user: User }>(
      "/auth/register",
      input,
    );
    setUser(next);
    setStatus("authed");
    return next;
  }, []);

  const logout = useCallback(async () => {
    await api.post<void>("/auth/logout");
    setUser(null);
    setStatus("anon");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
