"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Heart, Bookmark, ArrowRight, Trash2, ShoppingCart, 
  Sparkles, FileText, CheckCircle, Clock 
} from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import AddressSelector from "@/components/AddressSelector";

export default function MyMedicationsPage() {
  const router = useRouter();
  const { 
    medicationProfiles, 
    reorderProfile, 
    products, 
    prescriptions 
  } = useMockStore();

  const handleReorder = (profileId: string) => {
    reorderProfile(profileId);
    alert("Profile medicines loaded. Redirecting you to checkout...");
    router.push("/checkout");
  };

  const handleRemoveProfile = (profileId: string) => {
    if (confirm("Delete this medication profile?")) {
      const stored = localStorage.getItem("auramed_profiles");
      if (stored) {
        const parsed = JSON.parse(stored);
        const filtered = parsed.filter((p: any) => p.id !== profileId);
        localStorage.setItem("auramed_profiles", JSON.stringify(filtered));
        alert("Medication profile deleted.");
        window.location.reload();
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Heart className="h-6 w-6 text-teal-600" />
            <span>My Medications</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Archived profiles of repeat chronic medication sets for your family
          </p>
        </div>
        <Link
          href="/upload-prescription"
          className="flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-all duration-150"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          <span>Add New</span>
        </Link>
      </div>

      {/* Active delivery address for next reorder — canonical AddressSelector */}
      <div className="mb-6">
        <AddressSelector label="Next reorder ships to" />
      </div>

      {medicationProfiles.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-xs">
          <Heart className="mx-auto h-12 w-12 text-slate-350 animate-pulse" />
          <h3 className="text-base font-bold text-slate-900 mt-4">No saved medications yet</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
            Save a collection of prescription medicines from your shopping cart to quickly order next month.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/upload-prescription"
              className="rounded-xl bg-teal-600 text-white px-5 py-2.5 text-xs font-bold shadow-xs hover:bg-teal-700 transition-colors"
            >
              Upload a Prescription
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-150 text-slate-700 px-5 py-2.5 text-xs font-bold transition-all"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      ) : (
        /* Profiles list */
        <div className="space-y-6">
          {medicationProfiles.map((profile) => {
            const rx = prescriptions.find(p => p.id === profile.prescriptionId);
            
            return (
              <div 
                key={profile.id}
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs hover:shadow-md transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-50 pb-4 mb-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                      <span>{profile.name}</span>
                      <span className="rounded bg-teal-50 px-2 py-0.5 text-[9px] font-extrabold text-teal-700 border border-teal-100">
                        {profile.medicines.length} medicines
                      </span>
                    </h3>
                    
                    {/* Sub details */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Last Ordered: {profile.lastOrderedAt ? new Date(profile.lastOrderedAt).toLocaleDateString() : "Never"}</span>
                      </span>
                      {rx && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Prescription Attached (Active)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveProfile(profile.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg self-end sm:self-start transition-colors focus:outline-none"
                    title="Delete Profile"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Medicines List cards layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {profile.medicines.map((med, index) => {
                    const linkedProduct = products.find(p => p.id === med.lastOrderedProductId);
                    return (
                      <div 
                        key={index}
                        className="rounded-2xl border border-slate-100 bg-slate-50/30 p-3.5 flex items-start gap-3"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700 font-bold text-xs shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-slate-800 truncate">{med.name}</span>
                          <span className="block text-[10px] text-slate-500 truncate mt-0.5">{med.composition}</span>
                          {linkedProduct && (
                            <Link 
                              href={`/product/${linkedProduct.id}`}
                              className="text-[9px] text-teal-600 hover:underline mt-1 block font-medium"
                            >
                              Preferred: {linkedProduct.name} (₹{linkedProduct.price})
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CTA actions */}
                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                    <span>Rx on file. Reordering will not request a new upload.</span>
                  </span>
                  
                  <button
                    onClick={() => handleReorder(profile.id)}
                    className="flex items-center gap-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm hover:shadow transition-all duration-150 focus:outline-none"
                  >
                    <span>Reorder Set</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Inline Plus icon helper
function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
