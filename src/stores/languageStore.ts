import { create } from "zustand";
import type { Language } from "@/types";

interface LanguageState {
  lang: Language;
  setLang: (lang: Language) => void;
  toggle: () => void;
}

function applyLang(lang: Language) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

const stored = (typeof window !== "undefined" && localStorage.getItem("lang")) as Language | null;
const initialLang: Language = stored === "ar" || stored === "en" ? stored : "en";
applyLang(initialLang);

export const useLanguageStore = create<LanguageState>((set, get) => ({
  lang: initialLang,
  setLang: (lang) => {
    localStorage.setItem("lang", lang);
    applyLang(lang);
    set({ lang });
  },
  toggle: () => {
    const next = get().lang === "en" ? "ar" : "en";
    localStorage.setItem("lang", next);
    applyLang(next);
    set({ lang: next });
  },
}));

type TranslationKey = string;
const dict: Record<string, { en: string; ar: string }> = {
  // Landing
  "landing.hero.title": { en: "Launch your cafe's digital presence in minutes", ar: "أطلق حضورك الرقمي لمقهاك في دقائق" },
  "landing.hero.subtitle": { en: "Menu, loyalty, Wi-Fi sharing, and a live cashier queue — all in one installable app your customers access by scanning a QR code.", ar: "قائمة، ولاء، مشاركة واي-فاي، وطابور نقاد حي — كل ذلك في تطبيق قابل للتثبيت يصل إليه عملاؤك بمسح رمز QR." },
  "landing.cta.store": { en: "View Storefront", ar: "عرض المتجر" },
  "landing.cta.admin": { en: "Admin Dashboard", ar: "لوحة التحكم" },
  "landing.cta.cashier": { en: "Cashier View", ar: "واجهة الكاشير" },
  "landing.feature.menu.title": { en: "Digital Menu", ar: "قائمة رقمية" },
  "landing.feature.menu.desc": { en: "Beautiful, categorized menu with ingredient customization and live pricing.", ar: "قائمة جميلة مصنفة مع تخصيص المكونات وأسعار حية." },
  "landing.feature.loyalty.title": { en: "Loyalty Stamps", ar: "أختام الولاء" },
  "landing.feature.loyalty.desc": { en: "Digital stamp card — customers earn a free coffee after N orders.", ar: "بطاقة أختام رقمية — يكسب العملاء قهوة مجانية بعد N طلب." },
  "landing.feature.wifi.title": { en: "Wi-Fi Sharing", ar: "مشاركة الواي-فاي" },
  "landing.feature.wifi.desc": { en: "One-tap password copy plus a scannable QR code for instant connection.", ar: "نسخ كلمة المرور بنقرة واحدة مع رمز QR قابل للمسح للاتصال الفوري." },
  "landing.feature.cashier.title": { en: "Live Cashier Queue", ar: "طابور نقاد حي" },
  "landing.feature.cashier.desc": { en: "Staff see orders in real time and mark them preparing, ready, or paid.", ar: "يرى الموظفون الطلبات في الوقت الحقيقي ويحددونها قيد التحضير أو جاهزة أو مدفوعة." },
  "landing.feature.inventory.title": { en: "Inventory Alerts", ar: "تنبيهات المخزون" },
  "landing.feature.inventory.desc": { en: "Track stock levels with low-stock badges and auto sold-out hints.", ar: "تتبع مستويات المخزون مع شارات المخزون المنخفض وتلميحات نفاد المخزون التلقائية." },
  "landing.feature.rtl.title": { en: "Bilingual & RTL", ar: "ثنائي اللغة و RTL" },
  "landing.feature.rtl.desc": { en: "Full Arabic support with right-to-left layout mirroring every screen.", ar: "دعم عربي كامل مع تخطيط من اليمين لليسار يعكس كل شاشة." },

  // Storefront
  "store.wifi": { en: "Wi-Fi", ar: "واي-فاي" },
  "store.wifi.title": { en: "Connect to our Wi-Fi", ar: "اتصل بشبكتنا" },
  "store.wifi.copy": { en: "Copy Password", ar: "نسخ كلمة المرور" },
  "store.wifi.copied": { en: "Password copied to clipboard", ar: "تم نسخ كلمة المرور" },
  "store.wifi.scan": { en: "Scan to connect", ar: "امسح للاتصال" },
  "store.wifi.ssid": { en: "Network", ar: "الشبكة" },
  "store.wifi.password": { en: "Password", ar: "كلمة المرور" },
  "store.soldout": { en: "Sold Out", ar: "نفد" },
  "store.cart": { en: "Cart", ar: "السلة" },
  "store.cart.empty": { en: "Your cart is empty", ar: "سلتك فارغة" },
  "store.cart.empty.desc": { en: "Browse the menu and add your favorites.", ar: "تصفح القائمة وأضف مفضلاتك." },
  "store.cart.total": { en: "Total", ar: "الإجمالي" },
  "store.cart.checkout": { en: "Place Order — Pay at Counter", ar: "اطلب — ادفع عند الكاشير" },
  "store.cart.orderType": { en: "Order Type", ar: "نوع الطلب" },
  "store.cart.dineIn": { en: "Dine-in", ar: "في المقهى" },
  "store.cart.pickup": { en: "Pickup", ar: "استلام" },
  "store.cart.table": { en: "Table number", ar: "رقم الطاولة" },
  "store.cart.placed": { en: "Order placed! Pay at the counter.", ar: "تم الطلب! ادفع عند الكاشير." },
  "store.cart.qty": { en: "Qty", ar: "الكمية" },
  "store.detail.ingredients": { en: "Ingredients", ar: "المكونات" },
  "store.detail.remove": { en: "Remove", ar: "إزالة" },
  "store.detail.removed": { en: "Removed", ar: "مُزال" },
  "store.detail.choose": { en: "Choose", ar: "اختر" },
  "store.detail.quantity": { en: "Quantity", ar: "الكمية" },
  "store.detail.add": { en: "Add to Cart", ar: "أضف للسلة" },
  "store.loyalty.title": { en: "Loyalty Card", ar: "بطاقة الولاء" },
  "store.loyalty.progress": { en: "stamps", ar: "أختام" },
  "store.loyalty.reward": { en: "Reward", ar: "المكافأة" },
  "store.loyalty.claimed": { en: "Reward ready! Show this to the cashier.", ar: "المكافأة جاهزة! اعرضها على الكاشير." },
  "store.reviews.title": { en: "Enjoying your coffee?", ar: "هل تستمتع بقهوتك؟" },
  "store.reviews.subtitle": { en: "We'd love your feedback!", ar: "نحب سماع رأيك!" },
  "store.reviews.google": { en: "Leave a Google Review", ar: "اترك تقييم جوجل" },
  "store.reviews.instagram": { en: "Follow us on Instagram", ar: "تابعنا على إنستغرام" },

  // Cashier
  "cashier.title": { en: "Cashier", ar: "الكاشير" },
  "cashier.queue": { en: "Order Queue", ar: "طابور الطلبات" },
  "cashier.empty": { en: "No active orders", ar: "لا توجد طلبات نشطة" },
  "cashier.markPreparing": { en: "Mark Preparing", ar: "قيد التحضير" },
  "cashier.markReady": { en: "Mark Ready", ar: "جاهز" },
  "cashier.markPaid": { en: "Mark Paid at Counter", ar: "مدفوع عند الكاشير" },
  "cashier.items": { en: "items", ar: "عناصر" },
  "cashier.table": { en: "Table", ar: "طاولة" },
  "cashier.pickup": { en: "Pickup", ar: "استلام" },
  "cashier.dineIn": { en: "Dine-in", ar: "في المقهى" },
  "cashier.new": { en: "New", ar: "جديد" },
  "cashier.preparing": { en: "Preparing", ar: "قيد التحضير" },
  "cashier.ready": { en: "Ready", ar: "جاهز" },
  "cashier.paid": { en: "Paid", ar: "مدفوع" },

  // Admin
  "admin.title": { en: "Admin Dashboard", ar: "لوحة التحكم" },
  "admin.overview": { en: "Overview", ar: "نظرة عامة" },
  "admin.menu": { en: "Menu Manager", ar: "إدارة القائمة" },
  "admin.inventory": { en: "Smart Inventory", ar: "المخزون الذكي" },
  "admin.orders": { en: "Orders", ar: "الطلبات" },
  "admin.settings": { en: "Settings & Brand", ar: "الإعدادات والهوية" },
  "admin.revenue": { en: "Total Revenue", ar: "إجمالي الإيرادات" },
  "admin.totalOrders": { en: "Total Orders", ar: "إجمالي الطلبات" },
  "admin.avgOrder": { en: "Avg. Order Value", ar: "متوسط قيمة الطلب" },
  "admin.stockHealth": { en: "Stock Health", ar: "صحة المخزون" },
  "admin.inventoryValue": { en: "Inventory Valuation", ar: "قيمة المخزون الإجمالية" },
  "admin.lowStock": { en: "Low Stock Items", ar: "عناصر المخزون المنخفض" },
  "admin.outOfStock": { en: "Out of Stock", ar: "نفد من المخزون" },
  "admin.optimalStock": { en: "Optimal Stock", ar: "مخزون مثالي" },
  "admin.recentOrders": { en: "Recent Live Orders", ar: "الطلبات الحية الأخيرة" },
  "admin.topSelling": { en: "Top Selling Items", ar: "الأصناف الأكثر مبيعاً" },
  "admin.salesTrends": { en: "Revenue & Sales Performance", ar: "أداء المبيعات والإيرادات" },
  "admin.add": { en: "Add", ar: "إضافة" },
  "admin.edit": { en: "Edit", ar: "تعديل" },
  "admin.delete": { en: "Delete", ar: "حذف" },
  "admin.save": { en: "Save Changes", ar: "حفظ التغييرات" },
  "admin.cancel": { en: "Cancel", ar: "إلغاء" },
  "admin.nameEn": { en: "Name (English)", ar: "الاسم (إنجليزي)" },
  "admin.nameAr": { en: "Name (Arabic)", ar: "الاسم (عربي)" },
  "admin.descEn": { en: "Description (English)", ar: "الوصف (إنجليزي)" },
  "admin.descAr": { en: "Description (Arabic)", ar: "الوصف (عربي)" },
  "admin.price": { en: "Price", ar: "السعر" },
  "admin.category": { en: "Category", ar: "الفئة" },
  "admin.supplier": { en: "Supplier", ar: "المورّد" },
  "admin.costPerUnit": { en: "Cost / Unit", ar: "التكلفة / الوحدة" },
  "admin.maxCapacity": { en: "Max Capacity", ar: "السعة القصوى" },
  "admin.image": { en: "Image URL", ar: "رابط الصورة" },
  "admin.available": { en: "Available for Order", ar: "متاح للطلب" },
  "admin.ingredients": { en: "Ingredients", ar: "المكونات" },
  "admin.ingredientNameEn": { en: "Ingredient (EN)", ar: "المكون (إنجليزي)" },
  "admin.ingredientNameAr": { en: "Ingredient (AR)", ar: "المكون (عربي)" },
  "admin.removable": { en: "Removable", ar: "قابل للإزالة" },
  "admin.alternatives": { en: "Alternatives", ar: "البدائل" },
  "admin.altNameEn": { en: "Alt (EN)", ar: "البديل (إنجليزي)" },
  "admin.altNameAr": { en: "Alt (AR)", ar: "البديل (عربي)" },
  "admin.priceDelta": { en: "Price Delta", ar: "فرق السعر" },
  "admin.addIngredient": { en: "Add Ingredient", ar: "إضافة مكون" },
  "admin.addAlternative": { en: "Add Alternative", ar: "إضافة بديل" },
  "admin.stock": { en: "Current Stock", ar: "المخزون الحالي" },
  "admin.unit": { en: "Unit", ar: "الوحدة" },
  "admin.lowStockThreshold": { en: "Min Threshold", ar: "الحد الأدنى" },
  "admin.restock": { en: "Quick Restock", ar: "إعادة تخزين سريع" },
  "admin.generatePO": { en: "Purchase Order Reorder", ar: "إنشاء طلب توريد" },
  "admin.soldOut": { en: "Sold Out", ar: "نفد المخزون" },
  "admin.cafeName": { en: "Cafe Brand Name", ar: "اسم المقهى / العلامة" },
  "admin.logoUrl": { en: "Logo URL", ar: "رابط الشعار" },
  "admin.primaryColor": { en: "Primary Brand Color", ar: "اللون الأساسي للعلامة" },
  "admin.secondaryColor": { en: "Accent Color", ar: "اللون الثانوي" },
  "admin.wifiSsid": { en: "Wi-Fi SSID (Network Name)", ar: "اسم شبكة الواي-فاي" },
  "admin.wifiPassword": { en: "Wi-Fi Password", ar: "كلمة مرور الواي-فاي" },
  "admin.googleReviewUrl": { en: "Google Review Link", ar: "رابط تقييم جوجل" },
  "admin.instagramUrl": { en: "Instagram Profile URL", ar: "رابط حساب إنستغرام" },
  "admin.features": { en: "Platform Features & Modules", ar: "ميزات ووحدات المنصة" },
  "admin.feat.loyalty": { en: "Loyalty Stamp Program", ar: "برنامج أختام الولاء" },
  "admin.feat.wifi": { en: "Instant Wi-Fi QR Card", ar: "بطاقة اتصال واي-فاي فوري" },
  "admin.feat.reviews": { en: "Social Reviews Booster", ar: "محفز تقييمات السوشيال" },
  "admin.feat.ordering": { en: "Mobile Table Ordering", ar: "الطلب الذاتي من الطاولات" },
  "admin.loyaltyConfig": { en: "Loyalty Program Settings", ar: "إعدادات برنامج الولاء" },
  "admin.stampsNeeded": { en: "Stamps for Reward", ar: "الأختام المطلوبة للمكافأة" },
  "admin.rewardLabelEn": { en: "Reward Title (EN)", ar: "عنوان المكافأة (إنجليزي)" },
  "admin.rewardLabelAr": { en: "Reward Title (AR)", ar: "عنوان المكافأة (عربي)" },
  "admin.status": { en: "Status", ar: "الحالة" },
  "admin.orderId": { en: "Order ID", ar: "رقم الطلب" },
  "admin.type": { en: "Type", ar: "النوع" },
  "admin.date": { en: "Date & Time", ar: "التاريخ والوقت" },
  "admin.all": { en: "View All", ar: "عرض الكل" },
  "admin.backToStore": { en: "Customer Storefront", ar: "متجر العملاء" },
  "admin.analytics": { en: "Reports & Analytics", ar: "التقارير والتحليلات" },
  "admin.promos": { en: "Discounts & Promos", ar: "العروض والقسائم" },
  "admin.customers": { en: "Customer CRM", ar: "إدارة العملاء" },
  "admin.staff": { en: "Staff & Roles", ar: "فريق العمل والأدوار" },
  "admin.taxRate": { en: "Tax / VAT Rate (%)", ar: "نسبة الضريبة / القيمة المضافة (%)" },
  "admin.currency": { en: "Currency Symbol", ar: "رمز العملة" },
  "admin.storeStatus": { en: "Operating Status", ar: "حالة تشغيل المقهى" },
  "admin.operatingHours": { en: "Opening Hours Schedule", ar: "مواعيد العمل الأسبوعية" },
  "admin.exportCsv": { en: "Export CSV Report", ar: "تصدير تقرير CSV" },
  "admin.uploadImage": { en: "Upload Image", ar: "رفع صورة" },
};

export function t(key: TranslationKey, lang: Language): string {
  const entry = dict[key];
  if (!entry) return key;
  return entry[lang];
}
