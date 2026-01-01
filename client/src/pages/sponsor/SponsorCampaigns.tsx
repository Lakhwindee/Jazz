import { SponsorSidebar } from "@/components/SponsorSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { api, formatINR, type ApiCampaign } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Instagram, Plus, Users, Clock, CheckCircle, Pause, Play } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function SponsorCampaigns() {
  const queryClient = useQueryClient();

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
          <div className="mb-8 flex items-center justify-between">
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

          {campaigns.length === 0 ? (
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign, i) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card 
                    className={`flex h-full flex-col overflow-hidden transition-all ${
                      campaign.spotsRemaining > 0 
                        ? "ring-2 ring-green-500 shadow-green-100 dark:shadow-green-900/20" 
                        : "opacity-75"
                    }`} 
                    data-testid={`campaign-card-${campaign.id}`}
                  >
                    <div className={`h-24 w-full p-4 flex items-center justify-center relative ${
                      campaign.spotsRemaining > 0 
                        ? "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20" 
                        : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700"
                    }`}>
                      {campaign.brandLogo && (
                        <img src={campaign.brandLogo} alt={campaign.brand} className="max-h-12 max-w-[120px] object-contain" />
                      )}
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(campaign)}
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          {campaign.tier}
                        </Badge>
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Instagram className="h-3 w-3" />
                          {campaign.type}
                        </span>
                      </div>
                      <h3 className="mt-2 text-lg font-bold leading-tight">{campaign.title}</h3>
                      <p className="text-sm text-muted-foreground">{campaign.brand}</p>
                    </CardHeader>
                    <CardContent className="flex-1 text-sm text-muted-foreground">
                      <p className="line-clamp-2">{campaign.description}</p>
                      <div className="mt-4 flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span className="font-medium" data-testid={`spots-${campaign.id}`}>
                            {campaign.totalSpots - campaign.spotsRemaining}/{campaign.totalSpots}
                          </span>
                        </div>
                        <span className="text-xs">Due {new Date(campaign.deadline).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/20 p-4">
                      <div className="flex w-full items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Per Creator</p>
                          <p className="text-lg font-bold text-green-600" data-testid={`pay-${campaign.id}`}>{formatINR(campaign.payAmount)}</p>
                        </div>
                        <div className="flex gap-2">
                          {campaign.spotsRemaining > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => statusMutation.mutate({ id: campaign.id, status: "paused" })}
                              data-testid={`pause-${campaign.id}`}
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
