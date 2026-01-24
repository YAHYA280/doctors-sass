"use client";

import { createContext, useContext, ReactNode, useState, useCallback } from "react";
import { MOCK_DOCTOR, MOCK_USERS, IS_MOCK_MODE } from "@/lib/mock-data";

// Demo session type matching NextAuth structure
interface DemoUser {
  id: string;
  email: string;
  role: string;
  doctorId?: string;
  doctorSlug?: string;
  subscriptionPlan?: string;
}

interface DemoSession {
  user: DemoUser;
  expires: string;
}

interface DemoAuthContextType {
  session: DemoSession | null;
  status: "loading" | "authenticated" | "unauthenticated";
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  isDemoMode: boolean;
}

const DemoAuthContext = createContext<DemoAuthContextType | undefined>(undefined);

// Mock sessions for demo users
const DEMO_SESSIONS: Record<string, DemoSession> = {
  doctor: {
    user: {
      id: MOCK_USERS.doctor.id,
      email: MOCK_USERS.doctor.email,
      role: MOCK_USERS.doctor.role,
      doctorId: MOCK_DOCTOR.id,
      doctorSlug: MOCK_DOCTOR.slug,
      subscriptionPlan: MOCK_DOCTOR.subscriptionPlan,
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  admin: {
    user: {
      id: MOCK_USERS.admin.id,
      email: MOCK_USERS.admin.email,
      role: MOCK_USERS.admin.role,
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

interface DemoAuthProviderProps {
  children: ReactNode;
  autoLogin?: boolean; // Auto-login as doctor for demo
}

export function DemoAuthProvider({ children, autoLogin = false }: DemoAuthProviderProps) {
  const [session, setSession] = useState<DemoSession | null>(
    autoLogin ? DEMO_SESSIONS.doctor : null
  );
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">(
    autoLogin ? "authenticated" : "unauthenticated"
  );

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Check doctor credentials
    if (email === MOCK_USERS.doctor.email && password === MOCK_USERS.doctor.password) {
      setSession(DEMO_SESSIONS.doctor);
      setStatus("authenticated");
      return true;
    }

    // Check admin credentials
    if (email === MOCK_USERS.admin.email && password === MOCK_USERS.admin.password) {
      setSession(DEMO_SESSIONS.admin);
      setStatus("authenticated");
      return true;
    }

    return false;
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  return (
    <DemoAuthContext.Provider
      value={{
        session,
        status,
        signIn,
        signOut,
        isDemoMode: true,
      }}
    >
      {children}
    </DemoAuthContext.Provider>
  );
}

export function useDemoAuth() {
  const context = useContext(DemoAuthContext);
  if (context === undefined) {
    throw new Error("useDemoAuth must be used within a DemoAuthProvider");
  }
  return context;
}

// Hook that works with both NextAuth and Demo mode
export function useDemoSession() {
  const context = useContext(DemoAuthContext);
  if (context) {
    return {
      data: context.session,
      status: context.status,
    };
  }
  // Fallback - shouldn't happen if provider is properly set up
  return {
    data: null,
    status: "unauthenticated" as const,
  };
}
