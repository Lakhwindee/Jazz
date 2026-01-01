import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/lib/store";
import { Toaster as SonnerToaster } from "sonner";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import SponsorLogin from "@/pages/SponsorLogin";
import Dashboard from "@/pages/Dashboard";
import Campaigns from "@/pages/Campaigns";
import Earnings from "@/pages/Earnings";
import Profile from "@/pages/Profile";
import MyCampaigns from "@/pages/MyCampaigns";
import Groups from "@/pages/Groups";
import CategoryCampaignsPage from "@/pages/CategoryCampaigns";
import SponsorDashboard from "@/pages/sponsor/SponsorDashboard";
import SponsorCampaigns from "@/pages/sponsor/SponsorCampaigns";
import CreateCampaign from "@/pages/sponsor/CreateCampaign";
import SponsorSettings from "@/pages/sponsor/SponsorSettings";
import SponsorWallet from "@/pages/sponsor/SponsorWallet";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import Subscription from "@/pages/Subscription";
import Support from "@/pages/Support";

function Router() {
  return (
    <Switch>
      {/* Landing Page */}
      <Route path="/" component={LandingPage} />
      
      {/* Creator Auth Routes */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      {/* Sponsor Auth Routes */}
      <Route path="/sponsor/login" component={SponsorLogin} />
      
      {/* Creator Routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/campaigns/:categoryId" component={CategoryCampaignsPage} />
      <Route path="/my-campaigns" component={MyCampaigns} />
      <Route path="/groups" component={Groups} />
      <Route path="/earnings" component={Earnings} />
      <Route path="/profile" component={Profile} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/support" component={Support} />
      
      {/* Sponsor Routes */}
      <Route path="/sponsor" component={SponsorDashboard} />
      <Route path="/sponsor/campaigns" component={SponsorCampaigns} />
      <Route path="/sponsor/create-campaign" component={CreateCampaign} />
      <Route path="/sponsor/settings" component={SponsorSettings} />
      <Route path="/sponsor/wallet" component={SponsorWallet} />
      <Route path="/sponsor/support" component={Support} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <TooltipProvider>
          <Toaster />
          <SonnerToaster position="top-right" />
          <Router />
        </TooltipProvider>
      </StoreProvider>
    </QueryClientProvider>
  );
}

export default App;
