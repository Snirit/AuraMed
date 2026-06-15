"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, AlertCircle } from "lucide-react";
import { Bill } from "@/lib/types";

export interface BillSummaryLineItem {
  productId?: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface BillSummaryCTA {
  label: string;
  /** When `href` is provided, renders a Next.js Link. Otherwise calls `onClick`. */
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface BillSummaryProps {
  bill: Bill;
  /** Optional: when provided, renders a scrollable list of line items above the totals. */
  items?: BillSummaryLineItem[];
  title?: string;
  cta?: BillSummaryCTA;
  /** Optional warning/blocking message shown above the CTA (e.g. "Attach prescription to continue"). */
  hint?: string;
  className?: string;
}

/**
 * Canonical bill summary card.
 * Used on cart, checkout, and order tracking pages — labels and layout are identical everywhere.
 */
export default function BillSummary({
  bill,
  items,
  title = "Bill Summary",
  cta,
  hint,
  className = "",
}: BillSummaryProps) {
  const hasLineItems = items && items.length > 0;
  const hasDiscount = bill.discount > 0;

  const ctaButton = cta && (
    <button
      onClick={cta.onClick}
      disabled={cta.disabled || cta.loading}
      className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white px-4 py-3 text-sm font-bold shadow-md shadow-teal-600/20 transition-all"
    >
      <span>
        {cta.label} ₹{bill.totalPayable}
      </span>
      {!cta.disabled && !cta.loading && <ArrowRight className="h-4 w-4" />}
    </button>
  );

  return (
    <div
      className={`rounded-3xl border border-slate-100 bg-white p-6 shadow-xs h-fit ${className}`}
    >
      <h3 className="text-base font-bold text-slate-900 mb-4">{title}</h3>

      {/* Optional line items list */}
      {hasLineItems && (
        <>
          <ul className="space-y-2.5 mb-4 max-h-64 overflow-y-auto pr-1">
            {items!.map((item, idx) => (
              <li
                key={item.productId || idx}
                className="flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-700 truncate">
                    {item.productName}
                  </p>
                  {item.quantity > 1 && (
                    <span className="text-[10px] text-slate-400">
                      Qty {item.quantity} × ₹{item.price}
                    </span>
                  )}
                </div>
                <span className="font-bold text-slate-900 flex-shrink-0">
                  ₹{item.price * item.quantity}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-100 mb-4" />
        </>
      )}

      {/* Totals rows */}
      <dl className="space-y-2.5 text-xs">
        <div className="flex justify-between">
          <dt className="text-slate-600">Items Total</dt>
          <dd className="font-semibold text-slate-900">₹{bill.itemsTotal}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-600">Delivery Fee</dt>
          <dd
            className={`font-semibold ${
              bill.deliveryFee === 0 ? "text-emerald-600" : "text-slate-900"
            }`}
          >
            {bill.deliveryFee === 0 ? "FREE" : `₹${bill.deliveryFee}`}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-600">Generic Switch Discount</dt>
          <dd
            className={`font-semibold ${
              hasDiscount ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            {hasDiscount ? `−₹${bill.discount}` : "−₹0"}
          </dd>
        </div>
      </dl>

      <div className="border-t border-slate-100 my-4" />

      <div className="flex justify-between items-baseline">
        <span className="text-base font-bold text-slate-900">Total Payable</span>
        <span className="text-xl font-black text-slate-950">
          ₹{bill.totalPayable}
        </span>
      </div>

      {/* Optional blocking hint */}
      {hint && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
            {hint}
          </p>
        </div>
      )}

      {/* CTA — either Link or button */}
      {cta && (
        <div className="mt-5">
          {cta.href && !cta.disabled && !cta.onClick ? (
            <Link
              href={cta.href}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 text-sm font-bold shadow-md shadow-teal-600/20 transition-all"
            >
              <span>
                {cta.label} ₹{bill.totalPayable}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            ctaButton
          )}
        </div>
      )}
    </div>
  );
}
