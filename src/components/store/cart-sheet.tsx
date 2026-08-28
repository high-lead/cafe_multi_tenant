import { useState } from "react";
import { Trash2, ShoppingBag, Minus, Plus, Tag, Check, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import type { CartItem, OrderType, PromoCode } from "@/types";
import { useLanguageStore, t } from "@/stores/languageStore";
import { useTenantStore } from "@/stores/tenantStore";
import {
  computeItemPrice,
  formatPrice,
  getCustomizationSummary,
  calculateOrderTotals,
  isMenuItemInStock,
  getStoreOperatingStatus,
} from "@/lib/pricing";

export function CartSheet({
  open,
  onOpenChange,
  cart,
  updateQty,
  removeItem,
  onCheckout,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  updateQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  onCheckout: (type: OrderType, tableNumber?: string, promoCode?: PromoCode | null, customerName?: string) => void;
}) {
  const { lang } = useLanguageStore();
  const {
    menu,
    taxRate,
    currencySymbol,
    promoCodes,
    inventory,
    operatingHours,
    manualStoreStatus,
    customers,
    activeCustomerId,
  } = useTenantStore();

  const [orderType, setOrderType] = useState<OrderType>("dine-in");
  const [tableNumber, setTableNumber] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [customerName, setCustomerName] = useState(
    customers.find((c) => c.id === activeCustomerId)?.name || ""
  );

  const storeStatus = getStoreOperatingStatus(operatingHours, manualStoreStatus);

  // Check if any cart items are out of stock
  const outOfStockCartItems = cart.filter((ci) => {
    const menuItem = menu.find((m) => m.id === ci.menuItemId);
    if (!menuItem) return true;
    return !isMenuItemInStock(menuItem, inventory).available;
  });

  const totals = calculateOrderTotals(cart, menu, taxRate, appliedPromo);

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    const found = promoCodes.find(
      (p) => p.code.toUpperCase() === promoInput.trim().toUpperCase() && p.isActive
    );
    if (!found) {
      toast.error(lang === "ar" ? "رمز القسيمة غير صالح أو منتهي الصلاحية" : "Invalid or expired promo code");
      return;
    }
    if (found.minOrder && totals.subtotal < found.minOrder) {
      toast.error(
        lang === "ar"
          ? `الحد الأدنى لتطبيق الكود هو ${formatPrice(found.minOrder, currencySymbol)}`
          : `Minimum order for this promo is ${formatPrice(found.minOrder, currencySymbol)}`
      );
      return;
    }
    setAppliedPromo(found);
    toast.success(
      lang === "ar"
        ? `تم تطبيق الخصم: ${found.code}`
        : `Promo code ${found.code} applied successfully!`
    );
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
  };

  const handleCheckout = () => {
    if (!storeStatus.isOpen) {
      toast.error(lang === "ar" ? storeStatus.message_ar : storeStatus.message_en);
      return;
    }
    if (outOfStockCartItems.length > 0) {
      toast.error(
        lang === "ar"
          ? "بعض العناصر في سلتك نفدت من المخزون حالياً"
          : "Some items in your cart are currently out of stock"
      );
      return;
    }
    onCheckout(
      orderType,
      orderType === "dine-in" ? tableNumber : undefined,
      appliedPromo,
      customerName.trim() || undefined
    );
    setTableNumber("");
    setAppliedPromo(null);
    setPromoInput("");
    onOpenChange(false);
    toast.success(t("store.cart.placed", lang));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-md rounded-t-3xl max-h-[92vh] overflow-y-auto"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl">{t("store.cart", lang)}</SheetTitle>
              <SheetDescription>
                {cart.length} {t("store.cart.qty", lang).toLowerCase()}
              </SheetDescription>
            </div>
            {!storeStatus.isOpen && (
              <Badge variant="destructive" className="gap-1 text-xs font-semibold">
                <Clock className="size-3" />
                <span>{lang === "ar" ? storeStatus.message_ar : storeStatus.message_en}</span>
              </Badge>
            )}
          </div>
        </SheetHeader>

        {cart.length === 0 ? (
          <Empty className="mx-4 my-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <ShoppingBag className="size-10 text-muted-foreground" />
              <p className="font-medium">{t("store.cart.empty", lang)}</p>
              <p className="text-sm text-muted-foreground">
                {t("store.cart.empty.desc", lang)}
              </p>
            </div>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3.5 px-4 pb-6">
            {/* Out of Stock Warning */}
            {outOfStockCartItems.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive font-medium">
                <AlertTriangle className="size-4 shrink-0" />
                <span>
                  {lang === "ar"
                    ? "تنبيه: نفدت بعض المكونات لأصناف في سلتك، يرجى تعديلها."
                    : "Warning: Some ingredient stock ran out for items in your cart."}
                </span>
              </div>
            )}

            {/* Cart Items List */}
            <div className="space-y-2.5">
              {cart.map((ci) => {
                const menuItem = menu.find((m) => m.id === ci.menuItemId);
                if (!menuItem) return null;
                const unitPrice = computeItemPrice(menuItem, ci.customizations);
                const summary = getCustomizationSummary(menuItem, ci.customizations, lang);
                const stockCheck = isMenuItemInStock(menuItem, inventory);

                return (
                  <div
                    key={ci.id}
                    className={`flex gap-3 rounded-2xl border p-3 bg-card transition-all ${
                      !stockCheck.available ? "border-destructive/40 bg-destructive/5 opacity-80" : ""
                    }`}
                  >
                    <img
                      src={ci.image}
                      alt=""
                      className="size-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex flex-1 flex-col gap-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <span className="font-bold text-sm">
                            {lang === "ar" ? ci.name_ar : ci.name_en}
                          </span>
                          {!stockCheck.available && (
                            <Badge variant="destructive" className="ms-2 text-[10px] py-0 px-1.5">
                              {lang === "ar" ? "نفد المخزون" : "Out of Stock"}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeItem(ci.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>

                      {summary.length > 0 && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {summary.join(" · ")}
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon-xs"
                            onClick={() => updateQty(ci.id, ci.quantity - 1)}
                            disabled={ci.quantity <= 1}
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="w-6 text-center text-xs font-bold font-mono">
                            {ci.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon-xs"
                            onClick={() => updateQty(ci.id, ci.quantity + 1)}
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                        <span className="font-extrabold text-sm text-primary">
                          {formatPrice(unitPrice * ci.quantity, currencySymbol)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Promo Code Box */}
            <div className="rounded-xl border bg-muted/20 p-3 space-y-2">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <Tag className="size-3.5 text-primary" />
                <span>{lang === "ar" ? "رمز القسيمة / الخصم" : "Promo Code or Voucher"}</span>
              </Label>
              {appliedPromo ? (
                <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold font-mono text-emerald-700 dark:text-emerald-300">
                      {appliedPromo.code} ({appliedPromo.discountType === "percentage" ? `${appliedPromo.value}% OFF` : `-${formatPrice(appliedPromo.value, currencySymbol)}`})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleRemovePromo}
                    className="text-destructive h-6 px-1.5 text-xs hover:bg-destructive/10"
                  >
                    {lang === "ar" ? "إلغاء" : "Remove"}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. WELCOME10, BREW5"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    className="h-8 text-xs font-mono uppercase bg-background"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApplyPromo}
                    className="h-8 text-xs px-3 font-semibold"
                  >
                    {lang === "ar" ? "تطبيق" : "Apply"}
                  </Button>
                </div>
              )}
            </div>

            {/* Customer Name / Phone for Loyalty */}
            <div className="space-y-1.5">
              <Label htmlFor="cust-name" className="text-xs font-semibold">
                {lang === "ar" ? "اسم العميل أو رقم الهاتف (لحفظ نقاط الولاء)" : "Customer Name / Phone (for Loyalty Stamps)"}
              </Label>
              <Input
                id="cust-name"
                placeholder={lang === "ar" ? "مثال: أحمد شريف" : "e.g. Sarah Jenkins"}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Order type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {t("store.cart.orderType", lang)}
              </Label>
              <RadioGroup
                value={orderType}
                onValueChange={(v) => setOrderType(v as OrderType)}
                className="flex gap-2"
              >
                <Label
                  htmlFor="type-dinein"
                  className="flex-1 cursor-pointer rounded-xl border px-3 py-2 text-center text-xs font-semibold transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
                >
                  <RadioGroupItem id="type-dinein" value="dine-in" className="sr-only" />
                  {t("store.cart.dineIn", lang)}
                </Label>
                <Label
                  htmlFor="type-pickup"
                  className="flex-1 cursor-pointer rounded-xl border px-3 py-2 text-center text-xs font-semibold transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
                >
                  <RadioGroupItem id="type-pickup" value="pickup" className="sr-only" />
                  {t("store.cart.pickup", lang)}
                </Label>
              </RadioGroup>
            </div>

            {orderType === "dine-in" && (
              <div className="space-y-1.5">
                <Label htmlFor="table" className="text-xs font-semibold">
                  {t("store.cart.table", lang)}
                </Label>
                <Input
                  id="table"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="5"
                  className="h-8 text-xs"
                />
              </div>
            )}

            <Separator />

            {/* Itemized Financial Breakdown with Tax & Discounts */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>{lang === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
                <span className="font-mono font-medium">{formatPrice(totals.subtotal, currencySymbol)}</span>
              </div>

              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>{lang === "ar" ? "الخصم المطبق" : "Discount"}</span>
                  <span className="font-mono">-{formatPrice(totals.discountAmount, currencySymbol)}</span>
                </div>
              )}

              {taxRate > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>
                    {lang === "ar"
                      ? `ضريبة القيمة المضافة (${Math.round(taxRate * 100)}%)`
                      : `Estimated Tax (${Math.round(taxRate * 100)}% VAT)`}
                  </span>
                  <span className="font-mono font-medium">{formatPrice(totals.taxAmount, currencySymbol)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t text-sm">
                <span className="font-bold">{t("store.cart.total", lang)}</span>
                <span className="text-xl font-black text-primary">
                  {formatPrice(totals.total, currencySymbol)}
                </span>
              </div>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={!storeStatus.isOpen || outOfStockCartItems.length > 0}
              size="lg"
              className="w-full font-bold shadow-md h-11 text-sm mt-1"
            >
              {t("store.cart.checkout", lang)}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
