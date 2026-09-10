import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GuideBar } from "./components/guide/GuideBar";
import { GuidePointer } from "./components/guide/GuidePointer";
import { MarketingLayout } from "./components/marketing/MarketingLayout";
import { RequireAnon, RequireRole } from "./components/RequireRole";
import { AuthProvider } from "./lib/auth";
import { HealthPage } from "./pages/HealthPage";
import { BrandCampaigns } from "./pages/brand/BrandCampaigns";
import { BrandCollaborations } from "./pages/brand/BrandCollaborations";
import { BrandMarketplace } from "./pages/brand/BrandMarketplace";
import { BrandOverview } from "./pages/brand/BrandOverview";
import { BrandResults } from "./pages/brand/BrandResults";
import { BrandShell } from "./pages/brand/BrandShell";
import { CreatorCard } from "./pages/creator/CreatorCard";
import { CreatorCollaborations } from "./pages/creator/CreatorCollaborations";
import { CreatorEarnings } from "./pages/creator/CreatorEarnings";
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
        <GuideBar />
        <GuidePointer />
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
            <Route path="earnings" element={<CreatorEarnings />} />
          </Route>
          <Route
            path="/brand"
            element={
              <RequireRole role="brand">
                <BrandShell />
              </RequireRole>
            }
          >
            <Route index element={<BrandOverview />} />
            <Route path="marketplace" element={<BrandMarketplace />} />
            <Route path="campaigns" element={<BrandCampaigns />} />
            <Route path="collaborations" element={<BrandCollaborations />} />
            <Route path="results" element={<BrandResults />} />
          </Route>
          <Route path="/health" element={<HealthPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
