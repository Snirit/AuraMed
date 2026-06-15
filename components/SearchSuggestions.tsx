"use client";

import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { Product } from "@/lib/types";

interface SearchSuggestionsProps {
  query: string;
  open: boolean;
  onClose: () => void;
  /** Called when user navigates so the parent can clear focus / blur the input. */
  onNavigate?: () => void;
  /** Element id used for ARIA combobox plumbing in the parent input. */
  listboxId: string;
  /** Reports the currently highlighted option id back to the parent (for aria-activedescendant). */
  onActiveOptionChange?: (id: string | null) => void;
}

export interface SearchSuggestionsHandle {
  /** Called by the parent when the input receives arrow/enter keys. Returns true if handled. */
  handleKeyDown: (e: React.KeyboardEvent) => boolean;
}

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;
const MAX_RESULTS = 4;

type FetchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; results: Product[] }
  | { kind: "error" };

const SearchSuggestions = forwardRef<SearchSuggestionsHandle, SearchSuggestionsProps>(
  function SearchSuggestions({ query, open, onClose, onNavigate, listboxId, onActiveOptionChange }, ref) {
    const router = useRouter();
    const [state, setState] = useState<FetchState>({ kind: "idle" });
    const [highlight, setHighlight] = useState<number>(-1);
    const abortRef = useRef<AbortController | null>(null);

    const trimmed = query.trim();
    const shouldFetch = open && trimmed.length >= MIN_CHARS;

    // Debounced fetch + abort previous in-flight request
    useEffect(() => {
      if (!shouldFetch) {
        setState({ kind: "idle" });
        return;
      }
      const timer = setTimeout(() => {
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setState({ kind: "loading" });

        fetch(`/api/products?search=${encodeURIComponent(trimmed)}`, { signal: ctrl.signal })
          .then((r) => {
            if (!r.ok) throw new Error("Search failed");
            return r.json();
          })
          .then((data: { products: Product[] }) => {
            // Backend doesn't support ?limit — slice on frontend. Negligible for 74-product catalog.
            setState({ kind: "ok", results: data.products.slice(0, MAX_RESULTS) });
          })
          .catch((err) => {
            if (err?.name === "AbortError") return;
            setState({ kind: "error" });
          });
      }, DEBOUNCE_MS);

      return () => clearTimeout(timer);
    }, [trimmed, shouldFetch]);

    // Reset highlight when query changes or dropdown opens
    useEffect(() => {
      setHighlight(-1);
    }, [trimmed, open]);

    // Total number of stops: each result row + 1 for "View all"
    const resultsCount = state.kind === "ok" ? state.results.length : 0;
    const totalStops = resultsCount + 1; // +1 for "View all"

    // Report active option id upward for aria-activedescendant
    useEffect(() => {
      if (highlight < 0) {
        onActiveOptionChange?.(null);
      } else if (highlight === resultsCount) {
        onActiveOptionChange?.(`${listboxId}-viewall`);
      } else {
        const r = state.kind === "ok" ? state.results[highlight] : null;
        onActiveOptionChange?.(r ? `${listboxId}-${r.id}` : null);
      }
    }, [highlight, resultsCount, state, onActiveOptionChange, listboxId]);

    // Navigate helpers
    const goToProduct = useCallback(
      (id: string) => {
        onClose();
        onNavigate?.();
        router.push(`/product/${id}`);
      },
      [router, onClose, onNavigate]
    );

    const goToSearch = useCallback(() => {
      onClose();
      onNavigate?.();
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }, [router, trimmed, onClose, onNavigate]);

    // Imperative key handler exposed to the parent input
    useImperativeHandle(
      ref,
      () => ({
        handleKeyDown: (e) => {
          if (!open) return false;

          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => (totalStops === 0 ? -1 : (h + 1) % totalStops));
            return true;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => (totalStops === 0 ? -1 : (h <= 0 ? totalStops - 1 : h - 1)));
            return true;
          }
          if (e.key === "Escape") {
            e.preventDefault();
            onClose();
            return true;
          }
          if (e.key === "Enter") {
            // Highlight === resultsCount means "View all"; -1 means nothing highlighted
            if (highlight >= 0 && highlight < resultsCount && state.kind === "ok") {
              e.preventDefault();
              goToProduct(state.results[highlight].id);
              return true;
            }
            // "View all" highlighted OR nothing highlighted → fall through to default form submit
            // which already navigates to /search?q=... (existing behavior).
            return false;
          }
          return false;
        },
      }),
      [highlight, resultsCount, totalStops, state, open, onClose, goToProduct]
    );

    if (!open || trimmed.length < MIN_CHARS) return null;

    const viewAllIdx = resultsCount;
    const viewAllId = `${listboxId}-viewall`;

    return (
      <div
        id={listboxId}
        role="listbox"
        aria-label="Search suggestions"
        className="absolute left-0 right-0 sm:left-auto sm:right-auto sm:w-full top-full mt-1.5 z-50 rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto"
      >
        {state.kind === "loading" && <LoadingRows />}

        {state.kind === "error" && (
          <NonResultRow text="Something went wrong, try again" />
        )}

        {state.kind === "ok" && state.results.length === 0 && (
          <NonResultRow text={`No products found for "${trimmed}"`} />
        )}

        {state.kind === "ok" &&
          state.results.map((p, idx) => {
            const isActive = highlight === idx;
            const optionId = `${listboxId}-${p.id}`;
            return (
              <Link
                key={p.id}
                id={optionId}
                role="option"
                aria-selected={isActive}
                href={`/product/${p.id}`}
                onClick={() => {
                  onClose();
                  onNavigate?.();
                }}
                onMouseEnter={() => setHighlight(idx)}
                className={`flex items-center gap-3 px-3 py-2.5 min-h-[44px] border-b border-slate-50 last:border-b-0 transition-colors ${
                  isActive ? "bg-teal-50" : "hover:bg-slate-50"
                }`}
              >
                <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-slate-50 overflow-hidden flex items-center justify-center">
                  {p.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Search className="h-4 w-4 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {p.composition.map((c) => `${c.salt} ${c.strength}`).join(" + ")}
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-900 flex-shrink-0">
                  ₹{p.price}
                </div>
              </Link>
            );
          })}

        {/* Always-present "View all" row */}
        <button
          type="button"
          id={viewAllId}
          role="option"
          aria-selected={highlight === viewAllIdx}
          onClick={goToSearch}
          onMouseEnter={() => setHighlight(viewAllIdx)}
          className={`w-full flex items-center justify-between gap-2 px-3 py-3 min-h-[44px] border-t border-slate-100 text-left transition-colors ${
            highlight === viewAllIdx ? "bg-teal-50 text-teal-800" : "bg-slate-50/60 hover:bg-slate-50 text-teal-700"
          }`}
        >
          <span className="text-xs font-bold truncate">
            View all results for &ldquo;{trimmed}&rdquo;
          </span>
          <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
        </button>
      </div>
    );
  }
);

export default SearchSuggestions;

// -------------- helpers --------------

function LoadingRows() {
  return (
    <div className="px-3 py-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 py-2 animate-pulse"
        >
          <div className="h-10 w-10 rounded-lg bg-slate-100 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-slate-100 rounded w-2/3" />
            <div className="h-2.5 bg-slate-100 rounded w-1/2" />
          </div>
          <div className="h-3 w-8 bg-slate-100 rounded" />
        </div>
      ))}
      <div className="flex items-center justify-center py-1 text-[10px] text-slate-400 gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Searching…</span>
      </div>
    </div>
  );
}

function NonResultRow({ text }: { text: string }) {
  return (
    <div className="px-4 py-4 text-xs text-slate-500 text-center min-h-[44px] flex items-center justify-center">
      {text}
    </div>
  );
}
