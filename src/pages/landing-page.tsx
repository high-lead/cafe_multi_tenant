import { Link } from "react-router-dom";
import {
  Coffee,
  Wifi,
  Star,
  ShoppingBag,
  Package,
  Languages,
  ArrowRight,
  Store,
  LayoutDashboard,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguageStore, t } from "@/stores/languageStore";
import { useTenantStore } from "@/stores/tenantStore";

export function LandingPage() {
  const { lang } = useLanguageStore();
  const tenantName = useTenantStore((s) => s.tenantName);

  const features = [
    { icon: Coffee, key: "menu" },
    { icon: Star, key: "loyalty" },
    { icon: Wifi, key: "wifi" },
    { icon: Receipt, key: "cashier" },
    { icon: Package, key: "inventory" },
    { icon: Languages, key: "rtl" },
  ];

  return (
    <div className="min-h-svh bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/landing-hero.webp"
            alt=""
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 py-20 text-center sm:py-28">
          <Badge variant="secondary" className="mb-6 gap-1.5">
            <Coffee className="size-3" />
            {tenantName}
          </Badge>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-balance sm:text-5xl md:text-6xl">
            {t("landing.hero.title", lang)}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground text-balance">
            {t("landing.hero.subtitle", lang)}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link to="/store">
                <Store className="size-4" />
                {t("landing.cta.store", lang)}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/admin">
                <LayoutDashboard className="size-4" />
                {t("landing.cta.admin", lang)}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="gap-2">
              <Link to="/cashier">
                <Receipt className="size-4" />
                {t("landing.cta.cashier", lang)}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, key }) => (
            <Card key={key} className="overflow-hidden">
              <CardContent className="flex flex-col items-start gap-3 pt-6">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-6" />
                </div>
                <h3 className="text-lg font-semibold">
                  {t(`landing.feature.${key}.title`, lang)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`landing.feature.${key}.desc`, lang)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <Card className="overflow-hidden border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-6 py-12 text-center">
            <ShoppingBag className="size-10 text-primary" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {t("landing.hero.title", lang)}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t("landing.hero.subtitle", lang)}
              </p>
            </div>
            <Button asChild size="lg" className="gap-2">
              <Link to="/store">
                {t("landing.cta.store", lang)}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>{tenantName} — Brew Hub Cafe SaaS Platform</p>
      </footer>
    </div>
  );
}
