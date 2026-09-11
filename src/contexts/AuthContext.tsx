import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
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

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [customUser, setCustomUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const googleInitialized = useRef(false);

  // Initialize Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setLoading(false);
      return;
    }

    const checkGoogle = setInterval(() => {
      if (window.google?.accounts?.id && !googleInitialized.current) {
        googleInitialized.current = true;
        clearInterval(checkGoogle);
        setLoading(false);
      }
    }, 100);

    // Fallback: stop waiting after 3s
    const timeout = setTimeout(() => {
      clearInterval(checkGoogle);
      setLoading(false);
    }, 3000);

    return () => {
      clearInterval(checkGoogle);
      clearTimeout(timeout);
    };
  }, []);

  // Supabase session listener
  useEffect(() => {
    if (!supabase || !supabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleCredential = useCallback(async (response: { credential: string }) => {
    try {
      const res = await fetch("/api/user-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login-google", credential: response.credential })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google sign in failed.");
      if (data.token) {
        localStorage.setItem("maurya_user_token", data.token);
      }
      setCustomUser(data.user);
      window.location.hash = "#/home";
    } catch (err) {
      console.error("Google login error:", err);
      alert(err instanceof Error ? err.message : "Google sign in failed.");
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // If Google GIS is loaded and Client ID is set, use it
    if (GOOGLE_CLIENT_ID && window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true
      });
      window.google.accounts.id.prompt();
      return;
    }

    // Fallback: Supabase Google OAuth
    if (supabase && supabaseConfigured) {
      const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL?.trim() || window.location.origin;
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${siteUrl}#/home` }
      });
      return;
    }

    // Dev mock — no Google configured
    alert("Google login not configured. Set VITE_GOOGLE_CLIENT_ID in .env");
  }, [handleGoogleCredential]);

  const signInWithEmail = async (email: string, password: string) => {
    const res = await fetch("/api/user-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login-email", email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Email sign in failed.");
    if (data.requiresPasswordSetup) {
      return { requiresPasswordSetup: true, userId: data.userId, email: data.email, message: data.message };
    }
    if (data.token) {
      localStorage.setItem("maurya_user_token", data.token);
    }
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
    if (data.token) {
      localStorage.setItem("maurya_user_token", data.token);
    }
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
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    localStorage.removeItem("maurya_user_token");
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
