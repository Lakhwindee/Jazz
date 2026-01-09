import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { SUBSCRIPTION_PLANS } from "@shared/schema";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Check, Crown, Loader2, Calendar, Zap, Shield, Clock, CreditCard, Tag, Building2, MapPin, FileText, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLocation, useSearch } from "wouter";
import { useState, useCallback, useEffect } from "react";

declare global {
  interface Window {
    Cashfree: any;
  }
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

interface PromoValidation {
  valid: boolean;
  code: string;
  type: string;
  discountPercent: number | null;
  trialDays: number | null;
  afterTrialAction: string | null;
}

export default function Subscription() {
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"billing" | "payment">("billing");
  
  const [billingDetails, setBillingDetails] = useState({
    name: "",
    companyName: "",
    gstNumber: "",
    panNumber: "",
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingPincode: "",
    email: "",
    phone: "",
  });
  
  const [promoCode, setPromoCode] = useState("");
  const [promoValidation, setPromoValidation] = useState<PromoValidation | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: api.getCurrentUser,
  });

  const { data: subscription, isLoading: subLoading, refetch: refetchSubscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: () => api.getSubscription(user!.id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (user) {
      setBillingDetails(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        companyName: (user as any).companyName || "",
        gstNumber: (user as any).gstNumber || "",
        panNumber: (user as any).panNumber || "",
        billingAddress: (user as any).billingAddress || "",
        billingCity: (user as any).billingCity || "",
        billingState: (user as any).billingState || "",
        billingPincode: (user as any).billingPincode || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const orderId = params.get('order_id');
    const status = params.get('status');
    
    if (orderId && status === 'success' && user?.id) {
      verifyPaymentAfterReturn(orderId);
    }
  }, [searchString, user?.id]);

  const verifyPaymentAfterReturn = async (orderId: string) => {
    if (!user) return;
    
    setIsProcessing(true);
    try {
      await api.verifyPayment(user.id, { orderId });
      toast.success("Payment successful! Pro subscription activated.");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      refetchSubscription();
      setLocation('/subscription');
    } catch (error: any) {
      toast.error(error.message || "Payment verification failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const loadCashfreeScript = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      if (window.Cashfree) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }
    
    setIsValidatingPromo(true);
    try {
      const response = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: promoCode.trim().toUpperCase(), context: "subscription" }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Invalid promo code");
        setPromoValidation(null);
        return;
      }
      
      setPromoValidation(data);
      toast.success(data.type === "trial" 
        ? `Trial code valid! Get ${data.trialDays} days free` 
        : `Discount applied! ${data.discountPercent}% off`);
    } catch (error) {
      toast.error("Failed to validate promo code");
      setPromoValidation(null);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const applyPromoCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch("/api/promo-codes/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code, context: "subscription" }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to apply promo code");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["currentSponsor"] });
      queryClient.invalidateQueries({ queryKey: ["sponsorWallet"] });
      setShowCheckout(false);
      setPromoCode("");
      setPromoValidation(null);
      refetchSubscription();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleOpenCheckout = () => {
    setShowCheckout(true);
    setCheckoutStep("billing");
    setPromoCode("");
    setPromoValidation(null);
  };

  const handleProceedToPayment = () => {
    if (!billingDetails.name || !billingDetails.email) {
      toast.error("Please fill in required fields (Name, Email)");
      return;
    }
    
    if (billingDetails.gstNumber && !validateGST(billingDetails.gstNumber)) {
      toast.error("Invalid GST number format");
      return;
    }
    
    if (billingDetails.panNumber && !validatePAN(billingDetails.panNumber)) {
      toast.error("Invalid PAN number format");
      return;
    }
    
    setCheckoutStep("payment");
  };

  const validateGST = (gst: string) => {
    if (!gst) return true;
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst.toUpperCase());
  };

  const validatePAN = (pan: string) => {
    if (!pan) return true;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
  };

  const handleFinalPayment = async () => {
    if (!user) return;
    
    if (promoValidation?.type === "trial") {
      applyPromoCodeMutation.mutate(promoCode.trim().toUpperCase());
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const response = await fetch("/api/users/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(billingDetails),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save billing details");
      }
      
      const scriptLoaded = await loadCashfreeScript();
      if (!scriptLoaded) {
        toast.error("Failed to load payment gateway");
        setIsProcessing(false);
        return;
      }
      
      const finalAmount = calculateFinalAmount();
      const orderData = await api.createPaymentOrder(user.id, {
        amount: finalAmount,
        promoCode: promoValidation ? promoCode.trim().toUpperCase() : undefined,
        billingDetails,
      });
      
      const config = await api.getCashfreeConfig();
      
      const cashfree = window.Cashfree({
        mode: config.environment === 'production' ? 'production' : 'sandbox',
      });
      
      const checkoutOptions = {
        paymentSessionId: orderData.sessionId,
        redirectTarget: "_self",
      };
      
      cashfree.checkout(checkoutOptions);
      
    } catch (error: any) {
      toast.error(error.message || "Failed to start payment");
      setIsProcessing(false);
    }
  };

  const calculateFinalAmount = () => {
    const basePrice = SUBSCRIPTION_PLANS.pro.price;
    if (promoValidation?.type === "trial") {
      return 0;
    }
    if (promoValidation?.type === "discount" && promoValidation.discountPercent) {
      return Math.round(basePrice * (1 - promoValidation.discountPercent / 100));
    }
    return basePrice;
  };

  const isLoading = userLoading || subLoading;
  const hasActiveSubscription = subscription?.isActive;

  if (isLoading) {
    return (
      <div className="flex h-screen bg-black text-white">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Creator Subscription</h1>
            <p className="text-gray-400">Unlock the power to reserve campaigns and start earning</p>
          </div>

          {hasActiveSubscription && (
            <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-500/30 mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Pro Creator</h3>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Expires: {subscription?.expiresAt ? format(new Date(subscription.expiresAt), "MMM dd, yyyy") : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-green-600 text-white" data-testid="badge-active">Active</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Card className={`border-2 ${!hasActiveSubscription ? 'border-gray-700' : 'border-gray-700'} bg-gray-900/50`}>
              <CardHeader>
                <CardTitle className="text-xl text-white">Free</CardTitle>
                <CardDescription className="text-gray-400">Browse and explore</CardDescription>
                <div className="text-3xl font-bold text-white mt-2">
                  ₹0<span className="text-sm font-normal text-gray-400">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {SUBSCRIPTION_PLANS.free.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-300">
                      <Check className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-gray-500">
                    <X className="w-4 h-4 text-red-500" />
                    Reserve campaigns
                  </li>
                  <li className="flex items-center gap-2 text-gray-500">
                    <X className="w-4 h-4 text-red-500" />
                    Earn from promotions
                  </li>
                </ul>
                {!hasActiveSubscription && (
                  <div className="mt-6">
                    <Button variant="outline" className="w-full" disabled data-testid="button-current-plan">
                      Current Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={`border-2 ${hasActiveSubscription ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500/50 bg-gray-900/50'} relative overflow-visible`}>
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-3 py-1 rounded-bl-lg">
                Recommended
              </div>
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Pro Creator
                </CardTitle>
                <CardDescription className="text-gray-400">Start earning today</CardDescription>
                <div className="text-3xl font-bold text-white mt-2">
                  ₹499<span className="text-sm font-normal text-gray-400">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {SUBSCRIPTION_PLANS.pro.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-300">
                      <Check className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-green-400 font-medium">
                    <Zap className="w-4 h-4" />
                    Earn 100 - 35,000 per campaign
                  </li>
                </ul>
                <div className="mt-6">
                  {hasActiveSubscription ? (
                    <Button 
                      className="w-full bg-green-600 cursor-not-allowed"
                      disabled
                      data-testid="button-subscription-active"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Subscription Activated
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                      onClick={handleOpenCheckout}
                      disabled={isProcessing}
                      data-testid="button-upgrade-pro"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Upgrade to Pro
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4 text-center">
                <Shield className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <h4 className="font-medium text-white">Secure Payments</h4>
                <p className="text-sm text-gray-400">UPI, Cards, Wallets</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <h4 className="font-medium text-white">Instant Activation</h4>
                <p className="text-sm text-gray-400">Start reserving after payment</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4 text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <h4 className="font-medium text-white">Unlimited Campaigns</h4>
                <p className="text-sm text-gray-400">No limits on reservations</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Secure payment powered by Cashfree. By subscribing, you agree to our Terms of Service.</p>
          </div>
        </div>
      </main>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              {checkoutStep === "billing" ? "Billing Details" : "Review & Pay"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {checkoutStep === "billing" 
                ? "Enter your billing information for the invoice" 
                : "Review your order and complete payment"}
            </DialogDescription>
          </DialogHeader>

          {checkoutStep === "billing" ? (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Full Name *</Label>
                    <Input
                      value={billingDetails.name}
                      onChange={(e) => setBillingDetails({...billingDetails, name: e.target.value})}
                      placeholder="Your full name"
                      className="bg-gray-800 border-gray-700 text-white"
                      data-testid="input-billing-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Email *</Label>
                    <Input
                      type="email"
                      value={billingDetails.email}
                      onChange={(e) => setBillingDetails({...billingDetails, email: e.target.value})}
                      placeholder="your@email.com"
                      className="bg-gray-800 border-gray-700 text-white"
                      data-testid="input-billing-email"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-4">
                  <Label className="text-gray-300 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Have a Promo Code? (Optional)
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        if (promoValidation) setPromoValidation(null);
                      }}
                      placeholder="Enter promo code"
                      className="bg-gray-800 border-gray-700 text-white"
                      data-testid="input-promo-code"
                    />
                    <Button
                      variant="outline"
                      onClick={validatePromoCode}
                      disabled={isValidatingPromo || !promoCode.trim()}
                      data-testid="button-validate-promo"
                    >
                      {isValidatingPromo ? "..." : "Apply"}
                    </Button>
                  </div>
                  {promoValidation && (
                    <div className={`mt-2 p-3 rounded ${promoValidation.valid ? "bg-green-900/30 border border-green-700" : "bg-red-900/30 text-red-400"}`}>
                      {promoValidation.valid ? (
                        promoValidation.type === "trial" ? (
                          <div className="space-y-2">
                            <p className="text-green-400 font-medium flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Free Trial: {promoValidation.trialDays} days Pro access!
                            </p>
                            <p className="text-sm text-gray-400">
                              Trial expires on: {new Date(Date.now() + (promoValidation.trialDays || 7) * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {promoValidation.afterTrialAction === "continue" 
                                ? "After trial ends, you will be prompted to pay to continue" 
                                : "After trial ends, plan will downgrade to free"}
                            </p>
                          </div>
                        ) : promoValidation.type === "discount" ? (
                          <p className="text-green-400">{promoValidation.discountPercent}% discount applied!</p>
                        ) : (
                          <p className="text-green-400">Promo code applied!</p>
                        )
                      ) : "Invalid promo code"}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <Button variant="outline" onClick={() => setShowCheckout(false)}>
                  Cancel
                </Button>
                {promoValidation?.valid && promoValidation?.type === "trial" ? (
                  <Button 
                    onClick={() => applyPromoCodeMutation.mutate(promoCode.trim().toUpperCase())}
                    disabled={applyPromoCodeMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-activate-trial"
                  >
                    {applyPromoCodeMutation.isPending ? "Activating..." : "Activate Free Trial"}
                  </Button>
                ) : (
                  <Button onClick={handleProceedToPayment} data-testid="button-proceed-payment">
                    Continue to Payment
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">Pro Creator Plan</h4>
                        <p className="text-sm text-gray-400">30 days subscription</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">₹{SUBSCRIPTION_PLANS.pro.price}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span>₹{SUBSCRIPTION_PLANS.pro.price}</span>
                  </div>
                  {promoValidation?.type === "discount" && promoValidation.discountPercent && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount ({promoValidation.discountPercent}%)</span>
                      <span>-₹{Math.round(SUBSCRIPTION_PLANS.pro.price * promoValidation.discountPercent / 100)}</span>
                    </div>
                  )}
                  {promoValidation?.type === "trial" && (
                    <div className="flex justify-between text-green-400">
                      <span>Trial ({promoValidation.trialDays} days free)</span>
                      <span>-₹{SUBSCRIPTION_PLANS.pro.price}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-700 pt-3 flex justify-between text-lg font-bold text-white">
                    <span>Total</span>
                    <span>₹{calculateFinalAmount()}</span>
                  </div>
                </CardContent>
              </Card>

              {billingDetails.name && (
                <div className="text-sm text-gray-400 space-y-1">
                  <p className="font-medium text-gray-300">Billing to:</p>
                  <p>{billingDetails.name}</p>
                  <p>{billingDetails.email}</p>
                  {promoValidation?.valid && (
                    <p className="text-green-400">Promo: {promoValidation.code}</p>
                  )}
                </div>
              )}

              <div className="flex justify-between gap-3 pt-4 border-t border-gray-800">
                <Button variant="outline" onClick={() => setCheckoutStep("billing")}>
                  Back
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                  onClick={handleFinalPayment}
                  disabled={isProcessing || applyPromoCodeMutation.isPending}
                  data-testid="button-confirm-payment"
                >
                  {isProcessing || applyPromoCodeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : promoValidation?.type === "trial" ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Start Free Trial
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay ₹{calculateFinalAmount()}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
