"use client";

import React, { useState, useRef, useEffect } from "react";
import { MapPin, Check, ChevronDown } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { Address } from "@/lib/types";

interface AddressSelectorProps {
  variant?: "default" | "header" | "compact";
  /** When true, the "Change" CTA is hidden — used on read-only surfaces. */
  readOnly?: boolean;
  /** Label shown above the address (only in default variant). Defaults to "Delivering to". */
  label?: string;
  className?: string;
}

/**
 * Canonical address selector. Reads `currentUser.defaultAddressId` from the store —
 * that's the single source of truth. Clicking "Change" expands a list of saved addresses;
 * picking one calls `setActiveAddress()` (optimistic, persists via PATCH /api/user/address).
 *
 * Used on:
 *   - Header (variant="header") — compact location chip
 *   - Cart, Checkout (variant="default") — full bar with label
 *   - My Medications (variant="default" readOnly) — info banner
 */
export default function AddressSelector({
  variant = "default",
  readOnly = false,
  label = "Delivering to",
  className = "",
}: AddressSelectorProps) {
  const { currentUser, setActiveAddress } = useMockStore();
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const active: Address =
    currentUser.addresses.find(a => a.id === currentUser.defaultAddressId) ||
    currentUser.addresses[0];

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handlePick = async (addressId: string) => {
    setOpen(false);
    if (addressId !== currentUser.defaultAddressId) {
      await setActiveAddress(addressId);
    }
  };

  // ----------- Header variant (compact location chip) -----------
  if (variant === "header") {
    return (
      <div className={`relative ${className}`} ref={popoverRef}>
        <button
          onClick={() => !readOnly && setOpen(o => !o)}
          disabled={readOnly}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-default disabled:hover:bg-transparent"
        >
          <MapPin className="h-3.5 w-3.5 text-teal-600" />
          <span className="hidden sm:inline">{active?.label || "Set location"}</span>
          {!readOnly && <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />}
        </button>
        {open && <AddressPopover addresses={currentUser.addresses} activeId={currentUser.defaultAddressId} onPick={handlePick} />}
      </div>
    );
  }

  // ----------- Compact variant -----------
  if (variant === "compact") {
    return (
      <div className={`relative ${className}`} ref={popoverRef}>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
          <MapPin className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
          <span className="font-semibold text-slate-800 truncate flex-1">
            {active?.label || "No address"}
          </span>
          {!readOnly && (
            <button
              onClick={() => setOpen(o => !o)}
              className="text-[11px] font-bold text-teal-600 hover:text-teal-700 hover:underline"
            >
              Change
            </button>
          )}
        </div>
        {open && <AddressPopover addresses={currentUser.addresses} activeId={currentUser.defaultAddressId} onPick={handlePick} />}
      </div>
    );
  }

  // ----------- Default variant (full bar) -----------
  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      <div className="rounded-2xl border border-slate-100 bg-white p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-teal-600 flex-shrink-0">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {label}
            </span>
            <span className="text-xs font-bold text-slate-800 truncate block">
              {active ? (
                <>
                  {active.label} —{" "}
                  <span className="text-slate-600 font-normal">
                    {active.line1}, {active.city} {active.pincode}
                  </span>
                </>
              ) : (
                "No address selected"
              )}
            </span>
          </div>
        </div>
        {!readOnly && currentUser.addresses.length > 1 && (
          <button
            onClick={() => setOpen(o => !o)}
            className="text-xs font-bold text-teal-600 hover:underline focus:outline-none flex-shrink-0 ml-2"
          >
            Change
          </button>
        )}
      </div>
      {open && <AddressPopover addresses={currentUser.addresses} activeId={currentUser.defaultAddressId} onPick={handlePick} />}
    </div>
  );
}

// ----------------- Internal popover (shared by all variants) -----------------

function AddressPopover({
  addresses,
  activeId,
  onPick,
}: {
  addresses: Address[];
  activeId: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="absolute right-0 top-full mt-2 z-30 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
      <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        Saved addresses
      </p>
      <ul className="space-y-1">
        {addresses.map(addr => {
          const isActive = addr.id === activeId;
          return (
            <li key={addr.id}>
              <button
                onClick={() => onPick(addr.id)}
                className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors ${
                  isActive
                    ? "bg-teal-50/60 border border-teal-100"
                    : "hover:bg-slate-50 border border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-900">
                      {addr.label}
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city} {addr.pincode}
                    </span>
                  </div>
                  {isActive && (
                    <Check className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
