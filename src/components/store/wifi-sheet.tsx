import { QRCodeSVG } from "qrcode.react";
import { Copy, Wifi } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useTenantStore } from "@/stores/tenantStore";
import { useLanguageStore, t } from "@/stores/languageStore";

export function WifiSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { wifiSSID, wifiPassword } = useTenantStore();
  const { lang } = useLanguageStore();

  const wifiPayload = `WIFI:T:WPA;S:${wifiSSID};P:${wifiPassword};;`;

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(wifiPassword);
      toast.success(t("store.wifi.copied", lang));
    } catch {
      toast.error(t("store.wifi.copied", lang));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-md rounded-t-3xl"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <SheetHeader className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Wifi className="size-6" />
          </div>
          <SheetTitle className="text-xl">{t("store.wifi.title", lang)}</SheetTitle>
          <SheetDescription>{t("store.wifi.scan", lang)}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col items-center gap-6 px-4 pb-8">
          <div className="rounded-3xl border bg-white p-6">
            <QRCodeSVG
              value={wifiPayload}
              size={200}
              level="M"
              includeMargin
            />
          </div>
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
              <span className="text-sm font-medium text-muted-foreground">
                {t("store.wifi.ssid", lang)}
              </span>
              <span className="font-semibold">{wifiSSID}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
              <span className="text-sm font-medium text-muted-foreground">
                {t("store.wifi.password", lang)}
              </span>
              <span className="font-mono font-semibold">{wifiPassword}</span>
            </div>
          </div>
          <Button onClick={copyPassword} className="w-full gap-2" size="lg">
            <Copy className="size-4" />
            {t("store.wifi.copy", lang)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
