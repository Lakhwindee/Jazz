import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { api, ApiCategorySubscription } from "@/lib/api";
import { PROMOTION_CATEGORIES } from "@shared/schema";
import { TIERS, formatFollowers, getTierByFollowers } from "@shared/tiers";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  ShoppingBag,
  Users,
  CheckCircle,
  Loader2,
  Lock
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

export default function Groups() {
  const queryClient = useQueryClient();
  const [loadingGroup, setLoadingGroup] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: api.getCurrentUser,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["categorySubscriptions", user?.id],
    queryFn: () => api.getUserCategorySubscriptions(user!.id),
    enabled: !!user?.id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: api.getCategories,
  });

  const subscribeMutation = useMutation({
    mutationFn: ({ category, tier }: { category: string; tier: string }) =>
      api.subscribeToCategoryGroup(user!.id, category, tier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorySubscriptions"] });
      toast.success("Group joined successfully!");
      setLoadingGroup(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setLoadingGroup(null);
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: ({ category, tier }: { category: string; tier: string }) =>
      api.unsubscribeFromCategoryGroup(user!.id, category, tier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorySubscriptions"] });
      toast.success("Left group successfully!");
      setLoadingGroup(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setLoadingGroup(null);
    },
  });

  const getUserTierId = (): number => {
    if (!user?.tier) return 1;
    const tier = TIERS.find(t => t.name === user.tier);
    return tier?.id || 1;
  };

  const canJoinTier = (tierId: number): boolean => {
    const userTierId = getUserTierId();
    return tierId <= userTierId;
  };

  const isSubscribed = (category: string, tier: string): boolean => {
    return subscriptions.some(
      (sub: ApiCategorySubscription) => sub.category === category && sub.tier === tier
    );
  };

  const isInstagramConnected = !!user?.instagramUsername;

  const handleToggleSubscription = (category: string, tierName: string, tierId: number) => {
    const groupKey = `${category}-${tierName}`;
    
    if (isSubscribed(category, tierName)) {
      setLoadingGroup(groupKey);
      unsubscribeMutation.mutate({ category, tier: tierName });
    } else {
      if (!isInstagramConnected) {
        toast.error("Please connect your Instagram account first from Profile page");
        return;
      }
      if (!canJoinTier(tierId)) {
        const tier = TIERS.find(t => t.id === tierId);
        toast.error(`You need ${tier ? formatFollowers(tier.minFollowers) : tierName}+ followers to join this group`);
        return;
      }
      setLoadingGroup(groupKey);
      subscribeMutation.mutate({ category, tier: tierName });
    }
  };

  const getSubscriptionCount = (category: string): number => {
    return subscriptions.filter((sub: ApiCategorySubscription) => sub.category === category).length;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Campaign Groups</h1>
            <p className="mt-2 text-muted-foreground">
              Join groups for your category and tier to see matching campaigns
            </p>
          </motion.div>

          <div className="mb-6 flex items-center gap-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4">
            <Users className="h-8 w-8 text-purple-500" />
            <div>
              <p className="font-medium">You have joined {subscriptions.length} groups</p>
              <p className="text-sm text-muted-foreground">
                You will be notified when new campaigns are available
              </p>
            </div>
          </div>

          {user?.tier && (
            <div className="mb-6 rounded-lg border-2 border-green-500/50 bg-green-50 dark:bg-green-950/30 p-4" data-testid="tier-info-banner">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-white font-bold">
                  {getUserTierId()}
                </div>
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-400">
                    Your Current Tier: {user.tier}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                    You can reserve campaigns from your tier and all tiers below! This means you have access to campaigns from Tier 1 to {user.tier}.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {PROMOTION_CATEGORIES.map((category, index) => {
              const Icon = iconMap[category.icon] || Music;
              const subCount = getSubscriptionCount(category.id);
              
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Accordion type="single" collapsible>
                    <AccordionItem value={category.id} className="border rounded-lg overflow-hidden">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50" data-testid={`accordion-${category.id}`}>
                        <div className="flex items-center gap-3 text-left">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{category.name}</span>
                              {subCount > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {subCount} joined
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                          {TIERS.map((tier) => {
                            const subscribed = isSubscribed(category.id, tier.name);
                            const groupKey = `${category.id}-${tier.name}`;
                            const isLoading = loadingGroup === groupKey;
                            const eligible = canJoinTier(tier.id);
                            
                            return (
                              <Card 
                                key={tier.name} 
                                className={`transition-all ${subscribed ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : ''} ${!eligible && !subscribed ? 'opacity-60' : ''}`}
                                data-testid={`card-group-${category.id}-${tier.id}`}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{tier.name}</span>
                                        {subscribed && (
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                        )}
                                        {!eligible && !subscribed && (
                                          <Lock className="h-3 w-3 text-muted-foreground" />
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {formatFollowers(tier.minFollowers)} - {formatFollowers(tier.maxFollowers)} followers
                                      </p>
                                    </div>
                                    {eligible || subscribed ? (
                                      <Button
                                        size="sm"
                                        variant={subscribed ? "outline" : "default"}
                                        disabled={isLoading}
                                        onClick={() => handleToggleSubscription(category.id, tier.name, tier.id)}
                                        data-testid={`button-toggle-${category.id}-${tier.id}`}
                                      >
                                        {isLoading ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : subscribed ? (
                                          "Leave"
                                        ) : (
                                          "Join"
                                        )}
                                      </Button>
                                    ) : (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span>
                                            <Button
                                              size="sm"
                                              variant="secondary"
                                              disabled
                                              data-testid={`button-locked-${category.id}-${tier.id}`}
                                            >
                                              <Lock className="h-3 w-3 mr-1" />
                                              Locked
                                            </Button>
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Requires {formatFollowers(tier.minFollowers)}+ followers</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
