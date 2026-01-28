const API_BASE = "/api";

export function formatINR(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export interface ApiCampaign {
  id: number;
  sponsorId: number | null;
  title: string;
  brand: string;
  brandLogo: string;
  payAmount: string;
  type: string;
  contentTypes: string[] | null;
  promotionStyle: string | null;
  assetUrl: string | null;
  assetFileName: string | null;
  minFollowers: number;
  description: string;
  tier: string;
  deadline: string;
  totalSpots: number;
  spotsRemaining: number;
  status: string;
  isPromotional: boolean;
  starReward: number;
  isApproved: boolean;
  targetCountries: string[];
  totalBudget: string;
  releasedAmount: string;
  refundedAmount: string;
  escrowStatus: string;
  createdAt: string;
  campaignType?: string;
  productName?: string | null;
  productValue?: string | null;
  mentions?: string[] | null;
  // Reservation status counts (added by sponsor campaigns endpoint)
  reservedCount?: number;
  submittedCount?: number;
  approvedCount?: number;
  rejectedCount?: number;
  isTierCompleted?: boolean;
  productImage?: string | null;
  productDescription?: string | null;
}

export interface ApiUser {
  id: number;
  name: string;
  handle: string;
  email: string;
  role: string;
  followers: number;
  engagement: string;
  reach: number;
  avatar: string | null;
  isVerified: boolean;
  tier: string;
  balance: string;
  companyName: string | null;
  gstNumber: string | null;
  instagramUsername: string | null;
  instagramProfileUrl: string | null;
  instagramFollowers: number | null;
  isInstagramVerified: boolean;
  instagramVerificationCode: string | null;
  instagramVerificationStatus: string;
  instagramAccessToken: string | null;
  instagramUserId: string | null;
  instagramTokenExpiresAt: string | null;
  subscriptionPlan: string;
  subscriptionExpiresAt: string | null;
  stars: number;
  country: string;
  totalEarnings?: string;
  pendingWithdrawals?: string;
  starRewards?: number;
  activeReservations?: number;
  completedSubmissions?: number;
  campaignsCreated?: number;
  createdAt?: string;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPincode?: string | null;
  shippingPhone?: string | null;
}

export interface ApiSubscription {
  plan: string;
  expiresAt: string | null;
  isActive: boolean;
}

export interface ApiReservation {
  id: number;
  userId: number;
  campaignId: number;
  status: string;
  reservedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  trackingNumber?: string | null;
  shippingStatus?: string | null;
  shippedAt?: string | null;
  deliveryConfirmed?: boolean | null;
  deliveredAt?: string | null;
  campaign?: ApiCampaign | null;
}

export interface ApiTransaction {
  id: number;
  userId: number;
  type: string;
  category: string;
  amount: string;
  tax: string;
  net: string;
  description: string;
  status: string;
  reservationId: number | null;
  campaignId: number | null;
  paymentId: string | null;
  createdAt: string;
}

export interface ApiWallet {
  balance: string;
  transactions: ApiTransaction[];
}

export interface ApiNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  campaignId: number | null;
  reservationId: number | null;
  createdAt: string;
}

export interface ApiCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface ApiCategorySubscription {
  id: number;
  userId: number;
  category: string;
  tier: string;
  joinedAt: string;
}

export interface ApiBankAccount {
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

export interface ApiWithdrawalRequest {
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

export const api = {
  // Campaigns
  async getCampaigns(country?: string): Promise<ApiCampaign[]> {
    const url = country 
      ? `${API_BASE}/campaigns?country=${encodeURIComponent(country)}`
      : `${API_BASE}/campaigns`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch campaigns");
    return res.json();
  },

  // User (Creator)
  async getCurrentUser(): Promise<ApiUser> {
    const res = await fetch(`${API_BASE}/users/current`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch user");
    return res.json();
  },

  // Sponsor - uses same endpoint as user (authenticated session)
  async getCurrentSponsor(): Promise<ApiUser> {
    const res = await fetch(`${API_BASE}/users/current`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch sponsor");
    return res.json();
  },

  async getSponsorCampaigns(sponsorId: number): Promise<ApiCampaign[]> {
    const res = await fetch(`${API_BASE}/sponsors/${sponsorId}/campaigns`);
    if (!res.ok) throw new Error("Failed to fetch sponsor campaigns");
    return res.json();
  },

  async createCampaign(sponsorId: number, data: {
    title: string;
    brand: string;
    brandLogo: string;
    category?: string;
    payAmount: string;
    type: string;
    contentTypes?: string[];
    promotionStyle?: string;
    assetUrl?: string | null;
    assetFileName?: string | null;
    minFollowers: number;
    description: string;
    tier: string;
    deadline: string;
    totalSpots: number;
    targetCountries?: string[];
    campaignType?: string;
    productName?: string | null;
    productValue?: string | null;
    productImage?: string | null;
    productDescription?: string | null;
    mentions?: string[];
  }): Promise<ApiCampaign> {
    const res = await fetch(`${API_BASE}/sponsors/${sponsorId}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to create campaign");
    }
    return res.json();
  },

  async getCampaignReservations(campaignId: number): Promise<ApiReservation[]> {
    const res = await fetch(`${API_BASE}/campaigns/${campaignId}/reservations`);
    if (!res.ok) throw new Error("Failed to fetch reservations");
    return res.json();
  },

  async updateCampaignStatus(campaignId: number, status: string) {
    const res = await fetch(`${API_BASE}/campaigns/${campaignId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update campaign status");
    return res.json();
  },

  async deleteCampaign(campaignId: number) {
    const res = await fetch(`${API_BASE}/campaigns/${campaignId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to delete campaign");
    }
    return res.json();
  },

  // Sponsor Wallet
  async getSponsorWallet(sponsorId: number): Promise<ApiWallet> {
    const res = await fetch(`${API_BASE}/sponsors/${sponsorId}/wallet`);
    if (!res.ok) throw new Error("Failed to fetch wallet");
    return res.json();
  },

  async depositToWallet(sponsorId: number, amount: number, description?: string): Promise<{ success: boolean; newBalance: string; transaction: ApiTransaction }> {
    const res = await fetch(`${API_BASE}/sponsors/${sponsorId}/wallet/deposit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amount.toString(), description }),
    });
    if (!res.ok) throw new Error("Failed to process deposit");
    return res.json();
  },

  // Reservations
  async getUserReservations(userId: number): Promise<ApiReservation[]> {
    const res = await fetch(`${API_BASE}/users/${userId}/reservations`);
    if (!res.ok) throw new Error("Failed to fetch reservations");
    return res.json();
  },

  async reserveCampaign(userId: number, campaignId: number): Promise<ApiReservation> {
    const res = await fetch(`${API_BASE}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, campaignId }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to reserve campaign");
    }
    return res.json();
  },

  // Submissions
  async submitWork(reservationId: number, data: { link: string; clipUrl?: string }) {
    const res = await fetch(`${API_BASE}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reservationId, ...data }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to submit work");
    }
    return res.json();
  },

  async approveSubmission(reservationId: number) {
    const res = await fetch(`${API_BASE}/reservations/${reservationId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to approve submission");
    return res.json();
  },

  async cancelReservation(reservationId: number) {
    const res = await fetch(`${API_BASE}/reservations/${reservationId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to cancel reservation");
    }
    return res.json();
  },

  // Transactions
  async getUserTransactions(userId: number): Promise<ApiTransaction[]> {
    const res = await fetch(`${API_BASE}/users/${userId}/transactions`);
    if (!res.ok) throw new Error("Failed to fetch transactions");
    return res.json();
  },

  async withdrawFunds(userId: number, amount: number) {
    const res = await fetch(`${API_BASE}/users/${userId}/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to withdraw funds");
    }
    return res.json();
  },

  // Bank Accounts
  async getBankAccounts(): Promise<ApiBankAccount[]> {
    const res = await fetch(`${API_BASE}/bank-accounts`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to fetch bank accounts");
    }
    return res.json();
  },

  async addBankAccount(data: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    upiId?: string;
  }): Promise<ApiBankAccount> {
    const res = await fetch(`${API_BASE}/bank-accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to add bank account");
    }
    return res.json();
  },

  async deleteBankAccount(accountId: number) {
    const res = await fetch(`${API_BASE}/bank-accounts/${accountId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to delete bank account");
    }
    return res.json();
  },

  async setDefaultBankAccount(accountId: number) {
    const res = await fetch(`${API_BASE}/bank-accounts/${accountId}/set-default`, {
      method: "POST",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to set default account");
    }
    return res.json();
  },

  // Withdrawal Requests
  async getWithdrawalRequests(): Promise<ApiWithdrawalRequest[]> {
    const res = await fetch(`${API_BASE}/withdrawal-requests`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to fetch withdrawal requests");
    }
    return res.json();
  },

  async createWithdrawalRequest(amount: number, bankAccountId: number) {
    const res = await fetch(`${API_BASE}/withdrawal-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, bankAccountId }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to submit withdrawal request");
    }
    return res.json();
  },

  // Notifications
  async getNotifications(userId: number): Promise<ApiNotification[]> {
    const res = await fetch(`${API_BASE}/users/${userId}/notifications`);
    if (!res.ok) throw new Error("Failed to fetch notifications");
    return res.json();
  },

  async getUnreadCount(userId: number): Promise<{ count: number }> {
    const res = await fetch(`${API_BASE}/users/${userId}/notifications/unread-count`);
    if (!res.ok) throw new Error("Failed to fetch unread count");
    return res.json();
  },

  async markNotificationAsRead(notificationId: number) {
    const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      method: "PATCH",
    });
    if (!res.ok) throw new Error("Failed to mark notification as read");
    return res.json();
  },

  // Subscription
  async getSubscription(userId: number): Promise<ApiSubscription> {
    const res = await fetch(`${API_BASE}/users/${userId}/subscription`);
    if (!res.ok) throw new Error("Failed to fetch subscription");
    return res.json();
  },

  async createPaymentOrder(userId: number, options?: { amount?: number; promoCode?: string; billingDetails?: any }): Promise<{ orderId: string; sessionId: string; paymentLink?: string; amount: number; currency: string }> {
    const res = await fetch(`${API_BASE}/subscription/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...options }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to create payment order");
    }
    return res.json();
  },

  async verifyPayment(userId: number, paymentDetails: { orderId: string }): Promise<{ success: boolean; plan: string; expiresAt: string }> {
    const res = await fetch(`${API_BASE}/subscription/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...paymentDetails }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to verify payment");
    }
    return res.json();
  },

  async getCashfreeConfig(): Promise<{ appId: string; environment: string }> {
    const res = await fetch(`${API_BASE}/cashfree/config`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to get payment config");
    }
    return res.json();
  },

  async markAllNotificationsAsRead(userId: number) {
    const res = await fetch(`${API_BASE}/users/${userId}/notifications/mark-all-read`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to mark all as read");
    return res.json();
  },

  async updateUserInstagram(userId: number, instagramUsername: string, instagramProfileUrl?: string, instagramFollowers?: number): Promise<ApiUser> {
    const res = await fetch(`${API_BASE}/users/${userId}/instagram`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instagramUsername, instagramProfileUrl, instagramFollowers }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to update Instagram");
    }
    return res.json();
  },

  async updateUserShippingAddress(userId: number, data: { shippingAddress: string; shippingCity: string; shippingState: string; shippingPincode: string; shippingPhone: string }): Promise<ApiUser> {
    const res = await fetch(`${API_BASE}/users/${userId}/shipping-address`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to update shipping address");
    }
    return res.json();
  },

  async generateInstagramVerificationCode(userId: number): Promise<{ code: string; user: ApiUser }> {
    const res = await fetch(`${API_BASE}/users/${userId}/instagram/generate-code`, {
      method: "POST",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to generate verification code");
    }
    return res.json();
  },

  async submitInstagramForVerification(userId: number): Promise<ApiUser> {
    const res = await fetch(`${API_BASE}/users/${userId}/instagram/submit-verification`, {
      method: "POST",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to submit for verification");
    }
    return res.json();
  },

  async verifyInstagramAccount(userId: number): Promise<ApiUser> {
    const res = await fetch(`${API_BASE}/users/${userId}/instagram/verify`, {
      method: "POST",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to verify Instagram");
    }
    return res.json();
  },

  async getInstagramAuthUrl(userId: number): Promise<{ authUrl: string }> {
    const res = await fetch(`${API_BASE}/instagram/auth-url?userId=${userId}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to get Instagram auth URL");
    }
    return res.json();
  },

  async refreshInstagramData(userId: number): Promise<ApiUser> {
    const res = await fetch(`${API_BASE}/users/${userId}/instagram/refresh`, {
      method: "POST",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to refresh Instagram data");
    }
    return res.json();
  },

  // Categories
  async getCategories(): Promise<ApiCategory[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
  },

  async getCampaignsByCategory(category: string, tier?: string): Promise<ApiCampaign[]> {
    const url = tier 
      ? `${API_BASE}/categories/${category}/campaigns?tier=${encodeURIComponent(tier)}`
      : `${API_BASE}/categories/${category}/campaigns`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch campaigns");
    return res.json();
  },

  async getUserCategorySubscriptions(userId: number): Promise<ApiCategorySubscription[]> {
    const res = await fetch(`${API_BASE}/users/${userId}/category-subscriptions`);
    if (!res.ok) throw new Error("Failed to fetch subscriptions");
    return res.json();
  },

  async subscribeToCategoryGroup(userId: number, category: string, tier: string): Promise<ApiCategorySubscription> {
    const res = await fetch(`${API_BASE}/users/${userId}/category-subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, tier }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to subscribe");
    }
    return res.json();
  },

  async unsubscribeFromCategoryGroup(userId: number, category: string, tier: string): Promise<void> {
    const res = await fetch(`${API_BASE}/users/${userId}/category-subscriptions`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, tier }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to unsubscribe");
    }
  },

  // ============ ADMIN API ============
  admin: {
    async getStats(): Promise<AdminStats> {
      const res = await fetch(`${API_BASE}/admin/stats`, { credentials: "include" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch stats");
      }
      return res.json();
    },

    async getUsers(role?: string): Promise<ApiUser[]> {
      const url = role ? `${API_BASE}/admin/users?role=${role}` : `${API_BASE}/admin/users`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch users");
      }
      return res.json();
    },

    async getPendingVerifications(): Promise<ApiUser[]> {
      const res = await fetch(`${API_BASE}/admin/users/pending-verification`, { credentials: "include" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch pending verifications");
      }
      return res.json();
    },

    async getVerifiedInstagramUsers(): Promise<ApiUser[]> {
      const res = await fetch(`${API_BASE}/admin/users/verified-instagram`, { credentials: "include" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch verified users");
      }
      return res.json();
    },

    async verifyInstagram(userId: number): Promise<ApiUser> {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/verify-instagram`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to verify");
      }
      return res.json();
    },

    async rejectInstagram(userId: number, reason?: string): Promise<ApiUser> {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/reject-instagram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reject");
      }
      return res.json();
    },

    async updateUserStatus(userId: number, isVerified: boolean): Promise<ApiUser> {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update status");
      }
      return res.json();
    },

    async awardStars(userId: number, stars: number, reason?: string): Promise<{ success: boolean; newStars: number; promoCode?: string }> {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/award-stars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, reason }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to award stars");
      }
      return res.json();
    },

    async getCampaigns(): Promise<ApiCampaign[]> {
      const res = await fetch(`${API_BASE}/admin/campaigns`, { credentials: "include" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch campaigns");
      }
      return res.json();
    },

    async updateCampaignStatus(campaignId: number, status: string): Promise<ApiCampaign> {
      const res = await fetch(`${API_BASE}/admin/campaigns/${campaignId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update campaign");
      }
      return res.json();
    },

    async getPendingApprovalCampaigns(): Promise<ApiCampaign[]> {
      const res = await fetch(`${API_BASE}/admin/campaigns/pending-approval`, { credentials: "include" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch pending campaigns");
      }
      return res.json();
    },

    async approveCampaign(campaignId: number, isPromotional?: boolean, starReward?: number): Promise<ApiCampaign> {
      const res = await fetch(`${API_BASE}/admin/campaigns/${campaignId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPromotional, starReward }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to approve campaign");
      }
      return res.json();
    },

    async rejectCampaign(campaignId: number, reason?: string): Promise<{ success: boolean }> {
      const res = await fetch(`${API_BASE}/admin/campaigns/${campaignId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reject campaign");
      }
      return res.json();
    },

    async getWithdrawals(status?: string): Promise<AdminWithdrawalRequest[]> {
      const url = status ? `${API_BASE}/admin/withdrawals?status=${status}` : `${API_BASE}/admin/withdrawals`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch withdrawals");
      }
      return res.json();
    },

    async approveWithdrawal(requestId: number, utrNumber?: string): Promise<ApiWithdrawalRequest> {
      const res = await fetch(`${API_BASE}/admin/withdrawals/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utrNumber }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to approve withdrawal");
      }
      return res.json();
    },

    async rejectWithdrawal(requestId: number, reason?: string): Promise<ApiWithdrawalRequest> {
      const res = await fetch(`${API_BASE}/admin/withdrawals/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reject withdrawal");
      }
      return res.json();
    },

    async getPendingSubmissions(): Promise<AdminPendingSubmission[]> {
      const res = await fetch(`${API_BASE}/admin/submissions/pending`, { credentials: "include" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch submissions");
      }
      return res.json();
    },

    async getCampaignSubmissions(): Promise<CampaignGroup[]> {
      const res = await fetch(`${API_BASE}/admin/campaign-submissions`, { credentials: "include" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch campaign submissions");
      }
      return res.json();
    },

    async approveSubmission(reservationId: number): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`${API_BASE}/admin/submissions/${reservationId}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to approve submission");
      }
      return res.json();
    },

    async rejectSubmission(reservationId: number, reason?: string): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`${API_BASE}/admin/submissions/${reservationId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reject submission");
      }
      return res.json();
    },

    async getTransactions(): Promise<AdminTransaction[]> {
      const res = await fetch(`${API_BASE}/admin/transactions`, { credentials: "include" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch transactions");
      }
      return res.json();
    },
  },

  // Mock Instagram verification
  instagram: {
    async fetchFollowers(username: string): Promise<{ followers: number; username: string; message: string }> {
      const res = await fetch(`${API_BASE}/instagram/fetch-followers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch followers");
      }
      return res.json();
    },

    async submitForVerification(userId: number): Promise<any> {
      const res = await fetch(`${API_BASE}/instagram/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit for verification");
      }
      return res.json();
    },

    async generateCode(userId: number): Promise<any> {
      const res = await fetch(`${API_BASE}/instagram/generate-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate code");
      }
      return res.json();
    },

    async verify(userId: number): Promise<any> {
      const res = await fetch(`${API_BASE}/instagram/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to verify Instagram");
      }
      return res.json();
    },
  },

  async getAccountStatus(): Promise<AccountStatus> {
    const res = await fetch(`${API_BASE}/account/status`, {
      credentials: "include",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to get account status");
    }
    return res.json();
  },

  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/subscription/cancel`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to cancel subscription");
    }
    return res.json();
  },

  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/account`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to delete account");
    }
    return res.json();
  },
};

export interface AccountStatus {
  balance: number;
  activeCampaigns: number;
  pendingWithdrawals: number;
  subscriptionPlan: string;
  subscriptionExpiresAt: string | null;
  autoRenew: boolean;
}

// Admin types
export interface AdminStats {
  totalUsers: number;
  totalCreators: number;
  totalSponsors: number;
  totalCampaigns: number;
  activeCampaigns: number;
  pendingWithdrawals: number;
  pendingWithdrawalAmount: string;
  totalWithdrawalsProcessed: string;
  pendingSubmissions: number;
  pendingVerifications: number;
}

export interface AdminWithdrawalRequest extends ApiWithdrawalRequest {
  user: ApiUser | null;
  bankAccount: {
    id: number;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    upiId: string | null;
  } | null;
}

export interface AdminPendingSubmission {
  submission: {
    id: number;
    reservationId: number;
    link: string;
    clipUrl: string | null;
    startTime: string;
    endTime: string;
    submittedAt: string;
  };
  reservation: ApiReservation;
  campaign: ApiCampaign;
  user: ApiUser;
}

export interface AdminTransaction extends ApiTransaction {
  user: { id: number; name: string; email: string; handle: string } | null;
}

export interface CampaignGroup {
  campaign: {
    id: number;
    title: string;
    tier: string;
    totalSpots: number;
    spotsRemaining: number;
    deadline: string;
    payAmount: string;
    isPromotional: boolean;
    starReward: number;
    status: string;
  };
  sponsor: {
    id: number;
    name: string;
    email: string;
    companyName: string;
  } | null;
  stats: {
    totalReservations: number;
    reserved: number;
    submitted: number;
    approved: number;
    rejected: number;
    expired: number;
    spotsFilledPercent: number;
  };
  submissions: {
    reservation: ApiReservation;
    user: {
      id: number;
      name: string;
      email: string;
      instagramUsername: string;
      tier: number;
    } | null;
    submission: {
      id: number;
      reservationId: number;
      link: string;
      clipUrl: string | null;
      submittedAt: string;
    } | null;
  }[];
}
