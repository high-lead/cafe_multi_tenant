import { create } from "zustand";
import type {
  MenuItem,
  Order,
  InventoryItem,
  TenantSettings,
  OrderStatus,
  CartItem,
  OrderItem,
  OrderType,
  PaymentMethod,
  PromoCode,
  Customer,
  StaffMember,
  OperatingHours,
} from "@/types";
import { mockTenant } from "@/data/mockData";
import { calculateOrderTotals } from "@/lib/pricing";

interface TenantState extends TenantSettings {
  updateSettings: (partial: Partial<TenantSettings>) => void;
  updateFeatures: (partial: Partial<TenantSettings["features"]>) => void;
  updateLoyaltyConfig: (partial: Partial<TenantSettings["loyaltyConfig"]>) => void;
  updateSocialLinks: (partial: Partial<TenantSettings["socialLinks"]>) => void;
  updateOperatingHours: (hours: OperatingHours) => void;
  setManualStoreStatus: (status: TenantSettings["manualStoreStatus"]) => void;

  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;

  addOrder: (
    items: CartItem[],
    type: OrderType,
    tableNumber?: string,
    promoCode?: PromoCode | null,
    paymentMethod?: PaymentMethod,
    customerId?: string,
    customerName?: string
  ) => string;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  restockItem: (id: string, amount: number) => void;
  updateInventoryItem: (id: string, partial: Partial<InventoryItem>) => void;
  addInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (id: string) => void;

  addPromoCode: (promo: PromoCode) => void;
  updatePromoCode: (id: string, partial: Partial<PromoCode>) => void;
  deletePromoCode: (id: string) => void;

  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, partial: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  setActiveCustomer: (id: string) => void;

  addStaff: (staff: StaffMember) => void;
  updateStaff: (id: string, partial: Partial<StaffMember>) => void;
  deleteStaff: (id: string) => void;
  setActiveStaff: (id: string) => void;

  addLoyaltyStamp: (customerId?: string) => void;
  resetLoyalty: (customerId?: string) => void;
}

function cartToOrderItems(items: CartItem[]): OrderItem[] {
  return items.map((c) => ({
    menuItemId: c.menuItemId,
    name_en: c.name_en,
    name_ar: c.name_ar,
    basePrice: c.basePrice,
    quantity: c.quantity,
    customizations: c.customizations,
    image: c.image,
  }));
}

export const useTenantStore = create<TenantState>((set, get) => ({
  ...mockTenant,

  updateSettings: (partial) => set((s) => ({ ...s, ...partial })),
  updateFeatures: (partial) => set((s) => ({ features: { ...s.features, ...partial } })),
  updateLoyaltyConfig: (partial) => set((s) => ({ loyaltyConfig: { ...s.loyaltyConfig, ...partial } })),
  updateSocialLinks: (partial) => set((s) => ({ socialLinks: { ...s.socialLinks, ...partial } })),
  updateOperatingHours: (hours) => set({ operatingHours: hours }),
  setManualStoreStatus: (status) => set({ manualStoreStatus: status }),

  addMenuItem: (item) => set((s) => ({ menu: [...s.menu, item] })),
  updateMenuItem: (id, item) =>
    set((s) => ({
      menu: s.menu.map((m) => (m.id === id ? { ...m, ...item } : m)),
    })),
  deleteMenuItem: (id) => set((s) => ({ menu: s.menu.filter((m) => m.id !== id) })),

  addOrder: (items, type, tableNumber, promoCode, paymentMethod = "card", customerId, customerName) => {
    const id = `ORD-${1043 + Math.floor(Math.random() * 900)}`;
    const state = get();
    const pricing = calculateOrderTotals(items, state.menu, state.taxRate, promoCode);

    const order: Order = {
      id,
      items: cartToOrderItems(items),
      subtotal: pricing.subtotal,
      taxAmount: pricing.taxAmount,
      discountAmount: pricing.discountAmount,
      total: pricing.total,
      status: "new",
      type,
      tableNumber,
      paymentMethod,
      promoCode: promoCode ? promoCode.code : undefined,
      customerId: customerId || state.activeCustomerId,
      customerName: customerName || (customerId ? state.customers.find((c) => c.id === customerId)?.name : undefined),
      staffId: state.activeStaffId,
      createdAt: new Date().toISOString(),
    };

    // 1. Deduct Inventory automatically if enabled
    let updatedInventory = state.inventory;
    if (state.features.inventoryDeduction) {
      const deductionMap: Record<string, number> = {};
      for (const cartItem of items) {
        const menuItem = state.menu.find((m) => m.id === cartItem.menuItemId);
        if (menuItem) {
          // Required item IDs
          if (menuItem.requiredInventoryItemIds) {
            for (const invId of menuItem.requiredInventoryItemIds) {
              deductionMap[invId] = (deductionMap[invId] || 0) + cartItem.quantity;
            }
          }
          // Ingredients & Alternatives
          for (const [ingId, altId] of Object.entries(cartItem.customizations.selectedAlternatives)) {
            const ing = menuItem.ingredients.find((i) => i.id === ingId);
            const alt = ing?.alternatives.find((a) => a.id === altId);
            if (alt?.inventoryItemId) {
              deductionMap[alt.inventoryItemId] = (deductionMap[alt.inventoryItemId] || 0) + (alt.inventoryAmount || 1) * cartItem.quantity;
            }
          }
        }
      }

      updatedInventory = state.inventory.map((inv) => {
        if (deductionMap[inv.id]) {
          return { ...inv, stock: Math.max(0, inv.stock - deductionMap[inv.id]) };
        }
        return inv;
      });
    }

    // 2. Increment Promo Usage Count
    let updatedPromoCodes = state.promoCodes;
    if (promoCode) {
      updatedPromoCodes = state.promoCodes.map((p) =>
        p.code.toUpperCase() === promoCode.code.toUpperCase()
          ? { ...p, usageCount: p.usageCount + 1 }
          : p
      );
    }

    // 3. Update Customer Record if linked
    const targetCustId = customerId || state.activeCustomerId;
    let updatedCustomers = state.customers;
    if (targetCustId) {
      updatedCustomers = state.customers.map((c) =>
        c.id === targetCustId
          ? {
              ...c,
              loyaltyStamps: c.loyaltyStamps + 1,
              totalOrders: c.totalOrders + 1,
              totalSpent: Number((c.totalSpent + pricing.total).toFixed(2)),
            }
          : c
      );
    }

    set((s) => ({
      orders: [order, ...s.orders],
      inventory: updatedInventory,
      promoCodes: updatedPromoCodes,
      customers: updatedCustomers,
    }));

    return id;
  },

  updateOrderStatus: (orderId, status) =>
    set((s) => ({
      orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    })),

  restockItem: (id, amount) =>
    set((s) => ({
      inventory: s.inventory.map((i) =>
        i.id === id ? { ...i, stock: Math.max(0, i.stock + amount) } : i
      ),
    })),
  updateInventoryItem: (id, partial) =>
    set((s) => ({
      inventory: s.inventory.map((i) => (i.id === id ? { ...i, ...partial } : i)),
    })),
  addInventoryItem: (item) =>
    set((s) => ({ inventory: [...s.inventory, item] })),
  deleteInventoryItem: (id) =>
    set((s) => ({ inventory: s.inventory.filter((i) => i.id !== id) })),

  addPromoCode: (promo) =>
    set((s) => ({ promoCodes: [promo, ...s.promoCodes] })),
  updatePromoCode: (id, partial) =>
    set((s) => ({
      promoCodes: s.promoCodes.map((p) => (p.id === id ? { ...p, ...partial } : p)),
    })),
  deletePromoCode: (id) =>
    set((s) => ({ promoCodes: s.promoCodes.filter((p) => p.id !== id) })),

  addCustomer: (customer) =>
    set((s) => ({ customers: [customer, ...s.customers], activeCustomerId: customer.id })),
  updateCustomer: (id, partial) =>
    set((s) => ({
      customers: s.customers.map((c) => (c.id === id ? { ...c, ...partial } : c)),
    })),
  deleteCustomer: (id) =>
    set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),
  setActiveCustomer: (id) => set({ activeCustomerId: id }),

  addStaff: (staffMember) =>
    set((s) => ({ staff: [...s.staff, staffMember] })),
  updateStaff: (id, partial) =>
    set((s) => ({
      staff: s.staff.map((st) => (st.id === id ? { ...st, ...partial } : st)),
    })),
  deleteStaff: (id) =>
    set((s) => ({ staff: s.staff.filter((st) => st.id !== id) })),
  setActiveStaff: (id) => set({ activeStaffId: id }),

  addLoyaltyStamp: (targetCustId) => {
    const custId = targetCustId || get().activeCustomerId;
    if (custId) {
      set((s) => ({
        customers: s.customers.map((c) =>
          c.id === custId ? { ...c, loyaltyStamps: c.loyaltyStamps + 1 } : c
        ),
      }));
    }
  },
  resetLoyalty: (targetCustId) => {
    const custId = targetCustId || get().activeCustomerId;
    if (custId) {
      set((s) => ({
        customers: s.customers.map((c) =>
          c.id === custId ? { ...c, loyaltyStamps: 0 } : c
        ),
      }));
    }
  },
}));
