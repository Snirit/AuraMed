"use client";

import React from "react";

interface BadgeProps {
  variant?: "default" | "rx" | "generic" | "success" | "warning" | "info";
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: "bg-slate-100 text-slate-700",
  rx: "bg-amber-50 text-amber-700 border border-amber-200",
  generic: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  success: "bg-green-50 text-green-700 border border-green-200",
  warning: "bg-orange-50 text-orange-700 border border-orange-200",
  info: "bg-blue-50 text-blue-700 border border-blue-200",
};

export default function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
