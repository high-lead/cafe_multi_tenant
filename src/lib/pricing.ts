import type {
  MenuItem,
  CartItemCustomization,
  CartItem,
  InventoryItem,
  PromoCode,
  OperatingHours,
  Alternative,
} from "@/types";

export function computeItemPrice(
  item: MenuItem,
  customizations: CartItemCustomization
): number {
  let price = item.price;
  for (const [ingId, altId] of Object.entries(customizations.selectedAlternatives)) {
    const ing = item.ingredients.find((i) => i.id === ingId);
    const alt = ing?.alternatives.find((a) => a.id === altId);
    if (alt) price += alt.priceDelta;
  }
  return price;
}

export function formatPrice(price: number, currency = "$"): string {
  if (currency === "$" || currency === "€" || currency === "£") {
    return `${currency}${price.toFixed(2)}`;
  }
  return `${price.toFixed(2)} ${currency}`;
}

export function getCustomizationSummary(
  item: MenuItem,
  customizations: CartItemCustomization,
  lang: "en" | "ar"
): string[] {
  const parts: string[] = [];
  for (const [ingId, altId] of Object.entries(customizations.selectedAlternatives)) {
    const ing = item.ingredients.find((i) => i.id === ingId);
    const alt = ing?.alternatives.find((a) => a.id === altId);
    if (alt) {
      parts.push(lang === "ar" ? alt.name_ar : alt.name_en);
    }
  }
  for (const removedId of customizations.removedIngredients) {
    const ing = item.ingredients.find((i) => i.id === removedId);
    if (ing) {
      const name = lang === "ar" ? ing.name_ar : ing.name_en;
      parts.push(lang === "ar" ? `بدون ${name}` : `No ${name}`);
    }
  }
  return parts;
}

// Check if a menu item is available based on required inventory stock
export function isMenuItemInStock(
  item: MenuItem,
  inventory: InventoryItem[]
): { available: boolean; reason?: string } {
  if (!item.available) {
    return { available: false, reason: "Manually marked unavailable" };
  }

  // Check required inventory item IDs
  if (item.requiredInventoryItemIds && item.requiredInventoryItemIds.length > 0) {
    for (const invId of item.requiredInventoryItemIds) {
      const inv = inventory.find((i) => i.id === invId);
      if (inv && inv.stock <= 0) {
        return { available: false, reason: `Out of ${inv.name_en}` };
      }
    }
  }

  // Check non-removable ingredient inventory
  for (const ing of item.ingredients) {
    if (!ing.removable && ing.inventoryItemId) {
      const inv = inventory.find((i) => i.id === ing.inventoryItemId);
      if (inv && inv.stock <= 0) {
        return { available: false, reason: `Out of ${inv.name_en}` };
      }
    }
  }

  return { available: true };
}

export function isAlternativeInStock(
  alt: Alternative,
  inventory: InventoryItem[]
): boolean {
  if (!alt.inventoryItemId) return true;
  const inv = inventory.find((i) => i.id === alt.inventoryItemId);
  if (!inv) return true;
  return inv.stock > 0;
}

// Compute full cart breakdown with promo codes & taxes
export function calculateOrderTotals(
  cart: CartItem[],
  menu: MenuItem[],
  taxRate: number,
  promoCode?: PromoCode | null
): {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
} {
  const subtotal = cart.reduce((sum, ci) => {
    const menuItem = menu.find((m) => m.id === ci.menuItemId);
    if (!menuItem) return sum;
    return sum + computeItemPrice(menuItem, ci.customizations) * ci.quantity;
  }, 0);

  let discountAmount = 0;
  if (promoCode && promoCode.isActive) {
    if (!promoCode.minOrder || subtotal >= promoCode.minOrder) {
      if (promoCode.discountType === "percentage") {
        discountAmount = (subtotal * promoCode.value) / 100;
      } else {
        discountAmount = promoCode.value;
      }
      if (promoCode.maxDiscount) {
        discountAmount = Math.min(discountAmount, promoCode.maxDiscount);
      }
      discountAmount = Math.min(discountAmount, subtotal);
    }
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Number((taxableAmount * taxRate).toFixed(2));
  const total = Number((taxableAmount + taxAmount).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    taxableAmount: Number(taxableAmount.toFixed(2)),
    taxAmount,
    total,
  };
}

// Compute operating status
export function getStoreOperatingStatus(
  hours: OperatingHours,
  manualStatus: "auto" | "open" | "closed" | "break"
): {
  isOpen: boolean;
  status: "open" | "closed" | "break";
  message_en: string;
  message_ar: string;
} {
  if (manualStatus === "open") {
    return {
      isOpen: true,
      status: "open",
      message_en: "Open for orders",
      message_ar: "مفتوح لاستقبال الطلبات",
    };
  }
  if (manualStatus === "closed") {
    return {
      isOpen: false,
      status: "closed",
      message_en: "Currently closed",
      message_ar: "المقهى مغلق حالياً",
    };
  }
  if (manualStatus === "break") {
    return {
      isOpen: false,
      status: "break",
      message_en: "On a short break",
      message_ar: "في استراحة قصيرة",
    };
  }

  // Auto mode based on current time
  const now = new Date();
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  const currentDay = days[now.getDay()];
  const daySchedule = hours[currentDay];

  if (!daySchedule.isOpen) {
    return {
      isOpen: false,
      status: "closed",
      message_en: "Closed today",
      message_ar: "مغلق اليوم",
    };
  }

  const [openH, openM] = daySchedule.open.split(":").map(Number);
  const [closeH, closeM] = daySchedule.close.split(":").map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
    return {
      isOpen: true,
      status: "open",
      message_en: `Open until ${daySchedule.close}`,
      message_ar: `مفتوح حتى ${daySchedule.close}`,
    };
  }

  return {
    isOpen: false,
    status: "closed",
    message_en: `Closed · Opens at ${daySchedule.open}`,
    message_ar: `مغلق · يفتح في ${daySchedule.open}`,
  };
}
