import { Sidebar } from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, type ApiCategorySubscription, type ApiCampaign, type ApiReservation, formatINR } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Users, ChevronRight, X, Lock, Clock, Building2, Gift, Globe, Star } from "lucide-react";
import { useLocation } from "wouter";
import { PROMOTION_CATEGORIES } from "@shared/schema";
import { TIERS, formatFollowers } from "@shared/tiers";
import { COUNTRIES, getCountryByCode } from "@shared/countries";
import { 
  Music, 
  Heart, 
  Smartphone, 
  Utensils, 
  Gamepad2, 
  Dumbbell, 
  GraduationCap, 
  Plane, 
  Wallet, 
  ShoppingBag 
} from "lucide-react";
import { useState, useMemo } from "react";

const iconMap: Record<string, React.ElementType> = {
  music: Music,
  heart: Heart,
  smartphone: Smartphone,
  utensils: Utensils,
  "gamepad-2": Gamepad2,
  dumbbell: Dumbbell,
  "graduation-cap": GraduationCap,
  plane: Plane,
  wallet: Wallet,
  "shopping-bag": ShoppingBag,
};

export default function Campaigns() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("my-campaigns");
  const [countryFilter, setCountryFilter] = useState<string>("");

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: api.getCurrentUser,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["categorySubscriptions", user?.id],
    queryFn: () => api.getUserCategorySubscriptions(user!.id),
    enabled: !!user?.id,
  });

  const { data: allCampaigns = [] } = useQuery({
    queryKey: ["allCampaigns", countryFilter],
    queryFn: () => api.getCampaigns(countryFilter && countryFilter !== "all" ? countryFilter : undefined),
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ["reservations", user?.id],
    queryFn: () => user ? api.getUserReservations(user.id) : [],
    enabled: !!user?.id,
  });

  const isAlreadyReserved = (campaignId: number): boolean => {
    return reservations.some((r: ApiReservation) => r.campaignId === campaignId && r.status !== "expired");
  };

  const joinedCategories = Array.from(new Set(subscriptions.map((s: ApiCategorySubscription) => s.category)));

  const getCategoryDetails = (categoryId: string) => {
    return PROMOTION_CATEGORIES.find(c => c.id === categoryId);
  };

  const getJoinedTiersForCategory = (categoryId: string): string[] => {
    return subscriptions
      .filter((s: ApiCategorySubscription) => s.category === categoryId)
      .map((s: ApiCategorySubscription) => s.tier);
  };

  const getMaxTierForCategory = (categoryId: string): string => {
    const tiers = getJoinedTiersForCategory(categoryId);
    let maxTierId = 0;
    let maxTierName = "";
    tiers.forEach(tierName => {
      const tier = TIERS.find(t => t.name === tierName);
      if (tier && tier.id > maxTierId) {
        maxTierId = tier.id;
        maxTierName = tierName;
      }
    });
    return maxTierName;
  };

  const getUserTierId = (): number => {
    if (!user?.tier) return 1;
    const tier = TIERS.find(t => t.name === user.tier);
    return tier?.id || 1;
  };

  const getLowestCampaignTierId = (tierString: string): number => {
    // Campaign tier can be comma-separated like "Tier 3,Tier 4,Tier 5"
    // Use LOWEST tier to determine minimum eligibility
    const tierNames = tierString.split(",").map(t => t.trim());
    let lowestId = 20; // Start with highest possible
    tierNames.forEach(name => {
      const tier = TIERS.find(t => t.name === name);
      if (tier && tier.id < lowestId) {
        lowestId = tier.id;
      }
    });
    return lowestId;
  };

  const isCampaignLocked = (campaign: ApiCampaign): boolean => {
    const userTierId = getUserTierId();
    // Campaign locked if user's tier is LOWER than campaign's lowest tier
    // (Higher tier creators can always reserve lower tier campaigns)
    const lowestCampaignTierId = getLowestCampaignTierId(campaign.tier);
    return lowestCampaignTierId > userTierId;
  };

  const activeCampaigns = allCampaigns.filter((c: ApiCampaign) => c.status === "active" && c.spotsRemaining > 0);

  // Group campaigns by base title (removing tier suffix)
  const getBaseTitle = (title: string) => {
    return title.replace(/\s*\(Tier\s*\d+\)\s*$/i, '').trim();
  };

  interface CampaignGroup {
    title: string;
    brand: string;
    brandLogo: string;
    campaigns: ApiCampaign[];
    totalSpots: number;
    deadline: string;
    description: string;
    campaignType: string;
  }

  const campaignGroups = useMemo(() => {
    const groups: Map<string, CampaignGroup> = new Map();
    
    activeCampaigns.forEach((campaign: ApiCampaign) => {
      const baseTitle = getBaseTitle(campaign.title);
      
      if (!groups.has(baseTitle)) {
        groups.set(baseTitle, {
          title: baseTitle,
          brand: campaign.brand,
          brandLogo: campaign.brandLogo,
          campaigns: [],
          totalSpots: 0,
          deadline: campaign.deadline,
          description: campaign.description,
          campaignType: campaign.campaignType || "cash",
        });
      }
      
      const group = groups.get(baseTitle)!;
      group.campaigns.push(campaign);
      group.totalSpots += campaign.spotsRemaining;
    });

    // Sort campaigns within each group by tier number
    groups.forEach(group => {
      group.campaigns.sort((a, b) => {
        const tierA = parseInt(a.tier.replace(/\D/g, '')) || 0;
        const tierB = parseInt(b.tier.replace(/\D/g, '')) || 0;
        return tierA - tierB;
      });
    });

    return Array.from(groups.values());
  }, [activeCampaigns]);

  // Find the best matching campaign for user's tier in a group
  const getBestCampaignForUser = (group: CampaignGroup): ApiCampaign | null => {
    const userTierId = getUserTierId();
    // Find campaigns user can access (user tier >= campaign tier)
    const accessibleCampaigns = group.campaigns.filter(c => {
      const campaignTierId = getLowestCampaignTierId(c.tier);
      return campaignTierId <= userTierId;
    });
    // Return the highest tier campaign user can access
    if (accessibleCampaigns.length === 0) return null;
    return accessibleCampaigns[accessibleCampaigns.length - 1];
  };

  // Check if any campaign in group is reserved
  const isAnyReservedInGroup = (group: CampaignGroup): boolean => {
    return group.campaigns.some(c => isAlreadyReserved(c.id));
  };

  // Check if all campaigns in group are locked for user
  const isGroupLocked = (group: CampaignGroup): boolean => {
    return group.campaigns.every(c => isCampaignLocked(c));
  };

  // Get accessible campaigns for user in group
  const getAccessibleCampaigns = (group: CampaignGroup): ApiCampaign[] => {
    return group.campaigns.filter(c => !isCampaignLocked(c));
  };

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="mx-auto max-w-5xl p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Campaigns</h1>
                  <p className="text-muted-foreground">Browse and discover campaigns</p>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={countryFilter}
                    onValueChange={setCountryFilter}
                  >
                    <SelectTrigger className="w-[200px]" data-testid="select-country-filter">
                      <SelectValue placeholder="All Countries" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="all">All Countries</SelectItem>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {countryFilter && countryFilter !== "all" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCountryFilter("")}
                      data-testid="button-clear-filter"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="my-campaigns" data-testid="tab-my-campaigns">My Campaigns</TabsTrigger>
                <TabsTrigger value="all-campaigns" data-testid="tab-all-campaigns">All Campaigns</TabsTrigger>
              </TabsList>

              <TabsContent value="my-campaigns">
                {joinedCategories.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <div className="mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-6">
                      <Users className="h-12 w-12 text-purple-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">No groups joined yet</h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      First go to the Groups page and join groups for your category and tier, then campaigns will appear here
                    </p>
                    <Button 
                      onClick={() => navigate('/groups')}
                      className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      data-testid="button-go-to-groups"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Join Groups
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    <div className="mb-6 flex items-center gap-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4">
                      <Users className="h-8 w-8 text-purple-500" />
                      <div>
                        <p className="font-medium">{joinedCategories.length} categories have campaigns available</p>
                        <p className="text-sm text-muted-foreground">
                          Click on a category to view campaigns
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {joinedCategories.map((categoryId, index) => {
                        const category = getCategoryDetails(categoryId);
                        if (!category) return null;
                        
                        const Icon = iconMap[category.icon] || Music;
                        const maxTier = getMaxTierForCategory(categoryId);
                        
                        return (
                          <motion.div
                            key={categoryId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card 
                              className="cursor-pointer transition-all hover:shadow-lg hover:border-purple-300 hover:scale-[1.02]"
                              onClick={() => navigate(`/campaigns/${categoryId}`)}
                              data-testid={`card-category-${categoryId}`}
                            >
                              <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                                      <Icon className="h-7 w-7" />
                                    </div>
                                    <div>
                                      <h3 className="font-bold text-lg">{category.name}</h3>
                                      <p className="text-sm text-muted-foreground line-clamp-1">{category.description}</p>
                                      <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700 text-xs">
                                        Tier 1 - {maxTier}
                                      </Badge>
                                    </div>
                                  </div>
                                  <ChevronRight className="h-6 w-6 text-muted-foreground" />
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="all-campaigns">
                {user?.instagramUsername && user?.tier ? (
                  <div className="mb-6 flex items-center gap-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4">
                    <Lock className="h-8 w-8 text-amber-500" />
                    <div>
                      <p className="font-medium">Your tier: {user.tier} ({formatFollowers(TIERS.find(t => t.name === user.tier)?.minFollowers || 500)}-{formatFollowers(TIERS.find(t => t.name === user.tier)?.maxFollowers || 1000)} followers)</p>
                      <p className="text-sm text-muted-foreground">
                        Campaigns above your tier will show a red cross on hover
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 flex items-center gap-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4">
                    <Lock className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">Connect your Instagram to see your tier</p>
                      <p className="text-sm text-muted-foreground">
                        Go to Profile to connect your Instagram account
                      </p>
                    </div>
                  </div>
                )}

                {campaignGroups.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <div className="mb-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-6">
                      <Building2 className="h-12 w-12 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">No campaigns available</h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      Check back later for new campaigns from brands
                    </p>
                  </motion.div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {campaignGroups.map((group, index: number) => {
                      const isLocked = isGroupLocked(group);
                      const isReserved = isAnyReservedInGroup(group);
                      const accessibleCampaigns = getAccessibleCampaigns(group);
                      const bestCampaign = getBestCampaignForUser(group);
                      const lowestTier = group.campaigns[0];
                      const lowestTierInfo = TIERS.find(t => t.name === lowestTier?.tier);
                      
                      // Check if campaigns are promotional (star-based)
                      const hasPromotional = group.campaigns.some(c => c.isPromotional);
                      const allPromotional = group.campaigns.every(c => c.isPromotional);
                      
                      // Show payment range if multiple tiers
                      const payments = group.campaigns.map(c => parseFloat(c.payAmount));
                      const minPay = Math.min(...payments);
                      const maxPay = Math.max(...payments);
                      const paymentDisplay = minPay === maxPay 
                        ? formatINR(minPay.toString()) 
                        : `${formatINR(minPay.toString())} - ${formatINR(maxPay.toString())}`;
                      
                      // Star rewards for promotional campaigns
                      const starRewards = group.campaigns.filter(c => c.isPromotional).map(c => c.starReward || 1);
                      const minStars = starRewards.length > 0 ? Math.min(...starRewards) : 0;
                      const maxStars = starRewards.length > 0 ? Math.max(...starRewards) : 0;
                      const starDisplay = minStars === maxStars 
                        ? `${minStars} Star${minStars !== 1 ? 's' : ''}` 
                        : `${minStars}-${maxStars} Stars`;
                      
                      return (
                        <motion.div
                          key={group.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          {isLocked ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="relative group cursor-not-allowed" data-testid={`card-campaign-locked-${group.title}`}>
                                  <Card className="transition-all">
                                    <CardContent className="p-5">
                                      <div className="flex items-start gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shrink-0 overflow-hidden">
                                          {group.brandLogo ? (
                                            <img src={group.brandLogo} alt={group.brand} className="h-full w-full object-cover" />
                                          ) : (
                                            <Building2 className="h-7 w-7" />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h3 className="font-bold text-lg truncate">{group.title}</h3>
                                          <p className="text-sm text-muted-foreground truncate">{group.brand}</p>
                                          <div className="flex flex-wrap gap-2 mt-2">
                                            {group.campaignType === "product" ? (
                                              <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs gap-1">
                                                <Gift className="h-3 w-3" />
                                                Free Product
                                              </Badge>
                                            ) : allPromotional ? (
                                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs gap-1">
                                                <Star className="h-3 w-3" />
                                                {starDisplay}
                                              </Badge>
                                            ) : (
                                              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                                {paymentDisplay}
                                              </Badge>
                                            )}
                                            <Badge variant="outline" className="text-xs">
                                              {group.campaigns.length} {group.campaigns.length === 1 ? 'tier' : 'tiers'}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            <span>{new Date(group.deadline).toLocaleDateString()}</span>
                                            <span className="ml-2">{group.totalSpots} spots left</span>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="bg-red-500 rounded-full p-4 shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-200">
                                      <X className="h-10 w-10 text-white stroke-[3]" />
                                    </div>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-red-500 text-white border-red-500">
                                <p>Requires {lowestTierInfo ? formatFollowers(lowestTierInfo.minFollowers) : lowestTier?.tier}+ followers</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : isReserved ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="relative group cursor-not-allowed" data-testid={`card-campaign-reserved-${group.title}`}>
                                  <Card className="transition-all border-green-300">
                                    <CardContent className="p-5">
                                      <div className="flex items-start gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shrink-0 overflow-hidden">
                                          {group.brandLogo ? (
                                            <img src={group.brandLogo} alt={group.brand} className="h-full w-full object-cover" />
                                          ) : (
                                            <Building2 className="h-7 w-7" />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h3 className="font-bold text-lg truncate">{group.title}</h3>
                                          <p className="text-sm text-muted-foreground truncate">{group.brand}</p>
                                          <div className="flex flex-wrap gap-2 mt-2">
                                            {group.campaignType === "product" ? (
                                              <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs gap-1">
                                                <Gift className="h-3 w-3" />
                                                Free Product
                                              </Badge>
                                            ) : allPromotional ? (
                                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs gap-1">
                                                <Star className="h-3 w-3" />
                                                {starDisplay}
                                              </Badge>
                                            ) : (
                                              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                                {paymentDisplay}
                                              </Badge>
                                            )}
                                            <Badge variant="outline" className="text-xs">
                                              {group.campaigns.length} {group.campaigns.length === 1 ? 'tier' : 'tiers'}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            <span>{new Date(group.deadline).toLocaleDateString()}</span>
                                            <span className="ml-2">{group.totalSpots} spots left</span>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 rounded-lg flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="bg-red-500 rounded-full p-3 shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-200 mb-2">
                                      <X className="h-8 w-8 text-white stroke-[3]" />
                                    </div>
                                    <span className="text-white font-bold text-sm bg-red-500 px-3 py-1 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-200 delay-75">
                                      Already Reserved
                                    </span>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-green-500 text-white border-green-500">
                                <p>You've already reserved this campaign</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Card 
                              className="cursor-pointer transition-all hover:shadow-lg hover:border-purple-300 hover:scale-[1.02]"
                              data-testid={`card-campaign-${group.title}`}
                              onClick={() => bestCampaign && navigate(`/campaigns/${bestCampaign.id}`)}
                            >
                              <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shrink-0 overflow-hidden">
                                    {group.brandLogo ? (
                                      <img src={group.brandLogo} alt={group.brand} className="h-full w-full object-cover" />
                                    ) : (
                                      <Building2 className="h-7 w-7" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg truncate">{group.title}</h3>
                                    <p className="text-sm text-muted-foreground truncate">{group.brand}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {group.campaignType === "product" ? (
                                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs gap-1">
                                          <Gift className="h-3 w-3" />
                                          Free Product
                                        </Badge>
                                      ) : bestCampaign?.isPromotional ? (
                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs gap-1">
                                          <Star className="h-3 w-3" />
                                          {bestCampaign.starReward || 1} Star{(bestCampaign.starReward || 1) > 1 ? 's' : ''}
                                        </Badge>
                                      ) : allPromotional ? (
                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs gap-1">
                                          <Star className="h-3 w-3" />
                                          {starDisplay}
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                          {bestCampaign ? formatINR(bestCampaign.payAmount) : paymentDisplay}
                                        </Badge>
                                      )}
                                      {group.campaigns.length > 1 && (
                                        <Badge variant="outline" className="text-xs">
                                          {accessibleCampaigns.length} of {group.campaigns.length} tiers available
                                        </Badge>
                                      )}
                                      {bestCampaign && (
                                        <Badge variant="outline" className="text-xs bg-purple-100 dark:bg-purple-900/30">
                                          {bestCampaign.tier}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      <span>{new Date(group.deadline).toLocaleDateString()}</span>
                                      <span className="ml-2">{group.totalSpots} spots left</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
