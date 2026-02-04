import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { MOCK_USERS, MOCK_DOCTOR, IS_MOCK_MODE_SERVER } from "@/lib/mock-data";

// Conditionally import database only if not in mock mode
let db: any = null;
let users: any = null;
let doctors: any = null;
let eq: any = null;

if (!IS_MOCK_MODE_SERVER) {
  try {
    const dbModule = require("@/lib/db");
    const schemaModule = require("@/lib/db/schema");
    const drizzleModule = require("drizzle-orm");
    db = dbModule.db;
    users = schemaModule.users;
    doctors = schemaModule.doctors;
    eq = drizzleModule.eq;
  } catch (e) {
    console.log("Database not available, using mock mode");
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Mock mode authentication
        if (IS_MOCK_MODE_SERVER || !db) {
          // Check doctor credentials
          if (
            credentials.email === MOCK_USERS.doctor.email &&
            credentials.password === MOCK_USERS.doctor.password
          ) {
            return {
              id: MOCK_USERS.doctor.id,
              email: MOCK_USERS.doctor.email,
              role: MOCK_USERS.doctor.role,
              doctorId: MOCK_DOCTOR.id,
              doctorSlug: MOCK_DOCTOR.slug,
              subscriptionPlan: MOCK_DOCTOR.subscriptionPlan,
            };
          }

          // Check admin credentials
          if (
            credentials.email === MOCK_USERS.admin.email &&
            credentials.password === MOCK_USERS.admin.password
          ) {
            return {
              id: MOCK_USERS.admin.id,
              email: MOCK_USERS.admin.email,
              role: MOCK_USERS.admin.role,
              doctorId: undefined,
              doctorSlug: undefined,
              subscriptionPlan: undefined,
            };
          }

          throw new Error("Invalid email or password");
        }

        // Real database authentication
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email.toLowerCase()),
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (!user.isActive) {
          throw new Error("Your account has been deactivated");
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // Get doctor info if user is a doctor
        let doctorInfo = null;
        if (user.role === "doctor") {
          doctorInfo = await db.query.doctors.findFirst({
            where: eq(doctors.userId, user.id),
          });
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          doctorId: doctorInfo?.id,
          doctorSlug: doctorInfo?.slug,
          subscriptionPlan: doctorInfo?.subscriptionPlan,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.doctorId = user.doctorId;
        token.doctorSlug = user.doctorSlug;
        token.subscriptionPlan = user.subscriptionPlan;
      }

      // Handle session update
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        session.user.doctorId = token.doctorId as string | undefined;
        session.user.doctorSlug = token.doctorSlug as string | undefined;
        session.user.subscriptionPlan = token.subscriptionPlan as string | undefined;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Update last login timestamp (skip in mock mode)
      if (!IS_MOCK_MODE_SERVER && db && user.id) {
        try {
          await db
            .update(users)
            .set({ updatedAt: new Date() })
            .where(eq(users.id, user.id));
        } catch (e) {
          console.log("Could not update last login");
        }
      }
    },
  },
  debug: false,
};
