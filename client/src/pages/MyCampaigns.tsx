import { Sidebar } from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api, type ApiCampaign, type ApiReservation, formatINR } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Instagram, Clock, Upload, CheckCircle, AlertCircle, LayoutList, Timer, Download, X, FolderOpen, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("EXPIRED");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const hh = hours.toString().padStart(2, '0');
      const mm = minutes.toString().padStart(2, '0');
      const ss = seconds.toString().padStart(2, '0');

      setTimeLeft(`${hh}:${mm}:${ss}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="flex items-center gap-2 text-red-600 font-bold text-lg">
      <Timer className="h-5 w-5" />
      <span className="font-mono tracking-wider">{timeLeft}</span>
    </div>
  );
}

interface GroupedReservations {
  title: string;
  brand: string;
  brandLogo?: string | null;
  reservations: (ApiReservation & { campaign: ApiCampaign })[];
  totalPayout: number;
  tiers: string[];
}

export default function MyCampaigns() {
  const queryClient = useQueryClient();
  const [submissionData, setSubmissionData] = useState({
    link: "",
    clipUrl: ""
  });
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: api.getCurrentUser,
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ["reservations", user?.id],
    queryFn: () => user ? api.getUserReservations(user.id) : [],
    enabled: !!user,
  });

  const groupedReservations = useMemo(() => {
    const groups: Record<string, GroupedReservations> = {};
    
    // Function to extract base title without tier suffix
    const getBaseTitle = (title: string): string => {
      // Remove patterns like "(Tier 1)", "(Tier 2)", etc. from the end
      return title.trim().replace(/\s*\(Tier\s*\d+\)\s*$/i, '').trim().toLowerCase();
    };
    
    // Function to get display title (without tier suffix)
    const getDisplayTitle = (title: string): string => {
      return title.trim().replace(/\s*\(Tier\s*\d+\)\s*$/i, '').trim();
    };
    
    reservations.forEach((reservation) => {
      const campaign = reservation.campaign;
      if (!campaign) return;
      
      // Use base title (without tier) as grouping key
      const key = getBaseTitle(campaign.title);
      
      if (!groups[key]) {
        groups[key] = {
          title: getDisplayTitle(campaign.title),
          brand: campaign.brand,
          brandLogo: campaign.brandLogo,
          reservations: [],
          totalPayout: 0,
          tiers: [],
        };
      }
      
      groups[key].reservations.push(reservation as ApiReservation & { campaign: ApiCampaign });
      groups[key].totalPayout += parseFloat(campaign.payAmount);
      if (!groups[key].tiers.includes(campaign.tier)) {
        groups[key].tiers.push(campaign.tier);
      }
    });
    
    return Object.values(groups).sort((a, b) => a.title.localeCompare(b.title));
  }, [reservations]);

  const toggleFolder = (title: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const submitMutation = useMutation({
    mutationFn: ({ reservationId, data }: { reservationId: number; data: typeof submissionData }) => {
      return api.submitWork(reservationId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setSubmissionData({ link: "", clipUrl: "" });
      setSelectedReservationId(null);
      setIsDialogOpen(false);
      toast.success("Work submitted! Admin will review it shortly.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit work");
    },
  });

  const approveMutation = useMutation({
    mutationFn: (reservationId: number) => api.approveSubmission(reservationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Payment approved! Funds added to wallet (after 10% tax).");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (reservationId: number) => api.cancelReservation(reservationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Reservation cancelled. The spot has been released.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to cancel reservation");
    },
  });

  const handleSubmit = () => {
    if (!selectedReservationId) return;
    submitMutation.mutate({ reservationId: selectedReservationId, data: submissionData });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'reserved': return <Badge className="bg-yellow-500 hover:bg-yellow-600" data-testid="badge-reserved"><Clock className="w-3 h-3 mr-1"/> Reserved</Badge>;
      case 'submitted': return <Badge className="bg-blue-500 hover:bg-blue-600" data-testid="badge-submitted"><CheckCircle className="w-3 h-3 mr-1"/> Under Review</Badge>;
      case 'approved': return <Badge className="bg-green-500 hover:bg-green-600" data-testid="badge-approved"><CheckCircle className="w-3 h-3 mr-1"/> Approved</Badge>;
      case 'rejected': return <Badge className="bg-red-500 hover:bg-red-600" data-testid="badge-rejected"><AlertCircle className="w-3 h-3 mr-1"/> Rejected</Badge>;
      default: return null;
    }
  };

  const getStatusCounts = (reservations: (ApiReservation & { campaign: ApiCampaign })[]) => {
    const counts = { reserved: 0, submitted: 0, approved: 0, rejected: 0 };
    reservations.forEach(r => {
      if (r.status in counts) {
        counts[r.status as keyof typeof counts]++;
      }
    });
    return counts;
  };

  const renderReservationCard = (reservation: ApiReservation & { campaign: ApiCampaign }, index: number, isInFolder: boolean = false) => {
    const campaign = reservation.campaign;
    
    return (
      <motion.div
        key={reservation.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className={`flex h-full flex-col overflow-hidden transition-all hover:shadow-lg border-primary/20 ${isInFolder ? 'ml-4 border-l-4 border-l-primary/30' : ''}`} data-testid={`card-reservation-${reservation.id}`}>
          <div className="h-32 w-full bg-gradient-to-br from-gray-100 to-gray-200 p-6 flex items-center justify-center relative">
            {campaign.brandLogo ? (
              <img src={campaign.brandLogo} alt={campaign.brand} className="max-h-16 max-w-[150px] object-contain mix-blend-multiply" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {campaign.brand.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute top-2 right-2">
              {getStatusBadge(reservation.status)}
            </div>
          </div>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                {campaign.tier}
              </Badge>
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Instagram className="h-3 w-3" />
                {campaign.type}
              </span>
            </div>
            <h3 className="mt-2 text-xl font-bold leading-tight">{campaign.title}</h3>
            <p className="text-sm font-semibold text-muted-foreground">{campaign.brand}</p>
          </CardHeader>
          <CardContent className="flex-1 text-sm text-muted-foreground">
            <p className="line-clamp-3">{campaign.description}</p>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="font-medium text-foreground">{campaign.spotsRemaining} spots left</span>
              <span>•</span>
              <span>Due {new Date(campaign.deadline).toLocaleDateString()}</span>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/20 p-4 flex flex-col gap-2">
            <div className="flex w-full items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Payout</p>
                <p className="text-lg font-bold text-green-600" data-testid={`text-payout-${reservation.id}`}>{formatINR(campaign.payAmount)}</p>
              </div>

              {reservation.status === 'reserved' && (
                <div className="flex gap-2">
                  <Dialog open={isDialogOpen && selectedReservationId === reservation.id} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="rounded-full bg-blue-600 hover:bg-blue-700 text-white border-0 gap-2"
                        onClick={() => setSelectedReservationId(reservation.id)}
                        data-testid={`button-submit-${reservation.id}`}
                      >
                        <Upload className="w-4 h-4" /> Submit Work
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submit Content for {campaign.title}</DialogTitle>
                        <DialogDescription>
                          Please provide the link to your posted content and verify details.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="link">Post Link (Instagram/YouTube)</Label>
                          <Input 
                            id="link" 
                            placeholder="https://instagram.com/p/..." 
                            value={submissionData.link}
                            onChange={(e) => setSubmissionData({...submissionData, link: e.target.value})}
                            data-testid="input-link"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSubmit} disabled={submitMutation.isPending} data-testid="button-submit-confirm">
                          {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button 
                    variant="outline"
                    size="icon"
                    className="rounded-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to cancel this reservation? The spot will be released.")) {
                        cancelMutation.mutate(reservation.id);
                      }
                    }}
                    disabled={cancelMutation.isPending}
                    data-testid={`button-cancel-${reservation.id}`}
                    title="Cancel Reservation"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {reservation.status === 'submitted' && (
                <Button 
                  variant="outline" 
                  className="text-muted-foreground"
                  onClick={() => approveMutation.mutate(reservation.id)}
                  disabled={approveMutation.isPending}
                  data-testid={`button-approve-${reservation.id}`}
                >
                  {approveMutation.isPending ? "Approving..." : "Review Pending..."}
                </Button>
              )}

              {reservation.status === 'approved' && (
                <Button disabled variant="outline" className="text-green-600 border-green-200 bg-green-50" data-testid={`button-approved-${reservation.id}`}>
                  Payment Added
                </Button>
              )}
            </div>
            
            {reservation.status === 'reserved' && (
              <div className="w-full flex justify-center">
                <CountdownTimer expiresAt={reservation.expiresAt} />
              </div>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        <div className="mx-auto max-w-6xl p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">My Campaigns</h1>
            <p className="text-muted-foreground">Manage your reserved and active sponsorships.</p>
          </div>

          {reservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center animate-in fade-in zoom-in duration-500">
              <div className="rounded-full bg-muted p-4">
                <LayoutList className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No active campaigns</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
                You haven't reserved any campaigns yet. Browse available opportunities to get started.
              </p>
              <Link href="/campaigns">
                <Button className="rounded-full bg-insta-gradient text-white border-0 hover:opacity-90" data-testid="button-find-campaigns">
                  Find Campaigns
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedReservations.map((group) => {
                const isExpanded = expandedFolders.has(group.title);
                const statusCounts = getStatusCounts(group.reservations);
                const isSingleReservation = group.reservations.length === 1;
                
                if (isSingleReservation) {
                  return (
                    <div key={group.title} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {renderReservationCard(group.reservations[0], 0)}
                    </div>
                  );
                }
                
                return (
                  <div key={group.title} className="space-y-4">
                    <Card 
                      className="cursor-pointer hover:shadow-md transition-all border-primary/30"
                      onClick={() => toggleFolder(group.title)}
                      data-testid={`folder-${group.title}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            {group.brandLogo ? (
                              <img src={group.brandLogo} alt={group.brand} className="max-h-10 max-w-[40px] object-contain mix-blend-multiply" />
                            ) : (
                              <FolderOpen className="h-7 w-7 text-primary" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                              <h3 className="text-lg font-bold">{group.title}</h3>
                              <Badge variant="secondary" className="ml-2">
                                {group.reservations.length} Tiers
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{group.brand}</p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1">
                            <p className="text-lg font-bold text-green-600">{formatINR(group.totalPayout.toString())}</p>
                            <div className="flex gap-1">
                              {statusCounts.reserved > 0 && (
                                <Badge className="bg-yellow-500 text-xs">{statusCounts.reserved} Reserved</Badge>
                              )}
                              {statusCounts.submitted > 0 && (
                                <Badge className="bg-blue-500 text-xs">{statusCounts.submitted} Pending</Badge>
                              )}
                              {statusCounts.approved > 0 && (
                                <Badge className="bg-green-500 text-xs">{statusCounts.approved} Approved</Badge>
                              )}
                              {statusCounts.rejected > 0 && (
                                <Badge className="bg-red-500 text-xs">{statusCounts.rejected} Rejected</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex flex-wrap gap-1">
                          {group.tiers.sort().map(tier => (
                            <Badge key={tier} variant="outline" className="text-xs">
                              {tier}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pl-4"
                      >
                        {group.reservations.map((reservation, i) => 
                          renderReservationCard(reservation, i, true)
                        )}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
