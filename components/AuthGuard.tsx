"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const PUBLIC_ROUTES = ["/login"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (PUBLIC_ROUTES.includes(pathname)) {
      setChecked(true);
      return;
    }

    const token = localStorage.getItem("auramed_session_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    setChecked(true);
  }, [pathname, router]);

  // While checking auth, render nothing to avoid flash of protected content
  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xs text-slate-400 font-semibold animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
