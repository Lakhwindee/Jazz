import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Gift, Star, Copy, Check, Tag, Clock, Sparkles, Crown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

interface PromoCodeNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export default function Offers() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: api.getCurrentUser,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => api.getNotifications(user?.id || 0),
    enabled: !!user?.id,
  });

  const promoNotifications = notifications.filter(
    (n: PromoCodeNotification) => n.type === "subscription_reward" || n.type === "promo_code_generated"
  );

  const extractPromoCode = (message: string): string | null => {
    const match = message.match(/Your code:\s*([A-Z0-9-]+)/i) || message.match(/code:\s*([A-Z0-9-]+)/i);
    return match ? match[1] : null;
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success("Promo code copied!");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        <div className="container max-w-4xl py-6 px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">My Offers</h1>
                <p className="text-muted-foreground">Your earned promo codes and rewards</p>
              </div>
            </div>

            <Card className="mb-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-800/30">
                    <Star className="h-8 w-8 text-yellow-600 fill-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Stars</p>
                    <p className="text-3xl font-bold text-yellow-600">{user?.stars || 0} ⭐</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {5 - ((user?.stars || 0) % 5)} more stars for next promo code
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Complete promotional campaigns to earn stars. Every 5 stars = 1 month FREE Pro subscription!
                  </p>
                </div>
              </CardContent>
            </Card>

            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Your Promo Codes
            </h2>

            {promoNotifications.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <Gift className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">No Promo Codes Yet</h3>
                      <p className="text-muted-foreground mt-1">
                        Complete promotional campaigns and collect 5 stars to earn your first promo code!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {promoNotifications.map((notification: PromoCodeNotification) => {
                  const promoCode = extractPromoCode(notification.message);
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Crown className="h-5 w-5" />
                              <CardTitle className="text-base">{notification.title}</CardTitle>
                            </div>
                            <Badge className="bg-white/20 text-white border-0">
                              FREE Month
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            {notification.message.split("Your code:")[0]}
                          </p>
                          
                          {promoCode && (
                            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Your Promo Code</p>
                                <p className="text-lg font-mono font-bold tracking-wider" data-testid={`promo-code-${notification.id}`}>
                                  {promoCode}
                                </p>
                              </div>
                              <Button
                                variant={copiedCode === promoCode ? "default" : "outline"}
                                size="sm"
                                onClick={() => copyToClipboard(promoCode)}
                                className="gap-2"
                                data-testid={`button-copy-${notification.id}`}
                              >
                                {copiedCode === promoCode ? (
                                  <>
                                    <Check className="h-4 w-4" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4" />
                                    Copy
                                  </>
                                )}
                              </Button>
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Earned on {format(new Date(notification.createdAt), "MMM d, yyyy")}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  How to Use Promo Codes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                  <p className="text-sm">Go to the <strong>Subscription</strong> page</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                  <p className="text-sm">Click on <strong>Have a promo code?</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
                  <p className="text-sm">Paste your promo code and enjoy <strong>1 month FREE Pro</strong> subscription!</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
