"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import DemoSettings from "@/components/DemoSettings";
import AuthGuard from "@/components/AuthGuard";

const HIDE_CHROME = ["/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = HIDE_CHROME.includes(pathname);

  if (hideChrome) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        <Suspense fallback={<div className="h-16 bg-white border-b border-slate-100 shadow-sm" />}>
          <Header />
        </Suspense>
        <main className="flex-grow">{children}</main>
      </div>
      <DemoSettings />
    </AuthGuard>
  );
}
