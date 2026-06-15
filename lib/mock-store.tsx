"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  User,
  Product,
  Category,
  Prescription,
  Cart,
  MedicationProfile,
  Order,
  ExtractedMedicine,
} from "./types";
import { apiGet, apiPost, apiPut, apiDelete } from "./api-client";
import { computeOrderStatus } from "./utils/order-status";

interface MockStoreContextType {
  products: Product[];
  categories: Category[];
  currentUser: User;
  cart: Cart;
  medicationProfiles: MedicationProfile[];
  orders: Order[];
  prescriptions: Prescription[];
  isFtuxMode: boolean;
  setFtuxMode: (value: boolean) => void;
  addToCart: (productId: string, quantity: number) => void;
  updateCartItem: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  attachPrescription: (prescriptionId: string) => void;
  detachPrescription: (prescriptionId: string) => void;
  saveMedicationProfile: (name: string, prescriptionId: string) => void;
  reorderProfile: (profileId: string) => void;
  placeOrder: (addressId: string) => Promise<Order | null>;
  mockUploadPrescription: (typeOrImage: "bp" | "cold" | string) => Promise<Prescription>;
  mockManualPrescription: (names: string[]) => Promise<Prescription>;
  setActiveAddress: (addressId: string) => Promise<void>;
  resetStore: () => void;
}

const MockStoreContext = createContext<MockStoreContextType | undefined>(undefined);

// Fallback user for SSR/initial render — overridden by localStorage on hydration
const FALLBACK_USER: User = {
  id: "user_priya_001",
  name: "Priya",
  phone: "+91 98765 43210",
  defaultAddressId: "addr_bangalore_001",
  addresses: [
    {
      id: "addr_bangalore_001",
      label: "Home (Bangalore)",
      line1: "A-211, Majestic Residency",
      line2: "Koramangala 4th Block",
      city: "Bangalore",
      pincode: "560034",
    },
    {
      id: "addr_pune_002",
      label: "Parents' Home (Pune)",
      line1: "Flat 402, Shanti Vihar",
      line2: "Aundh Road",
      city: "Pune",
      pincode: "411007",
    },
  ],
};

const EMPTY_CART: Cart = {
  userId: "user_priya_001",
  items: [],
  attachedPrescriptionIds: [],
  updatedAt: new Date().toISOString(),
};

export function MockStoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(FALLBACK_USER);
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [medicationProfiles, setMedicationProfiles] = useState<MedicationProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isFtuxMode, setIsFtuxMode] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const userId = currentUser?.id || "user_priya_001";

  const refreshAll = useCallback(async () => {
    try {
      const [productRes, catRes, cartRes, profilesRes, ordersRes] = await Promise.all([
        apiGet<{ products: Product[] }>("/api/products"),
        apiGet<{ categories: Category[] }>("/api/categories"),
        apiGet<{ cart: Cart; products: Product[] }>(`/api/cart?userId=${userId}`),
        apiGet<{ profiles: MedicationProfile[] }>(`/api/medication-profiles?userId=${userId}`),
        apiGet<{ orders: Order[] }>(`/api/orders?userId=${userId}`),
      ]);
      setProducts(productRes.products);
      setCategories(catRes.categories);
      setCart(cartRes.cart);
      setMedicationProfiles(profilesRes.profiles);
      setOrders(ordersRes.orders);
    } catch (err) {
      console.error("Failed to refresh data:", err);
    }
  }, [userId]);

  // Hydrate on mount
  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem("auramed_current_user");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {}
    }
    const ftux = localStorage.getItem("auramed_ftux");
    if (ftux) setIsFtuxMode(ftux === "true");
    refreshAll();
  }, [refreshAll]);

  // Periodically recompute order statuses client-side (smooth UI updates)
  useEffect(() => {
    if (!isClient || orders.length === 0) return;
    const interval = setInterval(() => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === "order_sample_001"
            ? o
            : { ...o, status: computeOrderStatus(o.placedAt) }
        )
      );
    }, 2000);
    return () => clearInterval(interval);
  }, [isClient, orders.length]);

  // ====== Cart actions (optimistic) ======

  const addToCart = useCallback(
    async (productId: string, quantity: number) => {
      const prev = cart;
      setCart((c) => {
        const existing = c.items.find((i) => i.productId === productId);
        const items = existing
          ? c.items.map((i) =>
              i.productId === productId
                ? { ...i, quantity: i.quantity + quantity }
                : i
            )
          : [
              ...c.items,
              { productId, quantity, addedAt: new Date().toISOString() },
            ];
        return { ...c, items, updatedAt: new Date().toISOString() };
      });

      try {
        const res = await apiPost<{ cart: Cart }>("/api/cart/add", {
          productId,
          quantity,
          userId,
        });
        setCart(res.cart);
      } catch (err) {
        console.error("addToCart failed:", err);
        setCart(prev);
      }
    },
    [cart, userId]
  );

  const updateCartItem = useCallback(
    async (productId: string, quantity: number) => {
      const prev = cart;
      setCart((c) => {
        const items =
          quantity <= 0
            ? c.items.filter((i) => i.productId !== productId)
            : c.items.map((i) =>
                i.productId === productId ? { ...i, quantity } : i
              );
        return { ...c, items, updatedAt: new Date().toISOString() };
      });

      try {
        const res = await apiPut<{ cart: Cart }>("/api/cart/update", {
          productId,
          quantity,
          userId,
        });
        setCart(res.cart);
      } catch (err) {
        console.error("updateCartItem failed:", err);
        setCart(prev);
      }
    },
    [cart, userId]
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      const prev = cart;
      setCart((c) => ({
        ...c,
        items: c.items.filter((i) => i.productId !== productId),
        updatedAt: new Date().toISOString(),
      }));

      try {
        const res = await apiDelete<{ cart: Cart }>(
          `/api/cart/item/${productId}?userId=${userId}`
        );
        setCart(res.cart);
      } catch (err) {
        console.error("removeFromCart failed:", err);
        setCart(prev);
      }
    },
    [cart, userId]
  );

  const attachPrescription = useCallback(
    async (prescriptionId: string) => {
      const prev = cart;
      setCart((c) =>
        c.attachedPrescriptionIds.includes(prescriptionId)
          ? c
          : {
              ...c,
              attachedPrescriptionIds: [...c.attachedPrescriptionIds, prescriptionId],
            }
      );
      try {
        const res = await apiPost<{ cart: Cart }>("/api/cart/attach-prescription", {
          prescriptionId,
          userId,
        });
        setCart(res.cart);
      } catch (err) {
        console.error("attachPrescription failed:", err);
        setCart(prev);
      }
    },
    [cart, userId]
  );

  const detachPrescription = useCallback((prescriptionId: string) => {
    setCart((c) => ({
      ...c,
      attachedPrescriptionIds: c.attachedPrescriptionIds.filter(
        (id) => id !== prescriptionId
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // ====== Medication Profiles ======

  const saveMedicationProfile = useCallback(
    async (name: string, prescriptionId: string) => {
      try {
        const res = await apiPost<{ profile: MedicationProfile }>(
          "/api/medication-profiles",
          { name, prescriptionId, userId }
        );
        setMedicationProfiles((prev) => [res.profile, ...prev]);
        setIsFtuxMode(false);
        localStorage.setItem("auramed_ftux", "false");
      } catch (err) {
        console.error("saveMedicationProfile failed:", err);
      }
    },
    [userId]
  );

  const reorderProfile = useCallback(
    async (profileId: string) => {
      try {
        const res = await apiPost<{ cart: Cart }>(
          `/api/medication-profiles/${profileId}/reorder`,
          { userId }
        );
        setCart(res.cart);
      } catch (err) {
        console.error("reorderProfile failed:", err);
      }
    },
    [userId]
  );

  // ====== Orders ======

  const placeOrder = useCallback(
    async (addressId: string): Promise<Order | null> => {
      try {
        const res = await apiPost<{ order: Order }>("/api/orders", {
          addressId,
          userId,
        });
        setOrders((prev) => [res.order, ...prev]);
        setCart(EMPTY_CART);
        return res.order;
      } catch (err) {
        console.error("placeOrder failed:", err);
        return null;
      }
    },
    [userId]
  );

  // ====== Prescriptions ======

  const mockUploadPrescription = useCallback(
    async (typeOrImage: "bp" | "cold" | string): Promise<Prescription> => {
      // Backward compat: existing UI demo buttons pass "bp" or "cold" strings.
      // For real image upload, the caller passes the base64 image string.
      if (typeOrImage === "bp" || typeOrImage === "cold") {
        const names =
          typeOrImage === "bp"
            ? ["Telma 40", "Glycomet 500", "Atorlip 10"]
            : ["Solvin Cold", "Becosules"];
        const res = await apiPost<{
          prescriptionId: string;
          extractedMedicines: ExtractedMedicine[];
        }>("/api/prescriptions/manual", { medicineNames: names, userId });

        const newRx: Prescription = {
          id: res.prescriptionId,
          userId,
          imageUrl: "",
          extractedMedicines: res.extractedMedicines,
          uploadedAt: new Date().toISOString(),
        };
        setPrescriptions((prev) => [newRx, ...prev]);
        return newRx;
      }

      // Real image upload to Gemini
      const res = await apiPost<{
        prescriptionId: string;
        extractedMedicines: ExtractedMedicine[];
      }>("/api/prescriptions/upload", { imageBase64: typeOrImage, userId });

      const newRx: Prescription = {
        id: res.prescriptionId,
        userId,
        imageUrl: "",
        extractedMedicines: res.extractedMedicines,
        uploadedAt: new Date().toISOString(),
      };
      setPrescriptions((prev) => [newRx, ...prev]);
      return newRx;
    },
    [userId]
  );

  const mockManualPrescription = useCallback(
    async (names: string[]): Promise<Prescription> => {
      const res = await apiPost<{
        prescriptionId: string;
        extractedMedicines: ExtractedMedicine[];
      }>("/api/prescriptions/manual", { medicineNames: names, userId });

      const newRx: Prescription = {
        id: res.prescriptionId,
        userId,
        imageUrl: "",
        extractedMedicines: res.extractedMedicines,
        uploadedAt: new Date().toISOString(),
      };
      setPrescriptions((prev) => [newRx, ...prev]);
      return newRx;
    },
    [userId]
  );

  // ====== Address (optimistic) ======

  const setActiveAddress = useCallback(
    async (addressId: string) => {
      // Optimistic: flip the currentUser.defaultAddressId immediately
      const prevUser = currentUser;
      const optimisticUser = { ...currentUser, defaultAddressId: addressId };
      setCurrentUser(optimisticUser);
      // Cache for fast SSR on next visit
      localStorage.setItem("auramed_current_user", JSON.stringify(optimisticUser));

      try {
        const res = await fetch("/api/user/address", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addressId, userId: prevUser.id }),
        });
        if (!res.ok) throw new Error("Address update failed");
        const data = await res.json();
        setCurrentUser(data.user);
        localStorage.setItem("auramed_current_user", JSON.stringify(data.user));
      } catch (err) {
        console.error("setActiveAddress failed:", err);
        setCurrentUser(prevUser);
        localStorage.setItem("auramed_current_user", JSON.stringify(prevUser));
      }
    },
    [currentUser]
  );

  // ====== Demo / FTUX controls ======

  const handleSetFtuxMode = useCallback(
    (val: boolean) => {
      setIsFtuxMode(val);
      localStorage.setItem("auramed_ftux", val ? "true" : "false");
      if (val) {
        setMedicationProfiles([]);
        setOrders([]);
      } else {
        refreshAll();
      }
    },
    [refreshAll]
  );

  const resetStore = useCallback(() => {
    localStorage.removeItem("auramed_ftux");
    setIsFtuxMode(false);
    refreshAll();
  }, [refreshAll]);

  return (
    <MockStoreContext.Provider
      value={{
        products,
        categories,
        currentUser,
        cart,
        medicationProfiles,
        orders,
        prescriptions,
        isFtuxMode,
        setFtuxMode: handleSetFtuxMode,
        addToCart: addToCart as unknown as (p: string, q: number) => void,
        updateCartItem: updateCartItem as unknown as (p: string, q: number) => void,
        removeFromCart: removeFromCart as unknown as (p: string) => void,
        attachPrescription: attachPrescription as unknown as (id: string) => void,
        detachPrescription,
        saveMedicationProfile: saveMedicationProfile as unknown as (n: string, r: string) => void,
        reorderProfile: reorderProfile as unknown as (id: string) => void,
        placeOrder,
        mockUploadPrescription,
        mockManualPrescription,
        setActiveAddress,
        resetStore,
      }}
    >
      {children}
    </MockStoreContext.Provider>
  );
}

export function useMockStore() {
  const context = useContext(MockStoreContext);
  if (context === undefined) {
    throw new Error("useMockStore must be used within a MockStoreProvider");
  }
  return context;
}
