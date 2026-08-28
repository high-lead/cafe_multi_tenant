import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { DynamicTheme } from "@/components/dynamic-theme";
import { LandingPage } from "@/pages/landing-page";
import { StorefrontPage } from "@/pages/storefront-page";
import { CashierPage } from "@/pages/cashier-page";
import { AdminPage } from "@/pages/admin-page";

export function App() {
  return (
    <HashRouter>
      <DynamicTheme />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/store" element={<StorefrontPage />} />
        <Route path="/cashier" element={<CashierPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <Toaster position="top-center" />
    </HashRouter>
  );
}

export default App;
