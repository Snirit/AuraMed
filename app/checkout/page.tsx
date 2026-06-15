"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronRight, MapPin, CreditCard, DollarSign, Smartphone, 
  CheckCircle, ArrowLeft, Loader2 
} from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { calculateBill } from "@/lib/utils/bill";
import BillSummary from "@/components/BillSummary";
import AddressSelector from "@/components/AddressSelector";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, products, placeOrder, currentUser } = useMockStore();

  // Active address comes from the store (server-persisted, single source of truth)
  const selectedAddressId = currentUser.defaultAddressId;
  const [selectedPayment, setSelectedPayment] = useState<"upi" | "card" | "cod">("upi");
  const [processing, setProcessing] = useState(false);

  // Resolve cart items
  const cartItemsWithDetails = cart.items.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      ...item,
      product
    };
  }).filter(item => item.product !== undefined);

  // Bill — single source of truth in lib/utils/bill.ts
  const bill = calculateBill(
    cartItemsWithDetails.map(item => ({
      price: item.product!.price,
      quantity: item.quantity,
    }))
  );

  const handlePay = () => {
    if (cart.items.length === 0) return;
    setProcessing(true);

    // Simulate small payment gateway delay
    setTimeout(async () => {
      const order = await placeOrder(selectedAddressId);
      setProcessing(false);
      if (order) {
        router.push(`/order/${order.id}`);
      }
    }, 1500);
  };

  if (cart.items.length === 0 && !processing) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-slate-900">Checkout is empty</h2>
        <Link href="/" className="text-teal-600 font-semibold hover:underline mt-4 inline-block">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back to Cart */}
      <Link
        href="/cart"
        className="mb-6 flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-teal-600 px-1 py-1 w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Cart</span>
      </Link>

      <h1 className="text-2xl font-black text-slate-900 mb-6">Review & Checkout</h1>

      {processing ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-16 text-center shadow-xs flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 text-teal-600 animate-spin mb-4" />
          <h3 className="text-base font-bold text-slate-900">Processing Payment...</h3>
          <p className="text-xs text-slate-500 mt-2">Connecting with secure payment gateway to verify funds.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Columns: Address & Payments */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Address Selector — canonical component */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5 text-teal-600" />
                <span>Delivery Address</span>
              </h3>
              <AddressSelector label="Shipping to" />
            </div>

            {/* Payment Method Selector Card */}
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-teal-600" />
                <span>Choose Payment Method</span>
              </h3>

              <div className="space-y-3">
                {[
                  { id: "upi", label: "Instant UPI Pay (Paytm / Google Pay / PhonePe)", icon: Smartphone, desc: "Instant pharmacist verification processing" },
                  { id: "card", label: "Debit or Credit Card", icon: CreditCard, desc: "Visa, Mastercard, RuPay cards accepted" },
                  { id: "cod", label: "Cash on Delivery (COD)", icon: DollarSign, desc: "Pay cash/UPI at door during delivery" }
                ].map((pay) => {
                  const Icon = pay.icon;
                  return (
                    <button
                      key={pay.id}
                      onClick={() => setSelectedPayment(pay.id as any)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all duration-150 flex items-center justify-between gap-4 ${
                        pay.id === selectedPayment
                          ? "border-teal-600 bg-teal-50/10"
                          : "border-slate-150 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-slate-900">{pay.label}</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">{pay.desc}</span>
                        </div>
                      </div>
                      {pay.id === selectedPayment && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white">
                          <CheckCircle className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Summary & Pay */}
          <BillSummary
            bill={bill}
            title="Checkout Order Summary"
            items={cartItemsWithDetails.map(item => ({
              productId: item.productId,
              productName: item.product!.name,
              quantity: item.quantity,
              price: item.product!.price,
            }))}
            cta={{ label: "Confirm & Pay", onClick: handlePay }}
          />
        </div>
      )}
    </div>
  );
}
