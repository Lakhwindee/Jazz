import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, decimal, boolean, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Creator Subscription Plans
export const SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    features: ["Browse campaigns", "View campaign details", "Profile access"],
    canReserve: false,
  },
  pro: {
    id: "pro",
    name: "Pro Creator",
    price: 499,
    features: ["Browse campaigns", "Reserve unlimited ads", "Priority support", "Early access to campaigns"],
    canReserve: true,
  },
} as const;

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS;

// Session storage table for auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  handle: text("handle").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Hashed password
  role: text("role").notNull().default("creator"), // creator, sponsor, or admin
  followers: integer("followers").notNull().default(0),
  engagement: decimal("engagement", { precision: 5, scale: 2 }).notNull().default("0.00"),
  reach: integer("reach").notNull().default(0),
  avatar: text("avatar"),
  isVerified: boolean("is_verified").notNull().default(false),
  tier: text("tier").notNull().default("Tier 1"),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0.00"),
  companyName: text("company_name"), // for sponsors
  gstNumber: text("gst_number"), // GST number for billing
  billingAddress: text("billing_address"), // Full billing address
  billingCity: text("billing_city"),
  billingState: text("billing_state"),
  billingPincode: text("billing_pincode"),
  panNumber: text("pan_number"), // PAN number for billing
  instagramUsername: text("instagram_username"),
  instagramProfileUrl: text("instagram_profile_url"),
  instagramFollowers: integer("instagram_followers"),
  isInstagramVerified: boolean("is_instagram_verified").notNull().default(false),
  instagramVerificationCode: text("instagram_verification_code"),
  instagramVerificationStatus: text("instagram_verification_status").notNull().default("none"),
  instagramAccessToken: text("instagram_access_token"),
  instagramUserId: text("instagram_user_id"),
  instagramTokenExpiresAt: timestamp("instagram_token_expires_at"),
  subscriptionPlan: text("subscription_plan").notNull().default("free"), // free, pro
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  isTrialSubscription: boolean("is_trial_subscription").notNull().default(false),
  autoRenew: boolean("auto_renew").notNull().default(false),
  stars: integer("stars").notNull().default(0), // Stars earned from promotional campaigns
  country: text("country").notNull().default("IN"), // ISO country code (IN, US, CA, etc.)
  // Shipping address for product campaigns
  shippingAddress: text("shipping_address"),
  shippingCity: text("shipping_city"),
  shippingState: text("shipping_state"),
  shippingPincode: text("shipping_pincode"),
  shippingPhone: text("shipping_phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Auth schemas
export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  handle: z.string().min(3, "Handle must be at least 3 characters").regex(/^@?[a-zA-Z0-9._]+$/, "Handle can only contain letters, numbers, dots and underscores").optional(),
  role: z.enum(["creator", "sponsor"]).default("creator"),
  companyName: z.string().optional(),
  country: z.string().min(2, "Please select a country").default("IN"),
}).refine((data) => {
  if (data.role === "sponsor" && (!data.companyName || data.companyName.trim().length < 2)) {
    return false;
  }
  return true;
}, {
  message: "Company name is required for sponsors (at least 2 characters)",
  path: ["companyName"],
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;

// Promotion Categories
export const PROMOTION_CATEGORIES = [
  { id: "music_reels", name: "Music Reels", icon: "music", description: "Song promotions, lyrical videos, dance reels" },
  { id: "lifestyle", name: "Lifestyle", icon: "heart", description: "Fashion, beauty, daily life content" },
  { id: "tech", name: "Tech & Gadgets", icon: "smartphone", description: "Tech reviews, gadget promotions" },
  { id: "food", name: "Food & Beverages", icon: "utensils", description: "Food reviews, restaurant promos, recipes" },
  { id: "gaming", name: "Gaming", icon: "gamepad-2", description: "Game promotions, gaming content" },
  { id: "fitness", name: "Fitness & Health", icon: "dumbbell", description: "Fitness products, health tips" },
  { id: "education", name: "Education", icon: "graduation-cap", description: "Course promotions, educational content" },
  { id: "travel", name: "Travel", icon: "plane", description: "Travel destinations, tourism promos" },
  { id: "finance", name: "Finance & Apps", icon: "wallet", description: "Fintech apps, trading platforms" },
  { id: "ecommerce", name: "E-commerce", icon: "shopping-bag", description: "Product promotions, brand collaborations" },
] as const;

export type PromotionCategory = typeof PROMOTION_CATEGORIES[number]["id"];

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  sponsorId: integer("sponsor_id").references(() => users.id), // null for system-seeded campaigns
  title: text("title").notNull(),
  brand: text("brand").notNull(),
  brandLogo: text("brand_logo").notNull(),
  category: text("category").notNull().default("music_reels"), // Promotion category
  payAmount: decimal("pay_amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // Reel, Story, Post, Carousel
  contentTypes: text("content_types").array(), // Array of content types selected
  promotionStyle: text("promotion_style"), // lyricals, face_ad, share_only
  assetUrl: text("asset_url"), // URL to downloadable file/asset for creators
  assetFileName: text("asset_file_name"), // Original filename of the asset
  minFollowers: integer("min_followers").notNull(),
  description: text("description").notNull(),
  tier: text("tier").notNull(), // Tier 1-20
  deadline: timestamp("deadline").notNull(),
  totalSpots: integer("total_spots").notNull(),
  spotsRemaining: integer("spots_remaining").notNull(),
  status: text("status").notNull().default("active"), // active, paused, completed
  isPromotional: boolean("is_promotional").notNull().default(false), // Promotional campaigns give stars instead of money
  starReward: integer("star_reward").notNull().default(0), // Number of stars awarded for completing this campaign
  isApproved: boolean("is_approved").notNull().default(false), // Admin approval required before visible to creators
  targetCountries: text("target_countries").array().notNull().default(["IN"]), // Array of ISO country codes for targeting creators
  // Escrow tracking fields
  totalBudget: decimal("total_budget", { precision: 10, scale: 2 }).notNull().default("0"), // Total amount held (payAmount * totalSpots)
  releasedAmount: decimal("released_amount", { precision: 10, scale: 2 }).notNull().default("0"), // Amount released to creators
  refundedAmount: decimal("refunded_amount", { precision: 10, scale: 2 }).notNull().default("0"), // Amount refunded to sponsor
  escrowStatus: text("escrow_status").notNull().default("active"), // active, completed, refunded
  // Product campaign fields
  campaignType: text("campaign_type").notNull().default("cash"), // cash, product, hybrid
  productName: text("product_name"),
  productValue: decimal("product_value", { precision: 10, scale: 2 }),
  productImage: text("product_image"),
  productDescription: text("product_description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

// Campaign Reservations
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  status: text("status").notNull().default("reserved"), // reserved, submitted, approved, rejected
  reservedAt: timestamp("reserved_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  // Product campaign shipping fields
  trackingNumber: text("tracking_number"),
  shippingStatus: text("shipping_status").default("pending"), // pending, shipped, delivered
  deliveryConfirmedAt: timestamp("delivery_confirmed_at"),
  creatorShippingAddress: text("creator_shipping_address"), // Snapshot of address at reservation time
});

export const insertReservationSchema = createInsertSchema(reservations).omit({ 
  id: true, 
  reservedAt: true 
});
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservations.$inferSelect;

// Campaign Submissions
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id").notNull().references(() => reservations.id),
  link: text("link").notNull(),
  clipUrl: text("clip_url"),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({ 
  id: true, 
  submittedAt: true 
});
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;

// Transactions (Wallet) - for both creators and sponsors
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // credit, debit
  category: text("category").notNull().default("earning"), // deposit, campaign_payment, earning, withdrawal
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0.00"),
  net: decimal("net", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("completed"), // completed, pending
  reservationId: integer("reservation_id").references(() => reservations.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  paymentId: text("payment_id"), // External payment gateway reference
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // campaign_reserved, submission_received, submission_approved, submission_rejected, payment_received, new_campaign
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  reservationId: integer("reservation_id").references(() => reservations.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Creator Category Subscriptions - creators join category+tier groups
export const categorySubscriptions = pgTable("category_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  category: text("category").notNull(), // music_reels, lifestyle, etc.
  tier: text("tier").notNull(), // Tier 1, Tier 2, etc.
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertCategorySubscriptionSchema = createInsertSchema(categorySubscriptions).omit({ 
  id: true, 
  joinedAt: true 
});
export type InsertCategorySubscription = z.infer<typeof insertCategorySubscriptionSchema>;
export type CategorySubscription = typeof categorySubscriptions.$inferSelect;

// Bank Accounts - for withdrawal payouts
export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  accountHolderName: text("account_holder_name").notNull(),
  accountNumber: text("account_number").notNull(),
  ifscCode: text("ifsc_code").notNull(),
  bankName: text("bank_name").notNull(),
  upiId: text("upi_id"), // Optional UPI ID
  isDefault: boolean("is_default").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({ 
  id: true, 
  createdAt: true,
  isVerified: true,
});
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;

// Withdrawal Requests - tracked payout requests
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bankAccountId: integer("bank_account_id").notNull().references(() => bankAccounts.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, rejected
  utrNumber: text("utr_number"), // Transaction reference after payment
  adminNote: text("admin_note"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({ 
  id: true, 
  requestedAt: true,
  processedAt: true,
  utrNumber: true,
  adminNote: true,
});
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;

// App Settings - for admin configuration
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAppSettingSchema = createInsertSchema(appSettings).omit({ 
  id: true, 
  updatedAt: true,
});
export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
export type AppSetting = typeof appSettings.$inferSelect;

// Promo Codes - for discounts and trials
export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // "discount" | "trial"
  discountPercent: integer("discount_percent"), // for discount type
  trialDays: integer("trial_days"), // for trial type
  afterTrialAction: text("after_trial_action").default("downgrade"), // "downgrade" | "continue" - what happens after trial expires
  maxUses: integer("max_uses"), // null = unlimited
  currentUses: integer("current_uses").notNull().default(0),
  validFrom: timestamp("valid_from").notNull().defaultNow(),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({ 
  id: true, 
  currentUses: true,
  createdAt: true,
});
export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
export type PromoCode = typeof promoCodes.$inferSelect;

// Promo Code Usage - track who used which code
export const promoCodeUsage = pgTable("promo_code_usage", {
  id: serial("id").primaryKey(),
  promoCodeId: integer("promo_code_id").notNull().references(() => promoCodes.id),
  userId: integer("user_id").notNull().references(() => users.id),
  usedAt: timestamp("used_at").notNull().defaultNow(),
}, (table) => [
  index("idx_promo_usage_unique").on(table.promoCodeId, table.userId),
]);

export const insertPromoCodeUsageSchema = createInsertSchema(promoCodeUsage).omit({ 
  id: true, 
  usedAt: true,
});
export type InsertPromoCodeUsage = z.infer<typeof insertPromoCodeUsageSchema>;
export type PromoCodeUsage = typeof promoCodeUsage.$inferSelect;

// Admin Wallet - centralized platform wallet for all payments
export const adminWallet = pgTable("admin_wallet", {
  id: serial("id").primaryKey(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalEarnings: decimal("total_earnings", { precision: 12, scale: 2 }).notNull().default("0.00"), // Platform fees earned
  totalPayouts: decimal("total_payouts", { precision: 12, scale: 2 }).notNull().default("0.00"), // Paid to creators
  totalRefunds: decimal("total_refunds", { precision: 12, scale: 2 }).notNull().default("0.00"), // Refunded to sponsors
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AdminWallet = typeof adminWallet.$inferSelect;

// Admin Wallet Transactions - track all money movements
export const adminWalletTransactions = pgTable("admin_wallet_transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // credit, debit
  category: text("category").notNull(), // campaign_deposit, creator_payout, sponsor_refund, platform_fee, subscription_payment
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  relatedUserId: integer("related_user_id").references(() => users.id), // Sponsor or Creator
  campaignId: integer("campaign_id").references(() => campaigns.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAdminWalletTransactionSchema = createInsertSchema(adminWalletTransactions).omit({ 
  id: true, 
  createdAt: true,
});
export type InsertAdminWalletTransaction = z.infer<typeof insertAdminWalletTransactionSchema>;
export type AdminWalletTransaction = typeof adminWalletTransactions.$inferSelect;

// Subscription Plans - database-driven subscription management
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  planId: text("plan_id").notNull().unique(), // free, pro, premium, etc.
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  features: text("features").array().notNull(),
  canReserve: boolean("can_reserve").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
});
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// OTP Verification table for email verification
export const otpVerifications = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").notNull().default(false),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOtpVerificationSchema = createInsertSchema(otpVerifications).omit({ 
  id: true, 
  createdAt: true,
});
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;
export type OtpVerification = typeof otpVerifications.$inferSelect;
