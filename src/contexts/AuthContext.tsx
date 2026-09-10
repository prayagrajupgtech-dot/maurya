import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface CustomUser {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  role?: string;
  status?: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | CustomUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<any>;
  signInWithMobile: (phone: string, password: string) => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [customUser, setCustomUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !supabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase || !supabaseConfigured) {
      // Mock Google login when Supabase OAuth is not active in dev
      setCustomUser({ id: "g-user-101", email: "user@example.com", name: "Google User", role: "user" });
      window.location.hash = "#/home";
      return;
    }
    const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL?.trim() || window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}#/home`
      }
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    const res = await fetch("/api/user-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login-email", email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Email sign in failed.");
    setCustomUser(data.user);
    return data;
  };

  const signInWithMobile = async (phone: string, password: string) => {
    const res = await fetch("/api/user-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login-mobile", phone, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Mobile sign in failed.");
    setCustomUser(data.user);
    return data;
  };

  const resetPassword = async (email: string) => {
    const res = await fetch("/api/user-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "forgot-password", email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Password reset request failed.");
    return data;
  };

  const signOut = async () => {
    if (supabase && supabaseConfigured) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setCustomUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? customUser,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signInWithMobile,
        resetPassword,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
