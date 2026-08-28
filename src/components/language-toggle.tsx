import { Button } from "@/components/ui/button";
import { useLanguageStore } from "@/stores/languageStore";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { lang, toggle } = useLanguageStore();

  return (
    <Button
      variant="ghost"
      size={compact ? "sm" : "default"}
      onClick={toggle}
      className="font-semibold"
    >
      {lang === "en" ? "عربي" : "EN"}
    </Button>
  );
}
