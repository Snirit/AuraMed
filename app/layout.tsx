import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { MockStoreProvider } from "@/lib/mock-store";
import AppShell from "@/components/AppShell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "AuraMed - Caregiver-First Pharmacy Quick Commerce",
  description: "Manage, upload, and reorder chronic medications for your family in seconds. 15-minute quick delivery across India.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased min-h-screen bg-slate-50 text-slate-900`}>
        <MockStoreProvider>
          <AppShell>{children}</AppShell>
        </MockStoreProvider>
      </body>
    </html>
  );
}
