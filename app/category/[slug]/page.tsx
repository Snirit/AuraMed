"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { SlidersHorizontal, ArrowUpDown, ChevronRight, ShoppingBag } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import ProductCard from "@/components/ProductCard";

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { products, categories } = useMockStore();

  const category = useMemo(() => {
    return categories.find(c => c.slug === slug);
  }, [slug, categories]);

  // Filters state
  const [rxFilter, setRxFilter] = useState<"all" | "rx" | "otc">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "brand" | "generic">("all");
  const [sortOption, setSortOption] = useState<"relevance" | "price-asc" | "price-desc">("relevance");

  // Filter products based on category slug
  const categoryProducts = useMemo(() => {
    return products.filter(p => p.category === slug);
  }, [slug, products]);

  // Apply filters and sort
  const filteredAndSortedProducts = useMemo(() => {
    let results = [...categoryProducts];

    // 1. Rx Filter
    if (rxFilter === "rx") {
      results = results.filter(p => p.rxRequired);
    } else if (rxFilter === "otc") {
      results = results.filter(p => !p.rxRequired);
    }

    // 2. Type Filter
    if (typeFilter === "brand") {
      results = results.filter(p => !p.isGeneric);
    } else if (typeFilter === "generic") {
      results = results.filter(p => p.isGeneric);
    }

    // 3. Sort
    if (sortOption === "price-asc") {
      results.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price-desc") {
      results.sort((a, b) => b.price - a.price);
    }

    return results;
  }, [categoryProducts, rxFilter, typeFilter, sortOption]);

  if (!category) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-slate-900">Category Not Found</h2>
        <Link href="/" className="text-teal-600 font-semibold hover:underline mt-4 inline-block">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-4 flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
        <Link href="/" className="hover:text-teal-600">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-600">{category.name}</span>
      </nav>

      {/* Category Header */}
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          <span>{category.name}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Showing {filteredAndSortedProducts.length} medicines
        </p>
      </div>

      {categoryProducts.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-xs">
          <ShoppingBag className="mx-auto h-12 w-12 text-slate-300 animate-bounce" />
          <h3 className="text-base font-bold text-slate-900 mt-4">Coming Soon</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
            Medicines in this category are currently being stocked in our local dark store. Check back in a few days!
          </p>
          <div className="mt-6">
            <Link 
              href="/" 
              className="rounded-xl bg-teal-600 text-white px-5 py-2.5 text-xs font-bold shadow-xs hover:bg-teal-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      ) : (
        /* Content layout with sidebar filters */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 h-fit shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-teal-600" />
              <span>Filters</span>
            </h3>

            {/* Filter by Rx */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Prescription Type</h4>
              <div className="space-y-2">
                {[
                  { value: "all", label: "All Items" },
                  { value: "rx", label: "Prescription required (Rx)" },
                  { value: "otc", label: "Over-the-counter (OTC)" }
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="rx-filter"
                      checked={rxFilter === opt.value}
                      onChange={() => setRxFilter(opt.value as any)}
                      className="h-3.5 w-3.5 text-teal-600 border-slate-300 focus:ring-teal-500"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter by Brand/Generic */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Product Class</h4>
              <div className="space-y-2">
                {[
                  { value: "all", label: "All Classes" },
                  { value: "brand", label: "Branded Originals" },
                  { value: "generic", label: "Generic Alternatives" }
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="type-filter"
                      checked={typeFilter === opt.value}
                      onChange={() => setTypeFilter(opt.value as any)}
                      className="h-3.5 w-3.5 text-teal-600 border-slate-300 focus:ring-teal-500"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sort Dropdown */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3" />
                <span>Sort By</span>
              </h4>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          <div className="lg:col-span-3">
            {filteredAndSortedProducts.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xs">
                <p className="text-xs text-slate-500">No products match your selected filters. Try adjusting your sidebar filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {filteredAndSortedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
