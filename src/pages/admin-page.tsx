import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Store,
  Save,
  Palette,
  TrendingUp,
  RefreshCw,
  Search,
  FileSpreadsheet,
  Layers,
  Coffee,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Users,
  Percent,
  Shield,
  Download,
  Upload,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LanguageToggle } from "@/components/language-toggle";
import { ModeToggle } from "@/components/mode-toggle";
import { useLanguageStore, t } from "@/stores/languageStore";
import { useTenantStore } from "@/stores/tenantStore";
import { formatPrice } from "@/lib/pricing";
import type {
  MenuItem,
  InventoryItem,
  PromoCode,
  Customer,
  StaffMember,
  StaffRole,
} from "@/types";

// Curated brand theme presets for pitching
const BRAND_PRESETS = [
  { name: "Forest Roast", primary: "#1b4d3e", secondary: "#d4a373" },
  { name: "Espresso Amber", primary: "#78350f", secondary: "#f59e0b" },
  { name: "Nordic Indigo", primary: "#312e81", secondary: "#38bdf8" },
  { name: "Ruby Velvet", primary: "#881337", secondary: "#fb7185" },
  { name: "Matcha Bloom", primary: "#15803d", secondary: "#a3e635" },
  { name: "Modern Obsidian", primary: "#0f172a", secondary: "#64748b" },
];

export function AdminPage() {
  const { lang } = useLanguageStore();
  const {
    tenantName,
    primaryColor,
    secondaryColor,
    wifiSSID,
    wifiPassword,
    socialLinks,
    loyaltyConfig,
    currencySymbol,
    taxRate,
    manualStoreStatus,
    operatingHours,
    menu,
    orders,
    inventory,
    promoCodes,
    customers,
    staff,
    updateSettings,
    updateLoyaltyConfig,
    updateSocialLinks,
    updateOperatingHours,
    setManualStoreStatus,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    restockItem,
    addInventoryItem,
    addPromoCode,
    updatePromoCode,
    deletePromoCode,
    addCustomer,
    updateCustomer,
    addStaff,
    updateStaff,
    deleteStaff,
  } = useTenantStore();

  const [activeTab, setActiveTab] = useState("overview");

  // Settings states
  const [localTenantName, setLocalTenantName] = useState(tenantName);
  const [localPrimaryColor, setLocalPrimaryColor] = useState(primaryColor);
  const [localSecondaryColor, setLocalSecondaryColor] = useState(secondaryColor);
  const [localCurrency, setLocalCurrency] = useState(currencySymbol);
  const [localTaxRate, setLocalTaxRate] = useState(taxRate * 100);
  const [localWifiSSID, setLocalWifiSSID] = useState(wifiSSID);
  const [localWifiPassword, setLocalWifiPassword] = useState(wifiPassword);
  const [localGoogleReview, setLocalGoogleReview] = useState(socialLinks.googleReviewUrl);
  const [localInstagram, setLocalInstagram] = useState(socialLinks.instagramUrl);
  const [localStampsNeeded, setLocalStampsNeeded] = useState(loyaltyConfig.stampsNeeded);
  const [localRewardEn, setLocalRewardEn] = useState(loyaltyConfig.rewardLabel_en);
  const [localRewardAr, setLocalRewardAr] = useState(loyaltyConfig.rewardLabel_ar);
  const [localOperatingHours] = useState(operatingHours);

  // Analytics & Date Filter State
  const [analyticsDateRange, setAnalyticsDateRange] = useState<"today" | "yesterday" | "7d" | "30d" | "all">("today");

  // Inventory filtering & search
  const [invSearch, setInvSearch] = useState("");
  const [invCategoryFilter, setInvCategoryFilter] = useState("all");
  const [invStatusFilter, setInvStatusFilter] = useState<"all" | "low" | "out">("all");

  // Restock Dialog State
  const [selectedRestockItem, setSelectedRestockItem] = useState<InventoryItem | null>(null);
  const [restockAmount, setRestockAmount] = useState(10);
  const [isRestockOpen, setIsRestockOpen] = useState(false);

  // Add Inventory Item Dialog State
  const [isAddInvOpen, setIsAddInvOpen] = useState(false);
  const [invForm, setInvForm] = useState<Partial<InventoryItem>>({
    name_en: "",
    name_ar: "",
    unit: "kg",
    stock: 10,
    lowStockThreshold: 5,
    maxStock: 50,
    costPerUnit: 10,
    category: "Coffee",
    supplier: "",
  });

  // Purchase Order (PO) Modal State
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);

  // Menu Form Modal State (with Image Upload)
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState<{
    name_en: string;
    name_ar: string;
    description_en: string;
    description_ar: string;
    price: number;
    category: string;
    image: string;
    available: boolean;
    requiredInventoryItemIds: string[];
  }>({
    name_en: "",
    name_ar: "",
    description_en: "",
    description_ar: "",
    price: 4.5,
    category: "Coffee",
    image: "/images/cappuccino.jpg",
    available: true,
    requiredInventoryItemIds: [],
  });

  // Promo Code Modal State
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoForm, setPromoForm] = useState<Partial<PromoCode>>({
    code: "",
    discountType: "percentage",
    value: 15,
    minOrder: 10,
    maxDiscount: 20,
    isActive: true,
  });

  // Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState<Partial<Customer>>({
    name: "",
    phone: "",
    email: "",
    loyaltyStamps: 0,
  });

  // Staff Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState<Partial<StaffMember>>({
    name: "",
    pin: "1234",
    role: "barista",
    active: true,
  });

  // Date Filter logic for orders
  const getFilteredOrdersByDate = () => {
    const now = Date.now();
    return orders.filter((o) => {
      const orderTime = new Date(o.createdAt).getTime();
      const diffHours = (now - orderTime) / (1000 * 60 * 60);

      if (analyticsDateRange === "today") return diffHours <= 24;
      if (analyticsDateRange === "yesterday") return diffHours > 24 && diffHours <= 48;
      if (analyticsDateRange === "7d") return diffHours <= 24 * 7;
      if (analyticsDateRange === "30d") return diffHours <= 24 * 30;
      return true;
    });
  };

  const filteredOrders = getFilteredOrdersByDate();

  // Financial Metrics Calculation
  const totalRevenue = filteredOrders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.total, 0);

  const totalTaxCollected = filteredOrders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + (o.taxAmount || 0), 0);

  const totalDiscountsGiven = filteredOrders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + (o.discountAmount || 0), 0);

  const paidOrdersCount = filteredOrders.filter((o) => o.status === "paid").length;
  const avgOrderValue = paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0;

  // Inventory Health
  const lowStockItems = inventory.filter(
    (item) => item.stock > 0 && item.stock <= item.lowStockThreshold
  );
  const outOfStockItems = inventory.filter((item) => item.stock <= 0);
  const stockHealthScore = Math.round(
    ((inventory.length - (outOfStockItems.length + lowStockItems.length * 0.5)) /
      (inventory.length || 1)) *
      100
  );

  const totalInventoryValuation = inventory.reduce(
    (sum, item) => sum + item.stock * (item.costPerUnit || 10),
    0
  );

  // Hourly rush area chart data
  const hourlyRushData = [
    { hour: "08:00", orders: 12, sales: 54 },
    { hour: "09:00", orders: 28, sales: 142 },
    { hour: "10:00", orders: 34, sales: 185 },
    { hour: "11:00", orders: 22, sales: 110 },
    { hour: "12:00", orders: 19, sales: 98 },
    { hour: "13:00", orders: 25, sales: 135 },
    { hour: "14:00", orders: 31, sales: 160 },
    { hour: "15:00", orders: 18, sales: 92 },
    { hour: "16:00", orders: 24, sales: 125 },
    { hour: "17:00", orders: 15, sales: 80 },
  ];

  // Sales by Category Bar Data
  const categorySalesData = Array.from(new Set(menu.map((m) => m.category))).map((cat) => {
    const count = menu.filter((m) => m.category === cat).length * 15;
    return {
      category: cat,
      revenue: count * 4.8,
    };
  });

  // Export CSV Report Action
  const handleExportCSV = () => {
    const rows = [
      ["Order ID", "Date", "Customer", "Type", "Status", "Subtotal", "Tax", "Discount", "Total", "Payment Method"],
      ...filteredOrders.map((o) => [
        o.id,
        new Date(o.createdAt).toLocaleString(),
        o.customerName || "Guest",
        o.type,
        o.status,
        o.subtotal?.toFixed(2) || o.total.toFixed(2),
        o.taxAmount?.toFixed(2) || "0.00",
        o.discountAmount?.toFixed(2) || "0.00",
        o.total.toFixed(2),
        o.paymentMethod || "Card",
      ]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales-report-${analyticsDateRange}-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(lang === "ar" ? "تم تصدير تقرير المبيعات بنجاح" : "Sales report exported to CSV!");
  };

  // Image Upload handler
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setMenuForm((prev) => ({ ...prev, image: reader.result as string }));
        toast.success(lang === "ar" ? "تم رفع الصورة بنجاح!" : "Image uploaded & preview ready!");
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Settings Action
  const handleSaveSettings = () => {
    updateSettings({
      tenantName: localTenantName,
      primaryColor: localPrimaryColor,
      secondaryColor: localSecondaryColor,
      currencySymbol: localCurrency,
      taxRate: Number(localTaxRate) / 100,
      wifiSSID: localWifiSSID,
      wifiPassword: localWifiPassword,
    });
    updateOperatingHours(localOperatingHours);
    updateSocialLinks({
      googleReviewUrl: localGoogleReview,
      instagramUrl: localInstagram,
    });
    updateLoyaltyConfig({
      stampsNeeded: localStampsNeeded,
      rewardLabel_en: localRewardEn,
      rewardLabel_ar: localRewardAr,
    });
    toast.success(t("admin.save", lang));
  };

  // Filtered Inventory List
  const invCategories = ["all", ...Array.from(new Set(inventory.map((i) => i.category || "General")))];
  const filteredInventory = inventory.filter((item) => {
    const matchesCat = invCategoryFilter === "all" || item.category === invCategoryFilter;
    const matchesSearch =
      item.name_en.toLowerCase().includes(invSearch.toLowerCase()) ||
      item.name_ar.includes(invSearch) ||
      (item.supplier && item.supplier.toLowerCase().includes(invSearch.toLowerCase()));

    let matchesStatus = true;
    if (invStatusFilter === "low") matchesStatus = item.stock > 0 && item.stock <= item.lowStockThreshold;
    if (invStatusFilter === "out") matchesStatus = item.stock <= 0;

    return matchesCat && matchesSearch && matchesStatus;
  });

  // Reorder Purchase Order calculation
  const itemsNeedingReorder = inventory.filter((i) => i.stock <= i.lowStockThreshold);
  const totalPOCost = itemsNeedingReorder.reduce((sum, item) => {
    const qtyNeeded = (item.maxStock || 40) - item.stock;
    return sum + qtyNeeded * (item.costPerUnit || 10);
  }, 0);

  const handleExecutePOReorder = () => {
    itemsNeedingReorder.forEach((item) => {
      const qtyNeeded = (item.maxStock || 40) - item.stock;
      if (qtyNeeded > 0) restockItem(item.id, qtyNeeded);
    });
    setIsPOModalOpen(false);
    toast.success(lang === "ar" ? "تم إرسال طلب التوريد وتحديث كميات المخزون بالكامل!" : "Purchase Order processed! Stock restored to capacity.");
  };

  // Menu item save
  const handleSaveMenuItem = () => {
    if (!menuForm.name_en.trim() || !menuForm.name_ar.trim()) {
      toast.error(lang === "ar" ? "يرجى كتابة اسم الصنف بالعربية والإنجليزية" : "Please provide item names");
      return;
    }

    if (editingMenuItem) {
      updateMenuItem(editingMenuItem.id, {
        name_en: menuForm.name_en,
        name_ar: menuForm.name_ar,
        description_en: menuForm.description_en,
        description_ar: menuForm.description_ar,
        price: menuForm.price,
        category: menuForm.category,
        image: menuForm.image,
        available: menuForm.available,
        requiredInventoryItemIds: menuForm.requiredInventoryItemIds,
      });
      toast.success(lang === "ar" ? "تم تعديل الصنف" : "Menu item updated");
    } else {
      const newItem: MenuItem = {
        id: `m-${Date.now()}`,
        name_en: menuForm.name_en,
        name_ar: menuForm.name_ar,
        description_en: menuForm.description_en,
        description_ar: menuForm.description_ar,
        price: menuForm.price,
        category: menuForm.category,
        image: menuForm.image,
        available: menuForm.available,
        requiredInventoryItemIds: menuForm.requiredInventoryItemIds,
        ingredients: [],
      };
      addMenuItem(newItem);
      toast.success(lang === "ar" ? "تمت إضافة الصنف بنجاح" : "New item added");
    }
    setIsMenuModalOpen(false);
    setEditingMenuItem(null);
  };

  return (
    <div className="min-h-svh bg-background pb-20">
      {/* Top Admin App Header */}
      <header className="sticky top-0 z-30 border-b bg-card/85 backdrop-blur shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-extrabold shadow-sm ring-2 ring-primary/20">
                <Coffee className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold leading-tight tracking-tight">
                    {tenantName} — {t("admin.title", lang)}
                  </h1>
                  <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30 bg-primary/10">
                    Enterprise SaaS
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {lang === "ar" ? "لوحة الإدارة الشاملة وإعدادات الامتياز" : "Multi-tenant master administration & retail operations"}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex gap-1.5 text-xs font-semibold">
              <Link to="/store">
                <Store className="size-3.5 text-primary" />
                <span>{t("admin.backToStore", lang)}</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="hidden md:inline-flex gap-1.5 text-xs font-semibold">
              <Link to="/cashier">
                <Coffee className="size-3.5 text-primary" />
                <span>{t("landing.cta.cashier", lang)}</span>
              </Link>
            </Button>
            <LanguageToggle compact />
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Top Horizontal Navigation Bar */}
          <div className="overflow-x-auto no-scrollbar pb-1">
            <TabsList className="h-10 bg-muted/60 p-1">
              <TabsTrigger value="overview" className="gap-1.5 text-xs font-semibold px-3">
                <TrendingUp className="size-3.5" />
                <span>{t("admin.overview", lang)}</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5 text-xs font-semibold px-3">
                <Calendar className="size-3.5" />
                <span>{t("admin.analytics", lang)}</span>
              </TabsTrigger>
              <TabsTrigger value="menu" className="gap-1.5 text-xs font-semibold px-3">
                <Coffee className="size-3.5" />
                <span>{t("admin.menu", lang)}</span>
                <Badge variant="secondary" className="ms-1 size-4 p-0 flex items-center justify-center text-[10px]">
                  {menu.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="gap-1.5 text-xs font-semibold px-3">
                <Layers className="size-3.5" />
                <span>{t("admin.inventory", lang)}</span>
                {lowStockItems.length > 0 && (
                  <Badge variant="destructive" className="ms-1 size-4 p-0 flex items-center justify-center text-[10px]">
                    {lowStockItems.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="promos" className="gap-1.5 text-xs font-semibold px-3">
                <Percent className="size-3.5" />
                <span>{t("admin.promos", lang)}</span>
                <Badge variant="secondary" className="ms-1 size-4 p-0 flex items-center justify-center text-[10px]">
                  {promoCodes.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="customers" className="gap-1.5 text-xs font-semibold px-3">
                <Users className="size-3.5" />
                <span>{t("admin.customers", lang)}</span>
                <Badge variant="secondary" className="ms-1 size-4 p-0 flex items-center justify-center text-[10px]">
                  {customers.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="staff" className="gap-1.5 text-xs font-semibold px-3">
                <Shield className="size-3.5" />
                <span>{t("admin.staff", lang)}</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5 text-xs font-semibold px-3">
                <Palette className="size-3.5" />
                <span>{t("admin.settings", lang)}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ============================================================ */}
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {/* ============================================================ */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards Strip */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-primary/20 bg-primary/5 shadow-xs">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      {t("admin.revenue", lang)}
                    </span>
                    <DollarSign className="size-4 text-primary" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-primary">
                      {formatPrice(totalRevenue, currencySymbol)}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                      +18.4%
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {lang === "ar" ? "مقارنة بالأسبوع الماضي" : "vs. last week benchmark"}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-xs">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {t("admin.totalOrders", lang)}
                    </span>
                    <Coffee className="size-4 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-black">{filteredOrders.length}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {paidOrdersCount} {lang === "ar" ? "مدفوع ومكتمل" : "paid orders processed"}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-xs">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {t("admin.avgOrder", lang)}
                    </span>
                    <TrendingUp className="size-4 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-black">
                    {formatPrice(avgOrderValue, currencySymbol)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {lang === "ar" ? "متوسط سلة العميل" : "Per transaction ticket"}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-xs">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {t("admin.stockHealth", lang)}
                    </span>
                    <Layers className="size-4 text-muted-foreground" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black">{stockHealthScore}%</span>
                    <Badge variant={stockHealthScore > 80 ? "default" : "destructive"} className="text-[10px]">
                      {stockHealthScore > 80 ? "Good" : "Alert"}
                    </Badge>
                  </div>
                  <Progress value={stockHealthScore} className="mt-2 h-1.5" />
                </CardContent>
              </Card>
            </div>

            {/* Interactive Recharts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold">
                    {lang === "ar" ? "ذروة الطلبات اليومية (Hourly Rush)" : "Peak Hourly Order Rush"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {lang === "ar" ? "حجم المبيعات وتدفق الطلبات على مدار ساعات اليوم" : "Throughput volume across morning and afternoon coffee rush"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={hourlyRushData}>
                        <defs>
                          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="sales" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" name="Sales ($)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold">
                    {lang === "ar" ? "المبيعات حسب الفئة (Category Mix)" : "Sales Breakdown by Category"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {lang === "ar" ? "حصة القهوة، المخبوزات، والشاي من إجمالي المبيعات" : "Revenue distribution across coffee, teas, pastries, and food"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categorySalesData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="var(--color-primary)" radius={[6, 6, 0, 0]} name="Revenue ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 2: DETAILED ANALYTICS & CSV REPORTING */}
          {/* ============================================================ */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="shadow-xs">
              <CardHeader className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b">
                <div>
                  <CardTitle className="text-base font-bold">
                    {t("admin.analytics", lang)}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {lang === "ar" ? "فلترة البيانات وتصدير التقارير المالية والضريبية" : "Filter date ranges, track taxes & discounts, and export financial CSV reports"}
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Tabs value={analyticsDateRange} onValueChange={(v) => setAnalyticsDateRange(v as any)} className="w-auto">
                    <TabsList className="h-8">
                      <TabsTrigger value="today" className="text-xs px-2.5">Today</TabsTrigger>
                      <TabsTrigger value="yesterday" className="text-xs px-2.5">Yesterday</TabsTrigger>
                      <TabsTrigger value="7d" className="text-xs px-2.5">7 Days</TabsTrigger>
                      <TabsTrigger value="30d" className="text-xs px-2.5">30 Days</TabsTrigger>
                      <TabsTrigger value="all" className="text-xs px-2.5">All Time</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Button onClick={handleExportCSV} size="sm" className="h-8 gap-1.5 font-bold text-xs">
                    <Download className="size-3.5" />
                    <span>{t("admin.exportCsv", lang)}</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-6">
                {/* Financial Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="border rounded-xl p-3 bg-muted/20">
                    <span className="text-xs font-semibold text-muted-foreground">Gross Sales</span>
                    <p className="text-xl font-black mt-1 text-primary">{formatPrice(totalRevenue + totalDiscountsGiven, currencySymbol)}</p>
                  </div>
                  <div className="border rounded-xl p-3 bg-muted/20">
                    <span className="text-xs font-semibold text-emerald-600">Discounts Applied</span>
                    <p className="text-xl font-black mt-1 text-emerald-600">-{formatPrice(totalDiscountsGiven, currencySymbol)}</p>
                  </div>
                  <div className="border rounded-xl p-3 bg-muted/20">
                    <span className="text-xs font-semibold text-muted-foreground">Tax Collected ({Math.round(taxRate * 100)}%)</span>
                    <p className="text-xl font-black mt-1">{formatPrice(totalTaxCollected, currencySymbol)}</p>
                  </div>
                  <div className="border rounded-xl p-3 bg-muted/20">
                    <span className="text-xs font-semibold text-primary font-bold">Net Revenue</span>
                    <p className="text-xl font-black mt-1 text-primary">{formatPrice(totalRevenue, currencySymbol)}</p>
                  </div>
                </div>

                {/* Orders Breakdown Table */}
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-xs">Order ID</TableHead>
                        <TableHead className="text-xs">Customer</TableHead>
                        <TableHead className="text-xs">Time</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Subtotal</TableHead>
                        <TableHead className="text-xs">Tax</TableHead>
                        <TableHead className="text-xs">Discount</TableHead>
                        <TableHead className="text-xs text-end">Total Paid</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                            No orders found for this selected date filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((o) => (
                          <TableRow key={o.id}>
                            <TableCell className="font-mono font-bold text-xs">{o.id}</TableCell>
                            <TableCell className="text-xs font-medium">{o.customerName || "Walk-in Guest"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</TableCell>
                            <TableCell className="text-xs capitalize">
                              <Badge variant="outline" className="text-[10px]">{o.type}</Badge>
                            </TableCell>
                            <TableCell className="text-xs font-mono">{formatPrice(o.subtotal || o.total, currencySymbol)}</TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">{formatPrice(o.taxAmount || 0, currencySymbol)}</TableCell>
                            <TableCell className="text-xs font-mono text-emerald-600">{o.discountAmount ? `-${formatPrice(o.discountAmount, currencySymbol)}` : "—"}</TableCell>
                            <TableCell className="text-xs font-bold font-mono text-end text-primary">{formatPrice(o.total, currencySymbol)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 3: MENU MANAGEMENT (WITH IMAGE UPLOAD) */}
          {/* ============================================================ */}
          <TabsContent value="menu" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">{t("admin.menu", lang)}</h3>
                <p className="text-xs text-muted-foreground">{menu.length} items configured</p>
              </div>
              <Button
                onClick={() => {
                  setEditingMenuItem(null);
                  setMenuForm({
                    name_en: "",
                    name_ar: "",
                    description_en: "",
                    description_ar: "",
                    price: 4.5,
                    category: "Coffee",
                    image: "/images/cappuccino.jpg",
                    available: true,
                    requiredInventoryItemIds: ["inv1"],
                  });
                  setIsMenuModalOpen(true);
                }}
                size="sm"
                className="gap-1.5 font-bold text-xs"
              >
                <Plus className="size-3.5" />
                <span>{lang === "ar" ? "إضافة صنف جديد" : "Add Menu Item"}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menu.map((item) => (
                <Card key={item.id} className="overflow-hidden border shadow-xs flex flex-col justify-between">
                  <div className="relative h-40 w-full bg-muted">
                    <img src={item.image} alt="" className="size-full object-cover" />
                    <Badge variant="secondary" className="absolute top-2 start-2 text-[10px] backdrop-blur font-semibold">
                      {item.category}
                    </Badge>
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm">{lang === "ar" ? item.name_ar : item.name_en}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">{lang === "ar" ? item.description_ar : item.description_en}</p>
                      </div>
                      <span className="font-black text-sm text-primary">{formatPrice(item.price, currencySymbol)}</span>
                    </div>

                    <div className="flex items-center justify-between border-t pt-2 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Switch
                          checked={item.available}
                          onCheckedChange={(checked) => updateMenuItem(item.id, { available: checked })}
                        />
                        <span className="text-[11px] text-muted-foreground">
                          {item.available ? (lang === "ar" ? "متاح" : "Available") : (lang === "ar" ? "معطل" : "Unavailable")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => {
                            setEditingMenuItem(item);
                            setMenuForm({
                              name_en: item.name_en,
                              name_ar: item.name_ar,
                              description_en: item.description_en,
                              description_ar: item.description_ar,
                              price: item.price,
                              category: item.category,
                              image: item.image,
                              available: item.available,
                              requiredInventoryItemIds: item.requiredInventoryItemIds || [],
                            });
                            setIsMenuModalOpen(true);
                          }}
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => deleteMenuItem(item.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 4: SMART INVENTORY HUB */}
          {/* ============================================================ */}
          <TabsContent value="inventory" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold">{t("admin.inventory", lang)}</h3>
                <p className="text-xs text-muted-foreground">Valuation: {formatPrice(totalInventoryValuation, currencySymbol)}</p>
              </div>
              <div className="flex items-center gap-2">
                {itemsNeedingReorder.length > 0 && (
                  <Button
                    onClick={() => setIsPOModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-bold border-amber-500/40 text-amber-600 bg-amber-500/10 gap-1.5"
                  >
                    <FileSpreadsheet className="size-3.5" />
                    <span>Auto Purchase Order ({itemsNeedingReorder.length})</span>
                  </Button>
                )}
                <Button onClick={() => setIsAddInvOpen(true)} size="sm" className="h-8 text-xs font-bold gap-1.5">
                  <Plus className="size-3.5" />
                  <span>Add Ingredient</span>
                </Button>
              </div>
            </div>

            {/* Inventory Search and Filter Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20 p-2.5 rounded-xl border">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder={lang === "ar" ? "ابحث في المكونات والموردين..." : "Search ingredient or supplier..."}
                    value={invSearch}
                    onChange={(e) => setInvSearch(e.target.value)}
                    className="ps-8 h-8 text-xs"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {invCategories.map((cat) => (
                    <Button
                      key={cat}
                      size="xs"
                      variant={invCategoryFilter === cat ? "default" : "outline"}
                      onClick={() => setInvCategoryFilter(cat)}
                      className="h-7 text-[11px] rounded-lg capitalize whitespace-nowrap"
                    >
                      {cat === "all" ? (lang === "ar" ? "الكل" : "All") : cat}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="xs"
                  variant={invStatusFilter === "all" ? "secondary" : "ghost"}
                  onClick={() => setInvStatusFilter("all")}
                  className="h-7 text-[11px]"
                >
                  All Status
                </Button>
                <Button
                  size="xs"
                  variant={invStatusFilter === "low" ? "secondary" : "ghost"}
                  onClick={() => setInvStatusFilter(invStatusFilter === "low" ? "all" : "low")}
                  className="h-7 text-[11px] text-amber-600 dark:text-amber-400"
                >
                  Low Stock ({lowStockItems.length})
                </Button>
                <Button
                  size="xs"
                  variant={invStatusFilter === "out" ? "secondary" : "ghost"}
                  onClick={() => setInvStatusFilter(invStatusFilter === "out" ? "all" : "out")}
                  className="h-7 text-[11px] text-destructive"
                >
                  Out ({outOfStockItems.length})
                </Button>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs">Ingredient</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Supplier</TableHead>
                    <TableHead className="text-xs">Stock Level</TableHead>
                    <TableHead className="text-xs">Cost/Unit</TableHead>
                    <TableHead className="text-xs text-end">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs font-bold">
                        {lang === "ar" ? item.name_ar : item.name_en}
                      </TableCell>
                      <TableCell className="text-xs">{item.category}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.supplier || "Standard Supply"}</TableCell>
                      <TableCell className="text-xs">
                        <span className={`font-mono font-bold ${item.stock <= item.lowStockThreshold ? "text-destructive" : "text-emerald-600"}`}>
                          {item.stock} / {item.maxStock || 40} {item.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{formatPrice(item.costPerUnit || 5, currencySymbol)}</TableCell>
                      <TableCell className="text-xs text-end">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setSelectedRestockItem(item);
                            setIsRestockOpen(true);
                          }}
                          className="h-7 text-[11px] font-semibold gap-1"
                        >
                          <RefreshCw className="size-3" />
                          <span>Restock</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 5: PROMOS & DISCOUNTS */}
          {/* ============================================================ */}
          <TabsContent value="promos" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">{t("admin.promos", lang)}</h3>
                <p className="text-xs text-muted-foreground">Manage promo codes and happy hour discounts</p>
              </div>
              <Button
                onClick={() => {
                  setPromoForm({
                    code: "",
                    discountType: "percentage",
                    value: 15,
                    minOrder: 10,
                    maxDiscount: 20,
                    isActive: true,
                  });
                  setIsPromoModalOpen(true);
                }}
                size="sm"
                className="gap-1.5 text-xs font-bold"
              >
                <Plus className="size-3.5" />
                <span>Add Promo Code</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {promoCodes.map((p) => (
                <Card key={p.id} className="border shadow-xs">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className="font-mono text-xs font-bold">{p.code}</Badge>
                      <Switch
                        checked={p.isActive}
                        onCheckedChange={(checked) => updatePromoCode(p.id, { isActive: checked })}
                      />
                    </div>
                    <div>
                      <p className="text-xl font-black text-primary">
                        {p.discountType === "percentage" ? `${p.value}% OFF` : `-${formatPrice(p.value, currencySymbol)}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Min Order: {formatPrice(p.minOrder || 0, currencySymbol)} · Used {p.usageCount} times
                      </p>
                    </div>
                    <div className="flex justify-end pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => deletePromoCode(p.id)}
                        className="text-destructive h-6 text-xs hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3 me-1" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 6: CUSTOMERS CRM & LOYALTY */}
          {/* ============================================================ */}
          <TabsContent value="customers" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">{t("admin.customers", lang)}</h3>
                <p className="text-xs text-muted-foreground">{customers.length} registered customer accounts</p>
              </div>
              <Button
                onClick={() => {
                  setCustomerForm({ name: "", phone: "", email: "", loyaltyStamps: 0 });
                  setIsCustomerModalOpen(true);
                }}
                size="sm"
                className="gap-1.5 text-xs font-bold"
              >
                <Plus className="size-3.5" />
                <span>Add Customer</span>
              </Button>
            </div>

            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs">Customer Name</TableHead>
                    <TableHead className="text-xs">Phone</TableHead>
                    <TableHead className="text-xs">Loyalty Stamps</TableHead>
                    <TableHead className="text-xs">Total Orders</TableHead>
                    <TableHead className="text-xs">Total Spent</TableHead>
                    <TableHead className="text-xs text-end">Quick Stamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs font-bold">{c.name}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{c.phone}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {c.loyaltyStamps} / {loyaltyConfig.stampsNeeded} ☕
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{c.totalOrders}</TableCell>
                      <TableCell className="text-xs font-bold font-mono text-primary">{formatPrice(c.totalSpent, currencySymbol)}</TableCell>
                      <TableCell className="text-xs text-end">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            updateCustomer(c.id, { loyaltyStamps: c.loyaltyStamps + 1 });
                            toast.success(`Stamp added for ${c.name}!`);
                          }}
                          className="h-7 text-[11px] font-semibold"
                        >
                          +1 Stamp
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 7: STAFF & ROLES */}
          {/* ============================================================ */}
          <TabsContent value="staff" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">{t("admin.staff", lang)}</h3>
                <p className="text-xs text-muted-foreground">Manage cashiers, baristas, managers and security PINs</p>
              </div>
              <Button
                onClick={() => {
                  setStaffForm({ name: "", pin: "1234", role: "barista", active: true });
                  setIsStaffModalOpen(true);
                }}
                size="sm"
                className="gap-1.5 text-xs font-bold"
              >
                <Plus className="size-3.5" />
                <span>Add Staff Member</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {staff.map((st) => (
                <Card key={st.id} className="border shadow-xs">
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{st.name}</span>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary">
                        {st.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      PIN: •••• (Security Active)
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1.5">
                        <Switch
                          checked={st.active}
                          onCheckedChange={(checked) => updateStaff(st.id, { active: checked })}
                        />
                        <span className="text-[11px] text-muted-foreground">{st.active ? "Active" : "Disabled"}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => deleteStaff(st.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 8: SETTINGS, TAXES, STORE HOURS & BRAND */}
          {/* ============================================================ */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold">Brand & Visual Identity</CardTitle>
                <CardDescription className="text-xs">Live theme preview presets and custom palette</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {BRAND_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setLocalPrimaryColor(preset.primary);
                        setLocalSecondaryColor(preset.secondary);
                        updateSettings({
                          primaryColor: preset.primary,
                          secondaryColor: preset.secondary,
                        });
                        toast.success(`Theme switched to ${preset.name}`);
                      }}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all text-xs ${
                        localPrimaryColor.toLowerCase() === preset.primary.toLowerCase()
                          ? "border-primary ring-2 ring-primary/20 bg-primary/5 font-bold"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex size-7 items-center justify-center rounded-full shadow-sm" style={{ backgroundColor: preset.primary }}>
                        <div className="size-2.5 rounded-full" style={{ backgroundColor: preset.secondary }}></div>
                      </div>
                      <span className="text-[11px] truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t("admin.cafeName", lang)}</Label>
                    <Input
                      value={localTenantName}
                      onChange={(e) => setLocalTenantName(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">{t("admin.currency", lang)}</Label>
                      <Input
                        value={localCurrency}
                        onChange={(e) => setLocalCurrency(e.target.value)}
                        className="h-8 text-xs font-bold text-center"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">{t("admin.taxRate", lang)}</Label>
                      <Input
                        type="number"
                        value={localTaxRate}
                        onChange={(e) => setLocalTaxRate(Number(e.target.value))}
                        className="h-8 text-xs text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Wi-Fi & Social Media */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t("admin.wifiSsid", lang)}</Label>
                    <Input
                      value={localWifiSSID}
                      onChange={(e) => setLocalWifiSSID(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t("admin.wifiPassword", lang)}</Label>
                    <Input
                      value={localWifiPassword}
                      onChange={(e) => setLocalWifiPassword(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t("admin.googleReviewUrl", lang)}</Label>
                    <Input
                      value={localGoogleReview}
                      onChange={(e) => setLocalGoogleReview(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t("admin.instagramUrl", lang)}</Label>
                    <Input
                      value={localInstagram}
                      onChange={(e) => setLocalInstagram(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Loyalty Program Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t("admin.stampsNeeded", lang)}</Label>
                    <Input
                      type="number"
                      value={localStampsNeeded}
                      onChange={(e) => setLocalStampsNeeded(Number(e.target.value))}
                      className="h-8 text-xs text-center"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t("admin.rewardLabelEn", lang)}</Label>
                    <Input
                      value={localRewardEn}
                      onChange={(e) => setLocalRewardEn(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t("admin.rewardLabelAr", lang)}</Label>
                    <Input
                      value={localRewardAr}
                      onChange={(e) => setLocalRewardAr(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Operating Status Selector */}
                <div className="space-y-2 border-t pt-4">
                  <Label className="text-xs font-semibold">{t("admin.storeStatus", lang)}</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(["auto", "open", "closed", "break"] as const).map((st) => (
                      <Button
                        key={st}
                        type="button"
                        size="sm"
                        variant={manualStoreStatus === st ? "default" : "outline"}
                        onClick={() => {
                          setManualStoreStatus(st);
                          toast.success(`Store status updated to ${st.toUpperCase()}`);
                        }}
                        className="h-8 text-xs capitalize"
                      >
                        {st === "auto" ? "Auto Schedule" : st === "open" ? "Force Open" : st === "closed" ? "Force Closed" : "Short Break"}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSaveSettings} size="sm" className="font-bold text-xs gap-1.5">
                    <Save className="size-3.5" />
                    <span>{t("admin.save", lang)}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* ============================================================ */}
      {/* MENU ITEM EDIT / CREATE MODAL (WITH IMAGE UPLOAD) */}
      {/* ============================================================ */}
      <Dialog open={isMenuModalOpen} onOpenChange={setIsMenuModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingMenuItem ? (lang === "ar" ? "تعديل الصنف" : "Edit Menu Item") : (lang === "ar" ? "إضافة صنف جديد" : "Add Menu Item")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Image Preview & Real File Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{lang === "ar" ? "صورة الصنف" : "Item Image"}</Label>
              <div className="relative h-36 w-full rounded-xl overflow-hidden border bg-muted group">
                <img src={menuForm.image} alt="" className="size-full object-cover" />
                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-bold gap-1">
                  <Upload className="size-5" />
                  <span>{t("admin.uploadImage", lang)}</span>
                  <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                </label>
              </div>
              <Input
                placeholder="Or paste image URL"
                value={menuForm.image}
                onChange={(e) => setMenuForm((prev) => ({ ...prev, image: e.target.value }))}
                className="h-7 text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">{t("admin.nameEn", lang)}</Label>
                <Input
                  value={menuForm.name_en}
                  onChange={(e) => setMenuForm((prev) => ({ ...prev, name_en: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">{t("admin.nameAr", lang)}</Label>
                <Input
                  value={menuForm.name_ar}
                  onChange={(e) => setMenuForm((prev) => ({ ...prev, name_ar: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">{t("admin.price", lang)}</Label>
                <Input
                  type="number"
                  step="0.25"
                  value={menuForm.price}
                  onChange={(e) => setMenuForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">{t("admin.category", lang)}</Label>
                <Input
                  value={menuForm.category}
                  onChange={(e) => setMenuForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Linked Inventory Requirement Checkboxes */}
            <div className="space-y-1 border-t pt-2">
              <Label className="text-xs font-semibold">{lang === "ar" ? "المكونات المطلوبة من المخزون" : "Required Stock Ingredients"}</Label>
              <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto p-1 border rounded-lg">
                {inventory.map((inv) => {
                  const isChecked = menuForm.requiredInventoryItemIds.includes(inv.id);
                  return (
                    <div
                      key={inv.id}
                      onClick={() =>
                        setMenuForm((prev) => ({
                          ...prev,
                          requiredInventoryItemIds: isChecked
                            ? prev.requiredInventoryItemIds.filter((id) => id !== inv.id)
                            : [...prev.requiredInventoryItemIds, inv.id],
                        }))
                      }
                      className={`flex items-center gap-1.5 p-1.5 rounded text-[11px] cursor-pointer border ${
                        isChecked ? "bg-primary/10 border-primary font-bold" : "hover:bg-muted/40"
                      }`}
                    >
                      <input type="checkbox" checked={isChecked} readOnly className="size-3" />
                      <span className="truncate">{inv.name_en}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSaveMenuItem} className="w-full h-8 text-xs font-bold">
              {t("admin.save", lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* RESTOCK DIALOG */}
      {/* ============================================================ */}
      <Dialog open={isRestockOpen} onOpenChange={setIsRestockOpen}>
        <DialogContent className="max-w-xs" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Quick Restock</DialogTitle>
          </DialogHeader>
          {selectedRestockItem && (
            <div className="space-y-3 py-2">
              <p className="text-xs font-semibold">{selectedRestockItem.name_en}</p>
              <div className="flex gap-2">
                {[5, 10, 25].map((amt) => (
                  <Button
                    key={amt}
                    size="sm"
                    variant={restockAmount === amt ? "default" : "outline"}
                    onClick={() => setRestockAmount(amt)}
                    className="flex-1 h-8 text-xs"
                  >
                    +{amt}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                value={restockAmount}
                onChange={(e) => setRestockAmount(Number(e.target.value))}
                className="h-8 text-xs font-mono text-center"
              />
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => {
                if (selectedRestockItem) {
                  restockItem(selectedRestockItem.id, restockAmount);
                  setIsRestockOpen(false);
                  toast.success(`Restocked +${restockAmount} ${selectedRestockItem.unit}`);
                }
              }}
              className="w-full h-8 text-xs font-bold"
            >
              Confirm Restock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* PURCHASE ORDER BATCH REORDER MODAL */}
      {/* ============================================================ */}
      <Dialog open={isPOModalOpen} onOpenChange={setIsPOModalOpen}>
        <DialogContent className="max-w-md" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <FileSpreadsheet className="size-4 text-amber-500" />
              <span>Purchase Order Generator</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2 max-h-60 overflow-y-auto">
            {itemsNeedingReorder.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs p-2 border rounded-lg">
                <div>
                  <p className="font-bold">{item.name_en}</p>
                  <p className="text-[10px] text-muted-foreground">Supplier: {item.supplier}</p>
                </div>
                <div className="text-end font-mono">
                  <span>+{(item.maxStock || 40) - item.stock} {item.unit}</span>
                  <p className="text-[10px] text-primary">{formatPrice(((item.maxStock || 40) - item.stock) * (item.costPerUnit || 10), currencySymbol)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-2 border-t text-xs font-bold">
            <span>Total Estimated Cost:</span>
            <span className="text-primary font-black">{formatPrice(totalPOCost, currencySymbol)}</span>
          </div>
          <DialogFooter>
            <Button onClick={handleExecutePOReorder} className="w-full h-8 text-xs font-bold">
              Dispatch Purchase Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* ADD PROMO CODE MODAL */}
      {/* ============================================================ */}
      <Dialog open={isPromoModalOpen} onOpenChange={setIsPromoModalOpen}>
        <DialogContent className="max-w-xs" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Create Promo Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Code</Label>
              <Input
                value={promoForm.code}
                onChange={(e) => setPromoForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. COFFEE20"
                className="h-8 text-xs font-mono uppercase"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Discount Value (%)</Label>
              <Input
                type="number"
                value={promoForm.value}
                onChange={(e) => setPromoForm((prev) => ({ ...prev, value: Number(e.target.value) }))}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!promoForm.code?.trim()) return;
                addPromoCode({
                  id: `promo-${Date.now()}`,
                  code: promoForm.code.trim().toUpperCase(),
                  discountType: "percentage",
                  value: promoForm.value || 10,
                  minOrder: promoForm.minOrder || 5,
                  isActive: true,
                  usageCount: 0,
                });
                setIsPromoModalOpen(false);
                toast.success(`Promo code ${promoForm.code} created!`);
              }}
              className="w-full h-8 text-xs font-bold"
            >
              Create Promo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* ADD CUSTOMER MODAL */}
      {/* ============================================================ */}
      <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
        <DialogContent className="max-w-xs" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Add Customer Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Full Name</Label>
              <Input
                value={customerForm.name}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, name: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone Number</Label>
              <Input
                value={customerForm.phone}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!customerForm.name?.trim() || !customerForm.phone?.trim()) return;
                addCustomer({
                  id: `cust-${Date.now()}`,
                  name: customerForm.name.trim(),
                  phone: customerForm.phone.trim(),
                  loyaltyStamps: 0,
                  totalOrders: 0,
                  totalSpent: 0,
                  joinedAt: new Date().toISOString().split("T")[0],
                });
                setIsCustomerModalOpen(false);
                toast.success(`Customer ${customerForm.name} added!`);
              }}
              className="w-full h-8 text-xs font-bold"
            >
              Save Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* ADD STAFF MODAL */}
      {/* ============================================================ */}
      <Dialog open={isStaffModalOpen} onOpenChange={setIsStaffModalOpen}>
        <DialogContent className="max-w-xs" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Staff Name</Label>
              <Input
                value={staffForm.name}
                onChange={(e) => setStaffForm((prev) => ({ ...prev, name: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <div className="grid grid-cols-2 gap-1">
                {(["admin", "manager", "barista", "cashier"] as StaffRole[]).map((r) => (
                  <Button
                    key={r}
                    type="button"
                    size="xs"
                    variant={staffForm.role === r ? "default" : "outline"}
                    onClick={() => setStaffForm((prev) => ({ ...prev, role: r }))}
                    className="h-7 text-xs capitalize"
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">4-Digit Security PIN</Label>
              <Input
                maxLength={4}
                value={staffForm.pin}
                onChange={(e) => setStaffForm((prev) => ({ ...prev, pin: e.target.value }))}
                className="h-8 text-xs font-mono text-center"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!staffForm.name?.trim()) return;
                addStaff({
                  id: `staff-${Date.now()}`,
                  name: staffForm.name.trim(),
                  pin: staffForm.pin || "1234",
                  role: staffForm.role || "barista",
                  active: true,
                });
                setIsStaffModalOpen(false);
                toast.success(`Staff member ${staffForm.name} added!`);
              }}
              className="w-full h-8 text-xs font-bold"
            >
              Add Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* ADD INVENTORY ITEM MODAL */}
      {/* ============================================================ */}
      <Dialog open={isAddInvOpen} onOpenChange={setIsAddInvOpen}>
        <DialogContent className="max-w-xs" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Add Inventory Ingredient</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Name (EN)</Label>
              <Input
                value={invForm.name_en}
                onChange={(e) => setInvForm((prev) => ({ ...prev, name_en: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Name (AR)</Label>
              <Input
                value={invForm.name_ar}
                onChange={(e) => setInvForm((prev) => ({ ...prev, name_ar: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Stock</Label>
                <Input
                  type="number"
                  value={invForm.stock}
                  onChange={(e) => setInvForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                  className="h-8 text-xs font-mono text-center"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unit (kg, L, etc.)</Label>
                <Input
                  value={invForm.unit}
                  onChange={(e) => setInvForm((prev) => ({ ...prev, unit: e.target.value }))}
                  className="h-8 text-xs text-center"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Cost / Unit</Label>
                <Input
                  type="number"
                  value={invForm.costPerUnit}
                  onChange={(e) => setInvForm((prev) => ({ ...prev, costPerUnit: Number(e.target.value) }))}
                  className="h-8 text-xs font-mono text-center"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Input
                  value={invForm.category}
                  onChange={(e) => setInvForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!invForm.name_en?.trim() || !invForm.name_ar?.trim()) return;
                addInventoryItem({
                  id: `inv-${Date.now()}`,
                  name_en: invForm.name_en.trim(),
                  name_ar: invForm.name_ar.trim(),
                  unit: invForm.unit || "kg",
                  stock: invForm.stock || 10,
                  lowStockThreshold: invForm.lowStockThreshold || 5,
                  maxStock: invForm.maxStock || 50,
                  costPerUnit: invForm.costPerUnit || 10,
                  category: invForm.category || "General",
                  supplier: invForm.supplier || "Direct Supply",
                });
                setIsAddInvOpen(false);
                toast.success(`Ingredient ${invForm.name_en} added to inventory!`);
              }}
              className="w-full h-8 text-xs font-bold"
            >
              Save Ingredient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminPage;
