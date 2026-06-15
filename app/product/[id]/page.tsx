"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ChevronRight, ShieldAlert, Plus, Minus, Check, ArrowRight } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import ProductCard from "@/components/ProductCard";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { products, cart, addToCart, updateCartItem } = useMockStore();

  const product = useMemo(() => {
    return products.find(p => p.id === id);
  }, [id, products]);

  // Find if this item is in the cart
  const cartItem = cart.items.find(item => item.productId === id);
  const quantity = cartItem ? cartItem.quantity : 0;

  // Find generic or branded alternatives with the exact same active salt composition
  const alternatives = useMemo(() => {
    if (!product) return [];

    return products.filter(p => 
      p.id !== product.id &&
      p.composition.length === product.composition.length &&
      p.composition.every((c, index) => 
        c.salt === product.composition[index].salt && 
        c.strength === product.composition[index].strength
      )
    );
  }, [product, products]);

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
        <Link href="/" className="text-teal-600 font-semibold hover:underline mt-4 inline-block">
          Return to Home
        </Link>
      </div>
    );
  }

  const handleAdd = () => {
    addToCart(product.id, 1);
  };

  const handleIncrement = () => {
    updateCartItem(product.id, quantity + 1);
  };

  const handleDecrement = () => {
    updateCartItem(product.id, quantity - 1);
  };

  const discountPercent = product.mrp > product.price 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
        <Link href="/" className="hover:text-teal-600">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/category/${product.category}`} className="hover:text-teal-600">
          {product.category === "bp-heart" ? "BP & Heart" : product.category === "diabetes" ? "Diabetes" : "Concern Catalog"}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-600">{product.name}</span>
      </nav>

      {/* Main product card layout */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-xs mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Image */}
          <div className="flex flex-col items-center">
            <div className="aspect-square w-full max-w-sm rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden relative border border-slate-100">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="h-full w-full object-cover"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                {product.rxRequired && (
                  <span className="rounded bg-amber-50 px-2 py-1 text-[10px] font-extrabold text-amber-700 border border-amber-100 shadow-sm">
                    Prescription Required
                  </span>
                )}
                {product.isGeneric && (
                  <span className="rounded bg-teal-50 px-2 py-1 text-[10px] font-extrabold text-teal-700 border border-teal-100 shadow-sm">
                    Generic Alternative
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Info */}
          <div className="flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">{product.manufacturer}</span>
              <h1 className="text-2xl font-black text-slate-900 mt-1">{product.name}</h1>
              
              {/* Composition salt string */}
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Active Salt: {product.composition.map(c => `${c.salt} ${c.strength}`).join(" + ")}
              </p>
              
              <p className="text-xs text-slate-400 mt-1">Pack Size: {product.packSize}</p>

              {/* Price Block */}
              <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100/50 max-w-sm">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-950">₹{product.price}</span>
                  {product.mrp > product.price && (
                    <>
                      <span className="text-sm text-slate-400 line-through">MRP ₹{product.mrp}</span>
                      <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white">
                        {discountPercent}% OFF
                      </span>
                    </>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">inclusive of all taxes</span>
              </div>

              {/* Rx Warning */}
              {product.rxRequired && (
                <div className="mt-4 flex gap-2 p-3 rounded-xl bg-amber-50/50 border border-amber-100/50 text-amber-800 text-xs max-w-md">
                  <ShieldAlert className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <span className="font-bold">Prescription is required for this medicine.</span> You can upload it during checkout or apply a previously saved prescription.
                  </p>
                </div>
              )}
            </div>

            {/* Cart Buttons CTA */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-4">
              {quantity > 0 ? (
                <div className="flex items-center rounded-xl bg-teal-600 text-white shadow-md border border-teal-600">
                  <button
                    onClick={handleDecrement}
                    className="flex h-11 w-11 items-center justify-center rounded-l-xl hover:bg-teal-700 transition-colors focus:outline-none"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-bold">{quantity} packs</span>
                  <button
                    onClick={handleIncrement}
                    className="flex h-11 w-11 items-center justify-center rounded-r-xl hover:bg-teal-700 transition-colors focus:outline-none"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAdd}
                  className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-8 py-3.5 text-sm font-bold shadow-md hover:shadow-lg transition-all duration-150 focus:outline-none"
                >
                  <Plus className="h-4 w-4" />
                  <span>ADD TO CART</span>
                </button>
              )}

              <Link
                href="/cart"
                className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 px-6 py-3.5 text-sm font-semibold transition-all duration-150"
              >
                Go to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Composition & description */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="md:col-span-2 space-y-6">
          {/* Active Composition Table */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">Composition Details</h3>
            <div className="overflow-hidden rounded-xl border border-slate-150">
              <table className="min-w-full divide-y divide-slate-150 text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Active Ingredient (Salt)</th>
                    <th className="px-4 py-3">Strength</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-600 bg-white">
                  {product.composition.map((comp, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 font-semibold text-slate-800">{comp.salt}</td>
                      <td className="px-4 py-3">{comp.strength}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-2">About {product.name}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{product.description}</p>
            
            <h4 className="text-xs font-bold text-slate-950 mt-4 mb-1">Key Benefits:</h4>
            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-1">
              <li>Effectively regulates treatment parameters as prescribed by the doctor.</li>
              <li>High bioavailability for consistent and rapid therapeutic action.</li>
              <li>Manufactured in WHO-GMP certified facilities.</li>
            </ul>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="rounded-2xl border border-slate-100 bg-teal-50/20 p-6 shadow-xs h-fit space-y-4">
          <h3 className="text-sm font-bold text-slate-950">AuraMed Caregiver Guarantees</h3>
          <div className="space-y-3">
            {[
              "15-Minute Superfast Delivery",
              "Prescriptions securely archived on file",
              "100% Genuine WHO-GMP Medicines",
              "Free Pharmacist verification review"
            ].map((text, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                <Check className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alternatives section */}
      {alternatives.length > 0 && (
        <div className="mb-8 border-t border-slate-100 pt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Cheaper Alternatives (Same Composition)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact same salt composition ({product.composition.map(c => c.salt).join(" + ")}), differing only by brand and price.
              </p>
            </div>
          </div>

          {/* Best-savings callout (computed once) */}
          {(() => {
            const bestSavings = alternatives.reduce<{ price: number; savingsPct: number } | null>(
              (best, alt) => {
                const priceDiff = product.price - alt.price;
                const pct = Math.round((priceDiff / product.price) * 100);
                if (priceDiff > 0 && (!best || pct > best.savingsPct)) {
                  return { price: alt.price, savingsPct: pct };
                }
                return best;
              },
              null
            );
            return bestSavings ? (
              <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 flex items-center gap-2">
                <span className="rounded-md bg-emerald-500 text-white px-1.5 py-0.5 text-[9px] font-extrabold">
                  SAVE UP TO {bestSavings.savingsPct}%
                </span>
                <span className="text-xs font-semibold text-emerald-900">
                  Same composition, prices from ₹{bestSavings.price} — keep the brand or switch and save.
                </span>
              </div>
            ) : null;
          })()}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {alternatives.map((alt) => (
              <ProductCard key={alt.id} product={alt} variant="highlight-generic" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
