"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShoppingBag, Trash2, Plus, Minus, FileText, AlertTriangle, 
  CheckCircle, MapPin, ChevronRight, Bookmark, ArrowRight, ShieldCheck 
} from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { calculateBill } from "@/lib/utils/bill";
import BillSummary from "@/components/BillSummary";
import AddressSelector from "@/components/AddressSelector";

export default function CartPage() {
  const router = useRouter();
  const { 
    cart, 
    products, 
    prescriptions, 
    updateCartItem, 
    removeFromCart, 
    attachPrescription, 
    detachPrescription, 
    saveMedicationProfile, 
    currentUser 
  } = useMockStore();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [selectedRxForProfile, setSelectedRxForProfile] = useState("");
  const [showRxListDropdown, setShowRxListDropdown] = useState(false);

  // Resolve cart item details from catalog products
  const cartItemsWithDetails = cart.items.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      ...item,
      product
    };
  }).filter(item => item.product !== undefined);

  // Group items: Rx required vs OTC
  const rxItems = cartItemsWithDetails.filter(item => item.product!.rxRequired);
  const otcItems = cartItemsWithDetails.filter(item => !item.product!.rxRequired);

  // Check if prescription is attached
  const rxAttached = cart.attachedPrescriptionIds.length > 0;
  const rxRequiredButMissing = rxItems.length > 0 && !rxAttached;

  // Bill Calculations — single source of truth in lib/utils/bill.ts
  const bill = calculateBill(
    cartItemsWithDetails.map(item => ({
      price: item.product!.price,
      quantity: item.quantity,
    }))
  );

  // Handle mock prescription uploads
  const handleDirectUploadRx = async () => {
    // Simulate prescription upload
    const storedRxs = localStorage.getItem("auramed_prescriptions");
    const parsedRxs = storedRxs ? JSON.parse(storedRxs) : [];
    
    const newRx = {
      id: `rx_cart_${Date.now()}`,
      userId: "user_priya_001",
      imageUrl: "/docs/mom_bp_prescription.png",
      extractedMedicines: rxItems.map(item => ({
        name: item.product!.name,
        composition: item.product!.composition.map(c => `${c.salt} ${c.strength}`).join(" + "),
        confidence: "high" as const
      })),
      uploadedAt: new Date().toISOString()
    };
    
    // Add to store prescriptions list
    const updated = [newRx, ...parsedRxs];
    localStorage.setItem("auramed_prescriptions", JSON.stringify(updated));
    attachPrescription(newRx.id);
    alert("Prescription uploaded and verified by AI!");
    window.location.reload();
  };

  const handleAttachPrescriptionId = (rxId: string) => {
    attachPrescription(rxId);
    setShowRxListDropdown(false);
  };

  // Handle Medication Profile Creation
  const handleCreateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    // Use attached prescription or a default one
    const rxId = cart.attachedPrescriptionIds[0] || prescriptions[0]?.id;
    if (!rxId) {
      alert("Please upload or attach a prescription first!");
      return;
    }

    saveMedicationProfile(profileName.trim(), rxId);
    setShowProfileModal(false);
    setProfileName("");
    alert(`Medication profile "${profileName}" saved successfully!`);
  };

  if (cartItemsWithDetails.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-100 bg-white p-10 shadow-xs flex flex-col items-center">
          <ShoppingBag className="h-16 w-16 text-slate-300 mb-4" />
          <h2 className="text-lg font-black text-slate-900">Your shopping cart is empty</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
            Choose from chronic healthcare categories or search directly for prescriptions.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href="/#concern-section"
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 text-xs font-bold shadow-xs transition-colors"
            >
              Shop Concerns
            </Link>
            <Link
              href="/upload-prescription"
              className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 px-5 py-2.5 text-xs font-bold transition-colors"
            >
              Upload Prescription
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-black text-slate-900 mb-6">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Items list & prescription uploads */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Address Summary Bar — canonical AddressSelector */}
          <AddressSelector />


          {/* 2. Prescription Alert Warning Banner */}
          {rxItems.length > 0 && (
            <div className={`rounded-2xl border p-4 shadow-xs ${
              rxAttached 
                ? "border-emerald-100 bg-emerald-50/20 text-emerald-800" 
                : "border-amber-100 bg-amber-50/20 text-amber-800"
            }`}>
              <div className="flex items-start gap-3">
                {rxAttached ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-grow">
                  <h4 className="text-xs font-bold">
                    {rxAttached 
                      ? "Prescription attached successfully!" 
                      : `Prescription required for ${rxItems.length} item(s)`
                    }
                  </h4>
                  <p className="text-[11px] mt-1 leading-relaxed opacity-90">
                    {rxAttached 
                      ? "Pharmacist will verify the attached prescription after payment confirmation." 
                      : "We cannot process prescription items without an attached medical prescription. Upload one now or choose from your files."
                    }
                  </p>

                  {/* Actions to attach prescription */}
                  {!rxAttached && (
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      <button
                        onClick={handleDirectUploadRx}
                        className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-[10px] font-bold shadow-xs transition-colors"
                      >
                        Upload Prescription Image
                      </button>
                      
                      <div className="relative">
                        <button
                          onClick={() => setShowRxListDropdown(!showRxListDropdown)}
                          className="rounded-lg border border-amber-200 bg-white hover:bg-slate-50 text-amber-800 px-3 py-1.5 text-[10px] font-bold transition-all"
                        >
                          Select Saved Prescription ({prescriptions.length})
                        </button>

                        {showRxListDropdown && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowRxListDropdown(false)} />
                            <div className="absolute left-0 mt-1 z-50 w-72 rounded-xl border border-slate-100 bg-white p-2 shadow-lg max-h-48 overflow-y-auto">
                              {prescriptions.map((rx) => (
                                <button
                                  key={rx.id}
                                  onClick={() => handleAttachPrescriptionId(rx.id)}
                                  className="w-full text-left p-2 rounded-lg text-[10px] hover:bg-slate-50 border-b border-slate-50"
                                >
                                  <span className="font-bold block text-slate-800">Uploaded {new Date(rx.uploadedAt).toLocaleDateString()}</span>
                                  <span className="text-slate-500 line-clamp-1">Contains: {rx.extractedMedicines.map(m => m.name).join(", ")}</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {rxAttached && (
                    <button
                      onClick={() => detachPrescription(cart.attachedPrescriptionIds[0])}
                      className="mt-3 text-[10px] font-bold text-emerald-800 hover:underline block"
                    >
                      Detach Prescription
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. Prescription Required items */}
          {rxItems.length > 0 && (
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2 flex justify-between">
                <span>Prescription Required ({rxItems.length})</span>
                <span className="text-[10px] text-amber-600 font-extrabold flex items-center gap-0.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Rx Required</span>
                </span>
              </h3>

              <div className="divide-y divide-slate-50">
                {rxItems.map((item) => (
                  <div key={item.productId} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <img 
                      src={item.product!.imageUrl} 
                      alt={item.product!.name} 
                      className="h-14 w-14 rounded-lg bg-slate-50 object-cover border border-slate-100"
                    />
                    <div className="flex-grow min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.product!.name}</h4>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {item.product!.composition.map(c => `${c.salt} ${c.strength}`).join(" + ")}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.product!.packSize}</p>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <span className="text-xs font-black text-slate-900">₹{item.product!.price * item.quantity}</span>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        
                        <div className="flex items-center rounded-lg bg-slate-100 text-slate-700">
                          <button
                            onClick={() => updateCartItem(item.productId, item.quantity - 1)}
                            className="p-1 hover:bg-slate-200 rounded-l-lg"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItem(item.productId, item.quantity + 1)}
                            className="p-1 hover:bg-slate-200 rounded-r-lg"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. OTC / General items */}
          {otcItems.length > 0 && (
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">
                Other Healthcare Items ({otcItems.length})
              </h3>

              <div className="divide-y divide-slate-50">
                {otcItems.map((item) => (
                  <div key={item.productId} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <img 
                      src={item.product!.imageUrl} 
                      alt={item.product!.name} 
                      className="h-14 w-14 rounded-lg bg-slate-50 object-cover border border-slate-100"
                    />
                    <div className="flex-grow min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.product!.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.product!.packSize}</p>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <span className="text-xs font-black text-slate-900">₹{item.product!.price * item.quantity}</span>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        
                        <div className="flex items-center rounded-lg bg-slate-100 text-slate-700">
                          <button
                            onClick={() => updateCartItem(item.productId, item.quantity - 1)}
                            className="p-1 hover:bg-slate-200 rounded-l-lg"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItem(item.productId, item.quantity + 1)}
                            className="p-1 hover:bg-slate-200 rounded-r-lg"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Save as Medication Profile CTA banner */}
          {rxItems.length > 0 && (
            <div className="rounded-2xl border border-dashed border-teal-200 bg-teal-50/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Bookmark className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Save this cart to reorder next month</h4>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-md">
                    Convert these prescription medicines into a Medication Profile. Next month, you can refill this set in one tap without re-uploading the prescription!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(true)}
                className="rounded-xl border border-teal-200 bg-white hover:bg-teal-50 text-teal-600 px-4 py-2.5 text-xs font-bold shadow-xs transition-colors shrink-0"
              >
                Save as Medication Profile
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Bill Summary & Checkout */}
        <BillSummary
          bill={bill}
          cta={
            rxRequiredButMissing
              ? { label: "Proceed to Pay", disabled: true }
              : { label: "Proceed to Pay", href: "/checkout" }
          }
          hint={
            rxRequiredButMissing
              ? "Attach a prescription to proceed with checkout."
              : undefined
          }
        />
      </div>

      {/* Save Medication Profile Modal Dialog */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl animate-in zoom-in duration-150">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Name this Medication Set</h3>
            <p className="text-xs text-slate-500 mb-6">
              Create a profile (e.g. "Mom's BP meds" or "Dad's Chronic thyroid") to quickly group and reorder.
            </p>

            <form onSubmit={handleCreateProfileSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Profile Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mom's BP meds"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 text-white px-5 py-2 text-xs font-bold hover:bg-teal-700 shadow-xs transition-colors"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
