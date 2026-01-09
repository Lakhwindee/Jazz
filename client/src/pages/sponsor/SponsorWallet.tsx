import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { SponsorSidebar } from "@/components/SponsorSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api, formatINR, ApiTransaction } from "@/lib/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Wallet, Plus, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, CreditCard, Banknote, Building2, Trash2, AlertCircle, Globe, Ticket, Gift, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { calculateDepositWithGST, calculateInternationalDeposit, TAX_RATES } from "@shared/tiers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

declare global {
  interface Window {
    Cashfree: any;
  }
}

interface BankAccount {
  id: number;
  userId: number;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  upiId: string | null;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface WithdrawalRequest {
  id: number;
  userId: number;
  bankAccountId: number;
  amount: string;
  status: string;
  utrNumber: string | null;
  adminNote: string | null;
  requestedAt: string;
  processedAt: string | null;
}

interface WalletInfo {
  balance: string;
  minWithdrawalAmount: number;
  maxWithdrawalAmount: number;
  gstPercent: number;
}

export default function SponsorWallet() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isAddBankOpen, setIsAddBankOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [stripeSessionProcessed, setStripeSessionProcessed] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoCodeStatus, setPromoCodeStatus] = useState<{ valid: boolean; type: string; creditAmount?: string; message?: string } | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [isTaxExempt, setIsTaxExempt] = useState(false);
  
  // Standalone promo code application
  const [standalonePromoCode, setStandalonePromoCode] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  
  const [bankForm, setBankForm] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
  });

  const { data: sponsor } = useQuery({
    queryKey: ["currentSponsor"],
    queryFn: api.getCurrentSponsor,
  });

  const { data: wallet, isLoading } = useQuery({
    queryKey: ["sponsorWallet", sponsor?.id],
    queryFn: () => sponsor ? api.getSponsorWallet(sponsor.id) : null,
    enabled: !!sponsor,
  });

  const { data: walletInfo } = useQuery<WalletInfo>({
    queryKey: ["/api/wallet-info"],
  });

  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const { data: withdrawalRequests = [] } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/withdrawal-requests"],
  });

  const addBankMutation = useMutation({
    mutationFn: async (data: typeof bankForm) => {
      return await apiRequest("POST", "/api/bank-accounts", { ...data, isDefault: bankAccounts.length === 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast.success("Bank account added successfully!");
      setIsAddBankOpen(false);
      setBankForm({ accountHolderName: "", accountNumber: "", ifscCode: "", bankName: "", upiId: "" });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add bank account");
    },
  });

  const deleteBankMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/bank-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast.success("Bank account removed");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove bank account");
    },
  });

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;
    setIsValidatingPromo(true);
    try {
      const response = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: promoCode.trim().toUpperCase(), context: "deposit" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setPromoCodeStatus({ valid: false, type: "", message: data.error });
        toast.error(data.error || "Invalid promo code");
      } else {
        setPromoCodeStatus({ valid: true, type: data.type, creditAmount: data.creditAmount, message: "Code valid!" });
        if (data.type === "tax_exempt") {
          setIsTaxExempt(true);
          toast.success("Tax exemption applied! GST waived on this deposit.");
        } else if (data.type === "credit") {
          toast.success(`Valid credit code! Apply to get ₹${parseFloat(data.creditAmount || "0").toFixed(0)} free credits.`);
        }
      }
    } catch (error) {
      setPromoCodeStatus({ valid: false, type: "", message: "Failed to validate code" });
      toast.error("Failed to validate promo code");
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // Apply standalone promo code directly (without deposit)
  const applyStandalonePromoCode = async () => {
    if (!standalonePromoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }
    setIsApplyingPromo(true);
    try {
      const response = await fetch("/api/promo-codes/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: standalonePromoCode.trim().toUpperCase(), context: "deposit" }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to apply promo code");
      } else {
        toast.success(data.message || "Promo code applied successfully!");
        setStandalonePromoCode("");
        queryClient.invalidateQueries({ queryKey: ["sponsorWallet"] });
        queryClient.invalidateQueries({ queryKey: ["currentSponsor"] });
      }
    } catch (error) {
      toast.error("Failed to apply promo code");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; bankAccountId: number }) => {
      return await apiRequest("POST", "/api/withdrawal-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["sponsorWallet"] });
      queryClient.invalidateQueries({ queryKey: ["currentSponsor"] });
      toast.success("Withdrawal request submitted! Admin will process it soon.");
      setIsWithdrawOpen(false);
      setWithdrawAmount("");
      setSelectedBankId("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit withdrawal request");
    },
  });

  // Check if user is from India (use Cashfree) or international (use Stripe)
  const isIndianUser = sponsor?.country === "IN";

  // Load Cashfree script for Indian users
  useEffect(() => {
    if (isIndianUser) {
      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [isIndianUser]);
  
  // Handle Cashfree payment callback
  useEffect(() => {
    if (!sponsor) return;
    
    const params = new URLSearchParams(searchString);
    const orderId = params.get("order_id");
    const orderStatus = params.get("status");
    
    if (orderId) {
      // Always try to verify payment when we have an order_id
      if (orderStatus === "PAID" || orderStatus === "PENDING_VERIFICATION" || !orderStatus) {
        // Verify payment and credit wallet
        const storedBaseAmount = sessionStorage.getItem(`cashfree_base_${orderId}`);
        const storedTaxExempt = sessionStorage.getItem(`cashfree_taxexempt_${orderId}`);
        const storedPromoCode = sessionStorage.getItem(`cashfree_promo_${orderId}`);
        
        fetch(`/api/sponsors/${sponsor.id}/wallet/verify-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            orderId, 
            baseAmount: storedBaseAmount || "0",
            isTaxExempt: storedTaxExempt === "true",
            promoCode: storedPromoCode || undefined,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              let message = `Payment successful! ₹${data.walletCredit} added to wallet.`;
              if (data.promoCredits) {
                message += ` Plus ₹${data.promoCredits} bonus credits!`;
              }
              toast.success(message);
              queryClient.invalidateQueries({ queryKey: ["sponsorWallet"] });
              queryClient.invalidateQueries({ queryKey: ["currentSponsor"] });
              // Clean up session storage
              sessionStorage.removeItem(`cashfree_base_${orderId}`);
              sessionStorage.removeItem(`cashfree_taxexempt_${orderId}`);
              sessionStorage.removeItem(`cashfree_promo_${orderId}`);
            } else {
              // Payment not yet completed or failed
              if (data.status === "ACTIVE") {
                toast.info("Payment not completed yet. Please try again.");
              } else {
                toast.error(data.error || "Payment verification failed");
              }
            }
            setLocation("/sponsor/wallet");
          })
          .catch(() => {
            toast.error("Failed to verify payment");
            setLocation("/sponsor/wallet");
          });
      } else if (orderStatus === "ACTIVE" || orderStatus === "USER_DROPPED") {
        toast.info("Payment was cancelled or not completed");
        setLocation("/sponsor/wallet");
      } else if (orderStatus === "FAILED") {
        toast.error("Payment failed. Please try again.");
        setLocation("/sponsor/wallet");
      }
    }
  }, [sponsor, searchString, setLocation]);

  // Handle Stripe success callback
  useEffect(() => {
    if (!sponsor || stripeSessionProcessed) return;
    
    const params = new URLSearchParams(searchString);
    const stripeSuccess = params.get("stripe_success");
    const sessionId = params.get("session_id");
    
    if (stripeSuccess === "true" && sessionId) {
      setStripeSessionProcessed(true);
      
      // Verify the Stripe session and credit wallet
      fetch(`/api/sponsors/${sponsor.id}/stripe/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            toast.success(`Payment successful! ${data.currency?.toUpperCase()} ${data.walletCredit} added to wallet.`);
            queryClient.invalidateQueries({ queryKey: ["sponsorWallet"] });
            queryClient.invalidateQueries({ queryKey: ["currentSponsor"] });
          } else {
            toast.error(data.error || "Payment verification failed");
          }
          // Clean URL
          setLocation("/sponsor/wallet");
        })
        .catch(() => {
          toast.error("Failed to verify payment");
          setLocation("/sponsor/wallet");
        });
    } else if (params.get("stripe_cancelled") === "true") {
      toast.info("Payment was cancelled");
      setLocation("/sponsor/wallet");
    }
    
    // Handle PayU success/failure
    if (params.get("payu_success") === "true") {
      toast.success("Payment successful! Amount added to wallet.");
      queryClient.invalidateQueries({ queryKey: ["sponsorWallet"] });
      queryClient.invalidateQueries({ queryKey: ["currentSponsor"] });
      setLocation("/sponsor/wallet");
    } else if (params.get("payu_failed") === "true") {
      const message = params.get("message") || "Payment failed";
      toast.error(message);
      setLocation("/sponsor/wallet");
    }
  }, [sponsor, searchString, stripeSessionProcessed, setLocation]);

  const handleCashfreePayment = async () => {
    const baseAmount = parseFloat(depositAmount);
    if (isNaN(baseAmount) || baseAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!sponsor) {
      toast.error("Sponsor not found");
      return;
    }

    setIsProcessing(true);

    try {
      const orderRes = await fetch(`/api/sponsors/${sponsor.id}/wallet/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: baseAmount,
          isTaxExempt: isTaxExempt,
          promoCode: promoCodeStatus?.valid ? promoCode : undefined,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || "Failed to create order");
      }

      const orderData = await orderRes.json();
      
      // Store base amount and promo code in session storage for verification after redirect
      sessionStorage.setItem(`cashfree_base_${orderData.orderId}`, baseAmount.toString());
      sessionStorage.setItem(`cashfree_taxexempt_${orderData.orderId}`, isTaxExempt.toString());
      if (promoCodeStatus?.valid && promoCode) {
        sessionStorage.setItem(`cashfree_promo_${orderData.orderId}`, promoCode);
      }

      // Initialize Cashfree checkout
      const cashfree = window.Cashfree({
        mode: orderData.environment === 'production' ? 'production' : 'sandbox',
      });
      
      await cashfree.checkout({
        paymentSessionId: orderData.paymentSessionId,
        redirectTarget: "_self",
      });
      
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate payment");
      setIsProcessing(false);
    }
  };

  // Handle Stripe payment for international users
  const handleStripePayment = async () => {
    const baseAmount = parseFloat(depositAmount);
    if (isNaN(baseAmount) || baseAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!sponsor) {
      toast.error("Sponsor not found");
      return;
    }

    setIsProcessing(true);
    
    // Calculate total with processing fee
    const breakdown = calculateInternationalDeposit(baseAmount);

    try {
      const res = await fetch(`/api/sponsors/${sponsor.id}/stripe/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: breakdown.totalPayable,  // Total amount with fee
          baseAmount: baseAmount,           // Amount to credit to wallet
          processingFee: breakdown.processingFee,
          countryCode: sponsor.country 
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create checkout session");
      }

      const data = await res.json();
      
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate payment");
      setIsProcessing(false);
    }
  };

  // Handle PayU payment for Indian users (alternative to Razorpay)
  const handlePayUPayment = async () => {
    const baseAmount = parseFloat(depositAmount);
    if (isNaN(baseAmount) || baseAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!sponsor) {
      toast.error("Sponsor not found");
      return;
    }

    setIsProcessing(true);
    
    const breakdown = isTaxExempt 
      ? { gstAmount: 0, totalPayable: baseAmount }
      : calculateDepositWithGST(baseAmount);

    try {
      const res = await fetch(`/api/sponsors/${sponsor.id}/payu/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseAmount: baseAmount,
          gstAmount: breakdown.gstAmount,
          totalAmount: breakdown.totalPayable,
          firstname: sponsor.name || "User",
          email: sponsor.email,
          phone: (sponsor as any).phone || "9999999999",
          isTaxExempt: isTaxExempt,
          promoCode: promoCodeStatus?.valid ? promoCode : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to initiate PayU payment");
      }

      const data = await res.json();
      
      if (data.success && data.paymentData) {
        // Create and submit form to PayU
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.paymentData.payuBaseUrl;
        
        const fields = ["key", "txnid", "amount", "productinfo", "firstname", "email", "phone", "surl", "furl", "hash"];
        fields.forEach(field => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = field;
          input.value = data.paymentData[field];
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
      } else {
        throw new Error("Invalid payment data received");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate payment");
      setIsProcessing(false);
    }
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    const bankId = parseInt(selectedBankId);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (!bankId) {
      toast.error("Please select a bank account");
      return;
    }

    const minAmount = walletInfo?.minWithdrawalAmount || 500;
    if (amount < minAmount) {
      toast.error(`Minimum withdrawal amount is ${formatINR(minAmount)}`);
      return;
    }

    const balance = parseFloat(wallet?.balance || sponsor?.balance || "0");
    if (amount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    withdrawMutation.mutate({ amount, bankAccountId: bankId });
  };

  const calculateWithdrawalNet = (amount: number) => {
    const gstPercent = walletInfo?.gstPercent || 18;
    const gstAmount = Math.round(amount * gstPercent / 100);
    return { gstAmount, netAmount: amount - gstAmount };
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "deposit":
        return <ArrowDownCircle className="h-4 w-4 text-green-500" />;
      case "campaign_payment":
        return <ArrowUpCircle className="h-4 w-4 text-red-500" />;
      case "withdrawal":
        return <Banknote className="h-4 w-4 text-orange-500" />;
      default:
        return <Wallet className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "deposit":
        return "Deposit";
      case "campaign_payment":
        return "Campaign Payment";
      case "withdrawal":
        return "Withdrawal";
      default:
        return category;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "rejected":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingWithdrawal = withdrawalRequests.find(r => r.status === "pending");

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
        <div className="mx-auto max-w-4xl p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Wallet</h1>
            <p className="text-muted-foreground">Manage your campaign budget</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                <Wallet className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-balance">
                  {formatINR(wallet?.balance || sponsor.balance)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use for campaigns or withdraw
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Add Funds</CardTitle>
                <CreditCard className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" data-testid="button-add-funds">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Money
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Funds to Wallet</DialogTitle>
                      <DialogDescription>
                        Enter the amount you want to add. {isIndianUser ? "GST will be applied." : "International payments via Stripe."}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount to Add {isIndianUser ? "(INR)" : "(USD)"}</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="Enter amount"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          min="1"
                          data-testid="input-deposit-amount"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(isIndianUser ? [1000, 5000, 10000, 25000] : [50, 100, 250, 500]).map((amt) => (
                          <Button
                            key={amt}
                            variant="outline"
                            size="sm"
                            onClick={() => setDepositAmount(amt.toString())}
                            data-testid={`button-quick-amount-${amt}`}
                          >
                            {isIndianUser ? formatINR(amt) : `$${amt}`}
                          </Button>
                        ))}
                      </div>

                      {isIndianUser && (
                        <div className="space-y-2">
                          <Label className="text-sm">Have a promo code? (Optional)</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter promo code"
                              value={promoCode}
                              onChange={(e) => {
                                setPromoCode(e.target.value.toUpperCase());
                                setPromoCodeStatus(null);
                                setIsTaxExempt(false);
                              }}
                              className="font-mono"
                              data-testid="input-promo-code"
                            />
                            <Button
                              variant="outline"
                              onClick={validatePromoCode}
                              disabled={!promoCode.trim() || isValidatingPromo}
                              data-testid="button-validate-promo"
                            >
                              {isValidatingPromo ? "..." : "Apply"}
                            </Button>
                          </div>
                          {promoCodeStatus && (
                            <div className={`text-xs p-2 rounded ${promoCodeStatus.valid ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                              {promoCodeStatus.valid ? (
                                promoCodeStatus.type === "tax_exempt" ? "GST waived on this deposit!" : 
                                promoCodeStatus.type === "credit" ? `You'll get ₹${parseFloat(promoCodeStatus.creditAmount || "0").toFixed(0)} free credits!` :
                                "Code applied!"
                              ) : promoCodeStatus.message}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {depositAmount && parseFloat(depositAmount) > 0 && (
                        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Amount to Wallet</span>
                            <span className="font-medium">{isIndianUser ? formatINR(parseFloat(depositAmount)) : `$${parseFloat(depositAmount).toFixed(2)}`}</span>
                          </div>
                          {isIndianUser && (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">GST ({TAX_RATES.GST_PERCENT}%)</span>
                                {isTaxExempt ? (
                                  <span className="font-medium text-green-500 line-through">
                                    {formatINR(calculateDepositWithGST(parseFloat(depositAmount)).gstAmount)}
                                    <span className="ml-2 no-underline">WAIVED</span>
                                  </span>
                                ) : (
                                  <span className="font-medium">{formatINR(calculateDepositWithGST(parseFloat(depositAmount)).gstAmount)}</span>
                                )}
                              </div>
                              <div className="flex justify-between pt-2 border-t">
                                <span className="font-medium">Total Payable</span>
                                <span className="font-bold text-lg">
                                  {isTaxExempt 
                                    ? formatINR(parseFloat(depositAmount)) 
                                    : formatINR(calculateDepositWithGST(parseFloat(depositAmount)).totalPayable)}
                                </span>
                              </div>
                              {isTaxExempt && (
                                <div className="text-xs text-green-500 flex items-center gap-1">
                                  <Gift className="h-3 w-3" />
                                  GST waived with promo code!
                                </div>
                              )}
                            </>
                          )}
                          {!isIndianUser && (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Processing Fee ({TAX_RATES.INTERNATIONAL_FEE_PERCENT}%)</span>
                                <span className="font-medium">${calculateInternationalDeposit(parseFloat(depositAmount)).processingFee.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t">
                                <span className="font-medium">Total Payable</span>
                                <span className="font-bold text-lg">${calculateInternationalDeposit(parseFloat(depositAmount)).totalPayable.toFixed(2)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      
                      {isIndianUser ? (
                        <div className="space-y-4">
                          <div className="flex flex-wrap justify-center gap-3 py-2">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border flex items-center justify-center text-xs font-bold text-blue-600">GPay</div>
                              <span className="text-[10px] text-muted-foreground">Google Pay</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border flex items-center justify-center text-xs font-bold text-purple-600">PhPe</div>
                              <span className="text-[10px] text-muted-foreground">PhonePe</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border flex items-center justify-center text-xs font-bold text-blue-500">Pytm</div>
                              <span className="text-[10px] text-muted-foreground">Paytm</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border flex items-center justify-center text-xs font-bold text-green-600">BHIM</div>
                              <span className="text-[10px] text-muted-foreground">BHIM UPI</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border flex items-center justify-center text-[10px] font-bold text-gray-600">Cards</div>
                              <span className="text-[10px] text-muted-foreground">Debit/Credit</span>
                            </div>
                          </div>
                          
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={handleCashfreePayment}
                            disabled={isProcessing || !depositAmount}
                            data-testid="button-confirm-deposit"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            {isProcessing ? "Processing..." : depositAmount ? `Pay ${formatINR(isTaxExempt ? parseFloat(depositAmount) : calculateDepositWithGST(parseFloat(depositAmount) || 0).totalPayable)}` : "Pay Now"}
                          </Button>
                          <p className="text-xs text-center text-muted-foreground">
                            UPI, Cards, Net Banking - Powered by Cashfree
                          </p>
                          
                          <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              Secure
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              Instant
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              100% Safe
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Button
                            className="w-full"
                            onClick={handleStripePayment}
                            disabled={isProcessing || !depositAmount}
                            data-testid="button-confirm-deposit-stripe"
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            {isProcessing ? "Processing..." : depositAmount ? `Pay $${calculateInternationalDeposit(parseFloat(depositAmount) || 0).totalPayable.toFixed(2)} with Stripe` : "Pay with Stripe"}
                          </Button>
                          <p className="text-xs text-center text-muted-foreground">
                            Secure international payment powered by Stripe (5% processing fee)
                          </p>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Withdraw</CardTitle>
                <Banknote className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      disabled={!!pendingWithdrawal}
                      data-testid="button-withdraw"
                    >
                      <Banknote className="h-4 w-4 mr-2" />
                      {pendingWithdrawal ? "Request Pending" : "Withdraw"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Withdraw Funds</DialogTitle>
                      <DialogDescription>
                        Withdraw money to your bank account. 18% GST will be deducted.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      {bankAccounts.length === 0 ? (
                        <div className="text-center py-4">
                          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground mb-4">No bank account added</p>
                          <Button onClick={() => { setIsWithdrawOpen(false); setIsAddBankOpen(true); }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Bank Account
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label>Select Bank Account</Label>
                            <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                              <SelectTrigger data-testid="select-bank-account">
                                <SelectValue placeholder="Choose bank account" />
                              </SelectTrigger>
                              <SelectContent>
                                {bankAccounts.map((bank) => (
                                  <SelectItem key={bank.id} value={bank.id.toString()}>
                                    {bank.bankName} - {bank.accountNumber.slice(-4)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="withdrawAmount">Amount (INR)</Label>
                            <Input
                              id="withdrawAmount"
                              type="number"
                              placeholder={`Min ${formatINR(walletInfo?.minWithdrawalAmount || 500)}`}
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              min={walletInfo?.minWithdrawalAmount || 500}
                              data-testid="input-withdraw-amount"
                            />
                          </div>

                          {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Withdrawal Amount</span>
                                <span className="font-medium">{formatINR(parseFloat(withdrawAmount))}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">GST Deduction (18%)</span>
                                <span className="font-medium text-red-500">-{formatINR(calculateWithdrawalNet(parseFloat(withdrawAmount)).gstAmount)}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t">
                                <span className="font-medium">You will receive</span>
                                <span className="font-bold text-lg text-green-600">{formatINR(calculateWithdrawalNet(parseFloat(withdrawAmount)).netAmount)}</span>
                              </div>
                            </div>
                          )}

                          <Button
                            className="w-full"
                            onClick={handleWithdraw}
                            disabled={withdrawMutation.isPending || !withdrawAmount || !selectedBankId}
                            data-testid="button-confirm-withdraw"
                          >
                            {withdrawMutation.isPending ? "Submitting..." : "Submit Withdrawal Request"}
                          </Button>
                          <p className="text-xs text-center text-muted-foreground">
                            Admin will process within 2-3 business days
                          </p>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Apply Promo Code
              </CardTitle>
              <CardDescription>
                Have a promo code? Apply it to get free credits instantly!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter promo code"
                  value={standalonePromoCode}
                  onChange={(e) => setStandalonePromoCode(e.target.value.toUpperCase())}
                  className="font-mono max-w-xs"
                  data-testid="input-standalone-promo"
                />
                <Button
                  onClick={applyStandalonePromoCode}
                  disabled={!standalonePromoCode.trim() || isApplyingPromo}
                  data-testid="button-apply-standalone-promo"
                >
                  {isApplyingPromo ? "Applying..." : "Apply Code"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="transactions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
              <TabsTrigger value="withdrawals" data-testid="tab-withdrawals">Withdrawal Requests</TabsTrigger>
              <TabsTrigger value="banks" data-testid="tab-banks">Bank Accounts</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : !wallet?.transactions?.length ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No transactions yet</p>
                      <p className="text-sm">Add funds to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {wallet.transactions.map((tx: ApiTransaction) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card"
                          data-testid={`transaction-row-${tx.id}`}
                        >
                          <div className="flex items-center gap-3">
                            {getCategoryIcon(tx.category)}
                            <div>
                              <p className="font-medium">{tx.description}</p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span>{format(new Date(tx.createdAt), "dd MMM yyyy, hh:mm a")}</span>
                                <Badge variant="outline" className="text-xs">
                                  {getCategoryLabel(tx.category)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${tx.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                              {tx.type === "credit" ? "+" : "-"}{formatINR(tx.amount)}
                            </p>
                            <Badge
                              variant={tx.status === "completed" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {tx.status === "completed" ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <Clock className="h-3 w-3 mr-1" />
                              )}
                              {tx.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="withdrawals">
              <Card>
                <CardHeader>
                  <CardTitle>Withdrawal Requests</CardTitle>
                  <CardDescription>Track your withdrawal request status</CardDescription>
                </CardHeader>
                <CardContent>
                  {withdrawalRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No withdrawal requests yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {withdrawalRequests.map((req) => {
                        const bank = bankAccounts.find(b => b.id === req.bankAccountId);
                        return (
                          <div
                            key={req.id}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card"
                            data-testid={`withdrawal-row-${req.id}`}
                          >
                            <div>
                              <p className="font-medium">{formatINR(parseFloat(req.amount))}</p>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <p>{format(new Date(req.requestedAt), "dd MMM yyyy, hh:mm a")}</p>
                                {bank && <p>{bank.bankName} - ****{bank.accountNumber.slice(-4)}</p>}
                                {req.utrNumber && <p className="text-green-600">UTR: {req.utrNumber}</p>}
                                {req.adminNote && <p className="text-red-500">{req.adminNote}</p>}
                              </div>
                            </div>
                            <div>{getStatusBadge(req.status)}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="banks">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle>Bank Accounts</CardTitle>
                    <CardDescription>Manage your bank accounts for withdrawals</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setIsAddBankOpen(true)} data-testid="button-add-bank">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bank
                  </Button>
                </CardHeader>
                <CardContent>
                  {bankAccounts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No bank accounts added</p>
                      <p className="text-sm">Add a bank account to withdraw funds</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bankAccounts.map((bank) => (
                        <div
                          key={bank.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card"
                          data-testid={`bank-row-${bank.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{bank.bankName}</p>
                              <p className="text-sm text-muted-foreground">{bank.accountHolderName}</p>
                              <p className="text-xs text-muted-foreground">****{bank.accountNumber.slice(-4)} | {bank.ifscCode}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {bank.isDefault && <Badge variant="secondary">Default</Badge>}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteBankMutation.mutate(bank.id)}
                              disabled={deleteBankMutation.isPending}
                              data-testid={`button-delete-bank-${bank.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={isAddBankOpen} onOpenChange={setIsAddBankOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>
              Add your bank details for receiving withdrawals
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Account Holder Name</Label>
              <Input
                id="accountHolderName"
                placeholder="As per bank records"
                value={bankForm.accountHolderName}
                onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                data-testid="input-account-holder"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="e.g., HDFC Bank"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                data-testid="input-bank-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                placeholder="Your bank account number"
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                data-testid="input-account-number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ifscCode">IFSC Code</Label>
              <Input
                id="ifscCode"
                placeholder="e.g., HDFC0001234"
                value={bankForm.ifscCode}
                onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                data-testid="input-ifsc"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID (Optional)</Label>
              <Input
                id="upiId"
                placeholder="yourname@upi"
                value={bankForm.upiId}
                onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
                data-testid="input-upi"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => addBankMutation.mutate(bankForm)}
              disabled={addBankMutation.isPending || !bankForm.accountHolderName || !bankForm.bankName || !bankForm.accountNumber || !bankForm.ifscCode}
              data-testid="button-save-bank"
            >
              {addBankMutation.isPending ? "Saving..." : "Save Bank Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
