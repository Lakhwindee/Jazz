import { SponsorSidebar } from "@/components/SponsorSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { api, formatINR, type ApiCampaign } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Instagram, Plus, Users, Clock, CheckCircle, Pause, ChevronDown, ChevronRight, FolderOpen, Folder } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CampaignGroup {
  title: string;
  brand: string | null;
  brandLogo: string | null;
  campaigns: ApiCampaign[];
  totalSpots: number;
  filledSpots: number;
  totalBudget: number;
  isActive: boolean;
}

export default function SponsorCampaigns() {
  const queryClient = useQueryClient();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { data: sponsor } = useQuery({
    queryKey: ["currentSponsor"],
    queryFn: api.getCurrentSponsor,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["sponsorCampaigns", sponsor?.id],
    queryFn: () => sponsor ? api.getSponsorCampaigns(sponsor.id) : [],
    enabled: !!sponsor,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.updateCampaignStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsorCampaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign status updated");
    },
  });

  const campaignGroups = useMemo(() => {
    const groups: Map<string, CampaignGroup> = new Map();
    
    campaigns.forEach(campaign => {
      const key = campaign.title;
      
      if (!groups.has(key)) {
        groups.set(key, {
          title: campaign.title,
          brand: campaign.brand,
          brandLogo: campaign.brandLogo,
          campaigns: [],
          totalSpots: 0,
          filledSpots: 0,
          totalBudget: 0,
          isActive: false,
        });
      }
      
      const group = groups.get(key)!;
      group.campaigns.push(campaign);
      group.totalSpots += campaign.totalSpots;
      group.filledSpots += (campaign.totalSpots - campaign.spotsRemaining);
      group.totalBudget += parseFloat(campaign.payAmount) * campaign.totalSpots;
      if (campaign.spotsRemaining > 0) {
        group.isActive = true;
      }
    });

    groups.forEach(group => {
      group.campaigns.sort((a, b) => {
        const tierA = parseInt(a.tier.replace(/\D/g, '')) || 0;
        const tierB = parseInt(b.tier.replace(/\D/g, '')) || 0;
        return tierA - tierB;
      });
    });

    return Array.from(groups.values());
  }, [campaigns]);

  const handleGroupOpenChange = (title: string, open: boolean) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (open) {
        next.add(title);
      } else {
        next.delete(title);
      }
      return next;
    });
  };

  const getStatusBadge = (campaign: ApiCampaign) => {
    if (campaign.spotsRemaining === 0) {
      return <Badge className="bg-gray-500"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
    }
    return <Badge className="bg-green-500"><Clock className="w-3 h-3 mr-1" /> Active</Badge>;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SponsorSidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        <div className="mx-auto max-w-6xl p-6">
          <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Campaigns</h1>
              <p className="text-muted-foreground">Manage your influencer campaigns</p>
            </div>
            <Link href="/sponsor/create-campaign">
              <Button className="rounded-full gap-2" data-testid="button-create">
                <Plus className="w-4 h-4" /> New Campaign
              </Button>
            </Link>
          </div>

          {campaignGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <Instagram className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No campaigns yet</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
                Create your first influencer campaign to start reaching creators.
              </p>
              <Link href="/sponsor/create-campaign">
                <Button className="rounded-full" data-testid="button-create-first">
                  Create Campaign
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {campaignGroups.map((group, i) => {
                const isExpanded = expandedGroups.has(group.title);
                
                return (
                  <motion.div
                    key={group.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Collapsible open={isExpanded} onOpenChange={(open) => handleGroupOpenChange(group.title, open)}>
                      <Card className={`overflow-hidden transition-all ${
                        group.isActive 
                          ? "ring-2 ring-green-500/50" 
                          : "opacity-80"
                      }`}>
                        <CollapsibleTrigger asChild>
                          <div 
                            className="flex items-center gap-4 p-4 cursor-pointer hover-elevate"
                            data-testid={`campaign-group-${group.title}`}
                          >
                            <div className={`h-14 w-14 rounded-md flex items-center justify-center ${
                              group.isActive 
                                ? "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20" 
                                : "bg-muted"
                            }`}>
                              {group.brandLogo ? (
                                <img src={group.brandLogo} alt={group.brand || "Brand"} className="max-h-10 max-w-[40px] object-contain" />
                              ) : (
                                isExpanded ? <FolderOpen className="h-6 w-6 text-muted-foreground" /> : <Folder className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-lg truncate">{group.title}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {group.campaigns.length} {group.campaigns.length === 1 ? 'tier' : 'tiers'}
                                </Badge>
                                {group.isActive ? (
                                  <Badge className="bg-green-500 text-xs">Active</Badge>
                                ) : (
                                  <Badge className="bg-gray-500 text-xs">Completed</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{group.brand || "Campaign"}</p>
                            </div>

                            <div className="hidden sm:flex items-center gap-6 text-sm">
                              <div className="text-center">
                                <p className="text-muted-foreground text-xs">Spots</p>
                                <p className="font-semibold">{group.filledSpots}/{group.totalSpots}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-muted-foreground text-xs">Budget</p>
                                <p className="font-semibold text-green-600">{formatINR(group.totalBudget.toString())}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="border-t bg-muted/30 p-4">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {group.campaigns.map((campaign) => (
                                <Card 
                                  key={campaign.id}
                                  className={`flex flex-col overflow-hidden transition-all ${
                                    campaign.spotsRemaining > 0 
                                      ? "border-green-500/30" 
                                      : "opacity-75"
                                  }`} 
                                  data-testid={`campaign-card-${campaign.id}`}
                                >
                                  <CardHeader className="pb-2 pt-3">
                                    <div className="flex items-center justify-between gap-2">
                                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                                        {campaign.tier}
                                      </Badge>
                                      {getStatusBadge(campaign)}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Instagram className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm text-muted-foreground">{campaign.type}</span>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="flex-1 text-sm text-muted-foreground py-2">
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        <span className="font-medium" data-testid={`spots-${campaign.id}`}>
                                          {campaign.totalSpots - campaign.spotsRemaining}/{campaign.totalSpots}
                                        </span>
                                      </div>
                                      <span className="text-xs">Min: {campaign.minFollowers.toLocaleString()} followers</span>
                                    </div>
                                  </CardContent>
                                  <CardFooter className="border-t bg-muted/20 p-3">
                                    <div className="flex w-full items-center justify-between gap-2">
                                      <div>
                                        <p className="text-xs text-muted-foreground">Per Creator</p>
                                        <p className="text-lg font-bold text-green-600" data-testid={`pay-${campaign.id}`}>{formatINR(campaign.payAmount)}</p>
                                      </div>
                                      <div className="flex gap-2">
                                        {campaign.spotsRemaining > 0 && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              statusMutation.mutate({ id: campaign.id, status: "paused" });
                                            }}
                                            data-testid={`pause-${campaign.id}`}
                                          >
                                            <Pause className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </CardFooter>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
