import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Calendar, Users, IndianRupee, Clock, Sparkles, FileDown, Film, Smartphone, Image, LayoutGrid, Music, Video, Share2, Gift, Package, AlertTriangle } from "lucide-react";
import { formatINR, type ApiCampaign } from "@/lib/api";
import { format } from "date-fns";
import { useState, useEffect } from "react";

const PROMOTION_STYLE_LABELS: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  lyricals: { label: "Lyricals / Page Promotion", icon: Music, description: "Use provided content/audio only" },
  face_ad: { label: "Face on Camera", icon: Video, description: "Appear in video for the ad" },
  share_only: { label: "Direct Share", icon: Share2, description: "Share sponsor's provided file" },
};

const CONTENT_TYPE_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  reel: { label: "Reel", icon: Film },
  story: { label: "Story", icon: Smartphone },
  post: { label: "Post", icon: Image },
  carousel: { label: "Carousel", icon: LayoutGrid },
};

interface CampaignDetailsModalProps {
  campaign: ApiCampaign | null;
  isOpen: boolean;
  onClose: () => void;
  onReserve: (campaign: ApiCampaign) => void;
  isReserving: boolean;
}

export function CampaignDetailsModal({ campaign, isOpen, onClose, onReserve, isReserving }: CampaignDetailsModalProps) {
  const [hasDownloaded, setHasDownloaded] = useState(false);
  
  // Reset download state when campaign changes or modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasDownloaded(false);
    }
  }, [isOpen, campaign?.id]);
  
  if (!campaign) return null;

  const promotionStyle = campaign.promotionStyle ? PROMOTION_STYLE_LABELS[campaign.promotionStyle] : null;
  const deadlineDate = new Date(campaign.deadline);
  const isDeadlineSoon = deadlineDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
  const isProductCampaign = campaign.campaignType === "product";
  
  // Check if file download is required before reserving
  const requiresDownload = !!campaign.assetUrl;
  const canReserve = !requiresDownload || hasDownloaded;
  
  const handleDownload = () => {
    // Create a temporary link element to trigger direct download
    const link = document.createElement('a');
    link.href = campaign.assetUrl!;
    link.download = campaign.assetFileName || 'campaign-asset';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setHasDownloaded(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold">{campaign.title}</DialogTitle>
              <DialogDescription className="text-base mt-1">
                by <span className="font-semibold text-foreground">{campaign.brand}</span>
              </DialogDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {campaign.tier}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {isProductCampaign ? (
                <div className="flex flex-col items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/20 p-4">
                  <Gift className="h-5 w-5 text-purple-600 mb-1" />
                  <span className="text-xs text-muted-foreground">Reward</span>
                  <span className="text-lg font-bold text-purple-600" data-testid="modal-payment">
                    Free Product
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20 p-4">
                  <IndianRupee className="h-5 w-5 text-green-600 mb-1" />
                  <span className="text-xs text-muted-foreground">Payment</span>
                  <span className="text-lg font-bold text-green-600" data-testid="modal-payment">
                    {formatINR(campaign.payAmount)}
                  </span>
                </div>
              )}
              <div className="flex flex-col items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4">
                <Users className="h-5 w-5 text-blue-600 mb-1" />
                <span className="text-xs text-muted-foreground">Spots Left</span>
                <span className="text-lg font-bold text-blue-600" data-testid="modal-spots">
                  {campaign.spotsRemaining}/{campaign.totalSpots}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/20 p-4">
                <Sparkles className="h-5 w-5 text-purple-600 mb-1" />
                <span className="text-xs text-muted-foreground">Min Followers</span>
                <span className="text-lg font-bold text-purple-600">
                  {campaign.minFollowers >= 1000000 
                    ? `${(campaign.minFollowers / 1000000).toFixed(1)}M` 
                    : `${(campaign.minFollowers / 1000).toFixed(0)}K`}
                </span>
              </div>
              <div className={`flex flex-col items-center justify-center rounded-xl p-4 ${isDeadlineSoon ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-gray-50 dark:bg-gray-900/20'}`}>
                <Calendar className="h-5 w-5 text-orange-600 mb-1" />
                <span className="text-xs text-muted-foreground">Deadline</span>
                <span className={`text-lg font-bold ${isDeadlineSoon ? 'text-orange-600' : 'text-gray-600'}`}>
                  {format(deadlineDate, "MMM d")}
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Content Type</h3>
              <div className="flex flex-wrap gap-2">
                {(campaign.contentTypes || campaign.type.split(", ")).map((type: string) => {
                  const typeLower = type.toLowerCase().trim();
                  const contentType = CONTENT_TYPE_LABELS[typeLower];
                  const IconComponent = contentType?.icon || Film;
                  const label = contentType?.label || type;
                  return (
                    <Badge key={type} variant="outline" className="text-sm py-1.5 px-3">
                      <IconComponent className="h-4 w-4 mr-1.5" />
                      {label}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {promotionStyle && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Promotion Style</h3>
                  <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <promotionStyle.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{promotionStyle.label}</p>
                      <p className="text-sm text-muted-foreground">{promotionStyle.description}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {isProductCampaign && campaign.productName && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Product Details
                  </h3>
                  <div className="rounded-xl border bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4">
                    <div className="flex items-start gap-4">
                      {campaign.productImage && (
                        <img 
                          src={campaign.productImage} 
                          alt={campaign.productName}
                          className="w-20 h-20 rounded-lg object-cover border"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{campaign.productName}</p>
                        {campaign.productValue && (
                          <p className="text-sm text-muted-foreground">
                            Worth: {formatINR(campaign.productValue)}
                          </p>
                        )}
                        {campaign.productDescription && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {campaign.productDescription}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-purple-100 dark:bg-purple-800/30 rounded-lg text-xs text-purple-700 dark:text-purple-300">
                      You will receive this product for free after your content is approved
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Campaign Brief</h3>
              <p className="text-muted-foreground leading-relaxed" data-testid="modal-description">
                {campaign.description}
              </p>
            </div>

            {campaign.assetUrl && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileDown className="h-5 w-5" />
                    Download Content
                  </h3>
                  <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <Download className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{campaign.assetFileName || "Campaign Asset"}</p>
                          <p className="text-sm text-muted-foreground">Provided by sponsor</p>
                        </div>
                      </div>
                      <Button 
                        variant={hasDownloaded ? "outline" : "default"}
                        size="sm"
                        onClick={handleDownload}
                        className={!hasDownloaded ? "bg-primary animate-pulse" : ""}
                        data-testid="button-download-asset"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {hasDownloaded ? "Downloaded ✓" : "Download First"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-lg bg-muted/50 p-3">
              <Clock className="h-4 w-4" />
              <span>You have 48 hours to submit your work after reserving</span>
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t">
          {requiresDownload && !hasDownloaded && (
            <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Please download the campaign file first before reserving</span>
            </div>
          )}
          <div className="flex gap-3">
            <Button
              className="flex-1 rounded-full bg-insta-gradient hover:opacity-90"
              onClick={() => onReserve(campaign)}
              disabled={isReserving || campaign.spotsRemaining <= 0 || !canReserve}
              data-testid="button-confirm-reserve"
            >
              {isReserving ? "Reserving..." : campaign.spotsRemaining <= 0 ? "No Spots Available" : !canReserve ? "Download File First" : "Reserve This Campaign"}
            </Button>
            <Button variant="outline" className="rounded-full" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
