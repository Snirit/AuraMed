"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  /** Optional trailing element (e.g. badge or custom CTA) — rendered instead of href link */
  trailing?: React.ReactNode;
}

/**
 * Canonical section header — a title row with optional subtitle and "see all" link.
 * Replaces repeated inline "flex items-center justify-between" + heading + link pairs.
 */
export default function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel = "See all",
  className = "",
  trailing,
}: SectionHeaderProps) {
  return (
    <div className={`flex items-end justify-between mb-6 ${className}`}>
      <div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {trailing ? (
        trailing
      ) : href ? (
        <Link
          href={href}
          className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700"
        >
          <span>{linkLabel}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}
