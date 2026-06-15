"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText, Upload, Plus, Trash2, Edit2, Check,
  ArrowRight, Search, Sparkles, Loader2, Info, X, AlertCircle
} from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { ExtractedMedicine, Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function UploadPrescriptionPage() {
  const router = useRouter();
  const {
    mockUploadPrescription,
    mockManualPrescription,
    products,
    addToCart,
    cart,
    attachPrescription
  } = useMockStore();

  // Navigation states
  // step 1: upload / input
  // step 2: loading / editable list
  // step 3: swiggy-style match results
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [useManual, setUseManual] = useState(false);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string>("");

  // Manual inputs state
  const [manualTypedName, setManualTypedName] = useState("");
  const [manualList, setManualList] = useState<string[]>([]);

  // AI extracted state (editable)
  const [extractedMeds, setExtractedMeds] = useState<ExtractedMedicine[]>([]);
  const [activeRxId, setActiveRxId] = useState("");

  // ============= REAL FILE UPLOAD HANDLERS =============

  const validateFile = (file: File): string => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Please upload a JPEG, PNG, or WEBP image";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Image must be under 5MB";
    }
    return "";
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelected = async (file: File) => {
    setUploadError("");
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    try {
      const base64 = await readFileAsBase64(file);
      setPreviewUrl(base64);
      // Auto-trigger Gemini extraction
      await processUpload(base64);
    } catch (err: any) {
      setUploadError(err.message || "Failed to read image");
    }
  };

  const processUpload = async (base64: string) => {
    setLoading(true);
    setStep(2);
    try {
      const rx = await mockUploadPrescription(base64);
      if (rx.extractedMedicines.length === 0) {
        setUploadError(
          "We couldn't read this prescription clearly. Try a sharper photo or enter medicines manually."
        );
        setStep(1);
      } else {
        setExtractedMeds(rx.extractedMedicines);
        setActiveRxId(rx.id);
      }
    } catch (err: any) {
      const code = err?.code || "AI_DOWN";
      const messages: Record<string, string> = {
        AI_DOWN: "AI service is temporarily unavailable. Please try again or enter manually.",
        AI_QUOTA_EXHAUSTED: "AI extraction quota exhausted for the day. Please use manual entry or try again later.",
        AI_PARSE_ERROR: "We couldn't read this prescription. Try a clearer photo or manual entry.",
        IMAGE_TOO_LARGE: "Image is too large. Maximum size is 5MB.",
        INVALID_FILE_TYPE: "Please upload a JPEG, PNG, or WEBP image.",
        MISSING_IMAGE: "No image provided.",
      };
      setUploadError(messages[code] || err?.error || "Upload failed. Please try again.");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // Drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  };

  // Click-to-pick handler
  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleClearPreview = () => {
    setPreviewUrl(null);
    setUploadError("");
  };

  // Demo presets (still useful for quick testing without an image)
  const handleDemoUpload = async (type: "bp" | "cold") => {
    setLoading(true);
    setStep(2);
    try {
      const rx = await mockUploadPrescription(type);
      setExtractedMeds(rx.extractedMedicines);
      setActiveRxId(rx.id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Handle Manual Input submission
  const handleAddManualChip = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualTypedName.trim() && !manualList.includes(manualTypedName.trim())) {
      setManualList([...manualList, manualTypedName.trim()]);
      setManualTypedName("");
    }
  };

  const handleRemoveManualChip = (index: number) => {
    setManualList(manualList.filter((_, i) => i !== index));
  };

  const handleManualSearch = () => {
    if (manualList.length === 0) return;
    setLoading(true);
    setStep(2);
    setTimeout(() => {
      const rx = mockManualPrescription(manualList);
      setExtractedMeds(rx.extractedMedicines);
      setActiveRxId(rx.id);
      setLoading(false);
    }, 1000); // quick mock loading
  };

  // Editable list helpers
  const handleEditMedicine = (index: number, newName: string) => {
    const updated = [...extractedMeds];
    updated[index] = { ...updated[index], name: newName };
    setExtractedMeds(updated);
  };

  const handleEditComposition = (index: number, newComp: string) => {
    const updated = [...extractedMeds];
    updated[index] = { ...updated[index], composition: newComp };
    setExtractedMeds(updated);
  };

  const handleRemoveMedicine = (index: number) => {
    setExtractedMeds(extractedMeds.filter((_, i) => i !== index));
  };

  const handleAddRow = () => {
    setExtractedMeds([
      ...extractedMeds,
      { name: "New Medicine", composition: "Specify composition (e.g. Paracetamol)", confidence: "high" }
    ]);
  };

  // Advance to Swiggy Results page
  const handleFindMedicines = () => {
    if (extractedMeds.length === 0) return;
    setStep(3);
  };

  // Match products from catalog for step 3
  const getProductMatches = (med: ExtractedMedicine) => {
    // Find all products matching by name or composition salt
    const matches = products.filter(product => {
      const matchName = product.name.toLowerCase().includes(med.name.toLowerCase());
      const matchComp = product.composition.some(c => 
        med.composition.toLowerCase().includes(c.salt.toLowerCase())
      );
      return matchName || matchComp;
    });

    // Sort: branded first, then generics sorted by price
    return matches.sort((a, b) => {
      if (!a.isGeneric && b.isGeneric) return -1;
      if (a.isGeneric && !b.isGeneric) return 1;
      return a.price - b.price;
    });
  };

  const handleAddMatchToCart = (productId: string) => {
    addToCart(productId, 1);
    if (activeRxId) {
      attachPrescription(activeRxId);
    }
  };

  // Helper to count quantities in cart for matched items
  const getCartQuantity = (productId: string) => {
    const item = cart.items.find(i => i.productId === productId);
    return item ? item.quantity : 0;
  };

  // Count items added from this results page
  const addedCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Step Progress indicators */}
      <div className="mb-8 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
        <span className={step === 1 ? "text-teal-600 font-black" : "text-slate-500"}>1. Upload</span>
        <span className="h-0.5 w-8 bg-slate-200" />
        <span className={step === 2 ? "text-teal-600 font-black" : "text-slate-500"}>2. Extract & Edit</span>
        <span className="h-0.5 w-8 bg-slate-200" />
        <span className={step === 3 ? "text-teal-600 font-black" : "text-slate-500"}>3. Match Products</span>
      </div>

      {/* ============================================================== */}
      {/* STEP 1: Upload / Input Interface                               */}
      {/* ============================================================== */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-900">Upload Your Prescription</h1>
            <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
              Our AI extracts the medicine names so you don't have to search and type them one by one.
            </p>
          </div>

          {!useManual ? (
            /* Upload Zone card */
            <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-10 shadow-xs">
              {/* Hidden file input — actual upload mechanism */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {previewUrl ? (
                /* Preview state — shows uploaded image */
                <div className="relative rounded-2xl border-2 border-teal-200 bg-teal-50/20 p-4">
                  <button
                    onClick={handleClearPreview}
                    className="absolute top-2 right-2 z-10 rounded-full bg-white shadow-md p-1.5 hover:bg-slate-50 transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5 text-slate-600" />
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Prescription preview"
                    className="max-h-64 mx-auto rounded-xl object-contain"
                  />
                  <div className="mt-3 text-center">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700">
                      <Check className="h-3.5 w-3.5" />
                      Image ready — processing with AI...
                    </span>
                  </div>
                </div>
              ) : (
                /* Dashed Dropzone — real click + drag-and-drop handlers wired */
                <div
                  onClick={handleDropzoneClick}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleDropzoneClick()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDragging
                      ? "border-teal-500 bg-teal-50 scale-[1.01]"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-teal-300"
                  }`}
                >
                  <Upload
                    className={`mx-auto h-10 w-10 mb-4 transition-colors ${
                      isDragging ? "text-teal-600" : "text-slate-400"
                    }`}
                  />
                  <span className="block text-xs font-bold text-slate-800">
                    {isDragging
                      ? "Drop your prescription here"
                      : "Click to choose, or drag & drop your prescription image"}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-1">
                    Supports JPEG, PNG, WEBP up to 5MB (Printed prescriptions work best)
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDropzoneClick();
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 text-xs font-bold shadow-sm transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Choose Image</span>
                  </button>
                </div>
              )}

              {/* Error banner */}
              {uploadError && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-medium">{uploadError}</p>
                </div>
              )}

              {/* Demo Helper buttons for testing */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                  <span>Choose Demo Preset to Simulate AI Extraction</span>
                </h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleDemoUpload("bp")}
                    className="flex-1 rounded-xl border border-teal-150 bg-teal-50/30 hover:bg-teal-50 p-4 text-left transition-all duration-150"
                  >
                    <span className="block text-xs font-bold text-teal-900">Preset A: Chronic BP Meds</span>
                    <span className="block text-[10px] text-teal-700/80 mt-1">
                      Extracts: Telma 40, Glycomet 500, Atorlip 10
                    </span>
                  </button>

                  <button
                    onClick={() => handleDemoUpload("cold")}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 p-4 text-left transition-all duration-150"
                  >
                    <span className="block text-xs font-bold text-slate-900">Preset B: Cold & Cough OTC</span>
                    <span className="block text-[10px] text-slate-600 mt-1">
                      Extracts: Solvin Cold, Becosules
                    </span>
                  </button>
                </div>
              </div>

              {/* Toggle Manual Fallback */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => setUseManual(true)}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline"
                >
                  Don't have a photo? Type medicines manually
                </button>
              </div>
            </div>
          ) : (
            /* Manual Input fallback Card */
            <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Type medicines manually</h3>
              <p className="text-xs text-slate-500 mb-6">Type a medicine name and press Enter to add to list.</p>

              <form onSubmit={handleAddManualChip} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Telma 40, Glycomet, paracetamol..."
                  value={manualTypedName}
                  onChange={(e) => setManualTypedName(e.target.value)}
                  className="flex-grow rounded-xl border border-slate-200 px-4 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 text-white px-4 py-2 text-xs font-bold hover:bg-teal-700 transition-colors"
                >
                  Add
                </button>
              </form>

              {/* Chips strip */}
              <div className="flex flex-wrap gap-2 mt-6 min-h-[40px] p-2 bg-slate-50 rounded-xl border border-slate-100">
                {manualList.length === 0 ? (
                  <span className="text-[11px] text-slate-400 self-center pl-2">No medicines added yet.</span>
                ) : (
                  manualList.map((med, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 border border-teal-100"
                    >
                      <span>{med}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveManualChip(index)}
                        className="text-teal-600 hover:text-teal-800 font-bold ml-1 focus:outline-none"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* CTAs */}
              <div className="mt-8 flex justify-between items-center pt-4 border-t border-slate-50">
                <button
                  onClick={() => setUseManual(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  ← Go back to image upload
                </button>
                <button
                  onClick={handleManualSearch}
                  disabled={manualList.length === 0}
                  className="rounded-xl bg-teal-600 disabled:bg-slate-200 text-white px-6 py-2.5 text-xs font-bold hover:bg-teal-700 shadow-xs transition-colors"
                >
                  Find Medicines
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 2: Extraction Loading OR Edit Extracted List               */}
      {/* ============================================================== */}
      {step === 2 && (
        <div className="space-y-6">
          {loading ? (
            /* simulated AI Extraction Loader state */
            <div className="rounded-3xl border border-slate-100 bg-white p-16 text-center shadow-xs flex flex-col items-center">
              <Loader2 className="h-10 w-10 text-teal-600 animate-spin mb-4" />
              <h3 className="text-base font-bold text-slate-900">Reading Prescription with AI...</h3>
              <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                Extracting legibly printed medicine names and scientific compositions from the prescription image.
              </p>
            </div>
          ) : (
            /* Extracted list results editable container */
            <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-xs">
              <div className="mb-6 flex justify-between items-center border-b border-slate-50 pb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900">Here's what we found</h2>
                  <p className="text-xs text-slate-500">Edit, delete, or confirm the extracted list below.</p>
                </div>
                <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 border border-teal-100">
                  {extractedMeds.length} items
                </span>
              </div>

              {/* Editable Table/List */}
              <div className="space-y-4">
                {extractedMeds.map((med, index) => (
                  <div 
                    key={index}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all duration-150"
                  >
                    {/* Medicine Name Input */}
                    <div className="flex-grow flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Medicine Name</label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => handleEditMedicine(index, e.target.value)}
                        className="w-full bg-white rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    {/* Composition Salt Input */}
                    <div className="flex-grow flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Active Salt Composition</label>
                      <input
                        type="text"
                        value={med.composition}
                        onChange={(e) => handleEditComposition(index, e.target.value)}
                        className="w-full bg-white rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicine(index)}
                      className="self-end sm:self-center p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none"
                      title="Remove Row"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Row button */}
              <button
                type="button"
                onClick={handleAddRow}
                className="mt-6 flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline px-2 py-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add another medicine</span>
              </button>

              {/* Sticky bottom CTA row */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  ← Start Over
                </button>
                <button
                  onClick={handleFindMedicines}
                  disabled={extractedMeds.length === 0}
                  className="rounded-xl bg-teal-600 disabled:bg-slate-200 text-white px-6 py-3 text-xs font-bold hover:bg-teal-700 shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <span>Find Matches</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 3: Swiggy-style comparison matching results               */}
      {/* ============================================================== */}
      {step === 3 && (
        <div className="space-y-8 pb-24">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-slate-900">Compare & Select Products</h2>
              <p className="text-xs text-slate-500">We matched your prescribed medicines with originals and generics.</p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="text-xs font-bold text-teal-600 hover:text-teal-700"
            >
              ← Edit Prescription list
            </button>
          </div>

          {/* Grouped sections */}
          <div className="space-y-8">
            {extractedMeds.map((med, idx) => {
              const matches = getProductMatches(med);

              return (
                <div key={idx} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs">
                  <div className="border-b border-slate-50 pb-3 mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span>Prescribed: {med.name}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 pl-6">
                      Composition: {med.composition}
                    </p>
                  </div>

                  {matches.length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-slate-100/50">
                      We couldn't find matches in our dark store catalog. Try adjusting the medicine name spelling or remove this item.
                    </div>
                  ) : (
                    /* Canonical ProductCard with highlight-generic variant.
                       The onAdd override lets us attach the active prescription right after add. */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {matches.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          variant="highlight-generic"
                          onAdd={handleAddMatchToCart}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sticky Bottom Cart CTA */}
          <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-4 shadow-xl z-30">
            <div className="mx-auto max-w-4xl flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">
                  {addedCount} packs added to shopping cart
                </span>
                <span className="text-[10px] text-slate-400">
                  You can review item selections in your cart before checkout
                </span>
              </div>
              <Link
                href="/cart"
                className="flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200"
              >
                <span>Go to Cart</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
