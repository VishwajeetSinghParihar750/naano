import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AIAssistant } from "./components/ai/AIAssistant";
import { GuidePointer } from "./components/guide/GuidePointer";
import { MarketingLayout } from "./components/marketing/MarketingLayout";
import { RequireAnon, RequireRole } from "./components/RequireRole";
import { RequireCreatorOnboarding } from "./components/RequireCreatorOnboarding";
import { RequireBrandOnboarding } from "./components/RequireBrandOnboarding";
import { AuthProvider } from "./lib/auth";
import { HealthPage } from "./pages/HealthPage";
import { BrandBilling } from "./pages/brand/BrandBilling";
import { BrandCampaignAi } from "./pages/brand/BrandCampaignAi";
import { BrandCampaignFromLink } from "./pages/brand/BrandCampaignFromLink";
import { BrandCampaignNew } from "./pages/brand/BrandCampaignNew";
import { BrandCampaignOnboarding } from "./pages/brand/BrandCampaignOnboarding";
import { BrandCampaigns } from "./pages/brand/BrandCampaigns";
import { BrandCollaborations } from "./pages/brand/BrandCollaborations";
import { BrandMarketplace } from "./pages/brand/BrandMarketplace";
import { BrandMessages } from "./pages/brand/BrandMessages";
import { BrandOverview } from "./pages/brand/BrandOverview";
import { BrandResults } from "./pages/brand/BrandResults";
import { BrandSettings } from "./pages/brand/BrandSettings";
import { BrandShell } from "./pages/brand/BrandShell";
import { PublicCreatorCard } from "./pages/public/PublicCreatorCard";
import { CreatorAffiliate } from "./pages/creator/CreatorAffiliate";
import { CreatorAnalytics } from "./pages/creator/CreatorAnalytics";
import { CreatorCollaborations } from "./pages/creator/CreatorCollaborations";
import { CreatorCommunity } from "./pages/creator/CreatorCommunity";
import { CreatorEarnings } from "./pages/creator/CreatorEarnings";
import { CreatorHome } from "./pages/creator/CreatorHome";
import { CreatorMessages } from "./pages/creator/CreatorMessages";
import { CreatorOpportunities } from "./pages/creator/CreatorOpportunities";
import { CreatorSettings } from "./pages/creator/CreatorSettings";
import { CreatorShell } from "./pages/creator/CreatorShell";
import { CreatorStorefront } from "./pages/creator/CreatorStorefront";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { CreatorsPage } from "./pages/marketing/CreatorsPage";
import { HomePage } from "./pages/marketing/HomePage";
import { PricingPage } from "./pages/marketing/PricingPage";
import { OnboardingShell } from "./pages/onboarding/OnboardingShell";
import { OnboardingRolePage } from "./pages/onboarding/OnboardingRolePage";
import { OnboardingYouTubePage } from "./pages/onboarding/OnboardingYouTubePage";
import { OnboardingIndustriesPage } from "./pages/onboarding/OnboardingIndustriesPage";
import { OnboardingRatePage } from "./pages/onboarding/OnboardingRatePage";
import { OnboardingTermsPage } from "./pages/onboarding/OnboardingTermsPage";
import { OnboardingCompanyWebsitePage } from "./pages/onboarding/OnboardingCompanyWebsitePage";
import { OnboardingCompanySummaryPage } from "./pages/onboarding/OnboardingCompanySummaryPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AIAssistant />
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

          <Route path="/onboarding/role" element={<OnboardingRolePage />} />

          <Route path="/c/:cardSlug" element={<PublicCreatorCard />} />

          <Route
            path="/onboarding"
            element={
              <RequireRole role="creator">
                <RequireCreatorOnboarding mode="onboarding" />
              </RequireRole>
            }
          >
            <Route element={<OnboardingShell />}>
              <Route index element={<Navigate to="creator/youtube" replace />} />
              <Route path="creator/youtube" element={<OnboardingYouTubePage />} />
              <Route
                path="creator/linkedin"
                element={<Navigate to="/onboarding/creator/youtube" replace />}
              />
              <Route
                path="creator/industries"
                element={<OnboardingIndustriesPage />}
              />
              <Route path="creator/rate" element={<OnboardingRatePage />} />
              <Route path="creator/terms" element={<OnboardingTermsPage />} />
            </Route>
          </Route>

          <Route
            path="/onboarding/company"
            element={
              <RequireRole role="brand">
                <RequireBrandOnboarding mode="onboarding" />
              </RequireRole>
            }
          >
            <Route path="website" element={<OnboardingCompanyWebsitePage />} />
            <Route path="summary" element={<OnboardingCompanySummaryPage />} />
          </Route>

          <Route
            path="/creator"
            element={
              <RequireRole role="creator">
                <RequireCreatorOnboarding mode="app" />
              </RequireRole>
            }
          >
            <Route element={<CreatorShell />}>
              <Route index element={<CreatorHome />} />
              <Route path="storefront" element={<CreatorStorefront />} />
              <Route path="card" element={<Navigate to="/creator/storefront" replace />} />
              <Route path="opportunities" element={<CreatorOpportunities />} />
              <Route path="collaborations" element={<CreatorCollaborations />} />
              <Route path="analytics" element={<CreatorAnalytics />} />
              <Route path="earnings" element={<CreatorEarnings />} />
              <Route path="community" element={<CreatorCommunity />} />
              <Route path="affiliate" element={<CreatorAffiliate />} />
              <Route path="messages" element={<CreatorMessages />} />
              <Route path="settings" element={<CreatorSettings />} />
            </Route>
          </Route>

          <Route
            path="/brand"
            element={
              <RequireRole role="brand">
                <RequireBrandOnboarding mode="app" />
              </RequireRole>
            }
          >
            <Route element={<BrandShell />}>
              <Route index element={<BrandOverview />} />
              <Route path="marketplace" element={<BrandMarketplace />} />
              <Route path="campaigns" element={<BrandCampaigns />} />
              <Route path="campaigns/new" element={<BrandCampaignNew />} />
              <Route path="campaigns/new/ai" element={<BrandCampaignAi />} />
              <Route
                path="campaigns/new/from-link"
                element={<BrandCampaignFromLink />}
              />
              <Route
                path="campaigns/new/onboarding"
                element={<BrandCampaignOnboarding />}
              />
              <Route path="collaborations" element={<BrandCollaborations />} />
              <Route path="messages" element={<BrandMessages />} />
              <Route path="billing" element={<BrandBilling />} />
              <Route path="settings" element={<BrandSettings />} />
              <Route path="results" element={<BrandResults />} />
            </Route>
          </Route>
          <Route path="/health" element={<HealthPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
