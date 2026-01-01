import { Sidebar } from "@/components/Sidebar";
import { CampaignDetailsModal } from "@/components/CampaignDetailsModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { api, type ApiCampaign, type ApiReservation, type ApiCategorySubscription, formatINR } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Instagram, Search, CheckCircle, Clock, AlertCircle, ArrowLeft, XCircle, Lock, Star } from "lucide-react";
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { PROMOTION_CATEGORIES } from "@shared/schema";
import { TIERS } from "@shared/tiers";
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

export default function CategoryCampaignsPage() {
  const params = useParams();
  const categoryId = params.categoryId as string;
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  
  // Submit functionality moved to MyCampaigns page
  const [selectedCampaign, setSelectedCampaign] = useState<ApiCampaign | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const category = PROMOTION_CATEGORIES.find(c => c.id === categoryId);
  const Icon = category ? iconMap[category.icon] || Music : Music;

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: api.getCurrentUser,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["categorySubscriptions", user?.id],
    queryFn: () => api.getUserCategorySubscriptions(user!.id),
    enabled: !!user?.id,
  });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaignsByCategory", categoryId],
    queryFn: () => api.getCampaignsByCategory(categoryId),
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ["reservations", user?.id],
    queryFn: () => user ? api.getUserReservations(user.id) : [],
    enabled: !!user,
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: () => api.getSubscription(user!.id),
    enabled: !!user?.id,
  });

  const hasActiveSubscription = subscription?.isActive;

  const joinedTiers = subscriptions
    .filter((s: ApiCategorySubscription) => s.category === categoryId)
    .map((s: ApiCategorySubscription) => s.tier);

  const getMaxJoinedTierNumber = (): number => {
    let maxTier = 0;
    joinedTiers.forEach((tierName: string) => {
      const tier = TIERS.find(t => t.name === tierName);
      if (tier && tier.id > maxTier) {
        maxTier = tier.id;
      }
    });
    return maxTier;
  };

  const maxJoinedTier = getMaxJoinedTierNumber();
  const maxTierName = TIERS.find(t => t.id === maxJoinedTier)?.name || "Tier 1";

  const filteredCampaigns = campaigns.filter((c: ApiCampaign) => {
    // Don't show campaigns with 0 spots remaining
    if (c.spotsRemaining <= 0) return false;
    
    const matchesSearch = searchTerm === "" || 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const campaignTier = TIERS.find(t => t.name === c.tier);
    const matchesTier = campaignTier ? campaignTier.id <= maxJoinedTier : false;
    return matchesSearch && matchesTier;
  });

  const reserveMutation = useMutation({
    mutationFn: ({ campaignId }: { campaignId: number }) => {
      if (!user) throw new Error("User not found");
      return api.reserveCampaign(user.id, campaignId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaignsByCategory"] });
      setIsDetailsModalOpen(false);
      setSelectedCampaign(null);
      toast.success("Campaign reserved! Submit within 48 hours.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not reserve campaign");
    },
  });

  const handleOpenDetails = (campaign: ApiCampaign) => {
    setSelectedCampaign(campaign);
    setIsDetailsModalOpen(true);
  };

  const handleReserveFromModal = (campaign: ApiCampaign) => {
    reserveMutation.mutate({ campaignId: campaign.id });
  };

  const getReservationForCampaign = (campaignId: number): ApiReservation | undefined => {
    return reservations.find(r => r.campaignId === campaignId);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'reserved': return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1"/> Reserved</Badge>;
      case 'submitted': return <Badge className="bg-blue-500 hover:bg-blue-600"><CheckCircle className="w-3 h-3 mr-1"/> Under Review</Badge>;
      case 'approved': return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1"/> Approved</Badge>;
      case 'rejected': return <Badge className="bg-red-500 hover:bg-red-600"><AlertCircle className="w-3 h-3 mr-1"/> Rejected</Badge>;
      default: return null;
    }
  };

  if (!category) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-6">
          <p>Category not found</p>
        </main>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        <div className="mx-auto max-w-6xl p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Button 
              variant="ghost" 
              onClick={() => navigate("/campaigns")}
              className="mb-4 -ml-2"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>

            <div className="flex items-center gap-4 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">{category.name}</h1>
                <p className="text-muted-foreground">{category.description}</p>
              </div>
            </div>

            {subscriptions.length > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-sm px-3 py-1">
                  Tier 1 - {maxTierName} campaigns
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {filteredCampaigns.length} campaigns available
                </span>
              </div>
            )}
          </motion.div>

          <div className="mb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search campaign or brand..."
                className="pl-9 rounded-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </div>

          {isLoading || !subscriptions.length ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">No campaigns available for your tier in this category right now</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns.map((campaign: ApiCampaign, i: number) => {
                const reservation = getReservationForCampaign(campaign.id);
                const status = reservation?.status || 'available';
                const isAvailable = status === 'available';
                
                return (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card 
                      className={`flex h-full flex-col overflow-hidden transition-all hover:shadow-lg relative ${campaign.isPromotional ? 'border-2 border-yellow-500 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : ''} ${!isAvailable ? 'border-primary/50' : 'hover:border-primary/20'} ${!hasActiveSubscription && isAvailable ? 'opacity-75' : ''}`} 
                      data-testid={`card-campaign-${campaign.id}`}
                    >
                      {!hasActiveSubscription && isAvailable && (
                        <div className="absolute top-2 left-2 z-10">
                          <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-md">
                            <Lock className="h-3 w-3" />
                            <span>Pro Required</span>
                          </div>
                        </div>
                      )}
                      <div className={`h-28 w-full p-4 flex items-center justify-center relative ${campaign.isPromotional ? 'bg-gradient-to-br from-yellow-200 via-amber-100 to-yellow-300 dark:from-yellow-800 dark:via-amber-700 dark:to-yellow-600' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
                        <img src={campaign.brandLogo} alt={campaign.brand} className="max-h-14 max-w-[130px] object-contain mix-blend-multiply" />
                        {!hasActiveSubscription && isAvailable && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <XCircle className="h-12 w-12 text-red-500 drop-shadow-lg" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          {getStatusBadge(status)}
                        </div>
                      </div>
                      <CardHeader className="pb-2 pt-3">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1 flex-wrap">
                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 text-xs">
                              {campaign.tier}
                            </Badge>
                            {campaign.isPromotional && (
                              <Badge className="bg-yellow-500 text-white text-xs">
                                <Star className="h-3 w-3 mr-1" /> Promotional
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Instagram className="h-3 w-3" />
                            {campaign.type}
                          </span>
                        </div>
                        <h3 className="mt-2 text-lg font-bold leading-tight">{campaign.title}</h3>
                        <p className="text-sm font-semibold text-muted-foreground">{campaign.brand}</p>
                      </CardHeader>
                      <CardContent className="flex-1 text-sm text-muted-foreground py-2">
                        <p className="line-clamp-2">{campaign.description}</p>
                        <div className="mt-3 flex items-center gap-2 text-xs">
                          <span className="font-medium text-foreground">{campaign.spotsRemaining} spots</span>
                          <span>•</span>
                          <span>Due {new Date(campaign.deadline).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t bg-muted/20 p-3 flex flex-col gap-2">
                        <div className="flex w-full items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">{campaign.isPromotional ? "Reward" : "Payout"}</p>
                            {campaign.isPromotional ? (
                              <p className="text-lg font-bold text-yellow-500 flex items-center gap-1">
                                <Star className="h-5 w-5 fill-yellow-500" /> {campaign.starReward} Stars
                              </p>
                            ) : (
                              <p className="text-lg font-bold text-green-600">{formatINR(campaign.payAmount)}</p>
                            )}
                          </div>

                          {status === 'available' && (
                            hasActiveSubscription ? (
                              <Button 
                                onClick={() => handleOpenDetails(campaign)}
                                size="sm"
                                className="rounded-full bg-insta-gradient hover:opacity-90 text-white border-0"
                                disabled={campaign.spotsRemaining <= 0}
                                data-testid={`button-reserve-${campaign.id}`}
                              >
                                {campaign.spotsRemaining <= 0 ? "Full" : "Reserve"}
                              </Button>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="sm"
                                    className="rounded-full cursor-not-allowed opacity-60"
                                    variant="secondary"
                                    disabled
                                    data-testid={`button-reserve-locked-${campaign.id}`}
                                  >
                                    Reserve
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-red-500 text-white border-red-500">
                                  <p>Subscribe to Pro plan to reserve campaigns</p>
                                </TooltipContent>
                              </Tooltip>
                            )
                          )}

                          {status === 'reserved' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full text-yellow-600 border-yellow-300 cursor-not-allowed gap-1"
                                  disabled
                                  data-testid={`button-reserved-${campaign.id}`}
                                >
                                  <XCircle className="w-3 h-3" /> Reserved
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-yellow-500 text-white border-yellow-500">
                                <p>Go to My Campaigns to submit</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          
                          {status === 'submitted' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-blue-600 border-blue-300 cursor-not-allowed"
                                  disabled
                                >
                                  Under Review
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Your submission is being reviewed</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {status === 'approved' && (
                            <Button disabled size="sm" variant="outline" className="text-green-600 border-green-200 bg-green-50">
                              Paid
                            </Button>
                          )}
                        </div>
                        
                        {status === 'reserved' && reservation && (
                          <p className="text-[10px] text-yellow-600 w-full text-center">
                            Expires {new Date(reservation.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <CampaignDetailsModal
        campaign={selectedCampaign}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedCampaign(null);
        }}
        onReserve={handleReserveFromModal}
        isReserving={reserveMutation.isPending}
      />
    </div>
    </TooltipProvider>
  );
}
