import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MediBook - Doctor Management SaaS",
    template: "%s | MediBook",
  },
  description:
    "Streamline your medical practice with MediBook. Manage appointments, patients, and bookings effortlessly.",
  keywords: [
    "doctor management",
    "medical appointments",
    "healthcare SaaS",
    "patient booking",
    "clinic management",
  ],
  authors: [{ name: "MediBook" }],
  creator: "MediBook",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "MediBook - Doctor Management SaaS",
    description:
      "Streamline your medical practice with MediBook. Manage appointments, patients, and bookings effortlessly.",
    siteName: "MediBook",
  },
  twitter: {
    card: "summary_large_image",
    title: "MediBook - Doctor Management SaaS",
    description:
      "Streamline your medical practice with MediBook. Manage appointments, patients, and bookings effortlessly.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${fraunces.variable} font-body antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <QueryProvider>
              {children}
              <Toaster
                position="top-right"
                richColors
                closeButton
                duration={4000}
                toastOptions={{
                  style: {
                    fontFamily: "var(--font-body)",
                  },
                }}
              />
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
