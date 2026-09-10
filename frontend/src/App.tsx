import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MarketingLayout } from "./components/marketing/MarketingLayout";
import { LoginPlaceholder } from "./pages/auth/LoginPlaceholder";
import { RegisterPlaceholder } from "./pages/auth/RegisterPlaceholder";
import { HealthPage } from "./pages/HealthPage";
import { CreatorsPage } from "./pages/marketing/CreatorsPage";
import { HomePage } from "./pages/marketing/HomePage";
import { PricingPage } from "./pages/marketing/PricingPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/creators" element={<CreatorsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
        </Route>
        <Route path="/login" element={<LoginPlaceholder />} />
        <Route path="/register" element={<RegisterPlaceholder />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
