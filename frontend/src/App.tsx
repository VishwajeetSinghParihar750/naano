import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MarketingLayout } from "./components/marketing/MarketingLayout";
import { RequireAnon, RequireRole } from "./components/RequireRole";
import { AuthProvider } from "./lib/auth";
import { HealthPage } from "./pages/HealthPage";
import { BrandShell } from "./pages/app/BrandShell";
import { CreatorCard } from "./pages/creator/CreatorCard";
import { CreatorCollaborations } from "./pages/creator/CreatorCollaborations";
import { CreatorHome } from "./pages/creator/CreatorHome";
import { CreatorOpportunities } from "./pages/creator/CreatorOpportunities";
import { CreatorShell } from "./pages/creator/CreatorShell";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { CreatorsPage } from "./pages/marketing/CreatorsPage";
import { HomePage } from "./pages/marketing/HomePage";
import { PricingPage } from "./pages/marketing/PricingPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/creators" element={<CreatorsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
          </Route>
          <Route
            path="/login"
            element={
              <RequireAnon>
                <LoginPage />
              </RequireAnon>
            }
          />
          <Route
            path="/register"
            element={
              <RequireAnon>
                <RegisterPage />
              </RequireAnon>
            }
          />
          <Route
            path="/creator"
            element={
              <RequireRole role="creator">
                <CreatorShell />
              </RequireRole>
            }
          >
            <Route index element={<CreatorHome />} />
            <Route path="card" element={<CreatorCard />} />
            <Route path="opportunities" element={<CreatorOpportunities />} />
            <Route path="collaborations" element={<CreatorCollaborations />} />
          </Route>
          <Route
            path="/brand"
            element={
              <RequireRole role="brand">
                <BrandShell />
              </RequireRole>
            }
          />
          <Route path="/health" element={<HealthPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
