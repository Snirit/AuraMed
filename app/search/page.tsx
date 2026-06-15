"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, ArrowUpDown, HelpCircle, Check, DollarSign } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import ProductCard from "@/components/ProductCard";
import EmptyState from "@/components/ui/EmptyState";

const PRICE_MIN = 0;
const PRICE_MAX = 500;

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const { products } = useMockStore();

  // Filters state
  const [rxFilter, setRxFilter] = useState<"all" | "rx" | "otc">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "brand" | "generic">("all");
  const [sortOption, setSortOption] = useState<"relevance" | "price-asc" | "price-desc">("relevance");
  const [priceMin, setPriceMin] = useState<number>(PRICE_MIN);
  const [priceMax, setPriceMax] = useState<number>(PRICE_MAX);

  // Filter products based on search query
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();

    return products.filter(product => {
      const matchName = product.name.toLowerCase().includes(lowerQuery);
      const matchMfg = product.manufacturer.toLowerCase().includes(lowerQuery);
      const matchComp = product.composition.some(
        c => c.salt.toLowerCase().includes(lowerQuery) || c.strength.toLowerCase().includes(lowerQuery)
      );
      const matchCategory = product.category.toLowerCase().includes(lowerQuery);

      return matchName || matchMfg || matchComp || matchCategory;
    });
  }, [query, products]);

  // Apply filters and sort
  const filteredAndSortedResults = useMemo(() => {
    let results = [...searchResults];

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

    // 3. Price Range Filter
    results = results.filter(p => p.price >= priceMin && p.price <= priceMax);

    // 4. Sort
    if (sortOption === "price-asc") {
      results.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price-desc") {
      results.sort((a, b) => b.price - a.price);
    }

    return results;
  }, [searchResults, rxFilter, typeFilter, sortOption, priceMin, priceMax]);

  // Smart Alternative Banner logic (if they search a branded product, suggest its generic alternative)
  const smartGenericSuggestion = useMemo(() => {
    if (searchResults.length === 0) return null;

    // Check if the search matches a branded product with an alternative
    const searchedBranded = searchResults.find(p => !p.isGeneric && p.rxRequired);
    if (!searchedBranded) return null;

    // Find a generic alternative with the exact same active salt
    const alternative = products.find(p => 
      p.isGeneric && 
      p.id !== searchedBranded.id &&
      p.composition.length === searchedBranded.composition.length &&
      p.composition.every((c, index) => 
        c.salt === searchedBranded.composition[index].salt && 
        c.strength === searchedBranded.composition[index].strength
      )
    );

    if (alternative && alternative.price < searchedBranded.price) {
      const savings = searchedBranded.price - alternative.price;
      const savingsPercent = Math.round((savings / searchedBranded.price) * 100);
      return {
        brandProduct: searchedBranded,
        genericProduct: alternative,
        savings,
        savingsPercent
      };
    }

    return null;
  }, [searchResults, products]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Search Header Info */}
      <div className="mb-6 flex flex-col md:flex-row md:items-baseline md:justify-between border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {query ? `Search results for "${query}"` : "Search Medicines"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Found {filteredAndSortedResults.length} matching items
          </p>
        </div>
      </div>

      {/* Smart generic suggestion box */}
      {smartGenericSuggestion && (
        <div className="mb-8 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 p-5 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white font-bold text-sm flex-shrink-0">
              ₹
            </div>
            <div className="flex-grow">
              <h3 className="text-sm font-bold text-emerald-900">
                Switch to Generic & Save {smartGenericSuggestion.savingsPercent}%!
              </h3>
              <p className="text-xs text-emerald-800/80 mt-1">
                You searched for <span className="font-semibold">{smartGenericSuggestion.brandProduct.name}</span> (₹{smartGenericSuggestion.brandProduct.price}). We found <span className="font-semibold">{smartGenericSuggestion.genericProduct.name}</span> (₹{smartGenericSuggestion.genericProduct.price}) which contains the exact same active salt composition: <span className="underline">{smartGenericSuggestion.brandProduct.composition.map(c => `${c.salt} ${c.strength}`).join(" + ")}</span>.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <div className="rounded-lg border border-emerald-100 bg-white p-3 flex justify-between items-center gap-4 sm:max-w-md">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{smartGenericSuggestion.genericProduct.manufacturer}</span>
                    <span className="block text-xs font-bold text-slate-800">{smartGenericSuggestion.genericProduct.name}</span>
                    <span className="text-xs font-black text-emerald-600">₹{smartGenericSuggestion.genericProduct.price}</span>
                  </div>
                  <a 
                    href={`/product/${smartGenericSuggestion.genericProduct.id}`}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold transition-all shadow-xs"
                  >
                    Compare Alternative
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {searchResults.length === 0 ? (
        <EmptyState
          icon={<HelpCircle className="h-12 w-12" />}
          title="No medicines found"
          description='Try searching by chemical composition (e.g. "telmisartan") or browse our categories to find related healthcare concerns.'
          actions={
            <>
              <a
                href="/#concern-section"
                className="rounded-xl bg-teal-600 text-white px-5 py-2.5 text-xs font-bold shadow-xs hover:bg-teal-700 transition-colors"
              >
                Browse Concerns
              </a>
              <a
                href="/upload-prescription"
                className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 px-5 py-2.5 text-xs font-bold transition-all"
              >
                Upload Prescription
              </a>
            </>
          }
        />
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

            {/* Price Range Filter */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span>Price Range (₹)</span>
              </h4>
              <div className="space-y-3">
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={10}
                  value={priceMax}
                  onChange={e => setPriceMax(Number(e.target.value))}
                  className="w-full h-1.5 appearance-none rounded-full bg-slate-200 accent-teal-600 cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase">Min</label>
                    <div className="relative mt-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
                      <input
                        type="number"
                        min={PRICE_MIN}
                        max={priceMax}
                        value={priceMin}
                        onChange={e => setPriceMin(Math.min(Number(e.target.value), priceMax))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-5 pr-2 py-1.5 text-xs text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <span className="text-slate-300 mt-4">–</span>
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase">Max</label>
                    <div className="relative mt-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
                      <input
                        type="number"
                        min={priceMin}
                        max={PRICE_MAX}
                        value={priceMax}
                        onChange={e => setPriceMax(Math.max(Number(e.target.value), priceMin))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-5 pr-2 py-1.5 text-xs text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
                {(priceMin > PRICE_MIN || priceMax < PRICE_MAX) && (
                  <button
                    onClick={() => { setPriceMin(PRICE_MIN); setPriceMax(PRICE_MAX); }}
                    className="text-[10px] text-teal-600 hover:text-teal-800 font-semibold underline"
                  >
                    Reset price
                  </button>
                )}
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

          {/* Search Grid */}
          <div className="lg:col-span-3">
            {filteredAndSortedResults.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xs">
                <p className="text-xs text-slate-500">No products match your selected filters. Try loosening your sidebar filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {filteredAndSortedResults.map(product => (
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="animate-pulse text-slate-400 text-xs font-semibold">Loading search results...</div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
