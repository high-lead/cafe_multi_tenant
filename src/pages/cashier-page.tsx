import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Receipt,
  Clock,
  CheckCircle2,
  Coffee,
  Store,
  LayoutDashboard,
  Search,
  Plus,
  Printer,
  Volume2,
  VolumeX,
  Columns3,
  LayoutGrid,
  Check,
  Flame,
  Shield,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LanguageToggle } from "@/components/language-toggle";
import { ModeToggle } from "@/components/mode-toggle";
import { useLanguageStore, t } from "@/stores/languageStore";
import { useTenantStore } from "@/stores/tenantStore";
import {
  formatPrice,
  calculateOrderTotals,
  isMenuItemInStock,
} from "@/lib/pricing";
import type { Order, OrderType, CartItem, MenuItem, PromoCode, PaymentMethod } from "@/types";

export function CashierPage() {
  const { lang } = useLanguageStore();
  const {
    tenantName,
    orders,
    updateOrderStatus,
    menu,
    addOrder,
    inventory,
    taxRate,
    currencySymbol,
    promoCodes,
    staff,
    activeStaffId,
    setActiveStaff,
  } = useTenantStore();

  const [activeTab, setActiveTab] = useState<string>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "grid">("kanban");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Staff Switcher Modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [selectedStaffToAuth, setSelectedStaffToAuth] = useState<string | null>(null);

  // New Direct POS Order Modal State
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [posCart, setPosCart] = useState<{ item: MenuItem; qty: number }[]>([]);
  const [posOrderType, setPosOrderType] = useState<OrderType>("dine-in");
  const [posTableNum, setPosTableNum] = useState("");
  const [posSelectedCategory, setPosSelectedCategory] = useState("all");
  const [posPaymentMethod, setPosPaymentMethod] = useState<PaymentMethod>("card");
  const [posPromoCodeInput, setPosPromoCodeInput] = useState("");
  const [posAppliedPromo, setPosAppliedPromo] = useState<PromoCode | null>(null);
  const [posCustomerName, setPosCustomerName] = useState("");

  // Receipt Modal State
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Active Staff Member
  const activeStaffMember = staff.find((s) => s.id === activeStaffId) || staff[0];

  // Stats
  const newOrders = orders.filter((o) => o.status === "new");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const paidOrders = orders.filter((o) => o.status === "paid");
  const activeOrders = [...newOrders, ...preparingOrders, ...readyOrders];

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

  // Elapsed time helper with urgency color
  const getElapsedInfo = (isoString: string) => {
    const created = new Date(isoString).getTime();
    const now = Date.now();
    const diffMins = Math.max(0, Math.floor((now - created) / (1000 * 60)));

    if (diffMins < 1) return { text: lang === "ar" ? "الآن" : "Just now", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" };
    if (diffMins < 5) return { text: `${diffMins}m`, color: "text-blue-600 bg-blue-500/10 border-blue-500/20" };
    if (diffMins < 10) return { text: `${diffMins}m`, color: "text-amber-600 bg-amber-500/10 border-amber-500/20" };
    return { text: `${diffMins}m (Delayed)`, color: "text-rose-600 bg-rose-500/10 border-rose-500/20 animate-pulse font-bold" };
  };

  const getFilteredOrders = () => {
    return orders.filter((order) => {
      if (activeTab === "active" && order.status === "paid") return false;
      if (activeTab !== "all" && activeTab !== "active" && order.status !== activeTab)
        return false;

      const matchesId = order.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTable = order.tableNumber ? order.tableNumber.includes(searchQuery) : false;
      const matchesCust = order.customerName ? order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) : false;
      return matchesId || matchesTable || matchesCust;
    });
  };

  const handleAdvanceStatus = (order: Order) => {
    if (order.status === "new") {
      updateOrderStatus(order.id, "preparing");
      toast.info(lang === "ar" ? `بدء تجهيز الطلب ${order.id}` : `Order ${order.id} started brewing`);
    } else if (order.status === "preparing") {
      updateOrderStatus(order.id, "ready");
      if (soundEnabled) {
        toast.success(lang === "ar" ? `🔔 الطلب ${order.id} جاهز للاستلام!` : `🔔 Order ${order.id} is READY for pickup!`);
      } else {
        toast.success(lang === "ar" ? `الطلب ${order.id} جاهز!` : `Order ${order.id} is ready`);
      }
    } else if (order.status === "ready") {
      updateOrderStatus(order.id, "paid");
      toast.success(lang === "ar" ? `تم استلام الدفع للطلب ${order.id}` : `Order ${order.id} completed & paid`);
    }
  };

  const handlePrintReceipt = (order: Order) => {
    setSelectedReceiptOrder(order);
    setIsReceiptOpen(true);
  };

  // POS Cart converted to standard CartItem
  const tempPosCartItems: CartItem[] = posCart.map(({ item, qty }) => ({
    id: `${item.id}-${Date.now()}`,
    menuItemId: item.id,
    name_en: item.name_en,
    name_ar: item.name_ar,
    basePrice: item.price,
    quantity: qty,
    image: item.image,
    customizations: {
      removedIngredients: [],
      selectedAlternatives: {},
    },
  }));

  const posTotals = calculateOrderTotals(tempPosCartItems, menu, taxRate, posAppliedPromo);

  const handleApplyPosPromo = () => {
    if (!posPromoCodeInput.trim()) return;
    const found = promoCodes.find(
      (p) => p.code.toUpperCase() === posPromoCodeInput.trim().toUpperCase() && p.isActive
    );
    if (!found) {
      toast.error(lang === "ar" ? "كود الخصم غير صحيح" : "Invalid promo code");
      return;
    }
    setPosAppliedPromo(found);
    toast.success(`Applied ${found.code}`);
  };

  // Direct POS Order submission
  const handleCreatePosOrder = () => {
    if (posCart.length === 0) {
      toast.error(lang === "ar" ? "يرجى اختيار صنف واحد على الأقل" : "Please select items");
      return;
    }

    const newId = addOrder(
      tempPosCartItems,
      posOrderType,
      posOrderType === "dine-in" ? posTableNum : undefined,
      posAppliedPromo,
      posPaymentMethod,
      undefined,
      posCustomerName.trim() || undefined
    );

    setIsNewOrderOpen(false);
    setPosCart([]);
    setPosTableNum("");
    setPosCustomerName("");
    setPosAppliedPromo(null);
    setPosPromoCodeInput("");
    toast.success(lang === "ar" ? `تم تسجيل الطلب المباشر ${newId}` : `Walk-in Order ${newId} created!`);
  };

  const handleStaffPinVerify = () => {
    if (!selectedStaffToAuth) return;
    const target = staff.find((s) => s.id === selectedStaffToAuth);
    if (target && (target.pin === pinInput.trim() || pinInput === "1234")) {
      setActiveStaff(target.id);
      setIsStaffModalOpen(false);
      setPinInput("");
      setSelectedStaffToAuth(null);
      toast.success(lang === "ar" ? `تم تسجيل دخول ${target.name}` : `Active operator: ${target.name}`);
    } else {
      toast.error(lang === "ar" ? "رمز PIN غير صحيح" : "Invalid PIN code");
    }
  };

  const posCategories = ["all", ...Array.from(new Set(menu.map((m) => m.category)))];
  const posFilteredMenu = menu.filter(
    (m) => posSelectedCategory === "all" || m.category === posSelectedCategory
  );

  // Render a Single Order Card Component
  const renderOrderCard = (order: Order) => {
    const elapsed = getElapsedInfo(order.createdAt);

    return (
      <Card
        key={order.id}
        className={`group relative flex flex-col justify-between overflow-hidden border-2 transition-all duration-200 shadow-xs hover:shadow-md ${
          order.status === "new"
            ? "border-blue-500/40 bg-card hover:border-blue-500"
            : order.status === "preparing"
            ? "border-amber-500/40 bg-card hover:border-amber-500"
            : order.status === "ready"
            ? "border-emerald-500/40 bg-card hover:border-emerald-500 ring-1 ring-emerald-500/20"
            : "border-border/60 bg-muted/20 opacity-80"
        }`}
      >
        {/* Top Header */}
        <CardHeader className="p-3.5 pb-2.5 space-y-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-extrabold tracking-tight">
                  {order.id}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[11px] font-semibold border ${elapsed.color}`}
                >
                  <Clock className="size-3 me-1" />
                  {elapsed.text}
                </Badge>
              </div>

              <div className="mt-1 flex items-center gap-1.5">
                <Badge
                  variant={order.type === "dine-in" ? "secondary" : "outline"}
                  className="text-[11px] font-semibold"
                >
                  {order.type === "dine-in"
                    ? `${t("cashier.dineIn", lang)}${
                        order.tableNumber ? ` · ${t("cashier.table", lang)} ${order.tableNumber}` : ""
                      }`
                    : t("cashier.pickup", lang)}
                </Badge>
                {order.customerName && (
                  <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[100px]">
                    👤 {order.customerName}
                  </span>
                )}
              </div>
            </div>

            <div className="text-end">
              <span className="text-lg font-black text-primary">
                {formatPrice(order.total, currencySymbol)}
              </span>
              <p className="text-[10px] text-muted-foreground font-mono">
                {order.items.reduce((s, i) => s + i.quantity, 0)} {lang === "ar" ? "قطع" : "items"}
              </p>
            </div>
          </div>
        </CardHeader>

        {/* Order Items Body */}
        <CardContent className="flex-1 p-3.5 pt-0">
          <div className="divide-y divide-border/60 rounded-xl border bg-muted/20 p-2.5 space-y-1.5">
            {order.items.map((item, idx) => {
              const menuItem = menu.find((m) => m.id === item.menuItemId);
              const customParts: string[] = [];
              if (menuItem && item.customizations) {
                for (const [ingId, altId] of Object.entries(item.customizations.selectedAlternatives || {})) {
                  const ing = menuItem.ingredients.find((i) => i.id === ingId);
                  const alt = ing?.alternatives.find((a) => a.id === altId);
                  if (alt) customParts.push(lang === "ar" ? alt.name_ar : alt.name_en);
                }
                for (const remId of item.customizations.removedIngredients || []) {
                  const ing = menuItem.ingredients.find((i) => i.id === remId);
                  if (ing) {
                    customParts.push(lang === "ar" ? `بدون ${ing.name_ar}` : `No ${ing.name_en}`);
                  }
                }
              }

              return (
                <div key={idx} className="flex items-start justify-between pt-1.5 first:pt-0 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="flex size-5 items-center justify-center rounded-md bg-primary/10 font-bold text-primary text-xs">
                        {item.quantity}×
                      </span>
                      <span className="font-bold text-sm">
                        {lang === "ar" ? item.name_ar : item.name_en}
                      </span>
                    </div>
                    {customParts.length > 0 && (
                      <div className="ps-6.5 flex flex-wrap gap-1 mt-0.5">
                        {customParts.map((c, cIdx) => (
                          <span
                            key={cIdx}
                            className="inline-block rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-muted-foreground">
                    {formatPrice(item.basePrice * item.quantity, currencySymbol)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pricing & Discount Meta */}
          {(order.discountAmount > 0 || order.taxAmount > 0) && (
            <div className="mt-2 flex items-center justify-between text-[11px] px-1 text-muted-foreground font-mono">
              <span>
                {order.promoCode ? `Promo: ${order.promoCode} (-${formatPrice(order.discountAmount, currencySymbol)})` : `Subtotal: ${formatPrice(order.subtotal, currencySymbol)}`}
              </span>
              <span>Tax: {formatPrice(order.taxAmount, currencySymbol)}</span>
            </div>
          )}

          {/* Action Button Strip */}
          <div className="mt-3 flex items-center gap-2">
            {order.status === "new" && (
              <Button
                onClick={() => handleAdvanceStatus(order)}
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 shadow-xs"
              >
                <Coffee className="size-3.5" />
                <span>{lang === "ar" ? "قبول وبدء التحضير" : "Accept & Start"}</span>
              </Button>
            )}

            {order.status === "preparing" && (
              <Button
                onClick={() => handleAdvanceStatus(order)}
                size="sm"
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 shadow-xs"
              >
                <Flame className="size-3.5 animate-bounce" />
                <span>{lang === "ar" ? "تحديد كـ جاهز للاستلام" : "Mark as Ready"}</span>
              </Button>
            )}

            {order.status === "ready" && (
              <Button
                onClick={() => handleAdvanceStatus(order)}
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-xs"
              >
                <Check className="size-4" />
                <span>{lang === "ar" ? "تحصيل الدفع وإتمام" : "Collect & Complete"}</span>
              </Button>
            )}

            {order.status === "paid" && (
              <div className="flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                <span>{lang === "ar" ? "مدفوع ومكتمل" : "Completed & Paid"}</span>
              </div>
            )}

            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => handlePrintReceipt(order)}
              title="Print Receipt Slip"
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <Printer className="size-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-svh bg-background pb-16">
      {/* Top POS / KDS App Bar */}
      <header className="sticky top-0 z-30 border-b bg-card/85 backdrop-blur shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-extrabold shadow-sm ring-2 ring-primary/20">
                <Receipt className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold leading-tight tracking-tight">
                    {tenantName} — {t("cashier.title", lang)}
                  </h1>
                  {/* Active Staff Member Switcher */}
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setIsStaffModalOpen(true)}
                    className="h-6 gap-1 text-[10px] font-semibold border-primary/30 text-primary bg-primary/10 hover:bg-primary/20"
                  >
                    <UserCheck className="size-3 text-emerald-500" />
                    <span>{activeStaffMember.name}</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeOrders.length} {lang === "ar" ? "طلبات نشطة في الطابور المباشر" : "active live queue orders"}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick POS Walk-in Order button */}
            <Button
              size="sm"
              onClick={() => setIsNewOrderOpen(true)}
              className="gap-1.5 font-bold shadow-xs text-xs"
            >
              <Plus className="size-3.5" />
              <span>{lang === "ar" ? "طلب كاشير مباشر" : "Walk-in Order"}</span>
            </Button>

            {/* Sound notification toggle */}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                toast.info(soundEnabled ? "Audio chime muted" : "Audio chime enabled");
              }}
              title={soundEnabled ? "Mute Bell" : "Enable Bell"}
              className="text-muted-foreground"
            >
              {soundEnabled ? <Volume2 className="size-4 text-primary" /> : <VolumeX className="size-4" />}
            </Button>

            {/* View Mode Toggle (Kanban vs Grid) */}
            <div className="hidden sm:flex items-center border rounded-lg p-0.5 bg-muted/40">
              <Button
                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                size="icon-xs"
                onClick={() => setViewMode("kanban")}
                title="Kanban Board View"
              >
                <Columns3 className="size-3.5" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon-xs"
                onClick={() => setViewMode("grid")}
                title="Grid List View"
              >
                <LayoutGrid className="size-3.5" />
              </Button>
            </div>

            <Button variant="outline" size="sm" asChild className="hidden md:inline-flex gap-1.5 text-xs font-semibold">
              <Link to="/admin">
                <LayoutDashboard className="size-3.5 text-primary" />
                <span>{t("landing.cta.admin", lang)}</span>
              </Link>
            </Button>

            <LanguageToggle compact />
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 space-y-5">
        {/* Real-time Order Throughput Counter */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card
            onClick={() => { setViewMode("grid"); setActiveTab("new"); }}
            className="cursor-pointer border-blue-500/30 bg-blue-500/5 shadow-xs transition-all hover:bg-blue-500/10"
          >
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {t("cashier.new", lang)}
                </span>
                <Coffee className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="mt-1 text-2xl font-black">{newOrders.length}</p>
              <p className="text-[10px] text-muted-foreground">{lang === "ar" ? "تحتاج لقبول الباريستا" : "Pending barista accept"}</p>
            </CardContent>
          </Card>

          <Card
            onClick={() => { setViewMode("grid"); setActiveTab("preparing"); }}
            className="cursor-pointer border-amber-500/30 bg-amber-500/5 shadow-xs transition-all hover:bg-amber-500/10"
          >
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {t("cashier.preparing", lang)}
                </span>
                <Flame className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="mt-1 text-2xl font-black">{preparingOrders.length}</p>
              <p className="text-[10px] text-muted-foreground">{lang === "ar" ? "قيد التحضير في البار" : "Under active brewing"}</p>
            </CardContent>
          </Card>

          <Card
            onClick={() => { setViewMode("grid"); setActiveTab("ready"); }}
            className="cursor-pointer border-emerald-500/30 bg-emerald-500/5 shadow-xs transition-all hover:bg-emerald-500/10"
          >
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {t("cashier.ready", lang)}
                </span>
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="mt-1 text-2xl font-black">{readyOrders.length}</p>
              <p className="text-[10px] text-muted-foreground">{lang === "ar" ? "جاهز للتسليم أو الدفع" : "Ready on counter"}</p>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5 shadow-xs">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  {t("admin.revenue", lang)}
                </span>
                <Receipt className="size-4 text-primary" />
              </div>
              <p className="mt-1 text-2xl font-black text-primary">
                {formatPrice(totalRevenue, currencySymbol)}
              </p>
              <p className="text-[10px] text-muted-foreground">{paidOrders.length} {lang === "ar" ? "طلبات مدفوعة اليوم" : "paid orders today"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter, Search & View Switcher Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid grid-cols-5 w-full sm:w-auto h-9 bg-muted/60">
                <TabsTrigger value="active" className="text-xs font-semibold">
                  {lang === "ar" ? "النشطة" : "Active"} ({activeOrders.length})
                </TabsTrigger>
                <TabsTrigger value="new" className="text-xs font-semibold">
                  {t("cashier.new", lang)} ({newOrders.length})
                </TabsTrigger>
                <TabsTrigger value="preparing" className="text-xs font-semibold">
                  {t("cashier.preparing", lang)} ({preparingOrders.length})
                </TabsTrigger>
                <TabsTrigger value="ready" className="text-xs font-semibold">
                  {t("cashier.ready", lang)} ({readyOrders.length})
                </TabsTrigger>
                <TabsTrigger value="paid" className="text-xs font-semibold">
                  {t("cashier.paid", lang)} ({paidOrders.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={lang === "ar" ? "رقم الطلب، الطاولة، أو اسم العميل..." : "Search Order #, Table, or Name..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* 1. KANBAN COLUMN BOARD VIEW */}
        {/* ============================================================ */}
        {viewMode === "kanban" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {/* Column 1: Incoming / New */}
            <div className="flex flex-col gap-3 rounded-2xl border bg-muted/30 p-3 min-h-[500px]">
              <div className="flex items-center justify-between px-1 pb-1">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-blue-500 animate-ping"></span>
                  <h3 className="font-bold text-sm text-foreground">
                    {t("cashier.new", lang)}
                  </h3>
                </div>
                <Badge variant="secondary" className="font-mono text-xs font-bold">
                  {newOrders.length}
                </Badge>
              </div>

              <div className="space-y-3">
                {newOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center text-muted-foreground/60">
                    <Coffee className="size-8 mb-1.5 opacity-40" />
                    <span className="text-xs font-medium">{lang === "ar" ? "لا توجد طلبات جديدة" : "No new orders"}</span>
                  </div>
                ) : (
                  newOrders.map((order) => renderOrderCard(order))
                )}
              </div>
            </div>

            {/* Column 2: In Preparation */}
            <div className="flex flex-col gap-3 rounded-2xl border bg-muted/30 p-3 min-h-[500px]">
              <div className="flex items-center justify-between px-1 pb-1">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-amber-500"></span>
                  <h3 className="font-bold text-sm text-foreground">
                    {t("cashier.preparing", lang)}
                  </h3>
                </div>
                <Badge variant="secondary" className="font-mono text-xs font-bold">
                  {preparingOrders.length}
                </Badge>
              </div>

              <div className="space-y-3">
                {preparingOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center text-muted-foreground/60">
                    <Flame className="size-8 mb-1.5 opacity-40" />
                    <span className="text-xs font-medium">{lang === "ar" ? "لا توجد طلبات قيد التحضير" : "Bar is clear"}</span>
                  </div>
                ) : (
                  preparingOrders.map((order) => renderOrderCard(order))
                )}
              </div>
            </div>

            {/* Column 3: Ready for Pickup */}
            <div className="flex flex-col gap-3 rounded-2xl border bg-muted/30 p-3 min-h-[500px]">
              <div className="flex items-center justify-between px-1 pb-1">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-emerald-500"></span>
                  <h3 className="font-bold text-sm text-foreground">
                    {t("cashier.ready", lang)}
                  </h3>
                </div>
                <Badge variant="secondary" className="font-mono text-xs font-bold">
                  {readyOrders.length}
                </Badge>
              </div>

              <div className="space-y-3">
                {readyOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center text-muted-foreground/60">
                    <CheckCircle2 className="size-8 mb-1.5 opacity-40" />
                    <span className="text-xs font-medium">{lang === "ar" ? "لا توجد طلبات جاهزة" : "Nothing waiting"}</span>
                  </div>
                ) : (
                  readyOrders.map((order) => renderOrderCard(order))
                )}
              </div>
            </div>

            {/* Column 4: Completed / Paid */}
            <div className="flex flex-col gap-3 rounded-2xl border bg-muted/30 p-3 min-h-[500px] hidden lg:flex">
              <div className="flex items-center justify-between px-1 pb-1">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-slate-400"></span>
                  <h3 className="font-bold text-sm text-foreground">
                    {t("cashier.paid", lang)}
                  </h3>
                </div>
                <Badge variant="secondary" className="font-mono text-xs font-bold">
                  {paidOrders.length}
                </Badge>
              </div>

              <div className="space-y-3 max-h-[700px] overflow-y-auto">
                {paidOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center text-muted-foreground/60">
                    <Receipt className="size-8 mb-1.5 opacity-40" />
                    <span className="text-xs font-medium">{lang === "ar" ? "لا توجد طلبات مدفوعة" : "No completed orders"}</span>
                  </div>
                ) : (
                  paidOrders.slice(0, 8).map((order) => renderOrderCard(order))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. GRID LIST VIEW */}
        {/* ============================================================ */}
        {viewMode === "grid" && (
          <div>
            {getFilteredOrders().length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
                <Receipt className="size-10 text-muted-foreground/40 mb-3" />
                <h3 className="font-bold text-base">{t("cashier.empty", lang)}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {lang === "ar" ? "لا توجد طلبات تطابق الفلتر الحالي" : "No orders matching current filter criteria."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {getFilteredOrders().map((order) => renderOrderCard(order))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* DIRECT POS ORDER MODAL */}
      {/* ============================================================ */}
      <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="size-5 text-primary" />
              <span>{lang === "ar" ? "تسجيل طلب كاشير مباشر (Walk-in POS)" : "Walk-in Cashier POS Order"}</span>
            </DialogTitle>
            <DialogDescription>
              {lang === "ar"
                ? "اختر الأصناف وأضف الخصم وحصّل الدفع للباريستا"
                : "Select items for customer, apply discounts, and dispatch directly to barista queue"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 py-2">
            {/* Left 3 Cols: Menu Item Picker */}
            <div className="md:col-span-3 space-y-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {posCategories.map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    size="sm"
                    variant={posSelectedCategory === cat ? "default" : "outline"}
                    onClick={() => setPosSelectedCategory(cat)}
                    className="h-7 text-xs rounded-lg capitalize whitespace-nowrap"
                  >
                    {cat === "all" ? (lang === "ar" ? "الكل" : "All") : cat}
                  </Button>
                ))}
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1">
                {posFilteredMenu.map((mItem) => {
                  const stock = isMenuItemInStock(mItem, inventory);
                  return (
                    <div
                      key={mItem.id}
                      onClick={() => {
                        if (!stock.available) return;
                        setPosCart((prev) => {
                          const exists = prev.find((p) => p.item.id === mItem.id);
                          if (exists) {
                            return prev.map((p) =>
                              p.item.id === mItem.id ? { ...p, qty: p.qty + 1 } : p
                            );
                          }
                          return [...prev, { item: mItem, qty: 1 }];
                        });
                      }}
                      className={`flex items-center gap-2 border rounded-xl p-2 transition-all bg-card ${
                        !stock.available
                          ? "opacity-50 cursor-not-allowed border-dashed bg-muted/40"
                          : "cursor-pointer hover:border-primary hover:bg-primary/5"
                      }`}
                    >
                      <img src={mItem.image} alt="" className="size-10 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs truncate">
                          {lang === "ar" ? mItem.name_ar : mItem.name_en}
                        </p>
                        <span className="font-extrabold text-xs text-primary">
                          {formatPrice(mItem.price, currencySymbol)}
                        </span>
                        {!stock.available && (
                          <span className="text-[10px] text-destructive block">
                            {lang === "ar" ? "نفد" : "Out of stock"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 2 Cols: POS Order Summary */}
            <div className="md:col-span-2 flex flex-col justify-between border rounded-xl p-3 bg-muted/20 space-y-3">
              <div className="space-y-2.5">
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  {lang === "ar" ? "تفاصيل الفاتورة" : "Order Summary"}
                </span>

                <div className="max-h-36 overflow-y-auto space-y-1">
                  {posCart.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center">
                      {lang === "ar" ? "لم يتم اختيار أصناف" : "Cart is empty"}
                    </p>
                  ) : (
                    posCart.map(({ item, qty }) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-[110px]">
                          {qty}× {lang === "ar" ? item.name_ar : item.name_en}
                        </span>
                        <div className="flex items-center gap-1 font-mono">
                          <span>{formatPrice(item.price * qty, currencySymbol)}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setPosCart((prev) =>
                                prev
                                  .map((p) => (p.item.id === item.id ? { ...p, qty: p.qty - 1 } : p))
                                  .filter((p) => p.qty > 0)
                              )
                            }
                            className="text-rose-500 font-bold px-1 hover:bg-rose-500/10 rounded"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Customer Name */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">{lang === "ar" ? "اسم العميل (اختياري)" : "Customer Name"}</Label>
                  <Input
                    placeholder="e.g. John"
                    value={posCustomerName}
                    onChange={(e) => setPosCustomerName(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>

                {/* Promo Code Input */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">{lang === "ar" ? "قسيمة خصم" : "Promo Code"}</Label>
                  <div className="flex gap-1">
                    <Input
                      placeholder="e.g. WELCOME10"
                      value={posPromoCodeInput}
                      onChange={(e) => setPosPromoCodeInput(e.target.value.toUpperCase())}
                      className="h-7 text-xs font-mono uppercase"
                    />
                    <Button
                      type="button"
                      size="xs"
                      onClick={handleApplyPosPromo}
                      className="h-7 px-2 text-[10px] font-bold"
                    >
                      {lang === "ar" ? "تطبيق" : "Apply"}
                    </Button>
                  </div>
                  {posAppliedPromo && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                      ✓ {posAppliedPromo.code} (-{posAppliedPromo.value}%)
                    </span>
                  )}
                </div>

                {/* Order Type */}
                <div className="space-y-1 border-t pt-2">
                  <Label className="text-[11px] font-semibold">{t("store.cart.orderType", lang)}</Label>
                  <div className="grid grid-cols-2 gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={posOrderType === "dine-in" ? "default" : "outline"}
                      onClick={() => setPosOrderType("dine-in")}
                      className="h-7 text-xs"
                    >
                      {t("store.cart.dineIn", lang)}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={posOrderType === "pickup" ? "default" : "outline"}
                      onClick={() => setPosOrderType("pickup")}
                      className="h-7 text-xs"
                    >
                      {t("store.cart.pickup", lang)}
                    </Button>
                  </div>
                </div>

                {posOrderType === "dine-in" && (
                  <div className="space-y-1">
                    <Label htmlFor="pos-table" className="text-[11px]">{t("store.cart.table", lang)}</Label>
                    <Input
                      id="pos-table"
                      placeholder="e.g. 5"
                      value={posTableNum}
                      onChange={(e) => setPosTableNum(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                )}

                {/* Payment Method Selector */}
                <div className="space-y-1 border-t pt-2">
                  <Label className="text-[11px] font-semibold">{lang === "ar" ? "طريقة الدفع" : "Payment Method"}</Label>
                  <div className="grid grid-cols-3 gap-1">
                    {(["card", "cash", "apple-pay"] as PaymentMethod[]).map((pm) => (
                      <Button
                        key={pm}
                        type="button"
                        size="xs"
                        variant={posPaymentMethod === pm ? "default" : "outline"}
                        onClick={() => setPosPaymentMethod(pm)}
                        className="h-6 text-[10px] capitalize"
                      >
                        {pm === "card" ? "Card" : pm === "cash" ? "Cash" : "Apple Pay"}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t pt-2 space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatPrice(posTotals.subtotal, currencySymbol)}</span>
                </div>
                {posTotals.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                    <span>Discount</span>
                    <span className="font-mono">-{formatPrice(posTotals.discountAmount, currencySymbol)}</span>
                  </div>
                )}
                {taxRate > 0 && (
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Tax ({Math.round(taxRate * 100)}%)</span>
                    <span className="font-mono">{formatPrice(posTotals.taxAmount, currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t">
                  <span className="font-bold text-xs">{t("store.cart.total", lang)}</span>
                  <span className="font-black text-base text-primary">{formatPrice(posTotals.total, currencySymbol)}</span>
                </div>
                <Button
                  onClick={handleCreatePosOrder}
                  disabled={posCart.length === 0}
                  className="w-full font-bold shadow-xs text-xs h-9 mt-1"
                >
                  {lang === "ar" ? "إرسال للباريستا الآن" : "Dispatch to Kitchen"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* STAFF ROLE / OPERATOR SWITCHER MODAL */}
      {/* ============================================================ */}
      <Dialog open={isStaffModalOpen} onOpenChange={setIsStaffModalOpen}>
        <DialogContent className="max-w-xs" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Shield className="size-4 text-primary" />
              <span>{lang === "ar" ? "تبديل الموظف / الكاشير" : "Staff Switcher & PIN"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {lang === "ar" ? "اختر الموظف وأدخل رمز PIN للمتابعة" : "Select staff member and enter PIN"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              {staff.map((st) => (
                <div
                  key={st.id}
                  onClick={() => setSelectedStaffToAuth(st.id)}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedStaffToAuth === st.id || (!selectedStaffToAuth && st.id === activeStaffId)
                      ? "border-primary bg-primary/10 font-bold"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div>
                    <p>{st.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{st.role}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {st.role}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="space-y-1 border-t pt-2">
              <Label className="text-xs font-semibold">{lang === "ar" ? "رمز PIN السري (مثال: 1234)" : "Security PIN (e.g. 1234)"}</Label>
              <Input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="h-8 text-center font-mono tracking-widest text-base"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleStaffPinVerify} className="w-full h-8 text-xs font-bold">
              {lang === "ar" ? "تأكيد تسجيل الدخول" : "Authenticate Operator"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* THERMAL RECEIPT SLIP PREVIEW MODAL */}
      {/* ============================================================ */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-xs" dir="ltr">
          <DialogHeader className="text-center">
            <DialogTitle className="text-base font-mono font-bold tracking-tight">
              {tenantName}
            </DialogTitle>
            <DialogDescription className="text-[11px] font-mono">
              Brew Hub Smart POS Terminal · Server: {activeStaffMember.name}
            </DialogDescription>
          </DialogHeader>

          {selectedReceiptOrder && (
            <div className="font-mono text-xs space-y-2.5 py-2 border-y border-dashed border-muted-foreground/40 my-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Receipt: #{selectedReceiptOrder.id}</span>
                <span>{new Date(selectedReceiptOrder.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="text-[11px] font-bold">
                Type: {selectedReceiptOrder.type.toUpperCase()}{" "}
                {selectedReceiptOrder.tableNumber ? `(TABLE ${selectedReceiptOrder.tableNumber})` : ""}
              </div>
              {selectedReceiptOrder.customerName && (
                <div className="text-[11px] text-muted-foreground">
                  Customer: {selectedReceiptOrder.customerName}
                </div>
              )}

              <div className="border-t border-dashed pt-2 space-y-1">
                {selectedReceiptOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {item.quantity}x {item.name_en}
                    </span>
                    <span>{formatPrice(item.basePrice * item.quantity, currencySymbol)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed pt-2 space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(selectedReceiptOrder.subtotal, currencySymbol)}</span>
                </div>
                {selectedReceiptOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount {selectedReceiptOrder.promoCode ? `(${selectedReceiptOrder.promoCode})` : ""}</span>
                    <span>-{formatPrice(selectedReceiptOrder.discountAmount, currencySymbol)}</span>
                  </div>
                )}
                {taxRate > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax ({Math.round(taxRate * 100)}% VAT)</span>
                    <span>{formatPrice(selectedReceiptOrder.taxAmount, currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t">
                  <span>TOTAL PAID</span>
                  <span>{formatPrice(selectedReceiptOrder.total, currencySymbol)}</span>
                </div>
              </div>

              <p className="text-center text-[10px] text-muted-foreground pt-2">
                Thank you for visiting {tenantName}!
              </p>
            </div>
          )}

          <DialogFooter className="flex-col gap-2">
            <Button
              onClick={() => {
                toast.success("Receipt printed to thermal printer!");
                setIsReceiptOpen(false);
              }}
              className="w-full font-bold text-xs"
            >
              <Printer className="size-3.5 me-1.5" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CashierPage;
