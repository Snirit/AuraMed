"use client";

import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles: Record<string, string> = {
  sm: "p-6 rounded-2xl",
  md: "p-10 rounded-3xl",
  lg: "p-12 rounded-3xl",
};

/**
 * Canonical empty-state shell used across search, category, cart, my-medications, etc.
 * Centers icon → title → description → action buttons inside a soft bordered card.
 */
export default function EmptyState({
  icon,
  title,
  description,
  actions,
  size = "lg",
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`border border-slate-100 bg-white shadow-xs text-center ${sizeStyles[size]} ${className}`}
    >
      {icon && (
        <div className="mx-auto h-12 w-12 flex items-center justify-center text-slate-300 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {actions && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
