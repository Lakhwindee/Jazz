import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Instagram, Loader2, Link2, ExternalLink, Users, AlertCircle, Clock, Copy, ShieldCheck, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MIN_FOLLOWERS } from "@shared/tiers";
import { useLocation } from "wouter";

export default function Profile() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isConnectingInstagram, setIsConnectingInstagram] = useState(false);
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: api.getCurrentUser,
  });

  const [instagramUsername, setInstagramUsername] = useState("");
  const [instagramProfileUrl, setInstagramProfileUrl] = useState("");
  const [instagramFollowers, setInstagramFollowers] = useState("");
  
  useEffect(() => {
    if (user) {
      setInstagramUsername(user.instagramUsername || "");
      setInstagramProfileUrl(user.instagramProfileUrl || "");
      setInstagramFollowers(user.instagramFollowers ? user.instagramFollowers.toString() : "");
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('instagram_connected') === 'true') {
      toast.success("Instagram connected successfully! Your account is verified.");
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      window.history.replaceState({}, '', '/profile');
    }
    const error = params.get('error');
    if (error) {
      if (error === 'min_followers') {
        const required = params.get('required');
        const actual = params.get('actual');
        toast.error(`Minimum ${required} followers required. You have ${actual} followers.`);
      } else {
        toast.error(`Instagram connection failed: ${error.replace(/_/g, ' ')}`);
      }
      window.history.replaceState({}, '', '/profile');
    }
  }, [queryClient]);

  const handleConnectInstagramOAuth = async () => {
    if (!user) return;
    setIsConnectingInstagram(true);
    try {
      const { authUrl } = await api.getInstagramAuthUrl(user.id);
      window.location.href = authUrl;
    } catch (error: any) {
      if (error.message?.includes("not configured")) {
        toast.error("Instagram OAuth is not configured yet. Please use manual entry below or contact admin.");
      } else {
        toast.error(error.message || "Failed to connect Instagram");
      }
      setIsConnectingInstagram(false);
    }
  };

  const refreshInstagramMutation = useMutation({
    mutationFn: () => api.refreshInstagramData(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Instagram data refreshed!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to refresh Instagram data");
    },
  });


  const updateInstagramMutation = useMutation({
    mutationFn: ({ username, profileUrl, followers }: { username: string; profileUrl?: string; followers?: number }) => 
      api.updateUserInstagram(user!.id, username, profileUrl, followers),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      if (variables.username) {
        // Auto-generate verification code after linking
        try {
          await api.generateInstagramVerificationCode(user!.id);
          await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
          toast.success("Instagram linked! Copy the verification code and paste it in your Instagram bio.");
        } catch {
          toast.success("Instagram account linked! Now generate verification code.");
        }
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to link Instagram");
    },
  });

  const handleLinkInstagram = () => {
    if (!instagramUsername.trim()) {
      toast.error("Please enter your Instagram username");
      return;
    }
    const followers = parseInt(instagramFollowers);
    if (isNaN(followers) || followers < MIN_FOLLOWERS) {
      toast.error(`Minimum ${MIN_FOLLOWERS.toLocaleString()} followers required to link your Instagram`);
      return;
    }
    const username = instagramUsername.replace("@", "").trim();
    const profileUrl = instagramProfileUrl || `https://instagram.com/${username}`;
    updateInstagramMutation.mutate({ username, profileUrl, followers });
  };

  const handleDisconnect = () => {
    updateInstagramMutation.mutate({ username: "", profileUrl: "", followers: undefined });
    setInstagramUsername("");
    setInstagramProfileUrl("");
    setInstagramFollowers("");
    toast.success("Instagram disconnected");
  };

  const generateCodeMutation = useMutation({
    mutationFn: () => api.generateInstagramVerificationCode(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Verification code generated! Copy it to your Instagram bio.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate code");
    },
  });

  const submitVerificationMutation = useMutation({
    mutationFn: () => api.submitInstagramForVerification(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Submitted for verification! We'll review and verify your account soon.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit for verification");
    },
  });

  const handleCopyCode = () => {
    if (user?.instagramVerificationCode) {
      navigator.clipboard.writeText(user.instagramVerificationCode);
      toast.success("Code copied! Paste it in your Instagram bio.");
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  const isInstagramLinked = !!user.instagramUsername;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        <div className="mx-auto max-w-4xl p-4 sm:p-6">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profile Settings</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {user.role === "admin" 
                ? "Manage your admin profile settings." 
                : user.role === "sponsor"
                  ? "Manage your brand profile settings."
                  : "Manage your creator profile and Instagram connection."}
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white shadow-lg ring-2 ring-indigo-100">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback className="text-xl sm:text-2xl">{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      <h2 className="text-xl sm:text-2xl font-bold">{user.name}</h2>
                      {user.isVerified && (
                        <Badge className="bg-blue-500 hover:bg-blue-600 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{user.handle}</p>
                    {isInstagramLinked && user.isInstagramVerified && (
                      <p className="text-sm text-muted-foreground mt-1">{user.tier} • {user.followers.toLocaleString()} followers</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {user.role !== "admin" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Instagram className="h-5 w-5" />
                  Instagram Account
                </CardTitle>
                <CardDescription>Link your Instagram account to participate in campaigns.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isInstagramLinked ? (
                  <div className="space-y-4">
                    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border-2 p-4 gap-4 ${
                      user.isInstagramVerified 
                        ? "border-green-200 bg-green-50 dark:bg-green-900/20" 
                        : user.instagramVerificationStatus === "pending"
                          ? "border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20"
                          : "border-gray-200 bg-gray-50 dark:bg-gray-900/20"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px] shrink-0">
                          <div className="rounded-full bg-white dark:bg-gray-900 p-2">
                            <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">@{user.instagramUsername}</p>
                          <p className={`text-xs sm:text-sm ${
                            user.isInstagramVerified 
                              ? "text-green-600" 
                              : user.instagramVerificationStatus === "pending"
                                ? "text-yellow-600"
                                : "text-gray-600"
                          }`}>
                            {user.instagramAccessToken 
                              ? "API Connected" 
                              : user.isInstagramVerified 
                                ? "Verified" 
                                : user.instagramVerificationStatus === "pending"
                                  ? "Pending Verification"
                                  : "Connected (Manual)"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        {user.instagramAccessToken && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => refreshInstagramMutation.mutate()}
                            disabled={refreshInstagramMutation.isPending}
                            data-testid="button-refresh-instagram"
                          >
                            <RefreshCw className={`h-4 w-4 ${refreshInstagramMutation.isPending ? 'animate-spin' : ''}`} />
                          </Button>
                        )}
                        {user.instagramProfileUrl && (
                          <Button variant="ghost" size="icon" asChild>
                            <a 
                              href={user.instagramProfileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              data-testid="link-instagram-profile"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={handleDisconnect}
                          data-testid="button-disconnect-instagram"
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg bg-muted/30 p-4">
                      <h4 className="font-medium mb-3">Account Status</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {user.isInstagramVerified ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                              <Clock className="h-4 w-4" />
                            </div>
                          )}
                          <span className="text-sm">
                            {user.isInstagramVerified ? "Instagram Account Verified" : "Instagram Account Pending Review"}
                          </span>
                          {user.instagramAccessToken && (
                            <Badge variant="secondary" className="text-xs">Verified via OAuth</Badge>
                          )}
                        </div>
                        {user.isInstagramVerified && (
                          <>
                            <div className="flex items-center gap-3">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                              <span className="text-sm">Follower Count: {user.followers.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                              <span className="text-sm">Engagement Rate: {user.engagement}%</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {!user.isInstagramVerified && (
                      <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-4 space-y-4">
                        {user.instagramVerificationStatus === "pending" ? (
                          <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-3 text-center">
                              <Clock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Submitted for Review</p>
                              <p className="text-xs text-blue-600 dark:text-blue-300">Admin is verifying your Instagram bio. This usually takes a few hours.</p>
                            </div>
                            
                            {user.instagramVerificationCode ? (
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                                <p className="text-xs text-muted-foreground mb-2">Your Verification Code (paste this in your Instagram bio):</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 border rounded-lg p-3 font-mono text-sm break-all font-bold">
                                    {user.instagramVerificationCode}
                                  </div>
                                  <Button
                                    onClick={handleCopyCode}
                                    variant="outline"
                                    size="icon"
                                    data-testid="button-copy-code"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border space-y-3">
                                <p className="text-xs text-muted-foreground">No verification code found. Generate one to add to your Instagram bio:</p>
                                <Button
                                  onClick={() => generateCodeMutation.mutate()}
                                  disabled={generateCodeMutation.isPending}
                                  variant="outline"
                                  className="w-full"
                                  data-testid="button-generate-code-pending"
                                >
                                  {generateCodeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Generate Verification Code
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start gap-3">
                              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                              <div>
                                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Verify Your Instagram</h4>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                  To verify account ownership, copy the code below and paste it in your Instagram bio. Then click "Submit for Verification".
                                </p>
                              </div>
                            </div>
                            {!user.instagramVerificationCode ? (
                          <Button
                            onClick={() => generateCodeMutation.mutate()}
                            disabled={generateCodeMutation.isPending}
                            variant="outline"
                            className="w-full"
                            data-testid="button-generate-code"
                          >
                            {generateCodeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate Verification Code
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Your Verification Code:</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-white dark:bg-gray-800 border-2 border-yellow-400 rounded-lg p-3 font-mono text-base break-all font-bold text-center">
                                {user.instagramVerificationCode}
                              </div>
                              <Button
                                onClick={handleCopyCode}
                                variant="outline"
                                size="icon"
                                data-testid="button-copy-code"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-800/30 p-2 rounded">
                              <strong>Steps:</strong><br />
                              1. Copy the code above<br />
                              2. Open Instagram → Edit Profile → Bio<br />
                              3. Paste the code in your bio<br />
                              4. Click "Submit for Verification" below
                            </div>
                            <Button
                              onClick={() => submitVerificationMutation.mutate()}
                              disabled={submitVerificationMutation.isPending}
                              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                              data-testid="button-submit-verification"
                            >
                              {submitVerificationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Submit for Verification
                            </Button>
                          </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl border-2 border-dashed border-muted-foreground/30 p-4 sm:p-6 text-center">
                      <div className="flex flex-col items-center gap-3 sm:gap-4">
                        <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px]">
                          <div className="rounded-full bg-white dark:bg-gray-900 p-3 sm:p-4">
                            <Instagram className="h-6 w-6 sm:h-8 sm:w-8" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-base sm:text-lg">Connect & Verify Instagram</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Add your Instagram details and verify ownership</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-3 sm:p-4 mb-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-medium text-sm sm:text-base text-amber-800 dark:text-amber-200">Minimum Requirement</h4>
                          <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 mt-1">
                            You need at least {MIN_FOLLOWERS.toLocaleString()} followers on Instagram to join our creator platform.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4">
                      <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-2">How Verification Works:</h4>
                      <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                        <li>Enter your Instagram username and followers below</li>
                        <li>Click "Connect & Get Code" to generate verification code</li>
                        <li>Copy the code and paste it in your Instagram bio</li>
                        <li>Click "Submit for Verification" - Admin will verify and approve</li>
                      </ol>
                    </div>


                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="instagram-username">Instagram Username *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                          <Input
                            id="instagram-username"
                            placeholder="your_username"
                            value={instagramUsername.replace("@", "")}
                            onChange={(e) => setInstagramUsername(e.target.value.replace("@", ""))}
                            className="pl-8"
                            data-testid="input-instagram-username"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Example: cristiano, or yourname (your public Instagram username)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="instagram-followers">Your Follower Count *</Label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="instagram-followers"
                            type="number"
                            placeholder="e.g. 10000"
                            value={instagramFollowers}
                            onChange={(e) => setInstagramFollowers(e.target.value)}
                            className="pl-10"
                            min={MIN_FOLLOWERS}
                            data-testid="input-instagram-followers"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Minimum {MIN_FOLLOWERS.toLocaleString()} followers required
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="instagram-url">Profile URL (Optional)</Label>
                        <div className="relative">
                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="instagram-url"
                            placeholder="https://instagram.com/your_username"
                            value={instagramProfileUrl}
                            onChange={(e) => setInstagramProfileUrl(e.target.value)}
                            className="pl-10"
                            data-testid="input-instagram-url"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Leave blank to auto-generate from username</p>
                      </div>

                      <Button 
                        onClick={handleLinkInstagram}
                        disabled={updateInstagramMutation.isPending || !instagramUsername.trim() || !instagramFollowers}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                        data-testid="button-link-instagram"
                      >
                        {updateInstagramMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Instagram className="mr-2 h-4 w-4" />
                        Connect & Get Verification Code
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            <SettingsCard user={user} onNavigate={setLocation} />

          </div>
        </div>
      </main>
    </div>
  );
}

function SettingsCard({ user, onNavigate }: { user: any; onNavigate: (path: string) => void }) {
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const { data: accountStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["accountStatus"],
    queryFn: api.getAccountStatus,
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: api.cancelSubscription,
    onSuccess: (data) => {
      toast.success(data.message || "Subscription cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["accountStatus"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to cancel subscription");
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: api.deleteAccount,
    onSuccess: () => {
      toast.success("Account deleted successfully");
      onNavigate("/");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete account");
    },
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      toast.success("Logged out successfully");
      onNavigate("/");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const handleCancelSubscription = () => {
    cancelSubscriptionMutation.mutate();
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }
    deleteAccountMutation.mutate();
  };

  const hasActiveSubscription = accountStatus?.subscriptionPlan && accountStatus.subscriptionPlan !== "free";
  const canDelete = accountStatus && accountStatus.balance === 0 && accountStatus.pendingWithdrawals === 0;
  const isCreator = user?.role === "creator";

  return (
    <>
      {isCreator && hasActiveSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium capitalize">{accountStatus?.subscriptionPlan} Plan</p>
                {accountStatus?.subscriptionExpiresAt && (
                  <p className="text-sm text-muted-foreground">
                    {accountStatus.autoRenew ? "Renews" : "Expires"}: {new Date(accountStatus.subscriptionExpiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              {accountStatus?.autoRenew && (
                <Badge variant="outline">Auto-Renew On</Badge>
              )}
            </div>
            {accountStatus?.autoRenew && (
              <Button
                variant="outline"
                onClick={handleCancelSubscription}
                disabled={cancelSubscriptionMutation.isPending}
                className="w-full"
                data-testid="button-cancel-subscription"
              >
                {cancelSubscriptionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cancel Auto-Renewal
              </Button>
            )}
            {!accountStatus?.autoRenew && hasActiveSubscription && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Your subscription will end on {accountStatus?.subscriptionExpiresAt ? new Date(accountStatus.subscriptionExpiresAt).toLocaleDateString() : "period end"}.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full"
            data-testid="button-logout"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Logout
          </Button>

          {!showDeleteConfirm ? (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full"
              data-testid="button-show-delete-account"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          ) : (
            <div className="space-y-3 p-4 border border-destructive/50 rounded-md">
              <p className="text-sm font-medium text-destructive">
                This action cannot be undone!
              </p>
              {statusLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : !canDelete ? (
                <div className="text-sm space-y-1">
                  {accountStatus && accountStatus.balance > 0 && (
                    <p className="text-amber-600 dark:text-amber-400">
                      Withdraw your balance of ${accountStatus.balance.toFixed(2)} first.
                    </p>
                  )}
                  {accountStatus && accountStatus.pendingWithdrawals > 0 && (
                    <p className="text-amber-600 dark:text-amber-400">
                      You have {accountStatus.pendingWithdrawals} pending withdrawal(s).
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Type <span className="font-bold">DELETE</span> to confirm:
                  </p>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    data-testid="input-delete-confirm"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText("");
                      }}
                      className="flex-1"
                      data-testid="button-cancel-delete"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleteAccountMutation.isPending || deleteConfirmText !== "DELETE"}
                      className="flex-1"
                      data-testid="button-confirm-delete-account"
                    >
                      {deleteAccountMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
