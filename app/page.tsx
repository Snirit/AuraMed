"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  FileText, ArrowRight, Activity, Heart, Droplet, Wind, 
  Zap, Shield, Plus, Truck, AlertCircle, ShoppingBag, Eye 
} from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import ProductCard from "@/components/ProductCard";

// Helper to map category slugs to Lucide icons
const categoryIconMap: Record<string, React.ComponentType<any>> = {
  "bp-heart": Heart,
  "diabetes": Droplet,
  "cold-cough": Wind,
  "vitamins": Zap,
  "pain-relief": Activity,
  "stomach": Shield
};

export default function Home() {
  const router = useRouter();
  const { 
    isFtuxMode, 
    medicationProfiles, 
    orders, 
    products, 
    categories, 
    addToCart, 
    reorderProfile 
  } = useMockStore();

  // Find active orders (e.g. "out_for_delivery", "verifying", "placed")
  const activeOrder = orders.find(o => o.status !== "delivered");

  // Determine if we show FTUX layout
  const showFtux = isFtuxMode || medicationProfiles.length === 0;

  // Handle reorder in one tap (Flow 6: Reorder -> Pay -> Confirm)
  const handleQuickReorder = (profileId: string) => {
    reorderProfile(profileId);
    router.push("/checkout");
  };

  // Popular products to display under "Recently Ordered" for returning user
  const popularProducts = products.filter(p => 
    ["prod_telma_40", "prod_glycomet_500", "prod_dolo_650", "prod_revital_h"].includes(p.id)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 1. Active Order Banner (Returning User only) */}
      {!showFtux && activeOrder && (
        <div className="mb-8 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 to-emerald-50 p-4 shadow-sm animate-in slide-in-from-top duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-white animate-pulse-soft">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Your order is on the way!
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Arriving in approximately <span className="font-semibold text-teal-700">18 minutes</span> (Order #{activeOrder.id})
                </p>
              </div>
            </div>
            <Link
              href={`/order/${activeOrder.id}`}
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-xs font-semibold transition-all duration-150"
            >
              <span>Track Live</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 2. FTUX Hero & Welcoming Banner */}
      {showFtux ? (
        <div className="mb-12 rounded-3xl border border-slate-100 bg-white p-6 sm:p-10 shadow-sm relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 h-64 w-64 bg-radial-gradient from-teal-50/50 to-transparent -mr-20 -mt-20 rounded-full" />
          
          <div className="max-w-2xl relative z-10">
            <span className="rounded-full bg-teal-50 border border-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
              Introducing AuraMed
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mt-4 leading-tight">
              Manage your family's chronic medicines in one place
            </h1>
            <p className="text-base text-slate-600 mt-3">
              We extract medicine lists from prescriptions, match cheap generic alternatives, and save profiles for one-tap refills from Bangalore or Pune.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link
                href="/upload-prescription"
                className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-6 py-3.5 text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200"
              >
                <FileText className="h-5 w-5" />
                <span>Upload First Prescription</span>
              </Link>
              <Link
                href="#concern-section"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 px-6 py-3.5 text-sm font-semibold transition-all duration-200"
              >
                <span>Browse Catalog</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* 3. Returning User Medications Hub Strip */
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Your Medications</h2>
              <p className="text-xs text-slate-500">Refill your parents' saved prescriptions in seconds</p>
            </div>
            <Link
              href="/my-medications"
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-0.5"
            >
              <span>See all</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {medicationProfiles.map((profile) => (
              <div 
                key={profile.id}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-slate-950 text-base">{profile.name}</h3>
                    <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-100">
                      {profile.medicines.length} meds
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Last ordered: {profile.name.includes("BP") ? "12 days ago" : "4 days ago"}
                  </p>

                  <div className="mt-4 space-y-1.5">
                    {profile.medicines.map((med, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                        <span className="font-medium truncate">{med.name}</span>
                        <span className="text-[10px] text-slate-400">({med.composition.split(" ")[0]})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <Link
                    href="/my-medications"
                    className="flex-1 text-center rounded-lg border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleQuickReorder(profile.id)}
                    className="flex-1 rounded-lg bg-teal-600 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-xs transition-colors"
                  >
                    Quick Reorder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. FTUX "How it works" */}
      {showFtux && (
        <div className="mb-12 rounded-3xl border border-slate-100 bg-slate-50/50 p-6 sm:p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6">How AuraMed Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 border border-teal-100 text-teal-700 font-bold text-sm">
                1
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Upload Prescription</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Upload a photo of a printed prescription. Our AI reads the names and compositions instantly.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 border border-teal-100 text-teal-700 font-bold text-sm">
                2
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Choose Brand or Generic</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  We group matches by salt composition. Pick branded or choose high-quality generic alternatives to save up to 60%.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 border border-teal-100 text-teal-700 font-bold text-sm">
                3
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Save Medication Profile</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  At checkout, save this list as "Mom's BP Meds" or "Dad's Thyroid". Reorder next month in 1 tap without uploading again!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Shop by Concern (Categories) */}
      <div id="concern-section" className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Shop by Concern</h2>
        <p className="text-xs text-slate-500 mb-6">Explore medicines categorized by treatment area</p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {categories.map((cat) => {
            const IconComponent = categoryIconMap[cat.slug] || ShoppingBag;
            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 text-center hover:border-teal-200 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 mb-3">
                  <IconComponent className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-800 tracking-tight group-hover:text-teal-700 transition-colors">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 6. Recently Ordered items (Returning User only) */}
      {!showFtux && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Frequently Reordered Items</h2>
              <p className="text-xs text-slate-500">Fast checkout for individual items</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} variant="compact" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
