import { BarChart3, TrendingUp, Users, Wallet, Star } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { api, type ApiCampaign, type ApiUser, formatINR } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import heroBg from "@assets/generated_images/abstract_instagram-themed_3d_background.png";
import { QuickStartGuide, useQuickStartGuide } from "@/components/QuickStartGuide";

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: api.getCurrentUser,
  });

  const { showGuide, completeGuide } = useQuickStartGuide("creator");

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: api.getCampaigns,
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ["reservations", user?.id],
    queryFn: () => user ? api.getUserReservations(user.id) : [],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  const stats = [
    { label: "Followers", value: user.instagramFollowers ? user.instagramFollowers.toLocaleString() : "-", icon: Users, color: "text-blue-500" },
    { label: "Balance", value: formatINR(user.balance), icon: Wallet, color: "text-green-500" },
    { label: "Stars", value: `${user.stars || 0}/5`, icon: Star, color: "text-yellow-500" },
    { label: "Campaigns", value: reservations.length.toString(), icon: TrendingUp, color: "text-orange-500" },
  ];

  const featuredCampaigns = campaigns.slice(0, 2);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        <div className="mx-auto max-w-5xl p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 overflow-hidden rounded-3xl bg-black text-white shadow-xl relative"
          >
             <div className="absolute inset-0 opacity-40">
                <img src={heroBg} className="w-full h-full object-cover" />
             </div>
             <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
             
            <div className="relative z-10 p-8 md:p-10">
              <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">
                Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400">{user.name.split(' ')[0]}</span>
              </h1>
              <p className="mt-2 max-w-lg text-lg text-gray-300">
                You have {reservations.length} active campaigns and {campaigns.length} new opportunities waiting for you.
              </p>
              <div className="mt-6 flex gap-3">
                <Link href="/campaigns">
                    <div className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-100 cursor-pointer">
                    Find Campaigns
                    </div>
                </Link>
                <Link href="/earnings">
                    <div className="rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-semibold backdrop-blur-md transition hover:bg-white/20 cursor-pointer">
                    View Earnings
                    </div>
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
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Active Campaigns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {featuredCampaigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No campaigns available</p>
                ) : (
                  featuredCampaigns.map((campaign: ApiCampaign) => (
                    <div key={campaign.id} className="flex items-center gap-4 rounded-xl border p-4 transition hover:bg-muted/50" data-testid={`card-campaign-${campaign.id}`}>
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center">
                        {campaign.brandLogo ? (
                          <img src={campaign.brandLogo} alt={campaign.brand} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold">
                            {campaign.brand.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{campaign.title}</h4>
                        <p className="text-sm text-muted-foreground">{campaign.brand}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary" data-testid={`text-amount-${campaign.id}`}>{formatINR(campaign.payAmount)}</p>
                        <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                          {campaign.type}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="h-full bg-insta-gradient text-white">
              <CardContent className="flex h-full flex-col justify-between p-6">
                <div>
                  <h3 className="text-xl font-bold">Instagram Creator Tips</h3>
                  <p className="mt-2 text-sm text-white/90">
                    Reels with trending audio get 2x more engagement. Check out this week's top sounds.
                  </p>
                </div>
                <button className="mt-4 w-full rounded-lg bg-white/20 py-2 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/30">
                  View Trends
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      {showGuide && <QuickStartGuide userRole="creator" onComplete={completeGuide} />}
    </div>
  );
}
