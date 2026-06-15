"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, ShoppingCart, MapPin, Heart, FileText } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import AddressSelector from "@/components/AddressSelector";
import SearchSuggestions, { SearchSuggestionsHandle } from "@/components/SearchSuggestions";

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { cart } = useMockStore();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [open, setOpen] = useState(false);
  const [activeOption, setActiveOption] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<SearchSuggestionsHandle>(null);
  const mobileSuggestionsRef = useRef<SearchSuggestionsHandle>(null);
  const listboxId = useId();

  const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Close dropdown when clicking outside either search container
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDesktop = containerRef.current?.contains(target);
      const insideMobile = mobileContainerRef.current?.contains(target);
      if (!insideDesktop && !insideMobile) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Sync input from URL when navigating to /search?q=
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setSearchQuery(q);
  }, [searchParams]);

  // Shared handlers used by both desktop + mobile inputs
  const onChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim().length >= 2) setOpen(true);
    else setOpen(false);
  };

  const onFocus = () => {
    if (searchQuery.trim().length >= 2) setOpen(true);
  };

  const onClose = () => setOpen(false);

  const makeKeyHandler =
    (suggHandle: React.RefObject<SearchSuggestionsHandle>) =>
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Suggestions handle ArrowUp/Down/Esc/Enter-on-product. If they return
      // true they handled it; otherwise the form's onSubmit takes Enter.
      suggHandle.current?.handleKeyDown(e);
    };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo & Location */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
              AuraMed
            </span>
            <span className="hidden sm:inline-block rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 border border-teal-100">
              Caregiver First
            </span>
          </Link>

          <AddressSelector variant="header" />
        </div>

        {/* Center: Desktop Search Bar */}
        <div ref={containerRef} className="hidden md:flex flex-1 max-w-md mx-6 relative">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search medicines or composition..."
                value={searchQuery}
                onChange={(e) => onChange(e.target.value)}
                onFocus={onFocus}
                onKeyDown={makeKeyHandler(suggestionsRef)}
                role="combobox"
                aria-expanded={open}
                aria-controls={`${listboxId}-desktop`}
                aria-autocomplete="list"
                aria-activedescendant={activeOption ?? undefined}
                autoComplete="off"
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-4 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition-all duration-200"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors duration-150"
                aria-label="Search"
              >
                <Search className="h-4.5 w-4.5" />
              </button>
            </div>
          </form>

          <SearchSuggestions
            ref={suggestionsRef}
            query={searchQuery}
            open={open}
            onClose={onClose}
            listboxId={`${listboxId}-desktop`}
            onActiveOptionChange={setActiveOption}
          />
        </div>

        {/* Right: Nav Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/upload-prescription"
            className="flex items-center gap-1.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-xs font-semibold shadow-sm hover:shadow transition-all duration-150"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Upload Rx</span>
          </Link>

          <Link
            href="/my-medications"
            className="flex items-center gap-1 text-slate-600 hover:text-teal-600 text-sm font-medium transition-colors duration-150 px-2 py-1.5 rounded-lg hover:bg-slate-50"
          >
            <Heart className="h-4 w-4" />
            <span className="hidden lg:inline">My Medications</span>
          </Link>

          <Link
            href="/cart"
            className="relative flex items-center justify-center p-2 rounded-full text-slate-600 hover:bg-slate-50 hover:text-teal-600 transition-all duration-150"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-sm animate-in zoom-in duration-200">
                {cartCount}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-2 border-l border-slate-100 pl-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-700 border border-teal-100 font-semibold text-xs">
              P
            </div>
            <span className="hidden md:inline-block text-xs font-semibold text-slate-700">
              Priya
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Search Row */}
      <div
        ref={mobileContainerRef}
        className="border-t border-slate-100 bg-slate-50 p-2 md:hidden relative"
      >
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <input
            type="text"
            placeholder="Search medicines or composition..."
            value={searchQuery}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onKeyDown={makeKeyHandler(mobileSuggestionsRef)}
            role="combobox"
            aria-expanded={open}
            aria-controls={`${listboxId}-mobile`}
            aria-autocomplete="list"
            aria-activedescendant={activeOption ?? undefined}
            autoComplete="off"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-4 pr-10 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-all duration-200"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>

        <SearchSuggestions
          ref={mobileSuggestionsRef}
          query={searchQuery}
          open={open}
          onClose={onClose}
          listboxId={`${listboxId}-mobile`}
          onActiveOptionChange={setActiveOption}
        />
      </div>
    </header>
  );
}
