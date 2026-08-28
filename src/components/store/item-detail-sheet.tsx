import { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import type { MenuItem, CartItem, CartItemCustomization } from "@/types";
import { useLanguageStore, t } from "@/stores/languageStore";
import { useTenantStore } from "@/stores/tenantStore";
import { computeItemPrice, formatPrice, isAlternativeInStock } from "@/lib/pricing";

export function ItemDetailSheet({
  item,
  open,
  onOpenChange,
  onAddToCart,
}: {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (item: CartItem) => void;
}) {
  const { lang } = useLanguageStore();
  const { currencySymbol, inventory } = useTenantStore();
  const [quantity, setQuantity] = useState(1);
  const [removed, setRemoved] = useState<string[]>([]);
  const [alternatives, setAlternatives] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setRemoved([]);
      const defaultAlts: Record<string, string> = {};
      for (const ing of item.ingredients) {
        if (ing.alternatives.length > 0) {
          // Find first in-stock alternative
          const inStockAlt = ing.alternatives.find((a) => isAlternativeInStock(a, inventory));
          defaultAlts[ing.id] = (inStockAlt || ing.alternatives[0]).id;
        }
      }
      setAlternatives(defaultAlts);
    }
  }, [item, inventory]);

  if (!item) return null;

  const customizations: CartItemCustomization = {
    removedIngredients: removed,
    selectedAlternatives: alternatives,
  };

  const unitPrice = computeItemPrice(item, customizations);
  const totalPrice = unitPrice * quantity;

  const toggleRemove = (ingId: string) => {
    setRemoved((prev) =>
      prev.includes(ingId) ? prev.filter((id) => id !== ingId) : [...prev, ingId]
    );
  };

  const handleAdd = () => {
    const cartItem: CartItem = {
      id: `${item.id}-${Date.now()}`,
      menuItemId: item.id,
      name_en: item.name_en,
      name_ar: item.name_ar,
      basePrice: item.price,
      quantity,
      customizations,
      image: item.image,
    };
    onAddToCart(cartItem);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-md rounded-t-3xl max-h-[92vh] overflow-y-auto"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <SheetHeader>
          <div className="relative -mx-6 -mt-6 mb-2 h-44 overflow-hidden rounded-t-3xl bg-muted">
            <img src={item.image} alt="" className="h-full w-full object-cover" />
          </div>
          <SheetTitle className="text-xl font-bold">
            {lang === "ar" ? item.name_ar : item.name_en}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {lang === "ar" ? item.description_ar : item.description_en}
          </SheetDescription>
        </SheetHeader>

        {item.ingredients.length > 0 && (
          <div className="space-y-4 px-4 pb-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t("store.detail.ingredients", lang)}
            </h3>
            {item.ingredients.map((ing) => (
              <div key={ing.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {lang === "ar" ? ing.name_ar : ing.name_en}
                  </span>
                  {ing.removable && (
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`switch-${ing.id}`}
                        className="text-xs text-muted-foreground cursor-pointer"
                      >
                        {removed.includes(ing.id)
                          ? t("store.detail.removed", lang)
                          : t("store.detail.remove", lang)}
                      </Label>
                      <Switch
                        id={`switch-${ing.id}`}
                        checked={removed.includes(ing.id)}
                        onCheckedChange={() => toggleRemove(ing.id)}
                      />
                    </div>
                  )}
                </div>
                {ing.alternatives.length > 0 && !removed.includes(ing.id) && (
                  <RadioGroup
                    value={alternatives[ing.id] || ing.alternatives[0].id}
                    onValueChange={(val) =>
                      setAlternatives((prev) => ({ ...prev, [ing.id]: val }))
                    }
                    className="flex flex-wrap gap-2"
                  >
                    {ing.alternatives.map((alt) => {
                      const inStock = isAlternativeInStock(alt, inventory);
                      return (
                        <div key={alt.id}>
                          <Label
                            htmlFor={`alt-${alt.id}`}
                            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                              !inStock
                                ? "opacity-50 line-through cursor-not-allowed bg-muted/40 border-dashed"
                                : "has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
                            }`}
                          >
                            <RadioGroupItem
                              id={`alt-${alt.id}`}
                              value={alt.id}
                              disabled={!inStock}
                              className="sr-only"
                            />
                            <span>
                              {lang === "ar" ? alt.name_ar : alt.name_en}
                            </span>
                            {!inStock ? (
                              <span className="text-[10px] text-destructive no-underline">
                                ({lang === "ar" ? "نفد" : "Sold out"})
                              </span>
                            ) : alt.priceDelta > 0 ? (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                +{formatPrice(alt.priceDelta, currencySymbol)}
                              </span>
                            ) : null}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                )}
                <Separator />
              </div>
            ))}
          </div>
        )}

        {/* Quantity */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold">{t("store.detail.quantity", lang)}</span>
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="size-3.5" />
            </Button>
            <span className="w-8 text-center font-bold font-mono">{quantity}</span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setQuantity((q) => q + 1)}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Add to cart */}
        <div className="sticky bottom-0 bg-background/90 px-4 pb-6 pt-2 backdrop-blur border-t">
          <Button onClick={handleAdd} className="w-full gap-2 font-bold shadow-md" size="lg">
            <span>{t("store.detail.add", lang)}</span>
            <span className="ms-auto font-black">{formatPrice(totalPrice, currencySymbol)}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
