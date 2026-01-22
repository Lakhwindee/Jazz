import { db } from "../db";
import { users, campaigns, reservations, submissions, transactions, notifications, categorySubscriptions, bankAccounts, withdrawalRequests, appSettings, promoCodes, promoCodeUsage, adminWallet, adminWalletTransactions, subscriptionPlans, otpVerifications, newsletters, supportTickets, ticketMessages, sessions } from "@shared/schema";
import type { User, InsertUser, Campaign, InsertCampaign, Reservation, InsertReservation, Submission, InsertSubmission, Transaction, InsertTransaction, Notification, InsertNotification, CategorySubscription, InsertCategorySubscription, BankAccount, InsertBankAccount, WithdrawalRequest, InsertWithdrawalRequest, AppSetting, InsertAppSetting, PromoCode, InsertPromoCode, PromoCodeUsage, InsertPromoCodeUsage, AdminWallet, AdminWalletTransaction, InsertAdminWalletTransaction, SubscriptionPlan, InsertSubscriptionPlan, OtpVerification, InsertOtpVerification, Newsletter, InsertNewsletter, SupportTicket, InsertSupportTicket, TicketMessage, InsertTicketMessage } from "@shared/schema";
import { eq, desc, and, count, sql, or, isNull, ne, lt } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByHandle(handle: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, balance: string): Promise<void>;
  updateUserInstagram(id: number, instagramUsername: string, instagramProfileUrl: string, instagramFollowers: number | null): Promise<void>;
  updateUserTierAndFollowers(id: number, tier: string, followers: number): Promise<void>;
  updateUserBilling(id: number, billing: { companyName?: string | null; gstNumber?: string | null; panNumber?: string | null; billingAddress?: string | null; billingCity?: string | null; billingState?: string | null; billingPincode?: string | null }): Promise<void>;
  updateUserShippingAddress(id: number, address: { shippingAddress: string; shippingCity: string; shippingState: string; shippingPincode: string; shippingPhone: string }): Promise<void>;
  updateUserVerificationCode(id: number, code: string): Promise<void>;
  submitInstagramForVerification(id: number): Promise<void>;
  verifyUserInstagram(id: number): Promise<void>;
  updateUserInstagramOAuth(id: number, accessToken: string, instagramUserId: string, expiresAt: Date): Promise<void>;
  updateUserInstagramProfile(id: number, username: string, profileUrl: string, followers: number): Promise<void>;
  updateUserSubscription(id: number, plan: string, expiresAt: Date | null, isTrial?: boolean, autoRenew?: boolean): Promise<void>;
  updateUserStars(id: number, stars: number): Promise<void>;

  // Campaigns
  getAllCampaigns(): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaignSpots(id: number, spotsRemaining: number): Promise<void>;
  getCampaignsBySponsor(sponsorId: number): Promise<Campaign[]>;
  updateCampaignStatus(id: number, status: string): Promise<void>;
  deleteCampaign(id: number): Promise<void>;
  getReservationsForCampaign(campaignId: number): Promise<Reservation[]>;
  updateCampaignEscrow(id: number, releasedAmount: string, refundedAmount: string, escrowStatus: string): Promise<void>;
  getExpiredCampaignsForRefund(): Promise<Campaign[]>;

  // Reservations
  getReservationsByUser(userId: number): Promise<Reservation[]>;
  getReservation(id: number): Promise<Reservation | undefined>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservationStatus(id: number, status: string, reviewedAt?: Date): Promise<void>;
  getUserReservationForCampaign(userId: number, campaignId: number): Promise<Reservation | undefined>;
  expireExpiredReservations(): Promise<number>; // Returns count of expired reservations
  deleteReservation(id: number): Promise<void>;

  // Submissions
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmissionByReservation(reservationId: number): Promise<Submission | undefined>;

  // Transactions
  getTransactionsByUser(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // Notifications
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;

  // Category Subscriptions
  getCategorySubscriptionsByUser(userId: number): Promise<CategorySubscription[]>;
  subscribeToCategoryGroup(subscription: InsertCategorySubscription): Promise<CategorySubscription>;
  unsubscribeFromCategoryGroup(userId: number, category: string, tier: string): Promise<void>;
  getUserSubscription(userId: number, category: string, tier: string): Promise<CategorySubscription | undefined>;
  getCampaignsByCategory(category: string): Promise<Campaign[]>;
  getCampaignsByCategoryAndTier(category: string, tier: string): Promise<Campaign[]>;
  getPendingApprovalCampaigns(): Promise<Campaign[]>;
  approveCampaign(campaignId: number, isPromotional?: boolean, starReward?: number): Promise<Campaign | undefined>;
  rejectCampaign(campaignId: number): Promise<void>;

  // Bank Accounts
  getBankAccountsByUser(userId: number): Promise<BankAccount[]>;
  getBankAccount(id: number): Promise<BankAccount | undefined>;
  getDefaultBankAccount(userId: number): Promise<BankAccount | undefined>;
  createBankAccount(account: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(id: number, account: Partial<InsertBankAccount>): Promise<void>;
  deleteBankAccount(id: number): Promise<void>;
  setDefaultBankAccount(userId: number, accountId: number): Promise<void>;

  // Withdrawal Requests
  getWithdrawalRequestsByUser(userId: number): Promise<WithdrawalRequest[]>;
  getWithdrawalRequest(id: number): Promise<WithdrawalRequest | undefined>;
  getPendingWithdrawalRequest(userId: number): Promise<WithdrawalRequest | undefined>;
  createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest>;
  updateWithdrawalRequestStatus(id: number, status: string, utrNumber?: string, adminNote?: string): Promise<void>;
  getAllPendingWithdrawalRequests(): Promise<WithdrawalRequest[]>;

  // Admin Methods
  getAllUsers(): Promise<User[]>;
  getAllCreators(): Promise<User[]>;
  getAllSponsors(): Promise<User[]>;
  getUsersPendingVerification(): Promise<User[]>;
  getVerifiedInstagramUsers(): Promise<User[]>;
  getAllWithdrawalRequests(): Promise<WithdrawalRequest[]>;
  getAllSubmissions(): Promise<Submission[]>;
  getAllReservations(): Promise<Reservation[]>;
  getSubmissionsPendingReview(): Promise<{ submission: Submission; reservation: Reservation; campaign: Campaign; user: User }[]>;
  getAdminStats(): Promise<{
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
  }>;
  updateUserStatus(id: number, isVerified: boolean): Promise<void>;
  rejectInstagramVerification(id: number): Promise<void>;
  updateTransactionStatus(id: number, status: string): Promise<void>;
  getAllTransactions(): Promise<Transaction[]>;
  banUser(id: number, reason: string): Promise<void>;
  unbanUser(id: number): Promise<void>;
  deleteUser(id: number): Promise<void>;
  disconnectInstagram(id: number): Promise<void>;
  banInstagram(id: number): Promise<void>;
  unbanInstagram(id: number): Promise<void>;
  
  // App Settings
  getSetting(key: string): Promise<AppSetting | undefined>;
  getAllSettings(): Promise<AppSetting[]>;
  upsertSetting(key: string, value: string, description?: string): Promise<AppSetting>;

  // Promo Codes
  getAllPromoCodes(): Promise<PromoCode[]>;
  getPromoCode(id: number): Promise<PromoCode | undefined>;
  getPromoCodeByCode(code: string): Promise<PromoCode | undefined>;
  createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode>;
  updatePromoCode(id: number, updates: Partial<InsertPromoCode>): Promise<void>;
  deletePromoCode(id: number): Promise<void>;
  togglePromoCodeStatus(id: number, isActive: boolean): Promise<void>;
  incrementPromoCodeUsage(id: number): Promise<void>;
  recordPromoCodeUsage(promoCodeId: number, userId: number): Promise<PromoCodeUsage>;
  hasUserUsedPromoCode(promoCodeId: number, userId: number): Promise<boolean>;

  // Admin Wallet
  getAdminWallet(): Promise<AdminWallet>;
  updateAdminWalletBalance(amount: number, type: 'add' | 'subtract'): Promise<void>;
  createAdminWalletTransaction(transaction: InsertAdminWalletTransaction): Promise<AdminWalletTransaction>;
  getAdminWalletTransactions(): Promise<AdminWalletTransaction[]>;
  updateAdminWalletStats(earnings?: number, payouts?: number, refunds?: number): Promise<void>;

  // Subscription Plans (database-driven)
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  getSubscriptionPlanByPlanId(planId: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: number, updates: Partial<InsertSubscriptionPlan>): Promise<void>;
  deleteSubscriptionPlan(id: number): Promise<void>;

  // OTP Verification
  createOtp(email: string, otp: string, expiresAt: Date): Promise<OtpVerification>;
  getValidOtp(email: string): Promise<OtpVerification | undefined>;
  verifyOtp(email: string, otp: string): Promise<boolean>;
  incrementOtpAttempts(id: number): Promise<void>;
  deleteExpiredOtps(): Promise<void>;
  deleteOtp(email: string): Promise<void>;

  // Password Management
  updateUserPassword(id: number, hashedPassword: string): Promise<void>;

  // Newsletters
  getAllNewsletters(): Promise<Newsletter[]>;
  createNewsletter(newsletter: InsertNewsletter): Promise<Newsletter>;
  getUsersForNewsletter(targetAudience: string): Promise<User[]>;

  // Support Tickets
  getAllSupportTickets(): Promise<SupportTicket[]>;
  getSupportTicketsByUser(userId: number): Promise<SupportTicket[]>;
  getSupportTicket(id: number): Promise<SupportTicket | undefined>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicketStatus(id: number, status: string): Promise<void>;
  getTicketMessages(ticketId: number): Promise<TicketMessage[]>;
  createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage>;

  // Data Reset
  resetAllData(): Promise<{ users: number; campaigns: number; reservations: string; transactions: string }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByHandle(handle: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.handle, handle)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUserBalance(id: number, balance: string): Promise<void> {
    await db.update(users).set({ balance }).where(eq(users.id, id));
  }

  async updateUserInstagram(id: number, instagramUsername: string, instagramProfileUrl: string, instagramFollowers: number | null): Promise<void> {
    await db.update(users).set({ 
      instagramUsername: instagramUsername || null, 
      instagramProfileUrl: instagramProfileUrl || null,
      instagramFollowers,
      isInstagramVerified: false,
      instagramVerificationCode: null,
      instagramVerificationStatus: instagramUsername ? "pending" : "none",
      instagramAccessToken: null,
      instagramUserId: null,
      instagramTokenExpiresAt: null
    }).where(eq(users.id, id));
  }

  async updateUserTierAndFollowers(id: number, tier: string, followers: number): Promise<void> {
    await db.update(users).set({ tier, followers }).where(eq(users.id, id));
  }

  async updateUserBilling(id: number, billing: { companyName?: string | null; gstNumber?: string | null; panNumber?: string | null; billingAddress?: string | null; billingCity?: string | null; billingState?: string | null; billingPincode?: string | null }): Promise<void> {
    await db.update(users).set(billing).where(eq(users.id, id));
  }

  async updateUserShippingAddress(id: number, address: { shippingAddress: string; shippingCity: string; shippingState: string; shippingPincode: string; shippingPhone: string }): Promise<void> {
    await db.update(users).set(address).where(eq(users.id, id));
  }

  async updateUserVerificationCode(id: number, code: string): Promise<void> {
    await db.update(users).set({ instagramVerificationCode: code }).where(eq(users.id, id));
  }

  async submitInstagramForVerification(id: number): Promise<void> {
    await db.update(users).set({ instagramVerificationStatus: "pending" }).where(eq(users.id, id));
  }

  async verifyUserInstagram(id: number): Promise<void> {
    await db.update(users).set({ isInstagramVerified: true, instagramVerificationStatus: "verified" }).where(eq(users.id, id));
  }

  async updateUserInstagramOAuth(id: number, accessToken: string, instagramUserId: string, expiresAt: Date): Promise<void> {
    await db.update(users).set({ 
      instagramAccessToken: accessToken,
      instagramUserId: instagramUserId,
      instagramTokenExpiresAt: expiresAt,
      isInstagramVerified: true,
      instagramVerificationStatus: "verified"
    }).where(eq(users.id, id));
  }

  async updateUserInstagramProfile(id: number, username: string, profileUrl: string, followers: number): Promise<void> {
    await db.update(users).set({ 
      instagramUsername: username,
      instagramProfileUrl: profileUrl,
      instagramFollowers: followers,
      followers: followers
    }).where(eq(users.id, id));
  }

  async updateUserSubscription(id: number, plan: string, expiresAt: Date | null, isTrial: boolean = false, autoRenew?: boolean): Promise<void> {
    const updateData: any = { 
      subscriptionPlan: plan,
      subscriptionExpiresAt: expiresAt,
      isTrialSubscription: isTrial,
    };
    
    if (plan === "free") {
      updateData.autoRenew = false;
    } else if (autoRenew !== undefined) {
      updateData.autoRenew = autoRenew;
    }
    
    await db.update(users).set(updateData).where(eq(users.id, id));
  }

  async updateUserStars(id: number, stars: number): Promise<void> {
    await db.update(users).set({ stars }).where(eq(users.id, id));
  }

  async downgradeExpiredTrials(): Promise<number> {
    const now = new Date();
    const result = await db.update(users)
      .set({ 
        subscriptionPlan: "free",
        isTrialSubscription: false,
        subscriptionExpiresAt: null,
      })
      .where(
        and(
          eq(users.isTrialSubscription, true),
          eq(users.subscriptionPlan, "pro"),
          lt(users.subscriptionExpiresAt, now)
        )
      )
      .returning({ id: users.id });
    return result.length;
  }

  // Campaigns
  async getAllCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    return result[0];
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const result = await db.insert(campaigns).values(insertCampaign).returning();
    return result[0];
  }

  async updateCampaignSpots(id: number, spotsRemaining: number): Promise<void> {
    await db.update(campaigns).set({ spotsRemaining }).where(eq(campaigns.id, id));
  }

  async getCampaignsBySponsor(sponsorId: number): Promise<Campaign[]> {
    return await db.select().from(campaigns).where(eq(campaigns.sponsorId, sponsorId)).orderBy(desc(campaigns.createdAt));
  }

  async updateCampaignStatus(id: number, status: string): Promise<void> {
    await db.update(campaigns).set({ status }).where(eq(campaigns.id, id));
  }

  async deleteCampaign(id: number): Promise<void> {
    await db.delete(campaigns).where(eq(campaigns.id, id));
  }

  async getReservationsForCampaign(campaignId: number): Promise<Reservation[]> {
    return await db.select().from(reservations).where(eq(reservations.campaignId, campaignId)).orderBy(desc(reservations.reservedAt));
  }

  async updateCampaignEscrow(id: number, releasedAmount: string, refundedAmount: string, escrowStatus: string): Promise<void> {
    await db.update(campaigns).set({ 
      releasedAmount, 
      refundedAmount, 
      escrowStatus 
    }).where(eq(campaigns.id, id));
  }

  async getExpiredCampaignsForRefund(): Promise<Campaign[]> {
    const now = new Date();
    return await db.select().from(campaigns)
      .where(and(
        lt(campaigns.deadline, now),
        eq(campaigns.escrowStatus, "active"),
        ne(campaigns.isPromotional, true) // Only non-promotional campaigns have money to refund
      ));
  }

  // Reservations
  async getReservationsByUser(userId: number): Promise<Reservation[]> {
    return await db.select().from(reservations).where(eq(reservations.userId, userId)).orderBy(desc(reservations.reservedAt));
  }

  async getReservation(id: number): Promise<Reservation | undefined> {
    const result = await db.select().from(reservations).where(eq(reservations.id, id)).limit(1);
    return result[0];
  }

  async createReservation(insertReservation: InsertReservation): Promise<Reservation> {
    const result = await db.insert(reservations).values(insertReservation).returning();
    return result[0];
  }

  async updateReservationStatus(id: number, status: string, reviewedAt?: Date): Promise<void> {
    const updateData: any = { status };
    if (reviewedAt) {
      updateData.reviewedAt = reviewedAt;
    }
    await db.update(reservations).set(updateData).where(eq(reservations.id, id));
  }

  async deleteReservation(id: number): Promise<void> {
    await db.delete(reservations).where(eq(reservations.id, id));
  }

  async updateReservationShipping(id: number, data: {
    trackingNumber?: string;
    shippingStatus?: string;
    shippedAt?: Date;
    deliveryConfirmed?: boolean;
    deliveredAt?: Date;
  }): Promise<void> {
    await db.update(reservations).set(data).where(eq(reservations.id, id));
  }

  async getUserReservationForCampaign(userId: number, campaignId: number): Promise<Reservation | undefined> {
    const result = await db.select().from(reservations)
      .where(and(eq(reservations.userId, userId), eq(reservations.campaignId, campaignId)))
      .limit(1);
    return result[0];
  }

  async expireExpiredReservations(): Promise<number> {
    // Find all expired reservations that are still "reserved" status
    const expiredReservations = await db.select().from(reservations)
      .where(and(
        eq(reservations.status, "reserved"),
        lt(reservations.expiresAt, new Date())
      ));

    let expiredCount = 0;
    for (const reservation of expiredReservations) {
      // Mark reservation as expired
      await db.update(reservations)
        .set({ status: "expired" })
        .where(eq(reservations.id, reservation.id));

      // Return the spot to the campaign
      const campaign = await db.select().from(campaigns)
        .where(eq(campaigns.id, reservation.campaignId))
        .limit(1);

      if (campaign[0]) {
        await db.update(campaigns)
          .set({ spotsRemaining: campaign[0].spotsRemaining + 1 })
          .where(eq(campaigns.id, reservation.campaignId));
      }

      expiredCount++;
    }

    return expiredCount;
  }

  // Submissions
  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const result = await db.insert(submissions).values(insertSubmission).returning();
    return result[0];
  }

  async getSubmissionByReservation(reservationId: number): Promise<Submission | undefined> {
    const result = await db.select().from(submissions).where(eq(submissions.reservationId, reservationId)).limit(1);
    return result[0];
  }

  // Transactions
  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(insertTransaction).returning();
    return result[0];
  }

  // Notifications
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db.select().from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.length;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(insertNotification).returning();
    return result[0];
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  // Category Subscriptions
  async getCategorySubscriptionsByUser(userId: number): Promise<CategorySubscription[]> {
    return await db.select().from(categorySubscriptions)
      .where(eq(categorySubscriptions.userId, userId))
      .orderBy(desc(categorySubscriptions.joinedAt));
  }

  async subscribeToCategoryGroup(subscription: InsertCategorySubscription): Promise<CategorySubscription> {
    const result = await db.insert(categorySubscriptions).values(subscription).returning();
    return result[0];
  }

  async unsubscribeFromCategoryGroup(userId: number, category: string, tier: string): Promise<void> {
    await db.delete(categorySubscriptions)
      .where(and(
        eq(categorySubscriptions.userId, userId),
        eq(categorySubscriptions.category, category),
        eq(categorySubscriptions.tier, tier)
      ));
  }

  async getUserSubscription(userId: number, category: string, tier: string): Promise<CategorySubscription | undefined> {
    const result = await db.select().from(categorySubscriptions)
      .where(and(
        eq(categorySubscriptions.userId, userId),
        eq(categorySubscriptions.category, category),
        eq(categorySubscriptions.tier, tier)
      ))
      .limit(1);
    return result[0];
  }

  async getCampaignsByCategory(category: string): Promise<Campaign[]> {
    return await db.select().from(campaigns)
      .where(and(eq(campaigns.category, category), eq(campaigns.status, "active"), eq(campaigns.isApproved, true)))
      .orderBy(desc(campaigns.createdAt));
  }

  async getCampaignsByCategoryAndTier(category: string, tier: string): Promise<Campaign[]> {
    return await db.select().from(campaigns)
      .where(and(
        eq(campaigns.category, category),
        eq(campaigns.tier, tier),
        eq(campaigns.status, "active"),
        eq(campaigns.isApproved, true)
      ))
      .orderBy(desc(campaigns.createdAt));
  }

  async getPendingApprovalCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns)
      .where(eq(campaigns.isApproved, false))
      .orderBy(desc(campaigns.createdAt));
  }

  async approveCampaign(campaignId: number, isPromotional: boolean = false, starReward: number = 0): Promise<Campaign | undefined> {
    const result = await db.update(campaigns)
      .set({ 
        isApproved: true,
        status: "active",
        isPromotional: isPromotional,
        starReward: starReward
      })
      .where(eq(campaigns.id, campaignId))
      .returning();
    return result[0];
  }

  async convertCampaignToPromotional(campaignId: number, starReward: number): Promise<Campaign | undefined> {
    const result = await db.update(campaigns)
      .set({ 
        isPromotional: true,
        starReward: starReward
      })
      .where(eq(campaigns.id, campaignId))
      .returning();
    return result[0];
  }

  async convertCampaignToMoney(campaignId: number): Promise<Campaign | undefined> {
    const result = await db.update(campaigns)
      .set({ 
        isPromotional: false,
        starReward: 0
      })
      .where(eq(campaigns.id, campaignId))
      .returning();
    return result[0];
  }

  async rejectCampaign(campaignId: number): Promise<void> {
    await db.delete(campaigns).where(eq(campaigns.id, campaignId));
  }

  // Bank Accounts
  async getBankAccountsByUser(userId: number): Promise<BankAccount[]> {
    return await db.select().from(bankAccounts)
      .where(eq(bankAccounts.userId, userId))
      .orderBy(desc(bankAccounts.createdAt));
  }

  async getBankAccount(id: number): Promise<BankAccount | undefined> {
    const result = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id)).limit(1);
    return result[0];
  }

  async getDefaultBankAccount(userId: number): Promise<BankAccount | undefined> {
    const result = await db.select().from(bankAccounts)
      .where(and(eq(bankAccounts.userId, userId), eq(bankAccounts.isDefault, true)))
      .limit(1);
    return result[0];
  }

  async createBankAccount(account: InsertBankAccount): Promise<BankAccount> {
    const result = await db.insert(bankAccounts).values(account).returning();
    return result[0];
  }

  async updateBankAccount(id: number, account: Partial<InsertBankAccount>): Promise<void> {
    await db.update(bankAccounts).set(account).where(eq(bankAccounts.id, id));
  }

  async deleteBankAccount(id: number): Promise<void> {
    await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
  }

  async setDefaultBankAccount(userId: number, accountId: number): Promise<void> {
    await db.update(bankAccounts).set({ isDefault: false }).where(eq(bankAccounts.userId, userId));
    await db.update(bankAccounts).set({ isDefault: true }).where(eq(bankAccounts.id, accountId));
  }

  // Withdrawal Requests
  async getWithdrawalRequestsByUser(userId: number): Promise<WithdrawalRequest[]> {
    return await db.select().from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, userId))
      .orderBy(desc(withdrawalRequests.requestedAt));
  }

  async getWithdrawalRequest(id: number): Promise<WithdrawalRequest | undefined> {
    const result = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, id)).limit(1);
    return result[0];
  }

  async getPendingWithdrawalRequest(userId: number): Promise<WithdrawalRequest | undefined> {
    const result = await db.select().from(withdrawalRequests)
      .where(and(
        eq(withdrawalRequests.userId, userId),
        eq(withdrawalRequests.status, "pending")
      ))
      .limit(1);
    return result[0];
  }

  async createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest> {
    const result = await db.insert(withdrawalRequests).values(request).returning();
    return result[0];
  }

  async updateWithdrawalRequestStatus(id: number, status: string, utrNumber?: string, adminNote?: string): Promise<void> {
    const updateData: any = { status, processedAt: new Date() };
    if (utrNumber) updateData.utrNumber = utrNumber;
    if (adminNote) updateData.adminNote = adminNote;
    await db.update(withdrawalRequests).set(updateData).where(eq(withdrawalRequests.id, id));
  }

  async getAllPendingWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    return await db.select().from(withdrawalRequests)
      .where(eq(withdrawalRequests.status, "pending"))
      .orderBy(desc(withdrawalRequests.requestedAt));
  }

  // Admin Methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllCreators(): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.role, "creator"))
      .orderBy(desc(users.createdAt));
  }

  async getAllSponsors(): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.role, "sponsor"))
      .orderBy(desc(users.createdAt));
  }

  async getUsersPendingVerification(): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.instagramVerificationStatus, "pending"))
      .orderBy(desc(users.createdAt));
  }

  async getVerifiedInstagramUsers(): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.isInstagramVerified, true))
      .orderBy(desc(users.createdAt));
  }

  async getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    return await db.select().from(withdrawalRequests)
      .orderBy(desc(withdrawalRequests.requestedAt));
  }

  async getAllSubmissions(): Promise<Submission[]> {
    return await db.select().from(submissions)
      .orderBy(desc(submissions.submittedAt));
  }

  async getAllReservations(): Promise<Reservation[]> {
    return await db.select().from(reservations)
      .orderBy(desc(reservations.reservedAt));
  }

  async getSubmissionsPendingReview(): Promise<{ submission: Submission; reservation: Reservation; campaign: Campaign; user: User }[]> {
    const pendingReservations = await db.select().from(reservations)
      .where(eq(reservations.status, "submitted"))
      .orderBy(desc(reservations.reservedAt));

    const results: { submission: Submission; reservation: Reservation; campaign: Campaign; user: User }[] = [];
    
    for (const reservation of pendingReservations) {
      const [submission] = await db.select().from(submissions)
        .where(eq(submissions.reservationId, reservation.id))
        .limit(1);
      
      if (submission) {
        const [campaign] = await db.select().from(campaigns)
          .where(eq(campaigns.id, reservation.campaignId))
          .limit(1);
        const [user] = await db.select().from(users)
          .where(eq(users.id, reservation.userId))
          .limit(1);
        
        if (campaign && user) {
          results.push({ submission, reservation, campaign, user });
        }
      }
    }
    
    return results;
  }

  async getAdminStats(): Promise<{
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
  }> {
    const [userStats] = await db.select({ 
      total: count() 
    }).from(users);
    
    const [creatorStats] = await db.select({ 
      total: count() 
    }).from(users).where(eq(users.role, "creator"));
    
    const [sponsorStats] = await db.select({ 
      total: count() 
    }).from(users).where(eq(users.role, "sponsor"));
    
    const [campaignStats] = await db.select({ 
      total: count() 
    }).from(campaigns);
    
    const [activeCampaignStats] = await db.select({ 
      total: count() 
    }).from(campaigns).where(eq(campaigns.status, "active"));
    
    const pendingWithdrawals = await db.select().from(withdrawalRequests)
      .where(eq(withdrawalRequests.status, "pending"));
    
    const completedWithdrawals = await db.select().from(withdrawalRequests)
      .where(eq(withdrawalRequests.status, "completed"));
    
    const [pendingSubmissionStats] = await db.select({ 
      total: count() 
    }).from(reservations).where(eq(reservations.status, "submitted"));
    
    const [verificationStats] = await db.select({ 
      total: count() 
    }).from(users).where(eq(users.instagramVerificationStatus, "pending"));

    const pendingWithdrawalAmount = pendingWithdrawals.reduce(
      (sum, w) => sum + parseFloat(w.amount), 0
    );
    
    const totalWithdrawalsProcessed = completedWithdrawals.reduce(
      (sum, w) => sum + parseFloat(w.amount), 0
    );

    return {
      totalUsers: userStats?.total || 0,
      totalCreators: creatorStats?.total || 0,
      totalSponsors: sponsorStats?.total || 0,
      totalCampaigns: campaignStats?.total || 0,
      activeCampaigns: activeCampaignStats?.total || 0,
      pendingWithdrawals: pendingWithdrawals.length,
      pendingWithdrawalAmount: pendingWithdrawalAmount.toFixed(2),
      totalWithdrawalsProcessed: totalWithdrawalsProcessed.toFixed(2),
      pendingSubmissions: pendingSubmissionStats?.total || 0,
      pendingVerifications: verificationStats?.total || 0,
    };
  }

  async updateUserStatus(id: number, isVerified: boolean): Promise<void> {
    await db.update(users).set({ isVerified }).where(eq(users.id, id));
  }

  async rejectInstagramVerification(id: number): Promise<void> {
    await db.update(users).set({ 
      instagramVerificationStatus: "rejected",
      isInstagramVerified: false 
    }).where(eq(users.id, id));
  }

  async updateTransactionStatus(id: number, status: string): Promise<void> {
    await db.update(transactions).set({ status }).where(eq(transactions.id, id));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .orderBy(desc(transactions.createdAt));
  }

  async banUser(id: number, reason: string): Promise<void> {
    await db.update(users).set({ 
      isBanned: true, 
      bannedReason: reason,
      bannedAt: new Date()
    }).where(eq(users.id, id));
  }

  async unbanUser(id: number): Promise<void> {
    await db.update(users).set({ 
      isBanned: false, 
      bannedReason: null,
      bannedAt: null
    }).where(eq(users.id, id));
  }

  async deleteUser(id: number): Promise<void> {
    // Delete related records first to avoid foreign key constraint errors
    // Get user's reservations first
    const userReservations = await db.select({ id: reservations.id })
      .from(reservations)
      .where(eq(reservations.userId, id));
    
    // Delete submissions for user's reservations
    for (const res of userReservations) {
      await db.delete(submissions).where(eq(submissions.reservationId, res.id));
    }
    
    // Delete user's reservations
    await db.delete(reservations).where(eq(reservations.userId, id));
    // Delete user's transactions
    await db.delete(transactions).where(eq(transactions.userId, id));
    // Delete user's notifications
    await db.delete(notifications).where(eq(notifications.userId, id));
    // Delete campaigns created by user (sponsors)
    await db.delete(campaigns).where(eq(campaigns.sponsorId, id));
    // Finally delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  async disconnectInstagram(id: number): Promise<void> {
    await db.update(users).set({ 
      instagramUsername: null,
      instagramProfileUrl: null,
      instagramFollowers: null,
      isInstagramVerified: false,
      instagramVerificationCode: null,
      instagramVerificationStatus: "none",
      instagramAccessToken: null,
      instagramUserId: null,
      instagramTokenExpiresAt: null
    }).where(eq(users.id, id));
  }

  async banInstagram(id: number): Promise<void> {
    await db.update(users).set({ 
      isInstagramBanned: true,
      isInstagramVerified: false
    }).where(eq(users.id, id));
  }

  async unbanInstagram(id: number): Promise<void> {
    await db.update(users).set({ 
      isInstagramBanned: false
    }).where(eq(users.id, id));
  }

  // App Settings
  async getSetting(key: string): Promise<AppSetting | undefined> {
    const result = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
    return result[0];
  }

  async getAllSettings(): Promise<AppSetting[]> {
    return await db.select().from(appSettings).orderBy(appSettings.key);
  }

  async upsertSetting(key: string, value: string, description?: string): Promise<AppSetting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const result = await db.update(appSettings)
        .set({ value, description, updatedAt: new Date() })
        .where(eq(appSettings.key, key))
        .returning();
      return result[0];
    }
    const result = await db.insert(appSettings)
      .values({ key, value, description })
      .returning();
    return result[0];
  }

  // Promo Codes
  async getAllPromoCodes(): Promise<PromoCode[]> {
    return await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  }

  async getPromoCode(id: number): Promise<PromoCode | undefined> {
    const result = await db.select().from(promoCodes).where(eq(promoCodes.id, id)).limit(1);
    return result[0];
  }

  async getPromoCodeByCode(code: string): Promise<PromoCode | undefined> {
    const result = await db.select().from(promoCodes).where(eq(promoCodes.code, code.toUpperCase())).limit(1);
    return result[0];
  }

  async createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode> {
    const result = await db.insert(promoCodes).values({
      ...promoCode,
      code: promoCode.code.toUpperCase(),
      validFrom: promoCode.validFrom ? new Date(promoCode.validFrom) : new Date(),
      validUntil: promoCode.validUntil ? new Date(promoCode.validUntil) : null,
    }).returning();
    return result[0];
  }

  async updatePromoCode(id: number, updates: Partial<InsertPromoCode>): Promise<void> {
    const processedUpdates = { ...updates };
    if (updates.validFrom) {
      processedUpdates.validFrom = new Date(updates.validFrom);
    }
    if (updates.validUntil) {
      processedUpdates.validUntil = new Date(updates.validUntil);
    }
    await db.update(promoCodes).set(processedUpdates).where(eq(promoCodes.id, id));
  }

  async deletePromoCode(id: number): Promise<void> {
    // First delete all usage records for this promo code
    await db.delete(promoCodeUsage).where(eq(promoCodeUsage.promoCodeId, id));
    // Then delete the promo code itself
    await db.delete(promoCodes).where(eq(promoCodes.id, id));
  }

  async togglePromoCodeStatus(id: number, isActive: boolean): Promise<void> {
    await db.update(promoCodes).set({ isActive }).where(eq(promoCodes.id, id));
  }

  async incrementPromoCodeUsage(id: number): Promise<void> {
    await db.update(promoCodes)
      .set({ currentUses: sql`${promoCodes.currentUses} + 1` })
      .where(eq(promoCodes.id, id));
  }

  async recordPromoCodeUsage(promoCodeId: number, userId: number): Promise<PromoCodeUsage> {
    const result = await db.insert(promoCodeUsage).values({ promoCodeId, userId }).returning();
    return result[0];
  }

  async hasUserUsedPromoCode(promoCodeId: number, userId: number): Promise<boolean> {
    const result = await db.select()
      .from(promoCodeUsage)
      .where(and(
        eq(promoCodeUsage.promoCodeId, promoCodeId),
        eq(promoCodeUsage.userId, userId)
      ))
      .limit(1);
    return result.length > 0;
  }

  // Admin Wallet
  async getAdminWallet(): Promise<AdminWallet> {
    const result = await db.select().from(adminWallet).limit(1);
    if (result.length === 0) {
      const newWallet = await db.insert(adminWallet).values({
        balance: "0.00",
        totalEarnings: "0.00",
        totalPayouts: "0.00",
        totalRefunds: "0.00",
      }).returning();
      return newWallet[0];
    }
    return result[0];
  }

  async updateAdminWalletBalance(amount: number, type: 'add' | 'subtract'): Promise<void> {
    const wallet = await this.getAdminWallet();
    const currentBalance = parseFloat(wallet.balance);
    const newBalance = type === 'add' ? currentBalance + amount : currentBalance - amount;
    await db.update(adminWallet)
      .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
      .where(eq(adminWallet.id, wallet.id));
  }

  async createAdminWalletTransaction(transaction: InsertAdminWalletTransaction): Promise<AdminWalletTransaction> {
    const result = await db.insert(adminWalletTransactions).values(transaction).returning();
    return result[0];
  }

  async getAdminWalletTransactions(): Promise<AdminWalletTransaction[]> {
    return await db.select().from(adminWalletTransactions).orderBy(desc(adminWalletTransactions.createdAt));
  }

  async updateAdminWalletStats(earnings?: number, payouts?: number, refunds?: number): Promise<void> {
    const wallet = await this.getAdminWallet();
    const updates: Partial<AdminWallet> = { updatedAt: new Date() };
    
    if (earnings !== undefined) {
      updates.totalEarnings = (parseFloat(wallet.totalEarnings) + earnings).toFixed(2);
    }
    if (payouts !== undefined) {
      updates.totalPayouts = (parseFloat(wallet.totalPayouts) + payouts).toFixed(2);
    }
    if (refunds !== undefined) {
      updates.totalRefunds = (parseFloat(wallet.totalRefunds) + refunds).toFixed(2);
    }
    
    await db.update(adminWallet).set(updates).where(eq(adminWallet.id, wallet.id));
  }

  // Subscription Plans
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.sortOrder);
  }

  async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.sortOrder);
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id)).limit(1);
    return result[0];
  }

  async getSubscriptionPlanByPlanId(planId: string): Promise<SubscriptionPlan | undefined> {
    const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.planId, planId)).limit(1);
    return result[0];
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const result = await db.insert(subscriptionPlans).values(plan).returning();
    return result[0];
  }

  async updateSubscriptionPlan(id: number, updates: Partial<InsertSubscriptionPlan>): Promise<void> {
    await db.update(subscriptionPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptionPlans.id, id));
  }

  async deleteSubscriptionPlan(id: number): Promise<void> {
    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
  }

  // OTP Verification
  async createOtp(email: string, otp: string, expiresAt: Date): Promise<OtpVerification> {
    await db.delete(otpVerifications).where(eq(otpVerifications.email, email));
    const result = await db.insert(otpVerifications).values({
      email,
      otp,
      expiresAt,
      verified: false,
      attempts: 0,
    }).returning();
    return result[0];
  }

  async getValidOtp(email: string): Promise<OtpVerification | undefined> {
    const result = await db.select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.email, email),
          eq(otpVerifications.verified, false),
          sql`${otpVerifications.expiresAt} > NOW()`,
          lt(otpVerifications.attempts, 5)
        )
      )
      .orderBy(desc(otpVerifications.createdAt))
      .limit(1);
    return result[0];
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const otpRecord = await this.getValidOtp(email);
    if (!otpRecord || otpRecord.otp !== otp) {
      if (otpRecord) {
        await this.incrementOtpAttempts(otpRecord.id);
      }
      return false;
    }
    await db.update(otpVerifications)
      .set({ verified: true })
      .where(eq(otpVerifications.id, otpRecord.id));
    return true;
  }

  async incrementOtpAttempts(id: number): Promise<void> {
    await db.update(otpVerifications)
      .set({ attempts: sql`${otpVerifications.attempts} + 1` })
      .where(eq(otpVerifications.id, id));
  }

  async deleteExpiredOtps(): Promise<void> {
    await db.delete(otpVerifications)
      .where(sql`${otpVerifications.expiresAt} < NOW()`);
  }

  async deleteOtp(email: string): Promise<void> {
    await db.delete(otpVerifications).where(eq(otpVerifications.email, email));
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
  }

  // Newsletters
  async getAllNewsletters(): Promise<Newsletter[]> {
    return await db.select().from(newsletters).orderBy(desc(newsletters.createdAt));
  }

  async createNewsletter(newsletter: InsertNewsletter): Promise<Newsletter> {
    const result = await db.insert(newsletters).values(newsletter).returning();
    return result[0];
  }

  async getUsersForNewsletter(targetAudience: string): Promise<User[]> {
    if (targetAudience === "all") {
      return await db.select().from(users).where(ne(users.role, "admin"));
    } else if (targetAudience === "creators") {
      return await db.select().from(users).where(eq(users.role, "creator"));
    } else if (targetAudience === "sponsors") {
      return await db.select().from(users).where(eq(users.role, "sponsor"));
    }
    return [];
  }

  // Support Tickets
  async getAllSupportTickets(): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  }

  async getSupportTicketsByUser(userId: number): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    const result = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
    return result[0];
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const result = await db.insert(supportTickets).values(ticket).returning();
    return result[0];
  }

  async updateSupportTicketStatus(id: number, status: string): Promise<void> {
    await db.update(supportTickets)
      .set({ status, updatedAt: new Date() })
      .where(eq(supportTickets.id, id));
  }

  async getTicketMessages(ticketId: number): Promise<TicketMessage[]> {
    return await db.select().from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(ticketMessages.createdAt);
  }

  async createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage> {
    const result = await db.insert(ticketMessages).values(message).returning();
    return result[0];
  }

  // Data Reset - Delete all data except admin accounts (wrapped in transaction)
  async resetAllData(): Promise<{ users: number; campaigns: number; reservations: string; transactions: string }> {
    // Get counts before deletion
    const allUsers = await this.getAllUsers();
    const nonAdminUsers = allUsers.filter(u => u.role !== "admin");
    const allCampaigns = await this.getAllCampaigns();
    
    console.log(`[DATA RESET] Starting reset - ${nonAdminUsers.length} users, ${allCampaigns.length} campaigns to delete`);
    
    // Use raw SQL with proper order to handle foreign keys correctly
    // This is more reliable than ORM for complex delete operations
    console.log("[DATA RESET] Executing raw SQL reset...");
    
    await db.execute(sql`DELETE FROM ticket_messages`);
    console.log("[DATA RESET] Deleted ticket_messages");
    
    await db.execute(sql`DELETE FROM support_tickets`);
    console.log("[DATA RESET] Deleted support_tickets");
    
    await db.execute(sql`DELETE FROM notifications`);
    console.log("[DATA RESET] Deleted notifications");
    
    await db.execute(sql`DELETE FROM submissions`);
    console.log("[DATA RESET] Deleted submissions");
    
    await db.execute(sql`DELETE FROM transactions`);
    console.log("[DATA RESET] Deleted transactions");
    
    await db.execute(sql`DELETE FROM reservations`);
    console.log("[DATA RESET] Deleted reservations");
    
    await db.execute(sql`DELETE FROM admin_wallet_transactions`);
    console.log("[DATA RESET] Deleted admin_wallet_transactions");
    
    await db.execute(sql`DELETE FROM campaigns`);
    console.log("[DATA RESET] Deleted campaigns");
    
    await db.execute(sql`DELETE FROM category_subscriptions`);
    console.log("[DATA RESET] Deleted category_subscriptions");
    
    await db.execute(sql`DELETE FROM promo_code_usage`);
    console.log("[DATA RESET] Deleted promo_code_usage");
    
    await db.execute(sql`DELETE FROM promo_codes`);
    console.log("[DATA RESET] Deleted promo_codes");
    
    await db.execute(sql`DELETE FROM withdrawal_requests`);
    console.log("[DATA RESET] Deleted withdrawal_requests");
    
    await db.execute(sql`DELETE FROM bank_accounts`);
    console.log("[DATA RESET] Deleted bank_accounts");
    
    await db.execute(sql`DELETE FROM otp_verifications`);
    console.log("[DATA RESET] Deleted otp_verifications");
    
    await db.execute(sql`DELETE FROM newsletters`);
    console.log("[DATA RESET] Deleted newsletters");
    
    await db.execute(sql`DELETE FROM sessions`);
    console.log("[DATA RESET] Deleted sessions");
    
    await db.execute(sql`DELETE FROM users WHERE role != 'admin'`);
    console.log("[DATA RESET] Deleted non-admin users");
    
    await db.execute(sql`UPDATE admin_wallet SET balance = '0.00', total_earnings = '0.00', total_payouts = '0.00', total_refunds = '0.00'`);
    console.log("[DATA RESET] Reset admin wallet");
    
    console.log(`[DATA RESET] Completed successfully - deleted ${nonAdminUsers.length} users, ${allCampaigns.length} campaigns`);
    
    return {
      users: nonAdminUsers.length,
      campaigns: allCampaigns.length,
      reservations: "all",
      transactions: "all",
    };
  }
}

export const storage = new DatabaseStorage();
