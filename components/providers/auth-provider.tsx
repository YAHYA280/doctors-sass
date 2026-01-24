"use client";

import { SessionProvider, useSession as useNextAuthSession } from "next-auth/react";
import { ReactNode, createContext, useContext } from "react";
import { IS_MOCK_MODE, MOCK_DOCTOR, MOCK_USERS } from "@/lib/mock-data";

// Unified session type
interface UnifiedUser {
  id: string;
  email: string;
  role: string;
  doctorId?: string;
  doctorSlug?: string;
  subscriptionPlan?: string;
  image?: string;
}

interface UnifiedSession {
  user: UnifiedUser;
  expires: string;
}

interface AuthContextType {
  session: UnifiedSession | null;
  status: "loading" | "authenticated" | "unauthenticated";
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo session for mock mode - auto logged in as doctor
const DEMO_SESSION: UnifiedSession = {
  user: {
    id: MOCK_USERS.doctor.id,
    email: MOCK_USERS.doctor.email,
    role: MOCK_USERS.doctor.role,
    doctorId: MOCK_DOCTOR.id,
    doctorSlug: MOCK_DOCTOR.slug,
    subscriptionPlan: MOCK_DOCTOR.subscriptionPlan,
  },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

interface AuthProviderProps {
  children: ReactNode;
}

// Demo mode provider - no NextAuth needed
function DemoModeProvider({ children }: AuthProviderProps) {
  return (
    <AuthContext.Provider
      value={{
        session: DEMO_SESSION,
        status: "authenticated",
        isDemoMode: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Real auth provider wrapper
function RealAuthWrapper({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <RealAuthContextProvider>{children}</RealAuthContextProvider>
    </SessionProvider>
  );
}

function RealAuthContextProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useNextAuthSession();

  const unifiedSession: UnifiedSession | null = session
    ? {
        user: {
          id: session.user?.id as string,
          email: session.user?.email as string,
          role: session.user?.role as string,
          doctorId: session.user?.doctorId as string | undefined,
          doctorSlug: session.user?.doctorSlug as string | undefined,
          subscriptionPlan: session.user?.subscriptionPlan as string | undefined,
          image: session.user?.image as string | undefined,
        },
        expires: session.expires,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        session: unifiedSession,
        status,
        isDemoMode: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: AuthProviderProps) {
  // In demo/mock mode, use demo provider (no NextAuth)
  if (IS_MOCK_MODE) {
    return <DemoModeProvider>{children}</DemoModeProvider>;
  }

  // In production mode, use NextAuth
  return <RealAuthWrapper>{children}</RealAuthWrapper>;
}

// Unified hook to get auth state
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Backward compatible hook matching NextAuth's useSession
export function useUnifiedSession() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Fallback for when used outside provider
    return {
      data: null,
      status: "unauthenticated" as const,
    };
  }
  return {
    data: context.session,
    status: context.status,
  };
}
