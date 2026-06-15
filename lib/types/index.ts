// User (mock, single user for MVP)
export interface User {
  id: string;
  name: string;
  phone: string;
  defaultAddressId: string;
  addresses: Address[];
}

export interface Address {
  id: string;
  label: string; // "Home", "Mom's Place"
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
}

// Product (catalog)
export interface Product {
  id: string;
  name: string;
  manufacturer: string;
  composition: CompositionEntry[];
  packSize: string; // "15 tablets", "100 ml syrup"
  price: number; // in rupees
  mrp: number; // before discount, in rupees
  rxRequired: boolean;
  inStock: boolean;
  imageUrl: string;
  description: string;
  category: string; // category slug e.g. "bp-heart"
  isGeneric: boolean;
}

export interface CompositionEntry {
  salt: string; // "Telmisartan"
  strength: string; // "40mg"
}

// Category
export interface Category {
  slug: string;
  name: string;
  iconUrl: string;
}

// Prescription
export interface Prescription {
  id: string;
  userId: string;
  imageUrl: string; // local path or data URL
  extractedMedicines: ExtractedMedicine[];
  uploadedAt: string;
}

export interface ExtractedMedicine {
  name: string; // medicine name as written on Rx
  composition: string; // composition string
  confidence: "high" | "low"; // AI's confidence
}

// Cart
export interface Cart {
  userId: string;
  items: CartItem[];
  attachedPrescriptionIds: string[];
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: string;
}

// Medication Profile (saved for reorder)
export interface MedicationProfile {
  id: string;
  userId: string;
  name: string; // "Mom's BP meds"
  medicines: ProfileMedicine[];
  prescriptionId: string; // linked prescription
  createdAt: string;
  lastOrderedAt: string | null;
}

export interface ProfileMedicine {
  name: string;
  composition: string;
  lastOrderedProductId: string; // user's preferred product
}

// Order
export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  attachedPrescriptionIds: string[];
  addressId: string;
  bill: Bill;
  status: OrderStatus;
  placedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string; // snapshot at order time
  quantity: number;
  price: number; // snapshot at order time
}

export interface Bill {
  itemsTotal: number;
  deliveryFee: number;
  discount: number;
  totalPayable: number;
}

export type OrderStatus =
  | "placed"
  | "verifying" // pharmacist verifying (faked)
  | "packed"
  | "out_for_delivery"
  | "delivered";
