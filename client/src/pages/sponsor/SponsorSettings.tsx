import { SponsorSidebar } from "@/components/SponsorSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Mail, Building2, LogOut, AlertCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

export default function SponsorSettings() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  
  const { data: sponsor } = useQuery({
    queryKey: ["currentSponsor"],
    queryFn: api.getCurrentSponsor,
  });

  const { data: accountStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["accountStatus"],
    queryFn: api.getAccountStatus,
  });

  const deleteAccountMutation = useMutation({
    mutationFn: api.deleteAccount,
    onSuccess: () => {
      toast.success("Account deleted successfully");
      navigate("/");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete account");
    },
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }
    deleteAccountMutation.mutate();
  };

  const canDelete = accountStatus && 
    accountStatus.balance === 0 && 
    accountStatus.pendingWithdrawals === 0 && 
    accountStatus.activeCampaigns === 0;

  if (!sponsor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SponsorSidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        <div className="mx-auto max-w-2xl p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={sponsor.name || ""}
                    disabled
                    className="bg-muted"
                    data-testid="input-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={sponsor.email || ""}
                      disabled
                      className="bg-muted flex-1"
                      data-testid="input-email"
                    />
                  </div>
                </div>
                {sponsor.companyName && (
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="company"
                        value={sponsor.companyName}
                        disabled
                        className="bg-muted flex-1"
                        data-testid="input-company"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

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
                  <LogOut className="h-4 w-4 mr-2" />
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
                        {accountStatus && accountStatus.activeCampaigns > 0 && (
                          <p className="text-amber-600 dark:text-amber-400">
                            You have {accountStatus.activeCampaigns} active campaign(s). Complete or cancel them first.
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
          </div>
        </div>
      </main>
    </div>
  );
}
