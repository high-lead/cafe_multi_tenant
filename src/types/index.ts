export type Language = "en" | "ar";

export type OrderStatus = "new" | "preparing" | "ready" | "paid";
export type OrderType = "dine-in" | "pickup";
export type PaymentMethod = "cash" | "card" | "apple-pay";

export interface Alternative {
  id: string;
  name_en: string;
  name_ar: string;
  priceDelta: number;
  inventoryItemId?: string;
  inventoryAmount?: number;
}

export interface Ingredient {
  id: string;
  name_en: string;
  name_ar: string;
  removable: boolean;
  alternatives: Alternative[];
  inventoryItemId?: string;
  inventoryAmount?: number;
}

export interface MenuItem {
  id: string;
  category: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price: number;
  image: string;
  available: boolean;
  ingredients: Ingredient[];
  requiredInventoryItemIds?: string[];
}

export interface CartItemCustomization {
  removedIngredients: string[];
  selectedAlternatives: Record<string, string>;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name_en: string;
  name_ar: string;
  basePrice: number;
  quantity: number;
  customizations: CartItemCustomization;
  image: string;
}

export interface OrderItem {
  menuItemId: string;
  name_en: string;
  name_ar: string;
  basePrice: number;
  quantity: number;
  customizations: CartItemCustomization;
  image: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  status: OrderStatus;
  type: OrderType;
  tableNumber?: string;
  createdAt: string;
  paymentMethod?: PaymentMethod;
  promoCode?: string;
  customerId?: string;
  customerName?: string;
  staffId?: string;
}

export interface InventoryItem {
  id: string;
  name_en: string;
  name_ar: string;
  unit: string;
  stock: number;
  lowStockThreshold: number;
  maxStock?: number;
  costPerUnit?: number;
  category?: string;
  supplier?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  isActive: boolean;
  usageCount: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyStamps: number;
  totalOrders: number;
  totalSpent: number;
  joinedAt: string;
}

export type StaffRole = "admin" | "manager" | "cashier" | "barista";

export interface StaffMember {
  id: string;
  name: string;
  pin: string;
  role: StaffRole;
  active: boolean;
}

export interface DayHours {
  open: string;
  close: string;
  isOpen: boolean;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface SocialLinks {
  googleReviewUrl: string;
  instagramUrl: string;
}

export interface TenantFeatures {
  loyalty: boolean;
  wifiButton: boolean;
  reviewsBanner: boolean;
  ordering: boolean;
  discounts: boolean;
  inventoryDeduction: boolean;
}

export interface LoyaltyConfig {
  stampsNeeded: number;
  rewardLabel_en: string;
  rewardLabel_ar: string;
}

export interface TenantSettings {
  tenantName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  currencySymbol: string;
  taxRate: number; // e.g. 0.10 for 10%
  wifiSSID: string;
  wifiPassword: string;
  manualStoreStatus: "auto" | "open" | "closed" | "break";
  operatingHours: OperatingHours;
  socialLinks: SocialLinks;
  features: TenantFeatures;
  loyaltyConfig: LoyaltyConfig;
  menu: MenuItem[];
  orders: Order[];
  inventory: InventoryItem[];
  promoCodes: PromoCode[];
  customers: Customer[];
  staff: StaffMember[];
  activeStaffId: string;
  activeCustomerId?: string;
}
