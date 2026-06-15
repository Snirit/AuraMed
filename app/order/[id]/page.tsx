"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  CheckCircle, ArrowRight, MapPin, CreditCard, ChevronDown, 
  ChevronUp, PhoneCall, Home, Loader2, Sparkles, ShieldAlert 
} from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import BillSummary from "@/components/BillSummary";

export default function OrderPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { orders, currentUser } = useMockStore();

  // Retrieve current order
  const order = useMemo(() => {
    return orders.find(o => o.id === id);
  }, [id, orders]);

  // Find address details
  const address = useMemo(() => {
    if (!order) return null;
    return currentUser.addresses.find(a => a.id === order.addressId);
  }, [order, currentUser]);

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
        <Link href="/" className="text-teal-600 font-semibold hover:underline mt-4 inline-block">
          Return to Home
        </Link>
      </div>
    );
  }

  // Map status states to timeline indexes
  const statusIndexMap = {
    "placed": 0,
    "verifying": 1,
    "packed": 2,
    "out_for_delivery": 3,
    "delivered": 4
  };

  const currentIdx = statusIndexMap[order.status];

  const steps = [
    { label: "Order Placed", desc: "Verifying payment" },
    { label: "Verifying Rx", desc: "Pharmacist verifying prescription", special: true },
    { label: "Packed", desc: "Awaiting pickup" },
    { label: "Out for Delivery", desc: "Arriving in 15 mins" },
    { label: "Delivered", desc: "Refill confirmed" }
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 animate-bounce">
          <CheckCircle className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Order Placed!</h1>
        <p className="text-xs text-slate-500 mt-1">Order ID: #{order.id}</p>
        <p className="text-xs text-slate-500">Estimated delivery: <span className="font-bold text-teal-600">18 - 25 minutes</span></p>
      </div>

      {/* Real-time Order status timeline */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs mb-8">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Delivery Progress Status</h3>
        
        {/* Desktop timeline horizontal */}
        <div className="hidden md:flex justify-between relative mb-12">
          {/* Progress Line */}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-100 -z-10" />
          <div 
            className="absolute top-4 left-4 h-0.5 bg-teal-500 -z-10 transition-all duration-500" 
            style={{ width: `${(currentIdx / 4) * 100}%` }}
          />

          {steps.map((step, idx) => {
            const isCompleted = idx < currentIdx;
            const isActive = idx === currentIdx;
            const isPending = idx > currentIdx;

            return (
              <div key={idx} className="flex flex-col items-center text-center flex-1 relative">
                {/* Visual node indicator */}
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  isCompleted 
                    ? "bg-teal-600 text-white shadow" 
                    : isActive 
                      ? "bg-teal-50 text-teal-600 border-2 border-teal-600 shadow-md scale-105" 
                      : "bg-white text-slate-400 border border-slate-200"
                }`}>
                  {isCompleted ? "✓" : idx + 1}
                </div>
                
                <span className={`text-[10px] font-bold mt-2 ${
                  isActive ? "text-teal-600 font-extrabold" : "text-slate-800"
                }`}>
                  {step.label}
                </span>

                {isActive && step.special && (
                  <span className="absolute -bottom-8 flex items-center justify-center gap-1 rounded bg-teal-50 px-1.5 py-0.5 text-[8px] font-black text-teal-700 border border-teal-100 mt-1 animate-pulse-soft">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    <span>AI & RPh Checking</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile timeline vertical */}
        <div className="md:hidden space-y-6 relative pl-6">
          {/* Vertical progress line */}
          <div className="absolute top-2 bottom-2 left-2 w-0.5 bg-slate-100" />
          <div 
            className="absolute top-2 left-2 w-0.5 bg-teal-500 transition-all duration-500" 
            style={{ height: `${(currentIdx / 4) * 100}%` }}
          />

          {steps.map((step, idx) => {
            const isCompleted = idx < currentIdx;
            const isActive = idx === currentIdx;
            
            return (
              <div key={idx} className="flex gap-4 relative">
                {/* Node */}
                <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold z-10 -ml-2.5 ${
                  isCompleted 
                    ? "bg-teal-600 text-white" 
                    : isActive 
                      ? "bg-teal-50 text-teal-600 border border-teal-600 font-extrabold" 
                      : "bg-white text-slate-400 border border-slate-200"
                }`}>
                  {isCompleted ? "✓" : idx + 1}
                </div>

                <div>
                  <span className={`text-xs font-bold block ${
                    isActive ? "text-teal-700" : "text-slate-800"
                  }`}>
                    {step.label}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{step.desc}</span>
                  {isActive && step.special && (
                    <span className="inline-flex items-center gap-1 rounded bg-teal-50 px-1 py-0.5 text-[8px] font-black text-teal-700 border border-teal-100 mt-1.5">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      <span>Pharmacist review in progress</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Faked Pharmacist verification notification */}
        {order.status === "verifying" && (
          <div className="mt-8 p-3 rounded-2xl bg-amber-50/50 border border-amber-100/50 text-amber-800 text-xs flex gap-2 animate-in fade-in duration-300">
            <Loader2 className="h-4 w-4 text-amber-600 animate-spin mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">RPh Verification in progress...</p>
              <p className="text-[10px] mt-0.5">Under Indian rules, a registered pharmacist (RPh) is verifying your prescription details. This process takes less than 30 seconds for quick commerce orders.</p>
            </div>
          </div>
        )}
      </div>

      {/* Address card */}
      <div className="mb-8">
        {/* Address Card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-teal-600" />
            <span>Delivery Destination</span>
          </h4>
          {address ? (
            <div>
              <span className="text-xs font-bold text-slate-800">{address.label}</span>
              <span className="text-xs text-slate-600 block mt-1">{address.line1}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">{address.line2 ? `${address.line2}, ` : ""}{address.city} {address.pincode}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-500">Address detail not parsed.</span>
          )}
        </div>

      </div>

      {/* Canonical Bill Summary — same component used on cart & checkout */}
      <div className="mb-8">
        <BillSummary
          bill={order.bill}
          title="Order Payment Summary"
          items={order.items.map(i => ({
            productId: i.productId,
            productName: i.productName,
            quantity: i.quantity,
            price: i.price,
          }))}
        />
      </div>

      {/* Back to Home CTA */}
      <div className="flex justify-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 px-6 py-3 text-xs font-bold transition-all"
        >
          <Home className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
        <button
          onClick={() => alert("Connecting you with our support help desk...")}
          className="rounded-xl bg-teal-600 text-white px-6 py-3 text-xs font-bold hover:bg-teal-700 shadow-xs transition-colors"
        >
          Need Help?
        </button>
      </div>
    </div>
  );
}
