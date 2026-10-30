import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { setLogoutHandler } from "../api/client";
import * as session from "./session";
import type { User } from "./session";

type Status = "loading" | "authed" | "anon";

interface AuthValue {
  status: Status;
  user: User | null;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // A dead refresh token mid-session drops us back to the login screen.
    setLogoutHandler(() => {
      setUser(null);
      setStatus("anon");
    });
    session.loadSession().then((u) => {
      setUser(u);
      setStatus(u ? "authed" : "anon");
    });
  }, []);

  const value: AuthValue = {
    status,
    user,
    register: async (email, password) => {
      setUser(await session.register(email, password));
      setStatus("authed");
    },
    login: async (email, password) => {
      setUser(await session.login(email, password));
      setStatus("authed");
    },
    logout: async () => {
      await session.logout();
      setUser(null);
      setStatus("anon");
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
