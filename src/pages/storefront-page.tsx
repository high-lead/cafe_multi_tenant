import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Wifi,
  Search,
  Plus,
  Star,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Store,
  Receipt,
  LayoutDashboard,
  Gift,
  CheckCircle2,
  Clock,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LanguageToggle } from "@/components/language-toggle";
import { ModeToggle } from "@/components/mode-toggle";
import { ItemDetailSheet } from "@/components/store/item-detail-sheet";
import { CartSheet } from "@/components/store/cart-sheet";
import { WifiSheet } from "@/components/store/wifi-sheet";
import { useLanguageStore, t } from "@/stores/languageStore";
import { useTenantStore } from "@/stores/tenantStore";
import {
  formatPrice,
  isMenuItemInStock,
  getStoreOperatingStatus,
} from "@/lib/pricing";
import type { CartItem, MenuItem, OrderType, PromoCode } from "@/types";

export function StorefrontPage() {
  const { lang } = useLanguageStore();
  const {
    tenantName,
    menu,
    features,
    loyaltyConfig,
    socialLinks,
    currencySymbol,
    inventory,
    operatingHours,
    manualStoreStatus,
    customers,
    activeCustomerId,
    setActiveCustomer,
    addCustomer,
    addOrder,
    addLoyaltyStamp,
  } = useTenantStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWifiOpen, setIsWifiOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  // Operating status
  const storeStatus = getStoreOperatingStatus(operatingHours, manualStoreStatus);

  // Active customer info
  const activeCustomer = customers.find((c) => c.id === activeCustomerId) || customers[0];
  const activeLoyaltyStamps = activeCustomer?.loyaltyStamps || 0;
  const isRewardReady = activeLoyaltyStamps >= loyaltyConfig.stampsNeeded;

  // Categories list
  const categories = ["all", ...Array.from(new Set(menu.map((m) => m.category)))];

  // Filtered menu with inventory check
  const filteredMenu = menu.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const nameMatch =
      item.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name_ar.includes(searchQuery);
    const descMatch =
      item.description_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description_ar.includes(searchQuery);
    return matchesCategory && (nameMatch || descMatch);
  });

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cart.reduce((sum, ci) => {
    let unit = ci.basePrice;
    const menuItem = menu.find((m) => m.id === ci.menuItemId);
    if (menuItem) {
      for (const [ingId, altId] of Object.entries(
        ci.customizations.selectedAlternatives
      )) {
        const ing = menuItem.ingredients.find((i) => i.id === ingId);
        const alt = ing?.alternatives.find((a) => a.id === altId);
        if (alt) unit += alt.priceDelta;
      }
    }
    return sum + unit * ci.quantity;
  }, 0);

  const handleAddToCart = (item: CartItem) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (ci) =>
          ci.menuItemId === item.menuItemId &&
          JSON.stringify(ci.customizations) ===
            JSON.stringify(item.customizations)
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += item.quantity;
        return updated;
      }
      return [...prev, item];
    });
  };

  const updateCartQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== id));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
      );
    }
  };

  const removeCartItem = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const handleCheckout = (
    type: OrderType,
    tableNumber?: string,
    promoCode?: PromoCode | null,
    customerName?: string
  ) => {
    addOrder(cart, type, tableNumber, promoCode, "card", activeCustomer?.id, customerName || activeCustomer?.name);
    if (features.loyalty && activeCustomer) {
      addLoyaltyStamp(activeCustomer.id);
    }
    setCart([]);
  };

  const openItemDetail = (item: MenuItem) => {
    const stockStatus = isMenuItemInStock(item, inventory);
    if (!stockStatus.available) {
      toast.error(
        lang === "ar"
          ? `عذراً، هذا الصنف غير متوفر حالياً (${stockStatus.reason || "نفد المخزون"})`
          : `Sorry, this item is currently unavailable (${stockStatus.reason || "Out of stock"})`
      );
      return;
    }
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const handleCreateCustomer = () => {
    if (!newCustName.trim() || !newCustPhone.trim()) {
      toast.error(lang === "ar" ? "يرجى كتابة الاسم ورقم الهاتف" : "Please enter name and phone");
      return;
    }
    const newCust = {
      id: `cust-${Date.now()}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      loyaltyStamps: 1,
      totalOrders: 0,
      totalSpent: 0,
      joinedAt: new Date().toISOString().split("T")[0],
    };
    addCustomer(newCust);
    setNewCustName("");
    setNewCustPhone("");
    setIsCustomerModalOpen(false);
    toast.success(
      lang === "ar"
        ? `أهلاً بك يا ${newCust.name}! تم إنشاء حسابك وحصلت على أول ختم ترحيبي 🎁`
        : `Welcome ${newCust.name}! Profile created with 1 welcome loyalty stamp 🎁`
    );
  };

  return (
    <div className="min-h-svh bg-background pb-28">
      {/* Top App Header */}
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur shadow-xs">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-sm">
                <Store className="size-5" />
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight">{tenantName}</h1>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className={`size-2 rounded-full inline-block ${
                      storeStatus.isOpen
                        ? "bg-emerald-500 animate-pulse"
                        : storeStatus.status === "break"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                  ></span>
                  <span>{lang === "ar" ? storeStatus.message_ar : storeStatus.message_en}</span>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Customer Account Switcher Pill */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCustomerModalOpen(true)}
              className="gap-1.5 text-xs font-semibold h-8 bg-card"
            >
              <User className="size-3.5 text-primary" />
              <span className="max-w-[80px] sm:max-w-[120px] truncate">
                {activeCustomer ? activeCustomer.name : (lang === "ar" ? "تسجيل عميل" : "Guest Profile")}
              </span>
            </Button>

            {features.wifiButton && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs font-medium h-8"
                onClick={() => setIsWifiOpen(true)}
              >
                <Wifi className="size-3.5 text-primary" />
                <span className="hidden sm:inline">{t("store.wifi", lang)}</span>
              </Button>
            )}
            <LanguageToggle compact />
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Emergency Store Closed Alert Banner */}
      {!storeStatus.isOpen && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-center text-xs text-destructive font-semibold flex items-center justify-center gap-2">
          <Clock className="size-4 shrink-0" />
          <span>
            {lang === "ar"
              ? `المقهى مغلق حالياً (${storeStatus.message_ar}) - يمكنك تصفح القائمة فقط.`
              : `Store is currently closed (${storeStatus.message_en}) - Menu browsing only.`}
          </span>
        </div>
      )}

      <main className="mx-auto max-w-4xl px-4 pt-4 space-y-6">
        {/* Loyalty Program Widget */}
        {features.loyalty && activeCustomer && (
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/10 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                    <Star className="size-5 fill-primary-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base">
                        {t("store.loyalty.title", lang)}
                      </h3>
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {activeCustomer.name}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isRewardReady
                        ? t("store.loyalty.claimed", lang)
                        : `${activeLoyaltyStamps}/${loyaltyConfig.stampsNeeded} ${t(
                            "store.loyalty.progress",
                            lang
                          )} — ${
                            lang === "ar"
                              ? loyaltyConfig.rewardLabel_ar
                              : loyaltyConfig.rewardLabel_en
                          }`}
                    </p>
                  </div>
                </div>

                <Badge
                  variant={isRewardReady ? "default" : "secondary"}
                  className="gap-1 shadow-xs"
                >
                  <Gift className="size-3" />
                  {isRewardReady
                    ? lang === "ar"
                      ? "مكافأة مجانية جاهزة!"
                      : "Reward Ready!"
                    : `${loyaltyConfig.stampsNeeded - activeLoyaltyStamps} ${
                        lang === "ar" ? "متبقي" : "left"
                      }`}
                </Badge>
              </div>

              {/* Stamps visual grid */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                {Array.from({ length: loyaltyConfig.stampsNeeded }).map((_, idx) => {
                  const isEarned = idx < activeLoyaltyStamps;
                  return (
                    <div
                      key={idx}
                      className={`flex size-7 sm:size-8 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                        isEarned
                          ? "border-primary bg-primary text-primary-foreground shadow-sm scale-105"
                          : "border-dashed border-muted-foreground/30 bg-muted/40 text-muted-foreground/60"
                      }`}
                    >
                      {isEarned ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3">
                <Progress
                  value={(activeLoyaltyStamps / loyaltyConfig.stampsNeeded) * 100}
                  className="h-1.5"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={lang === "ar" ? "ابحث في القائمة..." : "Search menu..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 bg-card h-10 text-xs"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <Button
                  key={cat}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="rounded-full px-3.5 h-8 text-xs capitalize whitespace-nowrap"
                >
                  {cat === "all"
                    ? lang === "ar"
                      ? "الكل"
                      : "All"
                    : cat}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div>
          {filteredMenu.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Sparkles className="size-8 mb-2 opacity-50" />
              <p className="font-medium text-sm">
                {lang === "ar"
                  ? "لا توجد عناصر مطابقة للبحث"
                  : "No items match your search"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMenu.map((item) => {
                const stockCheck = isMenuItemInStock(item, inventory);
                const isAvailable = stockCheck.available;

                return (
                  <Card
                    key={item.id}
                    onClick={() => openItemDetail(item)}
                    className={`group relative overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer border ${
                      !isAvailable ? "opacity-60 grayscale-[50%]" : "hover:border-primary/40"
                    }`}
                  >
                    <div className="flex h-full flex-col">
                      <div className="relative h-44 w-full overflow-hidden bg-muted">
                        <img
                          src={item.image}
                          alt={lang === "ar" ? item.name_ar : item.name_en}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {!isAvailable && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs p-2 text-center">
                            <Badge variant="destructive" className="font-bold text-xs">
                              {t("store.soldout", lang)}
                            </Badge>
                            {stockCheck.reason && (
                              <span className="text-[10px] text-white/80 mt-1 font-medium">
                                {stockCheck.reason}
                              </span>
                            )}
                          </div>
                        )}
                        <Badge
                          variant="secondary"
                          className="absolute top-2 start-2 bg-background/85 text-xs backdrop-blur font-semibold shadow-xs"
                        >
                          {item.category}
                        </Badge>
                      </div>

                      <CardContent className="flex flex-1 flex-col justify-between p-4">
                        <div>
                          <h4 className="font-bold text-base line-clamp-1">
                            {lang === "ar" ? item.name_ar : item.name_en}
                          </h4>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {lang === "ar"
                              ? item.description_ar
                              : item.description_en}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-base font-extrabold text-primary">
                            {formatPrice(item.price, currencySymbol)}
                          </span>
                          {isAvailable && (
                            <Button
                              size="sm"
                              className="rounded-full gap-1 px-3 shadow-xs h-8 text-xs font-semibold"
                              onClick={(e) => {
                                e.stopPropagation();
                                openItemDetail(item);
                              }}
                            >
                              <Plus className="size-3.5" />
                              <span>{t("store.detail.add", lang)}</span>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Customer Reviews Banner */}
        {features.reviewsBanner && (
          <Card className="border-primary/20 bg-muted/30">
            <CardContent className="flex flex-col items-center justify-between gap-4 p-5 sm:flex-row text-center sm:text-start">
              <div>
                <h4 className="font-semibold text-sm sm:text-base">
                  {t("store.reviews.title", lang)}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("store.reviews.subtitle", lang)}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {socialLinks.googleReviewUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="text-xs gap-1.5 bg-background font-medium"
                  >
                    <a
                      href={socialLinks.googleReviewUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Star className="size-3.5 fill-amber-400 text-amber-500" />
                      <span>{t("store.reviews.google", lang)}</span>
                      <ExternalLink className="size-3 ms-0.5 text-muted-foreground" />
                    </a>
                  </Button>
                )}
                {socialLinks.instagramUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="text-xs gap-1.5 bg-background font-medium"
                  >
                    <a
                      href={socialLinks.instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>{t("store.reviews.instagram", lang)}</span>
                      <ExternalLink className="size-3 ms-0.5 text-muted-foreground" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom Quick Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-xs text-muted-foreground">
          <Link
            to="/cashier"
            className="flex items-center gap-1 hover:text-foreground underline underline-offset-4"
          >
            <Receipt className="size-3.5" />
            <span>{t("landing.cta.cashier", lang)}</span>
          </Link>
          <span>·</span>
          <Link
            to="/admin"
            className="flex items-center gap-1 hover:text-foreground underline underline-offset-4"
          >
            <LayoutDashboard className="size-3.5" />
            <span>{t("landing.cta.admin", lang)}</span>
          </Link>
        </div>
      </main>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 inset-x-0 z-40 px-4">
          <div className="mx-auto max-w-md">
            <Button
              onClick={() => setIsCartOpen(true)}
              size="lg"
              className="w-full justify-between rounded-2xl shadow-xl py-6 px-5 border border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-300"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-full bg-primary-foreground text-primary text-xs font-black">
                  {cartCount}
                </div>
                <span className="font-bold text-sm">
                  {t("store.cart", lang)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base">
                  {formatPrice(cartTotal, currencySymbol)}
                </span>
                <ArrowRight className="size-4 rtl:rotate-180" />
              </div>
            </Button>
          </div>
        </div>
      )}

      {/* Customer Profile & Loyalty Modal */}
      <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
        <DialogContent className="max-w-sm" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="size-5 text-primary" />
              <span>{lang === "ar" ? "حساب العميل ونقاط الولاء" : "Customer Account & Loyalty"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {lang === "ar"
                ? "اختر ملفك الشخصي أو أنشئ حساباً جديداً لجمع نقاط القهوة المجانية"
                : "Select your profile or create one to collect stamps towards free rewards"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Quick Customer Switcher */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {lang === "ar" ? "العملاء المسجلون" : "Saved Profiles"}
              </Label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {customers.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => {
                      setActiveCustomer(cust.id);
                      setIsCustomerModalOpen(false);
                      toast.success(lang === "ar" ? `تم التبديل إلى ${cust.name}` : `Switched to ${cust.name}`);
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer text-xs transition-all ${
                      cust.id === activeCustomerId
                        ? "border-primary bg-primary/10 font-bold"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{cust.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{cust.phone}</p>
                    </div>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {cust.loyaltyStamps} ☕
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Register New Customer */}
            <div className="border-t pt-3 space-y-2">
              <Label className="text-xs font-semibold">
                {lang === "ar" ? "أو تسجيل عميل جديد" : "Or Register New Customer"}
              </Label>
              <Input
                placeholder={lang === "ar" ? "الاسم الكامل" : "Full Name"}
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                className="h-8 text-xs"
              />
              <Input
                placeholder={lang === "ar" ? "رقم الهاتف" : "Phone Number"}
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                className="h-8 text-xs"
              />
              <Button
                onClick={handleCreateCustomer}
                className="w-full h-8 text-xs font-bold"
              >
                {lang === "ar" ? "تسجيل وبدء جمع الأختام" : "Register & Start Loyalty"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sheets */}
      <ItemDetailSheet
        item={selectedItem}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onAddToCart={handleAddToCart}
      />

      <CartSheet
        open={isCartOpen}
        onOpenChange={setIsCartOpen}
        cart={cart}
        updateQty={updateCartQty}
        removeItem={removeCartItem}
        onCheckout={handleCheckout}
      />

      <WifiSheet open={isWifiOpen} onOpenChange={setIsWifiOpen} />
    </div>
  );
}

export default StorefrontPage;
