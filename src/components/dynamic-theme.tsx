import { useEffect } from "react";
import { useTenantStore } from "@/stores/tenantStore";

function getContrastForeground(hex: string): string {
  // Normalize hex
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const r = parseInt(c.slice(0, 2), 16) || 0;
  const g = parseInt(c.slice(2, 4), 16) || 0;
  const b = parseInt(c.slice(4, 6), 16) || 0;

  // Standard YIQ brightness calculation
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160 ? "#0f172a" : "#ffffff";
}

export function DynamicTheme() {
  const primaryColor = useTenantStore((s) => s.primaryColor);
  const secondaryColor = useTenantStore((s) => s.secondaryColor);

  useEffect(() => {
    const root = document.documentElement;
    const primaryFg = getContrastForeground(primaryColor);
    const secondaryFg = getContrastForeground(secondaryColor);

    root.style.setProperty("--primary", primaryColor);
    root.style.setProperty("--primary-foreground", primaryFg);
    root.style.setProperty("--ring", primaryColor);
    root.style.setProperty("--sidebar-primary", primaryColor);
    root.style.setProperty("--sidebar-primary-foreground", primaryFg);

    root.style.setProperty("--sidebar-accent", secondaryColor);
    root.style.setProperty("--sidebar-accent-foreground", secondaryFg);

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", primaryColor);
    }
  }, [primaryColor, secondaryColor]);

  return null;
}
