import { SponsorSidebar } from "@/components/SponsorSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { api, formatINR } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Users, Wallet, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { QuickStartGuide, useQuickStartGuide } from "@/components/QuickStartGuide";
import { NotificationDropdown } from "@/components/NotificationDropdown";

export default function SponsorDashboard() {
  const { data: sponsor } = useQuery({
    queryKey: ["currentSponsor"],
    queryFn: api.getCurrentSponsor,
  });

  const { showGuide, completeGuide } = useQuickStartGuide("sponsor");

  const { data: campaigns = [] } = useQuery({
    queryKey: ["sponsorCampaigns", sponsor?.id],
    queryFn: () => sponsor ? api.getSponsorCampaigns(sponsor.id) : [],
    enabled: !!sponsor,
  });

  if (!sponsor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const totalSpots = campaigns.reduce((sum, c) => sum + c.totalSpots, 0);
  const filledSpots = campaigns.reduce((sum, c) => sum + (c.totalSpots - c.spotsRemaining), 0);
  const totalBudget = campaigns.reduce((sum, c) => sum + parseFloat(c.payAmount) * c.totalSpots, 0);
  const activeCampaigns = campaigns.filter(c => c.spotsRemaining > 0).length;

  const stats = [
    { label: "Active Campaigns", value: activeCampaigns.toString(), icon: BarChart3, color: "text-blue-500" },
    { label: "Total Budget", value: formatINR(totalBudget), icon: Wallet, color: "text-green-500" },
    { label: "Creators Reached", value: filledSpots.toString(), icon: Users, color: "text-purple-500" },
    { label: "Fill Rate", value: totalSpots > 0 ? `${Math.round((filledSpots / totalSpots) * 100)}%` : "0%", icon: TrendingUp, color: "text-orange-500" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <SponsorSidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        {/* Mobile Header with Notification */}
        <div className="sticky top-0 z-40 flex items-center justify-between bg-background/80 backdrop-blur-md px-4 py-3 border-b md:hidden">
          <h1 className="text-lg font-bold">Dashboard</h1>
          <NotificationDropdown userId={sponsor.id} />
        </div>
        
        <div className="mx-auto max-w-5xl p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl"
          >
            <div className="p-8 md:p-10">
              <h1 className="text-3xl font-bold md:text-4xl">
                Welcome, <span className="text-yellow-300">{sponsor.name.split(' ')[0]}</span>
              </h1>
              <p className="mt-2 text-lg text-white/80">
                {sponsor.companyName || "Brand Partner"}
              </p>
              <p className="mt-4 max-w-lg text-white/90">
                Manage your influencer campaigns and track creator submissions.
              </p>
              <div className="mt-6 flex gap-3">
                <Link href="/sponsor/create-campaign">
                  <Button className="rounded-full bg-white text-indigo-600 hover:bg-gray-100" data-testid="button-create-campaign">
                    + Create Campaign
                  </Button>
                </Link>
                <Link href="/sponsor/campaigns">
                  <Button variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10">
                    View Listings
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className={`rounded-full bg-gray-100 p-2 dark:bg-gray-800 ${stat.color}`}>
                        <stat.icon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-bold" data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}>{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaigns.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">No campaigns yet</p>
                    <Link href="/sponsor/create-campaign">
                      <Button className="mt-4 rounded-full" data-testid="button-create-first">
                        Create Your First Campaign
                      </Button>
                    </Link>
                  </div>
                ) : (
                  campaigns.slice(0, 5).map((campaign) => (
                    <div key={campaign.id} className="flex items-center gap-4 rounded-xl border p-4" data-testid={`campaign-${campaign.id}`}>
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center">
                        {campaign.brandLogo ? (
                          <img src={campaign.brandLogo} alt={campaign.brand} className="h-8 w-8 object-contain" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold">
                            {campaign.brand.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{campaign.title}</h4>
                        <p className="text-sm text-muted-foreground">{campaign.tier} • {campaign.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{formatINR(campaign.payAmount)}</p>
                        <span className="text-xs text-muted-foreground">
                          {campaign.totalSpots - campaign.spotsRemaining}/{campaign.totalSpots} filled
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      {showGuide && <QuickStartGuide userRole="sponsor" onComplete={completeGuide} />}
    </div>
  );
}
