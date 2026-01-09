import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, formatINR, type AdminStats, type ApiUser, type AdminWithdrawalRequest, type AdminPendingSubmission, type ApiCampaign, type CampaignGroup } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Users, 
  Briefcase, 
  CreditCard, 
  FileCheck, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Building2,
  Instagram,
  ExternalLink,
  AlertTriangle,
  Pause,
  Play,
  DollarSign,
  Eye,
  Settings,
  IndianRupee,
  Ticket,
  Plus,
  Copy,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Percent,
  Calendar,
  ArrowDown,
  RefreshCw,
  Search,
  Mail,
  Phone,
  Star,
  Wallet,
  UserCheck,
  UserX,
  ChevronRight,
  Crown,
  Award,
  EyeOff,
  Save,
  Menu,
  X,
  Home,
  MessageCircle,
  Send,
  Ban,
  Gift
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const adminMenuItems = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "users", label: "Users", icon: Users },
  { id: "withdrawals", label: "Withdrawals", icon: CreditCard },
  { id: "submissions", label: "Submissions", icon: FileCheck },
  { id: "campaigns", label: "Campaigns", icon: Briefcase },
  { id: "verifications", label: "Verifications", icon: Shield },
  { id: "promo-codes", label: "Promo Codes", icon: Ticket },
  { id: "newsletter", label: "Newsletter", icon: Mail },
  { id: "support-tickets", label: "Support Tickets", icon: MessageCircle },
  { id: "settings", label: "Settings", icon: Settings },
];

function AdminSidebar({ activeTab, setActiveTab, isOpen, onClose }: { 
  activeTab: string; 
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 
        w-64 bg-gray-900 min-h-screen p-4 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-purple-500" />
            <span className="text-xl font-bold text-white">Admin Panel</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="lg:hidden text-gray-400"
            onClick={onClose}
            data-testid="button-close-sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {adminMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                activeTab === item.id
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
              data-testid={`nav-admin-${item.id}`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <Button
          variant="outline"
          className="mt-auto border-gray-700 text-gray-400 hover:text-white"
          onClick={() => window.location.href = "/"}
          data-testid="button-back-home"
        >
          <Home className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>
    </>
  );
}

function MobileBottomNav({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const quickItems = [
    { id: "overview", label: "Home", icon: TrendingUp },
    { id: "submissions", label: "Review", icon: FileCheck },
    { id: "withdrawals", label: "Payouts", icon: CreditCard },
    { id: "users", label: "Users", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 lg:hidden z-30">
      <div className="flex justify-around items-center py-2">
        {quickItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              activeTab === item.id
                ? "text-purple-400"
                : "text-gray-500"
            }`}
            data-testid={`mobile-nav-${item.id}`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StatsOverview({ stats }: { stats: AdminStats }) {
  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { label: "Creators", value: stats.totalCreators, icon: Users, color: "text-green-500" },
    { label: "Sponsors", value: stats.totalSponsors, icon: Building2, color: "text-purple-500" },
    { label: "Active Campaigns", value: stats.activeCampaigns, icon: Briefcase, color: "text-orange-500" },
    { label: "Pending Withdrawals", value: stats.pendingWithdrawals, icon: CreditCard, color: "text-red-500" },
    { label: "Pending Amount", value: formatINR(stats.pendingWithdrawalAmount), icon: DollarSign, color: "text-yellow-500", isAmount: true },
    { label: "Total Processed", value: formatINR(stats.totalWithdrawalsProcessed), icon: CheckCircle, color: "text-green-500", isAmount: true },
    { label: "Pending Submissions", value: stats.pendingSubmissions, icon: FileCheck, color: "text-blue-500" },
    { label: "Pending Verifications", value: stats.pendingVerifications, icon: Shield, color: "text-purple-500" },
    { label: "Total Campaigns", value: stats.totalCampaigns, icon: Briefcase, color: "text-indigo-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function UserDetailDialog({ user, open, onClose }: { user: ApiUser | null; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [banReason, setBanReason] = useState("");
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/admin/users/${userId}/verify`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to verify user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User verified successfully");
    },
  });

  const banMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/ban`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to ban user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User banned successfully");
      setShowBanDialog(false);
      setBanReason("");
      onClose();
    },
  });

  const unbanMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/admin/users/${userId}/unban`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to unban user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User unbanned successfully");
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted successfully");
      setShowDeleteDialog(false);
      onClose();
    },
  });

  const disconnectInstagramMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/admin/users/${userId}/disconnect-instagram`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to disconnect Instagram");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Instagram disconnected successfully");
    },
  });

  const banInstagramMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/admin/users/${userId}/ban-instagram`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to ban Instagram");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Instagram banned successfully");
    },
  });

  const unbanInstagramMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/admin/users/${userId}/unban-instagram`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to unban Instagram");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Instagram unbanned successfully");
    },
  });

  if (!user) return null;

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "creator": return "bg-green-600";
      case "sponsor": return "bg-blue-600";
      case "admin": return "bg-purple-600";
      default: return "bg-gray-600";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-purple-600 text-white text-xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-white text-xl">{user.name}</DialogTitle>
                <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                {user.isVerified && <Badge className="bg-green-600">Verified</Badge>}
                {user.subscriptionPlan === "pro" && (
                  <Badge className="bg-yellow-600 gap-1">
                    <Crown className="h-3 w-3" /> Pro
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-gray-400 flex items-center gap-2">
                <Mail className="h-4 w-4" /> {user.email}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex gap-2 border-b border-gray-700 pb-2 mt-4">
          {/* Show tabs based on user role */}
          {["profile", 
            ...(user.role === "creator" ? ["instagram"] : []),
            ...(user.role === "creator" || user.role === "sponsor" ? ["wallet"] : []),
            "activity", 
            "actions"
          ].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className="capitalize"
              data-testid={`tab-user-${tab}`}
            >
              {tab}
            </Button>
          ))}
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {activeTab === "profile" && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-400">Role</p>
                    <p className="text-lg font-semibold text-white capitalize">{user.role}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-400">Tier</p>
                    <p className="text-lg font-semibold text-white">Tier {user.tier || "N/A"}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-400">Subscription</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-white capitalize">{user.subscriptionPlan || "Free"}</p>
                      {user.subscriptionPlan === "pro" && <Crown className="h-4 w-4 text-yellow-500" />}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-400">Verification Status</p>
                    <div className="flex items-center gap-2">
                      {user.isVerified ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <p className="text-lg font-semibold text-green-500">Verified</p>
                        </>
                      ) : (
                        <>
                          <Clock className="h-5 w-5 text-yellow-500" />
                          <p className="text-lg font-semibold text-yellow-500">Pending</p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {user.role === "sponsor" && user.companyName && (
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-400">Company</p>
                    <p className="text-lg font-semibold text-white">{user.companyName}</p>
                    {user.gstNumber && <p className="text-sm text-gray-400">GST: {user.gstNumber}</p>}
                  </CardContent>
                </Card>
              )}

              {!user.isVerified && (
                <div className="flex gap-2 mt-4">
                  <Button
                    className="bg-green-600"
                    onClick={() => verifyMutation.mutate(user.id)}
                    disabled={verifyMutation.isPending}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Verify User
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === "instagram" && user.role === "creator" && (
            <div className="space-y-4 pt-4">
              {user.instagramUsername ? (
                <>
                  <Card className="bg-gray-900 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Instagram className="h-8 w-8 text-pink-500" />
                          <div>
                            <p className="text-lg font-semibold text-white">@{user.instagramUsername}</p>
                            <p className="text-sm text-gray-400">
                              {user.isInstagramVerified ? (
                                <span className="text-green-500 flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4" /> Verified
                                </span>
                              ) : (
                                <span className="text-yellow-500">Pending verification</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <a
                          href={`https://instagram.com/${user.instagramUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-500"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-gray-900 border-gray-700">
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-400">Followers</p>
                        <p className="text-2xl font-bold text-white">
                          {user.instagramFollowers?.toLocaleString() || "N/A"}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-900 border-gray-700">
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-400">Tier Based on Followers</p>
                        <p className="text-2xl font-bold text-purple-500">Tier {user.tier || "N/A"}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-gray-900 border-gray-700 mt-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-sm">Instagram Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disconnectInstagramMutation.mutate(user.id)}
                          disabled={disconnectInstagramMutation.isPending}
                          data-testid="button-disconnect-instagram"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Disconnect
                        </Button>
                        {(user as any).isInstagramBanned ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-green-600 text-green-500"
                            onClick={() => unbanInstagramMutation.mutate(user.id)}
                            disabled={unbanInstagramMutation.isPending}
                            data-testid="button-unban-instagram"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Unban Instagram
                          </Button>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => banInstagramMutation.mutate(user.id)}
                            disabled={banInstagramMutation.isPending}
                            data-testid="button-ban-instagram"
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Ban Instagram
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-8">
                  <Instagram className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">No Instagram account linked</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "wallet" && (user.role === "creator" || user.role === "sponsor") && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-400">Current Balance</p>
                    <p className="text-2xl font-bold text-green-500">{formatINR(user.balance)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-400">Total Earnings</p>
                    <p className="text-2xl font-bold text-blue-500">{formatINR(user.totalEarnings || "0")}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm">Wallet Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Account Status</span>
                      <span className="text-green-500">Active</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Pending Withdrawals</span>
                      <span className="text-white">{formatINR(user.pendingWithdrawals || "0")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Star Rewards</span>
                      <span className="text-yellow-500 flex items-center gap-1">
                        <Star className="h-4 w-4" /> {user.starRewards || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-400">Active Reservations</p>
                    <p className="text-2xl font-bold text-purple-500">{user.activeReservations || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-400">Completed Submissions</p>
                    <p className="text-2xl font-bold text-green-500">{user.completedSubmissions || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-400">Campaigns Created</p>
                    <p className="text-2xl font-bold text-blue-500">{user.campaignsCreated || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-400">Member Since</p>
                    <p className="text-lg font-bold text-white">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "actions" && (
            <div className="space-y-4 pt-4">
              {(user as any).isBanned && (
                <Card className="bg-red-900/20 border-red-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                      <Ban className="h-5 w-5" />
                      <span className="font-medium">This user is banned</span>
                    </div>
                    {(user as any).bannedReason && (
                      <p className="text-sm text-gray-400">Reason: {(user as any).bannedReason}</p>
                    )}
                    {(user as any).bannedAt && (
                      <p className="text-xs text-gray-500">
                        Banned on: {new Date((user as any).bannedAt).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm">Account Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {(user as any).isBanned ? (
                      <Button
                        variant="outline"
                        className="border-green-600 text-green-500"
                        onClick={() => unbanMutation.mutate(user.id)}
                        disabled={unbanMutation.isPending}
                        data-testid="button-unban-user"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Unban User
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="border-yellow-600 text-yellow-500"
                        onClick={() => setShowBanDialog(true)}
                        data-testid="button-ban-user"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Ban User
                      </Button>
                    )}
                    
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      data-testid="button-delete-user"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete User
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm">Warning</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-400 space-y-2">
                    <p className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                      <span><strong>Banning</strong> will prevent the user from logging in and participating in campaigns.</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <span><strong>Deleting</strong> is permanent and will remove all user data including wallet balance and history.</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>

        <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Ban User</DialogTitle>
              <DialogDescription className="text-gray-400">
                Are you sure you want to ban {user.name}? They will not be able to access their account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Reason for ban (optional)</Label>
                <Input
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="input-ban-reason"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBanDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => banMutation.mutate({ userId: user.id, reason: banReason })}
                disabled={banMutation.isPending}
                data-testid="button-confirm-ban"
              >
                {banMutation.isPending ? "Banning..." : "Confirm Ban"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Delete User</DialogTitle>
              <DialogDescription className="text-gray-400">
                This action cannot be undone. This will permanently delete {user.name}'s account and all associated data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(user.id)}
                disabled={deleteMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending ? "Deleting..." : "Permanently Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

function UsersTab() {
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users", roleFilter],
    queryFn: () => api.admin.getUsers(roleFilter || undefined),
  });

  // Filter out admin users - they are site owners, not managed users
  const managedUsers = users.filter(u => u.role !== "admin");

  const filteredUsers = managedUsers.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.instagramUsername?.toLowerCase().includes(query)
    );
  });

  const creators = managedUsers.filter(u => u.role === "creator");
  const sponsors = managedUsers.filter(u => u.role === "sponsor");
  const verified = managedUsers.filter(u => u.isVerified);

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "creator": return "bg-green-600";
      case "sponsor": return "bg-blue-600";
      case "admin": return "bg-purple-600";
      default: return "bg-gray-600";
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-white">{managedUsers.length}</p>
                <p className="text-xs text-gray-400">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Instagram className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-white">{creators.length}</p>
                <p className="text-xs text-gray-400">Creators</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-white">{sponsors.length}</p>
                <p className="text-xs text-gray-400">Sponsors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-white">{verified.length}</p>
                <p className="text-xs text-gray-400">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or Instagram..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
            data-testid="input-search-users"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={roleFilter === "" ? "default" : "outline"}
            onClick={() => setRoleFilter("")}
            size="sm"
            data-testid="filter-all-users"
          >
            All
          </Button>
          <Button
            variant={roleFilter === "creator" ? "default" : "outline"}
            onClick={() => setRoleFilter("creator")}
            size="sm"
            data-testid="filter-creators"
          >
            Creators
          </Button>
          <Button
            variant={roleFilter === "sponsor" ? "default" : "outline"}
            onClick={() => setRoleFilter("sponsor")}
            size="sm"
            data-testid="filter-sponsors"
          >
            Sponsors
          </Button>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No users found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredUsers.map((user) => (
            <Card 
              key={user.id} 
              className="bg-gray-800 border-gray-700 hover:border-purple-600 transition-colors cursor-pointer"
              onClick={() => setSelectedUser(user)}
              data-testid={`card-user-${user.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className={`${getRoleColor(user.role)} text-white`}>
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-white font-medium">{user.name}</h4>
                        <Badge className={`${getRoleColor(user.role)} text-xs`}>
                          {user.role}
                        </Badge>
                        {user.isVerified && (
                          <Badge className="bg-green-600 text-xs">Verified</Badge>
                        )}
                        {user.subscriptionPlan === "pro" && (
                          <Badge className="bg-yellow-600 text-xs gap-1">
                            <Crown className="h-3 w-3" /> Pro
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {user.instagramUsername && (
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-pink-500">
                          <Instagram className="h-4 w-4" />
                          <span className="text-sm">@{user.instagramUsername}</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {user.instagramFollowers?.toLocaleString() || 0} followers
                        </p>
                      </div>
                    )}

                    <div className="text-right">
                      <p className="text-sm text-gray-400">Balance</p>
                      <p className="text-white font-medium">{formatINR(user.balance)}</p>
                    </div>

                    {user.role === "creator" && (
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Tier</p>
                        <p className="text-purple-500 font-medium">{user.tier || "N/A"}</p>
                      </div>
                    )}

                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <UserDetailDialog
        user={selectedUser}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}

function WithdrawalsTab() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AdminWithdrawalRequest | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ["admin-withdrawals", statusFilter],
    queryFn: () => api.admin.getWithdrawals(statusFilter || undefined),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, utr }: { id: number; utr: string }) => api.admin.approveWithdrawal(id, utr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setApproveDialogOpen(false);
      setUtrNumber("");
      toast.success("Withdrawal approved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => api.admin.rejectWithdrawal(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setRejectDialogOpen(false);
      setRejectReason("");
      toast.success("Withdrawal rejected and refunded");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400">Loading withdrawals...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button
          variant={statusFilter === "" ? "default" : "outline"}
          onClick={() => setStatusFilter("")}
          size="sm"
        >
          All
        </Button>
        <Button
          variant={statusFilter === "pending" ? "default" : "outline"}
          onClick={() => setStatusFilter("pending")}
          size="sm"
        >
          Pending
        </Button>
      </div>

      {withdrawals.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No withdrawal requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((request) => (
            <Card key={request.id} className="bg-gray-800 border-gray-700" data-testid={`card-withdrawal-${request.id}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-white">{formatINR(request.amount)}</span>
                      <Badge
                        className={
                          request.status === "pending" ? "bg-yellow-600" :
                          request.status === "completed" ? "bg-green-600" :
                          "bg-red-600"
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                    {request.user && (
                      <div>
                        <p className="text-white">{request.user.name}</p>
                        <p className="text-sm text-gray-400">{request.user.email}</p>
                      </div>
                    )}
                    {request.bankAccount && (
                      <div className="text-sm text-gray-400">
                        <p>{request.bankAccount.bankName} - {request.bankAccount.accountNumber}</p>
                        <p>IFSC: {request.bankAccount.ifscCode}</p>
                        {request.bankAccount.upiId && <p>UPI: {request.bankAccount.upiId}</p>}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Requested: {new Date(request.requestedAt).toLocaleString()}
                    </p>
                    {request.utrNumber && (
                      <p className="text-sm text-green-400">UTR: {request.utrNumber}</p>
                    )}
                    {request.adminNote && (
                      <p className="text-sm text-red-400">Note: {request.adminNote}</p>
                    )}
                  </div>
                  {request.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setSelectedRequest(request);
                          setApproveDialogOpen(true);
                        }}
                        data-testid={`button-approve-withdrawal-${request.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedRequest(request);
                          setRejectDialogOpen(true);
                        }}
                        data-testid={`button-reject-withdrawal-${request.id}`}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Approve Withdrawal</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the UTR number for this payment of {selectedRequest && formatINR(selectedRequest.amount)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">UTR Number</Label>
              <Input
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="Enter UTR/Reference number"
                className="bg-gray-700 border-gray-600 text-white"
                data-testid="input-utr-number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => selectedRequest && approveMutation.mutate({ id: selectedRequest.id, utr: utrNumber })}
              disabled={!utrNumber.trim() || approveMutation.isPending}
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending ? "Processing..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Withdrawal</DialogTitle>
            <DialogDescription className="text-gray-400">
              The amount will be refunded to the user's wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Reason (Optional)</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection"
                className="bg-gray-700 border-gray-600 text-white"
                data-testid="input-reject-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRequest && rejectMutation.mutate({ id: selectedRequest.id, reason: rejectReason })}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? "Processing..." : "Reject & Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubmissionsTab() {
  const queryClient = useQueryClient();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<number>>(new Set());
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const { data: campaignGroups = [], isLoading } = useQuery<CampaignGroup[]>({
    queryKey: ["admin-campaign-submissions"],
    queryFn: () => api.admin.getCampaignSubmissions(),
  });

  const approveMutation = useMutation({
    mutationFn: (reservationId: number) => api.admin.approveSubmission(reservationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaign-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Submission approved and payment sent");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => api.admin.rejectSubmission(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaign-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setRejectDialogOpen(false);
      setRejectReason("");
      toast.success("Submission rejected");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleCampaign = (campaignId: number) => {
    setExpandedCampaigns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
      } else {
        newSet.add(campaignId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400">Loading submissions...</div>;
  }

  const totalPending = campaignGroups.reduce((acc, g) => acc + g.stats.submitted, 0);

  if (campaignGroups.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No campaigns with activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Campaign Submissions</h2>
          {totalPending > 0 && (
            <Badge className="bg-yellow-500 text-gray-900">{totalPending} Pending</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={filterStatus === "all" ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setFilterStatus("all")}
          >
            All
          </Badge>
          <Badge 
            variant={filterStatus === "pending" ? "default" : "secondary"}
            className="cursor-pointer bg-yellow-500/20 text-yellow-400"
            onClick={() => setFilterStatus("pending")}
          >
            Pending
          </Badge>
          <Badge 
            variant={filterStatus === "approved" ? "default" : "secondary"}
            className="cursor-pointer bg-green-500/20 text-green-400"
            onClick={() => setFilterStatus("approved")}
          >
            Approved
          </Badge>
          <Badge 
            variant={filterStatus === "rejected" ? "default" : "secondary"}
            className="cursor-pointer bg-red-500/20 text-red-400"
            onClick={() => setFilterStatus("rejected")}
          >
            Rejected
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {campaignGroups.map((group) => {
          const isExpanded = expandedCampaigns.has(group.campaign.id);
          
          const filteredSubmissions = filterStatus === "all" 
            ? group.submissions 
            : group.submissions.filter(s => {
                if (filterStatus === "pending") return s.reservation.status === "submitted";
                if (filterStatus === "approved") return s.reservation.status === "approved";
                if (filterStatus === "rejected") return s.reservation.status === "rejected";
                return true;
              });

          if (filterStatus !== "all" && filteredSubmissions.length === 0) return null;

          return (
            <Card 
              key={group.campaign.id} 
              className="bg-gray-800 border-gray-700 overflow-visible"
              data-testid={`campaign-group-${group.campaign.id}`}
            >
              <div 
                className="p-4 cursor-pointer hover-elevate rounded-t-md"
                onClick={() => toggleCampaign(group.campaign.id)}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <ChevronRight 
                      className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} 
                    />
                    <div>
                      <h3 className="text-lg font-bold text-white">{group.campaign.title}</h3>
                      <p className="text-sm text-gray-400">
                        {group.sponsor?.companyName || group.sponsor?.name || "Unknown Sponsor"} 
                        {" - "}Tier {group.campaign.tier}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 uppercase">Spots</div>
                      <div className="text-white font-semibold">
                        {group.campaign.totalSpots - group.campaign.spotsRemaining}/{group.campaign.totalSpots}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {group.stats.submitted > 0 && (
                        <Badge className="bg-yellow-500/20 text-yellow-400">
                          {group.stats.submitted} Pending
                        </Badge>
                      )}
                      {group.stats.approved > 0 && (
                        <Badge className="bg-green-500/20 text-green-400">
                          {group.stats.approved} Approved
                        </Badge>
                      )}
                      {group.stats.rejected > 0 && (
                        <Badge className="bg-red-500/20 text-red-400">
                          {group.stats.rejected} Rejected
                        </Badge>
                      )}
                      {group.stats.reserved > 0 && (
                        <Badge className="bg-blue-500/20 text-blue-400">
                          {group.stats.reserved} Reserved
                        </Badge>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-gray-500 uppercase">Payment</div>
                      <div className="text-green-400 font-semibold">
                        {group.campaign.isPromotional ? (
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4" /> {group.campaign.starReward} Stars
                          </span>
                        ) : (
                          formatINR(group.campaign.payAmount)
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                      style={{ width: `${group.stats.spotsFilledPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>{group.stats.spotsFilledPercent}% Spots Filled</span>
                    <span>{group.campaign.spotsRemaining} spots remaining</span>
                  </div>
                </div>
              </div>

              {isExpanded && filteredSubmissions.length > 0 && (
                <div className="border-t border-gray-700 p-4 space-y-3">
                  {filteredSubmissions.map((item, idx) => (
                    <div 
                      key={item.reservation.id}
                      className={`p-3 rounded-lg ${
                        item.reservation.status === "submitted" ? "bg-yellow-500/10 border border-yellow-500/30" :
                        item.reservation.status === "approved" ? "bg-green-500/10 border border-green-500/30" :
                        "bg-red-500/10 border border-red-500/30"
                      }`}
                      data-testid={`submission-item-${item.reservation.id}`}
                    >
                      <div className="flex justify-between items-start gap-4 flex-wrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-purple-600 text-white text-xs">
                                {item.user?.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-white">{item.user?.name || "Unknown"}</p>
                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Instagram className="h-3 w-3" />
                                @{item.user?.instagramUsername || "N/A"}
                              </p>
                            </div>
                          </div>
                          
                          {item.submission && (
                            <div className="ml-10">
                              <a
                                href={item.submission.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline flex items-center gap-1 text-sm"
                                data-testid={`link-submission-${item.reservation.id}`}
                              >
                                <ExternalLink className="h-4 w-4" />
                                View Submission
                              </a>
                              <p className="text-xs text-gray-500 mt-1">
                                Submitted: {new Date(item.submission.submittedAt).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {item.reservation.status === "submitted" ? (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  approveMutation.mutate(item.reservation.id);
                                }}
                                disabled={approveMutation.isPending}
                                data-testid={`button-approve-${item.reservation.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSubmission({ reservation: item.reservation, user: item.user });
                                  setRejectDialogOpen(true);
                                }}
                                data-testid={`button-reject-${item.reservation.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          ) : item.reservation.status === "approved" ? (
                            <Badge className="bg-green-600 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge className="bg-red-600 text-white">
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejected
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isExpanded && filteredSubmissions.length === 0 && (
                <div className="border-t border-gray-700 p-4 text-center text-gray-500">
                  No submissions in this category
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Submission</DialogTitle>
            <DialogDescription className="text-gray-400">
              The campaign spot will be returned.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Reason</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedSubmission && rejectMutation.mutate({ id: selectedSubmission.reservation.id, reason: rejectReason })}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Processing..." : "Reject Submission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface AdminCampaignGroup {
  title: string;
  brand: string;
  campaigns: ApiCampaign[];
  totalSpots: number;
  filledSpots: number;
  totalBudget: number;
  isActive: boolean;
  isPending: boolean;
}

function CampaignsTab() {
  const queryClient = useQueryClient();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [bulkConvertDialogOpen, setBulkConvertDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<ApiCampaign | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<AdminCampaignGroup | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isPromotional, setIsPromotional] = useState(false);
  const [starReward, setStarReward] = useState(0);
  const [convertStarReward, setConvertStarReward] = useState(1);
  const [bulkStarReward, setBulkStarReward] = useState(1);
  const [bulkConverting, setBulkConverting] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: () => api.admin.getCampaigns(),
  });

  const { data: pendingCampaigns = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["admin-pending-campaigns"],
    queryFn: () => api.admin.getPendingApprovalCampaigns(),
  });

  const getBaseTitle = (title: string) => {
    return title.replace(/\s*\(Tier\s*\d+\)\s*$/i, '').trim();
  };

  const pendingCampaignGroups = useMemo(() => {
    const groups: Map<string, AdminCampaignGroup> = new Map();
    
    pendingCampaigns.forEach(campaign => {
      const baseTitle = getBaseTitle(campaign.title);
      
      if (!groups.has(baseTitle)) {
        groups.set(baseTitle, {
          title: baseTitle,
          brand: campaign.brand,
          campaigns: [],
          totalSpots: 0,
          filledSpots: 0,
          totalBudget: 0,
          isActive: false,
          isPending: true,
        });
      }
      
      const group = groups.get(baseTitle)!;
      group.campaigns.push(campaign);
      group.totalSpots += campaign.totalSpots;
      group.filledSpots += (campaign.totalSpots - campaign.spotsRemaining);
      group.totalBudget += parseFloat(campaign.payAmount) * campaign.totalSpots;
    });

    groups.forEach(group => {
      group.campaigns.sort((a, b) => {
        const tierA = parseInt(a.tier.replace(/\D/g, '')) || 0;
        const tierB = parseInt(b.tier.replace(/\D/g, '')) || 0;
        return tierA - tierB;
      });
    });

    return Array.from(groups.values());
  }, [pendingCampaigns]);

  const approvedCampaignGroups = useMemo(() => {
    const groups: Map<string, AdminCampaignGroup> = new Map();
    
    campaigns.forEach(campaign => {
      const baseTitle = getBaseTitle(campaign.title);
      
      if (!groups.has(baseTitle)) {
        groups.set(baseTitle, {
          title: baseTitle,
          brand: campaign.brand,
          campaigns: [],
          totalSpots: 0,
          filledSpots: 0,
          totalBudget: 0,
          isActive: false,
          isPending: false,
        });
      }
      
      const group = groups.get(baseTitle)!;
      group.campaigns.push(campaign);
      group.totalSpots += campaign.totalSpots;
      group.filledSpots += (campaign.totalSpots - campaign.spotsRemaining);
      group.totalBudget += parseFloat(campaign.payAmount) * campaign.totalSpots;
      if (campaign.spotsRemaining > 0 && campaign.status === "active" && campaign.isApproved) {
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

  // Active campaign groups (with active/paused campaigns)
  const activeCampaignGroups = useMemo(() => {
    return approvedCampaignGroups
      .map(group => ({
        ...group,
        campaigns: group.campaigns.filter(c => c.isApproved && (c.status === "active" || c.status === "paused")),
      }))
      .filter(group => group.campaigns.length > 0);
  }, [approvedCampaignGroups]);

  // Completed campaign groups
  const completedCampaignGroups = useMemo(() => {
    return approvedCampaignGroups
      .map(group => ({
        ...group,
        campaigns: group.campaigns.filter(c => c.isApproved && (c.status === "completed" || c.spotsRemaining === 0)),
      }))
      .filter(group => group.campaigns.length > 0);
  }, [approvedCampaignGroups]);

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.admin.updateCampaignStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      toast.success("Campaign status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const approveCampaignMutation = useMutation({
    mutationFn: ({ campaignId, isPromotional, starReward }: { campaignId: number; isPromotional: boolean; starReward: number }) => 
      api.admin.approveCampaign(campaignId, isPromotional, starReward),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setApproveDialogOpen(false);
      setIsPromotional(false);
      setStarReward(0);
      toast.success("Campaign approved and is now live!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const rejectCampaignMutation = useMutation({
    mutationFn: ({ campaignId, reason }: { campaignId: number; reason: string }) => api.admin.rejectCampaign(campaignId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setRejectDialogOpen(false);
      setRejectReason("");
      toast.success("Campaign rejected");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const convertToStarsMutation = useMutation({
    mutationFn: ({ campaignId, starReward }: { campaignId: number; starReward: number }) => 
      fetch(`/api/admin/campaigns/${campaignId}/convert-to-promotional`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ starReward }),
      }).then(res => {
        if (!res.ok) throw new Error("Failed to convert campaign");
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      setConvertDialogOpen(false);
      setConvertStarReward(1);
      toast.success("Campaign converted to star-based promotional campaign!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const convertToMoneyMutation = useMutation({
    mutationFn: (campaignId: number) => 
      fetch(`/api/admin/campaigns/${campaignId}/convert-to-money`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }).then(res => {
        if (!res.ok) throw new Error("Failed to convert campaign");
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      toast.success("Campaign converted back to money-based!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading || pendingLoading) {
    return <div className="text-center py-8 text-gray-400">Loading campaigns...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Pending Approval Section - Grouped by Title */}
      {pendingCampaignGroups.length > 0 && (
        <div>
          <h3 className="text-lg lg:text-xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 lg:h-6 lg:w-6" />
            Pending Approval ({pendingCampaignGroups.length} {pendingCampaignGroups.length === 1 ? 'campaign' : 'campaigns'})
          </h3>
          
          <div className="space-y-3">
            {pendingCampaignGroups.map((group) => {
              const isExpanded = expandedGroups.has(`pending-${group.title}`);
              const tiersText = group.campaigns.map(c => c.tier).join(", ");
              
              return (
                <Card key={group.title} className="bg-yellow-500/10 border-2 border-yellow-400" data-testid={`card-pending-group-${group.title}`}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div 
                        className="flex items-start justify-between gap-2 cursor-pointer"
                        onClick={() => toggleGroup(`pending-${group.title}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <ChevronRight className={`h-4 w-4 text-yellow-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            <p className="text-white font-semibold text-base">{group.title}</p>
                          </div>
                          <p className="text-sm text-gray-400 ml-6">{group.brand}</p>
                        </div>
                        <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-400">
                          {group.campaigns.length} {group.campaigns.length === 1 ? 'tier' : 'tiers'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm ml-6">
                        <div>
                          <span className="text-gray-400">Total Budget:</span>
                          <p className="text-green-300 font-semibold">{formatINR(group.totalBudget.toString())}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Total Spots:</span>
                          <p className="text-white font-medium">{group.totalSpots}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-400">Tiers:</span>
                          <p className="text-white font-medium">{tiersText}</p>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 ml-6 space-y-2 border-t border-yellow-400/30 pt-4">
                          {group.campaigns.map((campaign) => (
                            <div key={campaign.id} className="flex items-center justify-between gap-2 p-3 bg-gray-800/50 rounded-lg" data-testid={`row-pending-campaign-${campaign.id}`}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-gray-600 text-white text-xs">{campaign.tier}</Badge>
                                  <span className="text-green-300 font-semibold">{formatINR(campaign.payAmount)}</span>
                                  <span className="text-gray-400">x {campaign.totalSpots} spots</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  size="sm"
                                  className="bg-green-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCampaign(campaign);
                                    setIsPromotional(false);
                                    setStarReward(0);
                                    setApproveDialogOpen(true);
                                  }}
                                  data-testid={`button-approve-campaign-${campaign.id}`}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCampaign(campaign);
                                    setRejectDialogOpen(true);
                                  }}
                                  data-testid={`button-reject-campaign-${campaign.id}`}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {!isExpanded && (
                        <div className="flex gap-2 pt-2 ml-6">
                          <Button
                            size="sm"
                            className="bg-green-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              group.campaigns.forEach(campaign => {
                                approveCampaignMutation.mutate({ campaignId: campaign.id, isPromotional: false, starReward: 0 });
                              });
                            }}
                            data-testid={`button-approve-all-${group.title}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve All ({group.campaigns.length})
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleGroup(`pending-${group.title}`)}
                          >
                            View Tiers
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs for Active and Completed Campaigns */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-gray-800 border border-gray-700">
          <TabsTrigger value="active" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <Play className="h-4 w-4 mr-2" />
            Active ({activeCampaignGroups.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <CheckCircle className="h-4 w-4 mr-2" />
            Completed ({completedCampaignGroups.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
                <Play className="h-6 w-6" />
                ACTIVE CAMPAIGNS
              </h3>
              <div className="flex gap-2">
                <Badge className="bg-green-500 text-white">
                  {activeCampaignGroups.length} {activeCampaignGroups.length === 1 ? 'campaign' : 'campaigns'}
                </Badge>
              </div>
            </div>
          </div>
          
          <ScrollArea className="h-[600px]">
            <div className="space-y-3 pr-2">
              {activeCampaignGroups.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active campaigns</p>
                </div>
              ) : (
                activeCampaignGroups.map((group) => {
                  const isExpanded = expandedGroups.has(`active-${group.title}`);
                  const tiersText = group.campaigns.map(c => c.tier).join(", ");
                  const totalGroupBudget = group.campaigns.reduce((sum, c) => sum + parseFloat(c.totalBudget || "0"), 0);
                  const totalGroupSpots = group.campaigns.reduce((sum, c) => sum + c.totalSpots, 0);
                  const totalGroupSpotsRemaining = group.campaigns.reduce((sum, c) => sum + c.spotsRemaining, 0);
                  
                  return (
                    <Card key={group.title} className="bg-green-500/10 border-2 border-green-500/50" data-testid={`card-active-group-${group.title}`}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div 
                            className="flex items-start justify-between gap-2 cursor-pointer"
                            onClick={() => toggleGroup(`active-${group.title}`)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <ChevronRight className={`h-4 w-4 text-green-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                <p className="text-white font-semibold text-base">{group.title}</p>
                              </div>
                              <p className="text-sm text-gray-400 ml-6">{group.brand}</p>
                            </div>
                            <Badge className="bg-green-500/20 text-green-300 border border-green-400">
                              {group.campaigns.length} {group.campaigns.length === 1 ? 'tier' : 'tiers'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm ml-6">
                            <div>
                              <span className="text-gray-400">Total Budget:</span>
                              <p className="text-blue-300 font-semibold">{formatINR(totalGroupBudget.toString())}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Total Spots:</span>
                              <p className="text-white font-medium">{totalGroupSpots - totalGroupSpotsRemaining}/{totalGroupSpots}</p>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-400">Tiers:</span>
                              <p className="text-white font-medium">{tiersText}</p>
                            </div>
                          </div>

                          {/* Bulk Convert to Stars Button */}
                          {group.campaigns.some(c => !c.isPromotional) && (
                            <div className="ml-6">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-yellow-300 border-yellow-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGroup(group);
                                  setBulkStarReward(1);
                                  setBulkConvertDialogOpen(true);
                                }}
                                data-testid={`button-bulk-convert-stars-${group.title}`}
                              >
                                <Star className="h-4 w-4 mr-1" />
                                Convert All to Stars
                              </Button>
                              {group.campaigns.some(c => c.isPromotional) && (
                                <span className="text-xs text-gray-400 ml-2">
                                  ({group.campaigns.filter(c => !c.isPromotional).length} non-promo tiers)
                                </span>
                              )}
                            </div>
                          )}

                          {/* If all are already promotional, show "Convert All to Money" */}
                          {group.campaigns.every(c => c.isPromotional) && (
                            <div className="ml-6">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-300 border-green-500"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setBulkConverting(true);
                                  try {
                                    for (const campaign of group.campaigns) {
                                      const res = await fetch(`/api/admin/campaigns/${campaign.id}/convert-to-money`, {
                                        method: "POST",
                                        credentials: "include",
                                      });
                                      if (!res.ok) {
                                        const error = await res.json();
                                        throw new Error(error.error || "Failed to convert");
                                      }
                                    }
                                    toast.success(`All ${group.campaigns.length} tiers converted to money!`);
                                    queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
                                  } catch (error: any) {
                                    toast.error(error.message || "Failed to convert");
                                  } finally {
                                    setBulkConverting(false);
                                  }
                                }}
                                disabled={bulkConverting}
                                data-testid={`button-bulk-convert-money-${group.title}`}
                              >
                                <IndianRupee className="h-4 w-4 mr-1" />
                                {bulkConverting ? "Converting..." : "Convert All to Money"}
                              </Button>
                            </div>
                          )}

                          {isExpanded && (
                            <div className="mt-4 ml-6 space-y-2 border-t border-green-400/30 pt-4">
                              {group.campaigns.map((campaign) => {
                                const totalBudget = parseFloat(campaign.totalBudget || "0");
                                const released = parseFloat(campaign.releasedAmount || "0");
                                
                                return (
                                  <div key={campaign.id} className="p-3 bg-gray-800/50 rounded-lg space-y-2" data-testid={`row-active-campaign-${campaign.id}`}>
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className="bg-gray-600 text-white text-xs">{campaign.tier}</Badge>
                                        {campaign.isPromotional ? (
                                          <span className="text-yellow-300 font-semibold flex items-center gap-1">
                                            <Star className="h-3 w-3" /> {campaign.starReward} Stars
                                          </span>
                                        ) : (
                                          <span className="text-green-300 font-semibold">{formatINR(campaign.payAmount)}</span>
                                        )}
                                        <span className="text-gray-400">x {campaign.totalSpots} spots</span>
                                        <span className={`text-xs ${campaign.spotsRemaining === 0 ? "text-red-400" : "text-green-400"}`}>
                                          ({campaign.spotsRemaining} left)
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        {campaign.isPromotional && (
                                          <Badge className="bg-yellow-500 text-gray-900 text-xs">
                                            <Star className="h-3 w-3 mr-1" />
                                            Promo
                                          </Badge>
                                        )}
                                        <Badge className={campaign.status === "active" ? "bg-green-500 text-white" : "bg-yellow-500 text-gray-900"}>
                                          {campaign.status}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                      {campaign.status === "active" ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-white border-gray-500"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateStatusMutation.mutate({ id: campaign.id, status: "paused" });
                                          }}
                                          data-testid={`button-pause-campaign-${campaign.id}`}
                                        >
                                          <Pause className="h-4 w-4 mr-1" />
                                          Pause
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-white border-gray-500"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateStatusMutation.mutate({ id: campaign.id, status: "active" });
                                          }}
                                          data-testid={`button-activate-campaign-${campaign.id}`}
                                        >
                                          <Play className="h-4 w-4 mr-1" />
                                          Activate
                                        </Button>
                                      )}
                                      {campaign.isPromotional ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-yellow-300 border-yellow-500"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            convertToMoneyMutation.mutate(campaign.id);
                                          }}
                                          data-testid={`button-convert-to-money-${campaign.id}`}
                                        >
                                          <IndianRupee className="h-4 w-4 mr-1" />
                                          To Money
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-yellow-300 border-yellow-500"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCampaign(campaign);
                                            setConvertStarReward(1);
                                            setConvertDialogOpen(true);
                                          }}
                                          data-testid={`button-convert-to-stars-${campaign.id}`}
                                        >
                                          <Star className="h-4 w-4 mr-1" />
                                          To Stars
                                        </Button>
                                      )}
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-400 border-red-500"
                                            data-testid={`button-delete-campaign-${campaign.id}`}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-gray-900 border-gray-800">
                                          <AlertDialogHeader>
                                            <AlertDialogTitle className="text-white">Delete Campaign?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-gray-400">
                                              Are you sure you want to delete "{campaign.title}" ({campaign.tier})? This action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700">Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              className="bg-red-500 text-white hover:bg-red-600"
                                              onClick={async () => {
                                                try {
                                                  const res = await fetch(`/api/campaigns/${campaign.id}`, {
                                                    method: "DELETE",
                                                    credentials: "include",
                                                  });
                                                  if (!res.ok) {
                                                    const error = await res.json();
                                                    throw new Error(error.error || "Failed to delete");
                                                  }
                                                  toast.success("Campaign deleted successfully!");
                                                  queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
                                                } catch (error: any) {
                                                  toast.error(error.message || "Failed to delete campaign");
                                                }
                                              }}
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {!isExpanded && group.campaigns.length > 1 && (
                            <div className="flex gap-2 pt-2 ml-6">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleGroup(`active-${group.title}`)}
                              >
                                View All Tiers
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-purple-400 flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                COMPLETED CAMPAIGNS
              </h3>
              <Badge className="bg-purple-500 text-white">
                {completedCampaignGroups.length} {completedCampaignGroups.length === 1 ? 'campaign' : 'campaigns'}
              </Badge>
            </div>
          </div>
          
          <ScrollArea className="h-[600px]">
            <div className="space-y-3 pr-2">
              {completedCampaignGroups.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No completed campaigns yet</p>
                  <p className="text-sm mt-2">Campaigns will appear here when marked as complete</p>
                </div>
              ) : (
                completedCampaignGroups.map((group) => {
                  const isExpanded = expandedGroups.has(`completed-${group.title}`);
                  const tiersText = group.campaigns.map(c => c.tier).join(", ");
                  const totalGroupBudget = group.campaigns.reduce((sum, c) => sum + parseFloat(c.totalBudget || "0"), 0);
                  const totalGroupReleased = group.campaigns.reduce((sum, c) => sum + parseFloat(c.releasedAmount || "0"), 0);
                  const totalGroupSpots = group.campaigns.reduce((sum, c) => sum + c.totalSpots, 0);
                  const totalGroupSpotsUsed = group.campaigns.reduce((sum, c) => sum + (c.totalSpots - c.spotsRemaining), 0);
                  
                  return (
                    <Card key={group.title} className="bg-purple-500/10 border-2 border-purple-500/50" data-testid={`card-completed-group-${group.title}`}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div 
                            className="flex items-start justify-between gap-2 cursor-pointer"
                            onClick={() => toggleGroup(`completed-${group.title}`)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <ChevronRight className={`h-4 w-4 text-purple-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                <p className="text-white font-semibold text-base">{group.title}</p>
                              </div>
                              <p className="text-sm text-gray-400 ml-6">{group.brand}</p>
                            </div>
                            <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400">
                              {group.campaigns.length} {group.campaigns.length === 1 ? 'tier' : 'tiers'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm ml-6">
                            <div>
                              <span className="text-gray-400">Total Budget:</span>
                              <p className="text-blue-300 font-semibold">{formatINR(totalGroupBudget.toString())}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Released:</span>
                              <p className="text-green-300 font-semibold">{formatINR(totalGroupReleased.toString())}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Spots Used:</span>
                              <p className="text-white font-medium">{totalGroupSpotsUsed}/{totalGroupSpots}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Tiers:</span>
                              <p className="text-white font-medium">{tiersText}</p>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 ml-6 space-y-2 border-t border-purple-400/30 pt-4">
                              {group.campaigns.map((campaign) => {
                                const totalBudget = parseFloat(campaign.totalBudget || "0");
                                const released = parseFloat(campaign.releasedAmount || "0");
                                
                                return (
                                  <div key={campaign.id} className="p-3 bg-gray-800/50 rounded-lg" data-testid={`row-completed-campaign-${campaign.id}`}>
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <Badge className="bg-gray-600 text-white text-xs">{campaign.tier}</Badge>
                                        <span className="text-green-300 font-semibold">{formatINR(campaign.payAmount)}</span>
                                        <span className="text-gray-400">x {campaign.totalSpots} spots</span>
                                      </div>
                                      <span className="text-green-300 text-sm">Released: {formatINR(released.toString())}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {!isExpanded && group.campaigns.length > 1 && (
                            <div className="flex gap-2 pt-2 ml-6">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleGroup(`completed-${group.title}`)}
                              >
                                View All Tiers
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Approve Campaign Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-green-400">Approve Campaign</DialogTitle>
            <DialogDescription className="text-gray-400">
              Approve "{selectedCampaign?.title}" - You can also make it promotional with star rewards
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Campaign Details */}
            <div className="bg-gray-700/50 p-4 rounded-lg space-y-2">
              <p className="text-white font-semibold">{selectedCampaign?.title}</p>
              <p className="text-gray-300 text-sm">{selectedCampaign?.brand}</p>
              <div className="flex items-center gap-4">
                <p className="text-green-400">{selectedCampaign && formatINR(selectedCampaign.payAmount)} per creator</p>
                <p className="text-blue-400">{selectedCampaign?.totalSpots} spots</p>
              </div>
              <p className="text-gray-400 text-sm">{selectedCampaign?.tier}</p>
            </div>
            
            {/* Promotional Toggle */}
            <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div>
                <Label className="text-yellow-300 font-semibold">Make Promotional Campaign</Label>
                <p className="text-sm text-gray-400">Golden highlight, star rewards for creators</p>
              </div>
              <Button
                size="sm"
                variant={isPromotional ? "default" : "outline"}
                className={isPromotional ? "bg-yellow-500 hover:bg-yellow-600 text-gray-900" : ""}
                onClick={() => setIsPromotional(!isPromotional)}
              >
                {isPromotional ? "Yes" : "No"}
              </Button>
            </div>

            {/* Star Reward Input - Only show if promotional */}
            {isPromotional && (
              <div className="space-y-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <Label className="text-yellow-300 font-semibold">Star Reward</Label>
                <p className="text-sm text-gray-400 mb-2">How many stars will creators earn for this campaign?</p>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={starReward}
                  onChange={(e) => setStarReward(parseInt(e.target.value) || 0)}
                  placeholder="Enter star reward (e.g., 5)"
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 5, 10].map((stars) => (
                    <Button
                      key={stars}
                      size="sm"
                      variant={starReward === stars ? "default" : "outline"}
                      className={starReward === stars ? "bg-yellow-500 text-gray-900" : ""}
                      onClick={() => setStarReward(stars)}
                    >
                      {stars} Star{stars > 1 ? "s" : ""}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => selectedCampaign && approveCampaignMutation.mutate({ 
                campaignId: selectedCampaign.id, 
                isPromotional, 
                starReward: isPromotional ? starReward : 0 
              })}
              disabled={approveCampaignMutation.isPending || (isPromotional && starReward <= 0)}
            >
              {approveCampaignMutation.isPending ? "Processing..." : isPromotional ? `Approve as Promotional (${starReward} Stars)` : "Approve Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Campaign Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Reject Campaign</DialogTitle>
            <DialogDescription className="text-gray-400">
              Provide a reason for rejecting "{selectedCampaign?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection (will be sent to sponsor)"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedCampaign && rejectCampaignMutation.mutate({ campaignId: selectedCampaign.id, reason: rejectReason })}
              disabled={rejectCampaignMutation.isPending}
            >
              {rejectCampaignMutation.isPending ? "Processing..." : "Reject Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Stars Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 flex items-center gap-2">
              <Star className="h-5 w-5" />
              Convert to Star-Based Campaign
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Convert "{selectedCampaign?.title}" to a promotional campaign with star rewards
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-gray-700/50 p-4 rounded-lg space-y-2">
              <p className="text-white font-semibold">{selectedCampaign?.title}</p>
              <p className="text-gray-300 text-sm">{selectedCampaign?.brand}</p>
              <p className="text-gray-400 text-sm">{selectedCampaign?.tier}</p>
            </div>
            
            <div className="space-y-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <Label className="text-yellow-300 font-semibold">Select Star Reward</Label>
              <p className="text-sm text-gray-400 mb-2">How many stars will creators earn for this campaign?</p>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5].map((stars) => (
                  <Button
                    key={stars}
                    size="sm"
                    variant={convertStarReward === stars ? "default" : "outline"}
                    className={convertStarReward === stars ? "bg-yellow-500 text-gray-900" : "text-white border-gray-500"}
                    onClick={() => setConvertStarReward(stars)}
                  >
                    {stars} Star{stars > 1 ? "s" : ""}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                Creators who complete this campaign will earn {convertStarReward} star{convertStarReward > 1 ? "s" : ""}.
                When they collect 5 stars, they can redeem rewards!
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="text-white border-gray-500" onClick={() => setConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
              onClick={() => selectedCampaign && convertToStarsMutation.mutate({ 
                campaignId: selectedCampaign.id, 
                starReward: convertStarReward 
              })}
              disabled={convertToStarsMutation.isPending}
            >
              {convertToStarsMutation.isPending ? "Converting..." : `Convert to ${convertStarReward} Stars`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Convert to Stars Dialog */}
      <Dialog open={bulkConvertDialogOpen} onOpenChange={setBulkConvertDialogOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 flex items-center gap-2">
              <Star className="h-5 w-5" />
              Convert All Tiers to Stars
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Convert all {selectedGroup?.campaigns.filter(c => !c.isPromotional).length} non-promotional tiers of "{selectedGroup?.title}" to star-based campaigns
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-gray-700/50 p-4 rounded-lg space-y-2">
              <p className="text-white font-semibold">{selectedGroup?.title}</p>
              <p className="text-gray-300 text-sm">{selectedGroup?.brand}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedGroup?.campaigns.map(c => (
                  <Badge 
                    key={c.id} 
                    className={c.isPromotional ? "bg-yellow-500/20 text-yellow-300" : "bg-gray-600 text-white"}
                  >
                    {c.tier} {c.isPromotional && "(already promo)"}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <Label className="text-yellow-300 font-semibold">Select Star Reward (for all tiers)</Label>
              <p className="text-sm text-gray-400 mb-2">How many stars will creators earn for each campaign tier?</p>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5].map((stars) => (
                  <Button
                    key={stars}
                    size="sm"
                    variant={bulkStarReward === stars ? "default" : "outline"}
                    className={bulkStarReward === stars ? "bg-yellow-500 text-gray-900" : "text-white border-gray-500"}
                    onClick={() => setBulkStarReward(stars)}
                  >
                    {stars} Star{stars > 1 ? "s" : ""}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                All {selectedGroup?.campaigns.filter(c => !c.isPromotional).length} non-promotional tiers will be converted.
                Each tier will reward {bulkStarReward} star{bulkStarReward > 1 ? "s" : ""} to creators.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="text-white border-gray-500" onClick={() => setBulkConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
              onClick={async () => {
                if (!selectedGroup) return;
                setBulkConverting(true);
                try {
                  const nonPromoCampaigns = selectedGroup.campaigns.filter(c => !c.isPromotional);
                  for (const campaign of nonPromoCampaigns) {
                    const res = await fetch(`/api/admin/campaigns/${campaign.id}/convert-to-promotional`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ starReward: bulkStarReward }),
                    });
                    if (!res.ok) {
                      const err = await res.json();
                      throw new Error(err.error || "Failed to convert");
                    }
                  }
                  toast.success(`All ${nonPromoCampaigns.length} tiers converted to ${bulkStarReward} star${bulkStarReward > 1 ? "s" : ""}!`);
                  queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
                  setBulkConvertDialogOpen(false);
                } catch (error: any) {
                  toast.error(error.message || "Failed to convert campaigns");
                } finally {
                  setBulkConverting(false);
                }
              }}
              disabled={bulkConverting}
            >
              {bulkConverting ? "Converting..." : `Convert All to ${bulkStarReward} Stars`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VerificationsTab() {
  const queryClient = useQueryClient();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"pending" | "verified">("pending");

  const { data: pendingUsers = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["admin-pending-verifications"],
    queryFn: () => api.admin.getPendingVerifications(),
  });

  const { data: verifiedUsers = [], isLoading: verifiedLoading } = useQuery({
    queryKey: ["admin-verified-instagram-users"],
    queryFn: () => api.admin.getVerifiedInstagramUsers(),
  });

  const approveMutation = useMutation({
    mutationFn: (userId: number) => api.admin.verifyInstagram(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-verified-instagram-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Instagram verification approved");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason: string }) => api.admin.rejectInstagram(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setRejectDialogOpen(false);
      setRejectReason("");
      toast.success("Verification rejected");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const isLoading = activeSubTab === "pending" ? pendingLoading : verifiedLoading;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button
          variant={activeSubTab === "pending" ? "default" : "outline"}
          onClick={() => setActiveSubTab("pending")}
          className={`flex items-center gap-2 ${activeSubTab !== "pending" ? "text-white border-gray-500" : ""}`}
          data-testid="button-pending-verifications"
        >
          <Clock className="h-4 w-4" />
          Pending ({pendingUsers.length})
        </Button>
        <Button
          variant={activeSubTab === "verified" ? "default" : "outline"}
          onClick={() => setActiveSubTab("verified")}
          className={`flex items-center gap-2 ${activeSubTab !== "verified" ? "text-white border-gray-500" : ""}`}
          data-testid="button-verified-accounts"
        >
          <CheckCircle className="h-4 w-4" />
          Verified ({verifiedUsers.length})
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : activeSubTab === "pending" ? (
        pendingUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pending Instagram verifications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <Card key={user.id} className="bg-gray-800 border-gray-700" data-testid={`card-verification-${user.id}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white">{user.name}</h3>
                      <p className="text-sm text-gray-400">{user.email}</p>
                      <div className="flex items-center gap-2">
                        <Instagram className="h-5 w-5 text-pink-500" />
                        <span className="text-gray-300">{user.instagramUsername}</span>
                      </div>
                      {user.instagramProfileUrl && (
                        <a
                          href={user.instagramProfileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline flex items-center gap-1 text-sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Profile
                        </a>
                      )}
                      {user.instagramVerificationCode && (
                        <p className="text-sm text-gray-400">
                          Verification Code: <span className="text-yellow-400 font-mono">{user.instagramVerificationCode}</span>
                        </p>
                      )}
                      <p className="text-sm text-gray-400">
                        Followers: {user.instagramFollowers?.toLocaleString() || "Unknown"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                        }}
                        className="h-8 w-8 p-0"
                        data-testid={`button-view-verification-user-${user.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => approveMutation.mutate(user.id)}
                        disabled={approveMutation.isPending}
                        data-testid={`button-approve-verification-${user.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedUser(user);
                          setRejectDialogOpen(true);
                        }}
                        data-testid={`button-reject-verification-${user.id}`}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        verifiedUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Instagram className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No verified Instagram accounts yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {verifiedUsers.map((user) => (
              <Card key={user.id} className="bg-gray-800 border-gray-700" data-testid={`card-verified-user-${user.id}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{user.name}</h3>
                        <Badge className="bg-green-600 text-white">Verified</Badge>
                      </div>
                      <p className="text-sm text-gray-400">{user.email}</p>
                      <div className="flex items-center gap-2">
                        <Instagram className="h-5 w-5 text-pink-500" />
                        <span className="text-gray-300">@{user.instagramUsername}</span>
                      </div>
                      {user.instagramProfileUrl && (
                        <a
                          href={user.instagramProfileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline flex items-center gap-1 text-sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Profile
                        </a>
                      )}
                      <p className="text-sm text-gray-400">
                        Followers: {user.instagramFollowers?.toLocaleString() || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Country: {user.country || "Not specified"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(user);
                      }}
                      className="h-8 w-8 p-0"
                      data-testid={`button-view-verified-user-${user.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Reason</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && rejectMutation.mutate({ userId: selectedUser.id, reason: rejectReason })}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Processing..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UserDetailDialog
        user={selectedUser}
        open={!!selectedUser && !rejectDialogOpen}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}

interface AdminWallet {
  id: number;
  balance: string;
  totalEarnings: string;
  totalPayouts: string;
  totalRefunds: string;
}

interface AdminWalletTransaction {
  id: number;
  type: string;
  category: string;
  amount: string;
  description: string;
  relatedUserId: number | null;
  campaignId: number | null;
  createdAt: string;
}

interface SubscriptionPlan {
  id: number;
  planId: string;
  name: string;
  price: string;
  features: string[];
  canReserve: boolean;
  isActive: boolean;
  sortOrder: number;
}

function EditPlanForm({ 
  plan, 
  onSave, 
  onCancel, 
  isPending 
}: { 
  plan: SubscriptionPlan; 
  onSave: (updates: Partial<SubscriptionPlan>) => void; 
  onCancel: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(plan.name);
  const [price, setPrice] = useState(plan.price);
  const [features, setFeatures] = useState(plan.features.join(", "));
  const [canReserve, setCanReserve] = useState(plan.canReserve);

  const handleSave = () => {
    onSave({
      name,
      price,
      features: features.split(",").map(f => f.trim()).filter(f => f),
      canReserve,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-gray-300">Plan ID (read-only)</Label>
        <Input value={plan.planId} disabled className="bg-gray-600 border-gray-500 text-gray-400" />
      </div>
      <div>
        <Label className="text-gray-300">Plan Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-gray-700 border-gray-600 text-white"
        />
      </div>
      <div>
        <Label className="text-gray-300">Price (INR/month)</Label>
        <Input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="bg-gray-700 border-gray-600 text-white"
        />
      </div>
      <div>
        <Label className="text-gray-300">Features (comma-separated)</Label>
        <Textarea
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          className="bg-gray-700 border-gray-600 text-white"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={canReserve}
          onChange={(e) => setCanReserve(e.target.checked)}
          className="rounded"
        />
        <Label className="text-gray-300">Can Reserve Campaigns</Label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </div>
  );
}

function SettingsTab() {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState("wallet");
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [newPlan, setNewPlan] = useState({
    planId: "",
    name: "",
    price: "0",
    features: "",
    canReserve: false,
  });

  const { data: wallet, isLoading: walletLoading } = useQuery<AdminWallet>({
    queryKey: ["admin-wallet"],
    queryFn: async () => {
      const res = await fetch("/api/admin/wallet");
      if (!res.ok) throw new Error("Failed to fetch wallet");
      return res.json();
    },
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery<AdminWalletTransaction[]>({
    queryKey: ["admin-wallet-transactions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/wallet/transactions");
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["admin-subscription-plans"],
    queryFn: async () => {
      const res = await fetch("/api/admin/subscription-plans");
      if (!res.ok) throw new Error("Failed to fetch plans");
      return res.json();
    },
  });

  const { data: settingsData } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (plan: typeof newPlan) => {
      const res = await fetch("/api/admin/subscription-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...plan,
          features: plan.features.split(",").map(f => f.trim()).filter(f => f),
          sortOrder: plans.length,
        }),
      });
      if (!res.ok) throw new Error("Failed to create plan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-plans"] });
      toast.success("Subscription plan created!");
      setShowPlanDialog(false);
      setNewPlan({ planId: "", name: "", price: "0", features: "", canReserve: false });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SubscriptionPlan> & { id: number }) => {
      const res = await fetch(`/api/admin/subscription-plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update plan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-plans"] });
      toast.success("Plan updated!");
      setEditingPlan(null);
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/subscription-plans/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete plan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-plans"] });
      toast.success("Plan deleted!");
    },
  });

  const cashfreeConfigured = settingsData?.paymentGateway?.cashfree?.configured;
  const instagramConfigured = settingsData?.instagram?.configured;

  const subTabs = [
    { id: "wallet", label: "Admin Wallet", icon: IndianRupee },
    { id: "subscriptions", label: "Subscription Plans", icon: CreditCard },
    { id: "api-keys", label: "API Keys", icon: Settings },
    { id: "data-reset", label: "Data Reset", icon: Trash2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-2">
        {subTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeSubTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSubTab(tab.id)}
            className={`gap-2 ${activeSubTab === tab.id ? "" : "text-gray-300 border-gray-600"}`}
            data-testid={`tab-settings-${tab.id}`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.id === "wallet" ? "Wallet" : tab.id === "subscriptions" ? "Plans" : "API"}</span>
          </Button>
        ))}
      </div>

      {activeSubTab === "wallet" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <p className="text-sm text-gray-400">Current Balance</p>
                <p className="text-2xl font-bold text-green-500">{formatINR(wallet?.balance || "0")}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <p className="text-sm text-gray-400">Platform Earnings</p>
                <p className="text-2xl font-bold text-blue-500">{formatINR(wallet?.totalEarnings || "0")}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <p className="text-sm text-gray-400">Total Payouts</p>
                <p className="text-2xl font-bold text-orange-500">{formatINR(wallet?.totalPayouts || "0")}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <p className="text-sm text-gray-400">Total Refunds</p>
                <p className="text-2xl font-bold text-red-500">{formatINR(wallet?.totalRefunds || "0")}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <p className="text-gray-400">Loading transactions...</p>
              ) : transactions.length === 0 ? (
                <p className="text-gray-400">No transactions yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {transactions.slice(0, 50).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${tx.type === 'credit' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="text-white text-sm">{tx.description}</p>
                          <p className="text-gray-500 text-xs">{new Date(tx.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className={`font-medium ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{formatINR(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeSubTab === "subscriptions" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Subscription Plans</h3>
            <Button onClick={() => setShowPlanDialog(true)} className="gap-2" data-testid="button-add-plan">
              <Plus className="h-4 w-4" />
              Add Plan
            </Button>
          </div>

          {plansLoading ? (
            <p className="text-gray-400">Loading plans...</p>
          ) : plans.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <p className="text-gray-400 mb-4">No subscription plans configured yet</p>
                <Button onClick={() => setShowPlanDialog(true)}>Create First Plan</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-medium">{plan.name}</h4>
                            <Badge className={plan.isActive ? 'bg-green-600' : 'bg-gray-600'}>
                              {plan.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {plan.canReserve && <Badge className="bg-blue-600">Can Reserve</Badge>}
                          </div>
                          <p className="text-gray-400 text-sm">ID: {plan.planId} | Price: {formatINR(plan.price)}/month</p>
                          <p className="text-gray-500 text-xs mt-1">{plan.features.join(", ")}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-white border-gray-500"
                          onClick={() => setEditingPlan(plan)}
                          data-testid={`button-edit-plan-${plan.id}`}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-white border-gray-500"
                          onClick={() => updatePlanMutation.mutate({ id: plan.id, isActive: !plan.isActive })}
                          data-testid={`button-toggle-plan-${plan.id}`}
                        >
                          {plan.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deletePlanMutation.mutate(plan.id)}
                          data-testid={`button-delete-plan-${plan.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create Subscription Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Plan ID (e.g., free, pro, premium)</Label>
                  <Input
                    value={newPlan.planId}
                    onChange={(e) => setNewPlan({ ...newPlan, planId: e.target.value.toLowerCase() })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Plan Name</Label>
                  <Input
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Price (INR/month)</Label>
                  <Input
                    type="number"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Features (comma-separated)</Label>
                  <Textarea
                    value={newPlan.features}
                    onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
                    placeholder="Feature 1, Feature 2, Feature 3"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPlan.canReserve}
                    onChange={(e) => setNewPlan({ ...newPlan, canReserve: e.target.checked })}
                    className="rounded"
                  />
                  <Label className="text-gray-300">Can Reserve Campaigns</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPlanDialog(false)}>Cancel</Button>
                <Button onClick={() => createPlanMutation.mutate(newPlan)} disabled={createPlanMutation.isPending}>
                  {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Edit Subscription Plan</DialogTitle>
              </DialogHeader>
              {editingPlan && (
                <EditPlanForm
                  plan={editingPlan}
                  onSave={(updates) => {
                    updatePlanMutation.mutate({ id: editingPlan.id, ...updates });
                  }}
                  onCancel={() => setEditingPlan(null)}
                  isPending={updatePlanMutation.isPending}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {activeSubTab === "api-keys" && (
        <ApiKeysForm />
      )}

      {activeSubTab === "data-reset" && (
        <DataResetSection />
      )}
    </div>
  );
}

function DataResetSection() {
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/reset-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reset data");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      toast.success(`Data reset complete! Deleted: ${data.deleted.users} users, ${data.deleted.campaigns} campaigns, ${data.deleted.reservations} reservations, ${data.deleted.transactions} transactions`);
      setShowConfirmDialog(false);
      setConfirmText("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleReset = () => {
    if (confirmText === "RESET") {
      resetMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-red-950/30 border-red-700">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone - Reset All Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">
            This will permanently delete all data except admin accounts:
          </p>
          <ul className="text-gray-400 text-sm space-y-1 ml-4 list-disc">
            <li>All creator and sponsor accounts</li>
            <li>All campaigns and reservations</li>
            <li>All transactions and wallet balances</li>
            <li>All promo codes and notifications</li>
            <li>All groups and memberships</li>
            <li>Admin wallet will be reset to zero</li>
          </ul>
          <p className="text-red-400 font-medium">
            This action cannot be undone!
          </p>
          <Button 
            variant="destructive" 
            onClick={() => setShowConfirmDialog(true)}
            className="gap-2"
            data-testid="button-reset-data"
          >
            <Trash2 className="h-4 w-4" />
            Reset All Data
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Confirm Data Reset
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              This will permanently delete all users (except admins), campaigns, transactions, and other data. Type <span className="font-bold text-red-400">RESET</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type RESET to confirm"
              className="bg-gray-700 border-gray-600 text-white"
              data-testid="input-confirm-reset"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowConfirmDialog(false);
              setConfirmText("");
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReset}
              disabled={confirmText !== "RESET" || resetMutation.isPending}
              data-testid="button-confirm-reset"
            >
              {resetMutation.isPending ? "Resetting..." : "Delete All Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApiKeysForm() {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  
  const [apiKeys, setApiKeys] = useState({
    cashfree_app_id: "",
    cashfree_secret_key: "",
    instagram_app_id: "",
    instagram_app_secret: "",
    razorpay_key_id: "",
    razorpay_key_secret: "",
    stripe_publishable_key: "",
    stripe_secret_key: "",
    payu_merchant_key: "",
    payu_merchant_salt: "",
    payu_mode: "test",
    gmail_user: "",
    gmail_app_password: "",
    rapidapi_key: "",
  });

  const { data: savedKeys, isLoading } = useQuery({
    queryKey: ["admin-api-keys"],
    queryFn: async () => {
      const res = await fetch("/api/admin/api-keys");
      if (!res.ok) throw new Error("Failed to fetch API keys");
      return res.json();
    },
  });

  useEffect(() => {
    if (savedKeys) {
      setApiKeys(prev => ({
        ...prev,
        cashfree_app_id: savedKeys.cashfree_app_id || "",
        cashfree_secret_key: savedKeys.cashfree_secret_key || "",
        instagram_app_id: savedKeys.instagram_app_id || "",
        instagram_app_secret: savedKeys.instagram_app_secret || "",
        razorpay_key_id: savedKeys.razorpay_key_id || "",
        razorpay_key_secret: savedKeys.razorpay_key_secret || "",
        stripe_publishable_key: savedKeys.stripe_publishable_key || "",
        stripe_secret_key: savedKeys.stripe_secret_key || "",
        payu_merchant_key: savedKeys.payu_merchant_key || "",
        payu_merchant_salt: savedKeys.payu_merchant_salt || "",
        payu_mode: savedKeys.payu_mode || "test",
        gmail_user: savedKeys.gmail_user || "",
        gmail_app_password: savedKeys.gmail_app_password || "",
        rapidapi_key: savedKeys.rapidapi_key || "",
      }));
    }
  }, [savedKeys]);

  const saveMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save API key");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-api-keys"] });
    },
    onError: () => {
      toast.error("Failed to save API key");
    },
  });

  const saveMultipleMutation = useMutation({
    mutationFn: async (keys: { key: string; value: string }[]) => {
      for (const { key, value } of keys) {
        if (value) {
          const res = await fetch("/api/admin/api-keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ key, value }),
          });
          if (!res.ok) throw new Error("Failed to save API key");
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-api-keys"] });
      toast.success("Settings saved successfully!");
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  const handleSave = (key: string) => {
    const value = apiKeys[key as keyof typeof apiKeys];
    if (value) {
      saveMutation.mutate({ key, value });
    }
  };

  const handleSaveGroup = (keys: string[]) => {
    const keysToSave = keys.map(key => ({
      key,
      value: apiKeys[key as keyof typeof apiKeys]
    })).filter(k => k.value);
    
    if (keysToSave.length > 0) {
      saveMultipleMutation.mutate(keysToSave);
    }
  };

  const toggleShowPassword = (key: string) => {
    setShowPassword(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderKeyInputOnly = (
    key: string,
    label: string,
    placeholder: string,
    isSecret: boolean = false
  ) => {
    const value = apiKeys[key as keyof typeof apiKeys];
    const isConfigured = savedKeys?.[key] && savedKeys[key].length > 0;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-gray-300">{label}</Label>
          {isConfigured && (
            <Badge className="bg-green-600 text-xs">Configured</Badge>
          )}
        </div>
        <div className="relative">
          <Input
            type={isSecret && !showPassword[key] ? "password" : "text"}
            value={value}
            onChange={(e) => setApiKeys(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder={isConfigured ? "••••••••••••" : placeholder}
            className="bg-gray-700 border-gray-600 text-white pr-10"
            data-testid={`input-${key}`}
          />
          {isSecret && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => toggleShowPassword(key)}
            >
              {showPassword[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderKeyInput = (
    key: string,
    label: string,
    placeholder: string,
    isSecret: boolean = false
  ) => {
    const value = apiKeys[key as keyof typeof apiKeys];
    const isConfigured = savedKeys?.[key] && savedKeys[key].length > 0;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-gray-300">{label}</Label>
          {isConfigured && (
            <Badge className="bg-green-600 text-xs">Configured</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={isSecret && !showPassword[key] ? "password" : "text"}
              value={value}
              onChange={(e) => setApiKeys(prev => ({ ...prev, [key]: e.target.value }))}
              placeholder={isConfigured ? "••••••••••••" : placeholder}
              className="bg-gray-700 border-gray-600 text-white pr-10"
              data-testid={`input-${key}`}
            />
            {isSecret && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => toggleShowPassword(key)}
              >
                {showPassword[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
          </div>
          <Button
            onClick={() => handleSave(key)}
            disabled={!value || saveMutation.isPending}
            className="bg-green-600"
            data-testid={`button-save-${key}`}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="text-gray-400">Loading API keys...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-green-500" />
            Cashfree Payment Gateway
          </CardTitle>
          <p className="text-sm text-gray-400">For creator withdrawals and payouts</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderKeyInput("cashfree_app_id", "App ID", "Enter Cashfree App ID")}
          {renderKeyInput("cashfree_secret_key", "Secret Key", "Enter Cashfree Secret Key", true)}
          <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-xs text-gray-400">
              Get keys from <a href="https://merchant.cashfree.com" target="_blank" rel="noopener" className="text-blue-400 underline">Cashfree Dashboard</a> - Developers - API Keys
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            Instagram / Meta Integration
          </CardTitle>
          <p className="text-sm text-gray-400">For auto-fetching follower counts</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderKeyInput("instagram_app_id", "App ID", "Enter Meta App ID")}
          {renderKeyInput("instagram_app_secret", "App Secret", "Enter Meta App Secret", true)}
          
          <div className="p-3 bg-gray-900 rounded-lg">
            <Label className="text-gray-300 text-sm">OAuth Redirect URI (copy this to Meta)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={`${window.location.origin}/api/instagram/oauth-callback`}
                readOnly
                className="bg-gray-600 border-gray-500 text-gray-300 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/instagram/oauth-callback`);
                  toast.success("Copied!");
                }}
                data-testid="button-copy-redirect-uri"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-xs text-gray-400">
              Get keys from <a href="https://developers.facebook.com" target="_blank" rel="noopener" className="text-blue-400 underline">Meta Developers</a> - Create App - Instagram Basic Display
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-500" />
            Razorpay
          </CardTitle>
          <p className="text-sm text-gray-400">For sponsor wallet deposits</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderKeyInput("razorpay_key_id", "Key ID", "Enter Razorpay Key ID")}
          {renderKeyInput("razorpay_key_secret", "Key Secret", "Enter Razorpay Key Secret", true)}
          <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-xs text-gray-400">
              Get keys from <a href="https://dashboard.razorpay.com" target="_blank" rel="noopener" className="text-blue-400 underline">Razorpay Dashboard</a> - Settings - API Keys
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            Stripe (International Payments)
          </CardTitle>
          <p className="text-sm text-gray-400">For international sponsor wallet deposits (non-India)</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderKeyInputOnly("stripe_publishable_key", "Publishable Key", "pk_live_... or pk_test_...")}
          {renderKeyInputOnly("stripe_secret_key", "Secret Key", "sk_live_... or sk_test_...", true)}
          <Button
            onClick={() => handleSaveGroup(["stripe_publishable_key", "stripe_secret_key"])}
            disabled={(!apiKeys.stripe_publishable_key && !apiKeys.stripe_secret_key) || saveMultipleMutation.isPending}
            className="w-full bg-blue-600"
            data-testid="button-save-stripe"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMultipleMutation.isPending ? "Saving..." : "Save Stripe Settings"}
          </Button>
          <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-xs text-gray-400">
              Get keys from <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener" className="text-blue-400 underline">Stripe Dashboard</a> - Developers - API Keys
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-500" />
            PayU (Alternative India Payments)
          </CardTitle>
          <p className="text-sm text-gray-400">Alternative payment gateway for Indian sponsor wallet deposits</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderKeyInputOnly("payu_merchant_key", "Merchant Key", "Enter PayU Merchant Key")}
          {renderKeyInputOnly("payu_merchant_salt", "Merchant Salt", "Enter PayU Merchant Salt", true)}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Environment Mode</label>
            <select
              value={apiKeys.payu_mode}
              onChange={(e) => setApiKeys(prev => ({ ...prev, payu_mode: e.target.value }))}
              className="w-full bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2 text-sm"
              data-testid="select-payu-mode"
            >
              <option value="test">Test (Sandbox)</option>
              <option value="production">Production (Live)</option>
            </select>
          </div>
          <Button
            onClick={() => handleSaveGroup(["payu_merchant_key", "payu_merchant_salt", "payu_mode"])}
            disabled={(!apiKeys.payu_merchant_key && !apiKeys.payu_merchant_salt) || saveMultipleMutation.isPending}
            className="w-full bg-orange-600"
            data-testid="button-save-payu"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMultipleMutation.isPending ? "Saving..." : "Save PayU Settings"}
          </Button>
          <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-xs text-gray-400">
              Get keys from <a href="https://onboarding.payu.in" target="_blank" rel="noopener" className="text-blue-400 underline">PayU Dashboard</a> - API Keys section
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-red-500" />
            Gmail / Email Service (OTP Verification)
          </CardTitle>
          <p className="text-sm text-gray-400">Required for email OTP verification during signup</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderKeyInputOnly("gmail_user", "Gmail Address", "your-email@gmail.com")}
          {renderKeyInputOnly("gmail_app_password", "App Password", "Enter 16-character app password", true)}
          <Button
            onClick={() => handleSaveGroup(["gmail_user", "gmail_app_password"])}
            disabled={(!apiKeys.gmail_user && !apiKeys.gmail_app_password) || saveMultipleMutation.isPending}
            className="w-full bg-green-600"
            data-testid="button-save-gmail"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMultipleMutation.isPending ? "Saving..." : "Save Gmail Settings"}
          </Button>
          <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-xs text-gray-400">
              Generate app password from <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener" className="text-blue-400 underline">Google App Passwords</a> (requires 2-Step Verification)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-500" />
            RapidAPI (Instagram Followers)
          </CardTitle>
          <p className="text-sm text-gray-400">For fetching real Instagram follower counts</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderKeyInput("rapidapi_key", "RapidAPI Key", "Enter RapidAPI Key", true)}
          <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-xs text-gray-400">
              Get key from <a href="https://rapidapi.com/hub" target="_blank" rel="noopener" className="text-blue-400 underline">RapidAPI</a> - Subscribe to an Instagram API
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface PromoCode {
  id: number;
  code: string;
  type: string;
  discountPercent: number | null;
  trialDays: number | null;
  creditAmount: string | null;
  afterTrialAction: string | null;
  maxUses: number | null;
  currentUses: number;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

function PromoCodesTab() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCode, setNewCode] = useState({
    code: "",
    type: "trial",
    discountPercent: 20,
    trialDays: 7,
    creditAmount: 500,
    afterTrialAction: "downgrade" as "downgrade" | "continue",
    maxUses: "",
    validUntil: "",
  });

  const { data: promoCodes = [], isLoading } = useQuery<PromoCode[]>({
    queryKey: ["/api/admin/promo-codes"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newCode) => {
      const response = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code: data.code,
          type: data.type,
          discountPercent: data.type === "discount" ? data.discountPercent : null,
          trialDays: data.type === "trial" ? data.trialDays : null,
          creditAmount: data.type === "credit" ? data.creditAmount.toString() : null,
          afterTrialAction: data.type === "trial" ? data.afterTrialAction : null,
          maxUses: data.maxUses ? parseInt(data.maxUses) : null,
          validUntil: data.validUntil || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create promo code");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      setShowCreateDialog(false);
      setNewCode({ code: "", type: "trial", discountPercent: 20, trialDays: 7, creditAmount: 500, afterTrialAction: "downgrade", maxUses: "", validUntil: "" });
      toast.success("Promo code created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/promo-codes/${id}/toggle`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to toggle promo code");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      toast.success("Promo code status updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/promo-codes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete promo code");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      toast.success("Promo code deleted");
    },
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode({ ...newCode, code });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400">Loading promo codes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <p className="text-gray-400">Create and manage promotional codes for discounts and free trials</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-promo">
          <Plus className="h-4 w-4 mr-2" />
          Create Promo Code
        </Button>
      </div>

      <div className="grid gap-4">
        {promoCodes.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <Ticket className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No promo codes created yet</p>
              <p className="text-sm text-gray-500 mt-1">Click the button above to create your first promo code</p>
            </CardContent>
          </Card>
        ) : (
          promoCodes.map((promo) => (
            <Card key={promo.id} className={`bg-gray-800 border-gray-700 ${!promo.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <code className="text-xl font-mono font-bold text-white bg-gray-700 px-3 py-1 rounded">
                        {promo.code}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(promo.code)}
                        data-testid={`button-copy-${promo.id}`}
                      >
                        <Copy className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                    <Badge variant={promo.type === "trial" ? "default" : "secondary"}>
                      {promo.type === "trial" ? (
                        <><Calendar className="h-3 w-3 mr-1" /> {promo.trialDays} Days Trial</>
                      ) : (
                        <><Percent className="h-3 w-3 mr-1" /> {promo.discountPercent}% Off</>
                      )}
                    </Badge>
                    <Badge variant={promo.isActive ? "outline" : "destructive"}>
                      {promo.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>
                      Uses: {promo.currentUses}{promo.maxUses ? `/${promo.maxUses}` : " (unlimited)"}
                    </span>
                    {promo.validUntil && (
                      <span>
                        Expires: {new Date(promo.validUntil).toLocaleDateString()}
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleMutation.mutate(promo.id)}
                        data-testid={`button-toggle-${promo.id}`}
                      >
                        {promo.isActive ? (
                          <ToggleRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-gray-500" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(promo.id)}
                        data-testid={`button-delete-${promo.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create Promo Code</DialogTitle>
            <DialogDescription className="text-gray-400">
              Generate a new promotional code for discounts or free trials
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Promo Code</Label>
              <div className="flex gap-2">
                <Input
                  value={newCode.code}
                  onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER2024"
                  className="bg-gray-700 border-gray-600 text-white font-mono"
                  data-testid="input-promo-code"
                />
                <Button variant="outline" onClick={generateRandomCode} className="shrink-0 text-white border-gray-500">
                  Generate
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={newCode.type === "trial" ? "default" : "outline"}
                  onClick={() => setNewCode({ ...newCode, type: "trial" })}
                  size="sm"
                  className={newCode.type !== "trial" ? "text-white border-gray-500" : ""}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Free Trial
                </Button>
                <Button
                  variant={newCode.type === "discount" ? "default" : "outline"}
                  onClick={() => setNewCode({ ...newCode, type: "discount" })}
                  size="sm"
                  className={newCode.type !== "discount" ? "text-white border-gray-500" : ""}
                >
                  <Percent className="h-4 w-4 mr-1" />
                  Discount
                </Button>
                <Button
                  variant={newCode.type === "tax_exempt" ? "default" : "outline"}
                  onClick={() => setNewCode({ ...newCode, type: "tax_exempt" })}
                  size="sm"
                  className={newCode.type !== "tax_exempt" ? "text-white border-gray-500" : ""}
                >
                  <Ban className="h-4 w-4 mr-1" />
                  Tax Exempt
                </Button>
                <Button
                  variant={newCode.type === "credit" ? "default" : "outline"}
                  onClick={() => setNewCode({ ...newCode, type: "credit" })}
                  size="sm"
                  className={newCode.type !== "credit" ? "text-white border-gray-500" : ""}
                >
                  <Gift className="h-4 w-4 mr-1" />
                  Free Credit
                </Button>
              </div>
            </div>

            {newCode.type === "trial" && (
              <>
                <div className="space-y-2">
                  <Label className="text-gray-300">Trial Days</Label>
                  <Input
                    type="number"
                    value={newCode.trialDays}
                    onChange={(e) => setNewCode({ ...newCode, trialDays: parseInt(e.target.value) || 7 })}
                    min={1}
                    className="bg-gray-700 border-gray-600 text-white [color-scheme:dark]"
                    data-testid="input-trial-days"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">After Trial Expires</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={newCode.afterTrialAction === "downgrade" ? "default" : "outline"}
                      onClick={() => setNewCode({ ...newCode, afterTrialAction: "downgrade" })}
                      className={`flex-1 ${newCode.afterTrialAction !== "downgrade" ? "text-white border-gray-500" : ""}`}
                      data-testid="button-after-trial-downgrade"
                    >
                      <ArrowDown className="h-4 w-4 mr-2" />
                      Downgrade to Free
                    </Button>
                    <Button
                      type="button"
                      variant={newCode.afterTrialAction === "continue" ? "default" : "outline"}
                      onClick={() => setNewCode({ ...newCode, afterTrialAction: "continue" })}
                      className={`flex-1 ${newCode.afterTrialAction !== "continue" ? "text-white border-gray-500" : ""}`}
                      data-testid="button-after-trial-continue"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Auto-Renew (Pay)
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {newCode.afterTrialAction === "downgrade" 
                      ? "User will be downgraded to free plan when trial ends" 
                      : "User will be prompted to pay when trial ends to continue premium"}
                  </p>
                </div>
              </>
            )}

            {newCode.type === "discount" && (
              <div className="space-y-2">
                <Label className="text-gray-300">Discount Percentage</Label>
                <Input
                  type="number"
                  value={newCode.discountPercent}
                  onChange={(e) => setNewCode({ ...newCode, discountPercent: parseInt(e.target.value) || 20 })}
                  min={1}
                  max={100}
                  className="bg-gray-700 border-gray-600 text-white [color-scheme:dark]"
                  data-testid="input-discount-percent"
                />
              </div>
            )}

            {newCode.type === "tax_exempt" && (
              <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg">
                <p className="text-sm text-green-300">
                  This code will waive GST/taxes on wallet deposits. Users won't pay any tax when adding money to their wallet.
                </p>
              </div>
            )}

            {newCode.type === "credit" && (
              <div className="space-y-2">
                <Label className="text-gray-300">Credit Amount (INR)</Label>
                <Input
                  type="number"
                  value={newCode.creditAmount}
                  onChange={(e) => setNewCode({ ...newCode, creditAmount: parseInt(e.target.value) || 500 })}
                  min={1}
                  className="bg-gray-700 border-gray-600 text-white [color-scheme:dark]"
                  data-testid="input-credit-amount"
                />
                <p className="text-xs text-gray-500">
                  This amount will be added to the user's wallet for free when they apply this code.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-gray-300">Max Uses (leave empty for unlimited)</Label>
              <Input
                type="number"
                value={newCode.maxUses}
                onChange={(e) => setNewCode({ ...newCode, maxUses: e.target.value })}
                placeholder="Unlimited"
                min={1}
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 [color-scheme:dark]"
                data-testid="input-max-uses"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Valid Until (leave empty for no expiry)</Label>
              <Input
                type="date"
                value={newCode.validUntil}
                onChange={(e) => setNewCode({ ...newCode, validUntil: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white [color-scheme:dark]"
                data-testid="input-valid-until"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="text-white border-gray-500">
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(newCode)}
              disabled={!newCode.code || createMutation.isPending}
              data-testid="button-submit-promo"
            >
              {createMutation.isPending ? "Creating..." : "Create Promo Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface Newsletter {
  id: number;
  subject: string;
  content: string;
  targetAudience: string;
  recipientCount: number;
  status: string;
  createdAt: string;
}

interface SupportTicket {
  id: number;
  userId: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

interface TicketMessage {
  id: number;
  ticketId: number;
  senderId: number;
  message: string;
  isAdminReply: boolean;
  createdAt: string;
  senderName: string;
  senderRole: string;
}

function NewsletterTab() {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");
  const [isSending, setIsSending] = useState(false);

  const { data: newsletters, isLoading } = useQuery<Newsletter[]>({
    queryKey: ["/api/admin/newsletters"],
  });

  const sendNewsletter = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error("Please enter subject and content");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/admin/newsletters/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, content, targetAudience }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to send newsletter");
      }

      toast.success(`Newsletter sent to ${result.stats.sent} users`);
      setSubject("");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletters"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to send newsletter");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-purple-500" />
            Compose Newsletter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Target Audience</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={targetAudience === "all" ? "default" : "outline"}
                onClick={() => setTargetAudience("all")}
                size="sm"
                data-testid="button-audience-all"
              >
                <Users className="h-4 w-4 mr-2" />
                All Users
              </Button>
              <Button
                variant={targetAudience === "creators" ? "default" : "outline"}
                onClick={() => setTargetAudience("creators")}
                size="sm"
                data-testid="button-audience-creators"
              >
                <Instagram className="h-4 w-4 mr-2" />
                Creators Only
              </Button>
              <Button
                variant={targetAudience === "sponsors" ? "default" : "outline"}
                onClick={() => setTargetAudience("sponsors")}
                size="sm"
                data-testid="button-audience-sponsors"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Sponsors Only
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Newsletter subject line"
              className="bg-gray-700 border-gray-600 text-white"
              data-testid="input-newsletter-subject"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Content (HTML supported)</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your newsletter content here. HTML tags are supported."
              className="bg-gray-700 border-gray-600 text-white min-h-[200px]"
              data-testid="input-newsletter-content"
            />
          </div>

          <Button 
            onClick={sendNewsletter} 
            disabled={isSending || !subject.trim() || !content.trim()}
            className="w-full"
            data-testid="button-send-newsletter"
          >
            {isSending ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Newsletter
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Newsletter History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : newsletters && newsletters.length > 0 ? (
            <div className="space-y-3">
              {newsletters.map((newsletter) => (
                <div 
                  key={newsletter.id} 
                  className="bg-gray-700/50 rounded-lg p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <h4 className="font-medium text-white">{newsletter.subject}</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {newsletter.targetAudience}
                      </Badge>
                      <Badge variant="outline" className="text-green-400 border-green-400/50">
                        {newsletter.recipientCount} sent
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Sent on {new Date(newsletter.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-center py-8">No newsletters sent yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SupportTicketsTab() {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: tickets, isLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/admin/support-tickets"],
  });

  const { data: ticketDetails, isLoading: detailsLoading } = useQuery<SupportTicket & { messages: TicketMessage[] }>({
    queryKey: [`/api/support-tickets/${selectedTicket?.id}`],
    enabled: !!selectedTicket,
  });

  const sendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    setIsReplying(true);
    try {
      const response = await fetch(`/api/support-tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          senderId: 1, 
          message: replyText,
          isAdminReply: true
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reply");
      }

      toast.success("Reply sent successfully");
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: [`/api/support-tickets/${selectedTicket.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setIsReplying(false);
    }
  };

  const updateTicketStatus = async (ticketId: number, status: string) => {
    try {
      const response = await fetch(`/api/support-tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      toast.success("Ticket status updated");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
      if (selectedTicket?.id === ticketId) {
        queryClient.invalidateQueries({ queryKey: [`/api/support-tickets/${ticketId}`] });
      }
    } catch (error) {
      toast.error("Failed to update ticket status");
    }
  };

  const filteredTickets = tickets?.filter(ticket => 
    statusFilter === "all" || ticket.status === statusFilter
  ) || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      open: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      resolved: "bg-green-500/20 text-green-400 border-green-500/30",
      closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return variants[status] || variants.open;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      low: "bg-gray-500/20 text-gray-400",
      normal: "bg-blue-500/20 text-blue-400",
      high: "bg-orange-500/20 text-orange-400",
      urgent: "bg-red-500/20 text-red-400",
    };
    return variants[priority] || variants.normal;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {["all", "open", "in_progress", "resolved", "closed"].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status)}
            data-testid={`button-filter-${status}`}
          >
            {status === "all" ? "All" : status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-purple-500" />
              Tickets ({filteredTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-gray-400 text-center py-8">Loading tickets...</div>
            ) : filteredTickets.length > 0 ? (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {filteredTickets.map((ticket) => (
                    <div 
                      key={ticket.id} 
                      className={`bg-gray-700/50 rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTicket?.id === ticket.id ? "ring-2 ring-purple-500" : ""
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                      data-testid={`ticket-item-${ticket.id}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-white line-clamp-1">{ticket.subject}</h4>
                        <Badge className={getStatusBadge(ticket.status)}>
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-gray-400">{ticket.user?.name || "Unknown"}</span>
                        <Badge className={getPriorityBadge(ticket.priority)} variant="outline">
                          {ticket.priority}
                        </Badge>
                        <Badge variant="secondary">{ticket.category}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(ticket.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-gray-400 text-center py-8">No tickets found</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              {selectedTicket ? selectedTicket.subject : "Select a Ticket"}
            </CardTitle>
            {selectedTicket && (
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  size="sm"
                  variant={selectedTicket.status === "in_progress" ? "default" : "outline"}
                  onClick={() => updateTicketStatus(selectedTicket.id, "in_progress")}
                  data-testid="button-status-in-progress"
                >
                  In Progress
                </Button>
                <Button
                  size="sm"
                  variant={selectedTicket.status === "resolved" ? "default" : "outline"}
                  onClick={() => updateTicketStatus(selectedTicket.id, "resolved")}
                  data-testid="button-status-resolved"
                >
                  Resolved
                </Button>
                <Button
                  size="sm"
                  variant={selectedTicket.status === "closed" ? "default" : "outline"}
                  onClick={() => updateTicketStatus(selectedTicket.id, "closed")}
                  data-testid="button-status-closed"
                >
                  Closed
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!selectedTicket ? (
              <div className="text-gray-400 text-center py-8">
                Select a ticket to view messages
              </div>
            ) : detailsLoading ? (
              <div className="text-gray-400 text-center py-8">Loading...</div>
            ) : ticketDetails ? (
              <div className="space-y-4">
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-3">
                    {ticketDetails.messages?.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`p-3 rounded-lg ${
                          msg.isAdminReply 
                            ? "bg-purple-500/20 ml-4" 
                            : "bg-gray-700/50 mr-4"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">
                            {msg.senderName}
                          </span>
                          {msg.isAdminReply && (
                            <Badge variant="secondary" className="text-xs">Admin</Badge>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {selectedTicket.status !== "closed" && (
                  <div className="flex gap-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      className="bg-gray-700 border-gray-600 text-white flex-1"
                      data-testid="input-ticket-reply"
                    />
                    <Button 
                      onClick={sendReply} 
                      disabled={isReplying || !replyText.trim()}
                      data-testid="button-send-reply"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: api.getCurrentUser,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: api.admin.getStats,
    enabled: user?.role === "admin",
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 p-8 max-w-md">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-4">You do not have admin access.</p>
            <Button onClick={() => setLocation("/")} data-testid="button-go-home">
              Go to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <main className="flex-1 overflow-auto pb-20 lg:pb-0">
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm z-20 px-4 py-3 lg:hidden border-b border-gray-800">
          <div className="flex items-center justify-between gap-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSidebarOpen(true)}
              className="text-white"
              data-testid="button-open-sidebar"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-bold text-white truncate">
              {activeTab === "overview" && "Overview"}
              {activeTab === "users" && "Users"}
              {activeTab === "withdrawals" && "Withdrawals"}
              {activeTab === "submissions" && "Submissions"}
              {activeTab === "campaigns" && "Campaigns"}
              {activeTab === "verifications" && "Verifications"}
              {activeTab === "promo-codes" && "Promo Codes"}
              {activeTab === "newsletter" && "Newsletter"}
              {activeTab === "support-tickets" && "Support Tickets"}
              {activeTab === "settings" && "Settings"}
            </h1>
            <div className="w-9" />
          </div>
        </div>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <div className="mb-6 lg:mb-8 hidden lg:block">
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "users" && "User Management"}
              {activeTab === "withdrawals" && "Withdrawal Requests"}
              {activeTab === "submissions" && "Submission Reviews"}
              {activeTab === "campaigns" && "Campaign Management"}
              {activeTab === "verifications" && "Instagram Verifications"}
              {activeTab === "promo-codes" && "Promo & Trial Codes"}
              {activeTab === "newsletter" && "Newsletter Broadcast"}
              {activeTab === "support-tickets" && "Support Tickets"}
              {activeTab === "settings" && "Platform Settings"}
            </h1>
            <p className="text-gray-400">
              Manage your platform from here
            </p>
          </div>

          {activeTab === "overview" && (
            <div className="space-y-6 lg:space-y-8">
              {statsLoading ? (
                <div className="text-center py-8 text-gray-400">Loading statistics...</div>
              ) : stats ? (
                <StatsOverview stats={stats} />
              ) : null}
            </div>
          )}

          {activeTab === "users" && <UsersTab />}
          {activeTab === "withdrawals" && <WithdrawalsTab />}
          {activeTab === "submissions" && <SubmissionsTab />}
          {activeTab === "campaigns" && <CampaignsTab />}
          {activeTab === "verifications" && <VerificationsTab />}
          {activeTab === "promo-codes" && <PromoCodesTab />}
          {activeTab === "newsletter" && <NewsletterTab />}
          {activeTab === "support-tickets" && <SupportTicketsTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </main>

      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
