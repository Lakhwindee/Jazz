import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Instagram, Loader2, Link2, ExternalLink, Users, AlertCircle, Clock, Copy, ShieldCheck, RefreshCw, Camera, MapPin, Save } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { MIN_FOLLOWERS } from "@shared/tiers";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCitiesByCountry } from "@shared/cities";

function CityEditor({ userId, currentCity, country }: { userId: number; currentCity: string; country: string }) {
  const [city, setCity] = useState(currentCity);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const cities = getCitiesByCountry(country);

  return (
    <div className="flex gap-2">
      <Select value={city} onValueChange={setCity}>
        <SelectTrigger data-testid="select-profile-city">
          <SelectValue placeholder="Select your city" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {cities.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        disabled={isSaving || city === currentCity}
        onClick={async () => {
          setIsSaving(true);
          try {
            const res = await fetch(`/api/users/${userId}/city`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ city }),
              credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to update city");
            queryClient.invalidateQueries({ queryKey: ["currentUser"] });
            toast.success("City updated!");
          } catch {
            toast.error("Failed to update city");
          } finally {
            setIsSaving(false);
          }
        }}
        data-testid="button-save-city"
      >
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      </Button>
    </div>
  );
}

export default function Profile() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isConnectingInstagram, setIsConnectingInstagram] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showFollowerInput, setShowFollowerInput] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: api.getCurrentUser,
  });

  const [instagramUsername, setInstagramUsername] = useState("");
  const [instagramProfileUrl, setInstagramProfileUrl] = useState("");
  const [instagramFollowers, setInstagramFollowers] = useState("");
  const [fetchedProfile, setFetchedProfile] = useState<{
    followers: number;
    fullName?: string;
    profilePic?: string;
    bio?: string;
    isPrivate?: boolean;
  } | null>(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [fetchError, setFetchError] = useState("");
  
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
    if (params.get('instagram_oauth_partial') === 'true') {
      toast.success("Instagram account verified! Please enter your username and follower count below to complete setup.");
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setShowManualEntry(true);
      window.history.replaceState({}, '', '/profile');
    }
    const error = params.get('error');
    if (error) {
      if (error === 'min_followers') {
        const required = params.get('required');
        const actual = params.get('actual');
        toast.error(`Minimum ${required} followers required. You have ${actual} followers.`);
      } else if (error === 'profile_fetch_failed') {
        const detail = params.get('detail');
        toast.error(`Instagram connection failed: profile fetch failed${detail ? ` (${detail})` : ''}`);
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
      
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = authUrl;
        return;
      }
      
      const width = 500;
      const height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        authUrl, 
        "instagram_auth",
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        window.location.href = authUrl;
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'instagram_oauth') {
          window.removeEventListener('message', handleMessage);
          setIsConnectingInstagram(false);
          
          if (event.data.status === 'success') {
            toast.success(`Instagram connected! @${event.data.username} (${event.data.followers?.toLocaleString()} followers)`);
            queryClient.invalidateQueries({ queryKey: ["currentUser"] });
          } else if (event.data.status === 'partial') {
            toast.success("Instagram account verified! Please enter your username below to complete setup.");
            queryClient.invalidateQueries({ queryKey: ["currentUser"] });
          } else if (event.data.status === 'error') {
            toast.error(event.data.message || "Instagram verification failed");
          }
        }
      };
      
      window.addEventListener('message', handleMessage);

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsConnectingInstagram(false);
          window.removeEventListener('message', handleMessage);
          queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        }
      }, 1000);
    } catch (error: any) {
      if (error.message?.includes("not configured")) {
        toast.error("Instagram verification is not available right now. Please use manual entry below.");
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

  const avatarMutation = useMutation({
    mutationFn: (file: File) => api.uploadAvatar(user!.id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Profile picture updated!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update profile picture");
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    avatarMutation.mutate(file);
  };


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

  const handleFetchInstagramProfile = async () => {
    const username = instagramUsername.replace("@", "").trim();
    if (!username) {
      toast.error("Please enter your Instagram username");
      return;
    }
    setIsFetchingProfile(true);
    setFetchError("");
    setFetchedProfile(null);
    setShowManualEntry(false);
    try {
      const res = await fetch("/api/instagram/fetch-followers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) {
        setShowManualEntry(true);
        return;
      }
      setFetchedProfile({
        followers: data.followers,
        fullName: data.fullName,
        profilePic: data.profilePic,
        bio: data.bio,
        isPrivate: data.isPrivate,
      });
      setInstagramFollowers(data.followers.toString());
      toast.success(`Found @${username} with ${data.followers.toLocaleString()} followers!`);
    } catch (error: any) {
      setShowManualEntry(true);
    } finally {
      setIsFetchingProfile(false);
    }
  };

  const handleLinkInstagram = async () => {
    if (!instagramUsername.trim()) {
      toast.error("Please enter your Instagram username");
      return;
    }
    const username = instagramUsername.replace("@", "").trim();
    const profileUrl = instagramProfileUrl || `https://instagram.com/${username}`;
    
    setIsFetchingProfile(true);
    try {
      const bodyData: any = { userId: user.id, username };
      if (instagramFollowers) {
        bodyData.manualFollowers = parseInt(instagramFollowers);
      }

      const res = await fetch("/api/instagram/complete-oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Instagram connected! @${data.username} - ${data.followers.toLocaleString()} followers verified.`);
        setInstagramFollowers("");
        setShowFollowerInput(false);
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      } else if (data.needsFollowers) {
        setShowFollowerInput(true);
        toast.error("Enter your follower count to complete verification.");
      } else {
        toast.error(data.error || "Could not verify username");
      }
    } catch (e) {
      toast.error("Something went wrong. Try again.");
    } finally {
      setIsFetchingProfile(false);
    }
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
  const isOAuthPartial = !!user.instagramUserId && !user.instagramUsername;

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
                  <div className="relative group">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white shadow-lg ring-2 ring-indigo-100">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="text-xl sm:text-2xl">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      disabled={avatarMutation.isPending}
                      data-testid="button-change-avatar"
                    >
                      {avatarMutation.isPending ? (
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      ) : (
                        <Camera className="h-5 w-5 text-white" />
                      )}
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      data-testid="input-avatar-upload"
                    />
                  </div>
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
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {user.city || "No city set"}
                      </p>
                    </div>
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

                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button
                      onClick={handleConnectInstagramOAuth}
                      disabled={isConnectingInstagram}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white h-12 text-base font-medium"
                      data-testid="button-connect-instagram-oauth"
                    >
                      {isConnectingInstagram ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Instagram className="mr-2 h-5 w-5" />
                      )}
                      Connect Instagram Account
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Securely sign in with Meta to auto-verify your follower count
                    </p>
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
        <CardContent className="pt-6">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full"
            data-testid="button-logout"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
