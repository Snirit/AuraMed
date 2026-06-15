"use client";

import React, { useState } from "react";
import { Sliders, RefreshCw, AlertCircle } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";

export default function DemoSettings() {
  const { isFtuxMode, setFtuxMode, resetStore } = useMockStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleReset = () => {
    if (confirm("Reset local storage to initial pre-seeded data?")) {
      resetStore();
      setIsOpen(false);
      window.location.href = "/"; // reload back to home
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 focus:outline-none transition-all duration-200 hover:scale-105"
        title="Demo Settings"
      >
        <Sliders className={`h-5 w-5 ${isOpen ? "rotate-90" : ""} transition-transform duration-200`} />
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-xs" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-16 right-0 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-black/5 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <span>Demo Helper Settings</span>
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Toggle between app states to test the exact workflows.
            </p>

            {/* Toggle State */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">User State</span>
                  <span className="text-[10px] text-slate-500">
                    {isFtuxMode ? "First-Time User (FTUX)" : "Returning User"}
                  </span>
                </div>
                <button
                  onClick={() => setFtuxMode(!isFtuxMode)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isFtuxMode ? "bg-teal-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isFtuxMode ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Info panel */}
              <div className="flex gap-2 p-2.5 rounded-xl bg-amber-50/50 border border-amber-100/50 text-amber-800 text-[10px]">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold mb-0.5">Simulate flows:</p>
                  {isFtuxMode ? (
                    <p>Home is empty. Click "Upload Rx" or search for a medicine to build your first medication profile.</p>
                  ) : (
                    <p>Home displays Mom's BP profile, Dad's thyroid profile, and an active delivery tracker banner.</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={handleReset}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/20 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 hover:text-red-800 transition-all duration-150"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset Demo Database</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
