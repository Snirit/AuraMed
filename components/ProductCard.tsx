"use client";

import React from "react";
import Link from "next/link";
import { Plus, Minus } from "lucide-react";
import { Product } from "@/lib/types";
import { useMockStore } from "@/lib/mock-store";

export type ProductCardVariant = "default" | "compact" | "highlight-generic";

interface ProductCardProps {
  product: Product;
  variant?: ProductCardVariant;
  /**
   * Optional callback fired when the user clicks ADD on a product that's not yet in cart.
   * If provided, this replaces the default `addToCart(product.id, 1)` call —
   * the caller is responsible for performing the add (and any side effects like Rx attach).
   * Quantity stepper (+/−) always uses the default cart actions.
   */
  onAdd?: (productId: string) => void;
}

export default function ProductCard({
  product,
  variant = "default",
  onAdd,
}: ProductCardProps) {
  const { cart, addToCart, updateCartItem } = useMockStore();

  // Find if this item is in the cart
  const cartItem = cart.items.find(item => item.productId === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    if (onAdd) {
      onAdd(product.id);
    } else {
      addToCart(product.id, 1);
    }
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

  // ---------- Variant styling ----------
  const isCompact = variant === "compact";
  const isGenericHighlight = variant === "highlight-generic" && product.isGeneric;

  const containerClasses = [
    "group rounded-2xl border transition-all duration-200 flex flex-col justify-between h-full shadow-xs",
    isCompact ? "p-3" : "p-4",
    isGenericHighlight
      ? "border-emerald-200 bg-gradient-to-b from-emerald-50/40 to-teal-50/20 hover:border-emerald-300 hover:shadow-md"
      : "border-slate-100 bg-white hover:border-teal-200 hover:shadow-md",
  ].join(" ");

  const imageWrapperClasses = [
    "w-full rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden relative",
    isCompact ? "aspect-square mb-2" : "aspect-square mb-3",
  ].join(" ");

  return (
    <div className={containerClasses}>
      <div>
        {/* Image & Badges */}
        <div className={imageWrapperClasses}>
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.rxRequired && (
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-100 shadow-xs">
                Rx
              </span>
            )}
            {product.isGeneric && (
              <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold text-teal-700 border border-teal-100 shadow-xs">
                {isGenericHighlight ? "Generic — Save" : "Generic alternative"}
              </span>
            )}
            {variant === "highlight-generic" && !product.isGeneric && (
              <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 border border-slate-100 shadow-xs">
                Original
              </span>
            )}
          </div>

          {discountPercent > 0 && (
            <span className="absolute bottom-2 right-2 rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Brand & Name */}
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {product.manufacturer}
        </span>
        <Link
          href={`/product/${product.id}`}
          className="block mt-0.5 hover:text-teal-600 transition-colors"
        >
          <h4 className="text-xs font-bold text-slate-900 line-clamp-1 leading-snug">
            {product.name}
          </h4>
        </Link>

        {/* Composition Info */}
        <p className="text-[10px] text-slate-500 line-clamp-1 mt-1 font-medium bg-slate-50 rounded px-1.5 py-0.5 inline-block">
          {product.composition.map(c => `${c.salt} ${c.strength}`).join(" + ")}
        </p>

        {/* Pack Size */}
        <p className="text-[10px] text-slate-400 mt-1">{product.packSize}</p>
      </div>

      {/* Footer: Price and CTA */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black text-slate-950">₹{product.price}</span>
            {product.mrp > product.price && (
              <span className="text-[10px] text-slate-400 line-through">₹{product.mrp}</span>
            )}
          </div>
          <span className="text-[8px] text-slate-400">incl. of all taxes</span>
        </div>

        {!product.inStock ? (
          <span className="rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
            Out of stock
          </span>
        ) : quantity > 0 ? (
          <div className="flex items-center rounded-lg bg-teal-600 text-white shadow-sm border border-teal-600">
            <button
              onClick={handleDecrement}
              className="flex h-7 w-7 items-center justify-center rounded-l-lg hover:bg-teal-700 transition-colors focus:outline-none"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-6 text-center text-xs font-bold">{quantity}</span>
            <button
              onClick={handleIncrement}
              className="flex h-7 w-7 items-center justify-center rounded-r-lg hover:bg-teal-700 transition-colors focus:outline-none"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-white hover:bg-teal-600 text-teal-600 hover:text-white px-3 py-1.5 text-xs font-bold transition-all duration-150 shadow-xs focus:outline-none"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>ADD</span>
          </button>
        )}
      </div>
    </div>
  );
}
