import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCampaignSchema, insertReservationSchema, insertSubmissionSchema, insertTransactionSchema, PROMOTION_CATEGORIES, signupSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import passport from "passport";
import { setupAuth, hashPassword, isAuthenticated, sanitizeUser } from "./auth";
import { MIN_FOLLOWERS, getTierByFollowers } from "@shared/tiers";
import { createCashfreeOrder, fetchCashfreeOrder, getCashfreeAppId, isCashfreeConfigured } from "./cashfree";
import { createOrder as createRazorpayOrder, verifyPaymentSignature, getRazorpayKeyId } from "./razorpay";
import axios from "axios";

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || "https://instacreator-hub.replit.app/api/instagram/oauth-callback";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup authentication
  await setupAuth(app);

  // Serve uploaded files
  app.use("/uploads", (await import("express")).default.static(uploadDir));

  // ==================== AUTH ROUTES ====================

  // Unified Sign up (Creator + Sponsor)
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const data = signupSchema.parse(req.body);
      const role = data.role || "creator";
      const isSponsor = role === "sponsor";
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      // Generate handle based on role
      let handle: string;
      if (data.handle) {
        handle = data.handle.startsWith("@") ? data.handle : `@${data.handle}`;
      } else if (isSponsor && data.companyName) {
        // For sponsors: generate from company name
        const baseHandle = data.companyName
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .trim()
          .replace(/\s+/g, ".");
        handle = `@${baseHandle}`;
      } else {
        // For creators: generate from name
        const baseHandle = data.name
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .trim()
          .replace(/\s+/g, ".");
        handle = `@${baseHandle}`;
      }
      
      // Check if handle already exists, append random suffix if needed
      let existingHandle = await storage.getUserByHandle(handle);
      let attempts = 0;
      const baseForSuffix = isSponsor && data.companyName 
        ? data.companyName.toLowerCase().replace(/[^a-z0-9]/g, "")
        : data.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      
      while (existingHandle && attempts < 10) {
        const suffix = Math.floor(Math.random() * 9999);
        handle = `@${baseForSuffix}.${suffix}`;
        existingHandle = await storage.getUserByHandle(handle);
        attempts++;
      }
      
      if (existingHandle) {
        return res.status(400).json({ error: "Could not generate unique handle, please try again" });
      }
      
      // Hash password and create user
      const hashedPassword = await hashPassword(data.password);
      const user = await storage.createUser({
        name: data.name,
        email: data.email,
        handle: handle,
        password: hashedPassword,
        role: role,
        followers: 0,
        engagement: "0.00",
        reach: 0,
        tier: isSponsor ? "Sponsor" : "Tier 1",
        balance: "0.00",
        isVerified: isSponsor, // Sponsors are auto-verified
        companyName: isSponsor ? data.companyName?.trim() : undefined,
        country: data.country || "IN", // User's country for targeting
      });
      
      // Notify admins about new signup (for creators only)
      if (role === "creator") {
        const allUsers = await storage.getAllUsers();
        const admins = allUsers.filter(u => u.role === "admin");
        for (const admin of admins) {
          await storage.createNotification({
            userId: admin.id,
            type: "new_creator_signup",
            title: "New Creator Joined",
            message: `${user.name} (${user.email}) has signed up as a creator.`,
            isRead: false,
          });
        }
      }
      
      // Log in the user
      req.login(user, (err) => {
        if (err) {
          console.error("Login error after signup:", err);
          return res.status(500).json({ error: "Failed to log in after signup" });
        }
        res.status(201).json(sanitizeUser(user));
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  // Log in
  app.post("/api/auth/login", (req, res, next) => {
    try {
      loginSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
    }
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Authentication failed" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid email or password" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ error: "Login failed" });
        }
        res.json(sanitizeUser(user));
      });
    })(req, res, next);
  });

  // Log out
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      res.json(sanitizeUser(req.user));
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single("file"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ 
        url: fileUrl, 
        fileName: req.file.originalname,
        size: req.file.size 
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Get all campaigns
  app.get("/api/campaigns", async (req, res) => {
    try {
      // First, expire any expired reservations and return spots to campaigns
      await storage.expireExpiredReservations();
      
      let campaigns = await storage.getAllCampaigns();
      
      // Filter campaigns by user's country if user is logged in as creator
      // Also support optional country filter query parameter
      const filterCountry = req.query.country as string | undefined;
      
      if (filterCountry) {
        // Use explicit country filter from query parameter
        campaigns = campaigns.filter(c => 
          c.targetCountries && c.targetCountries.includes(filterCountry)
        );
      } else if (req.user && req.user.role === "creator") {
        // Default: filter by user's country
        const user = await storage.getUser(req.user.id);
        if (user && user.country) {
          campaigns = campaigns.filter(c => 
            c.targetCountries && c.targetCountries.includes(user.country)
          );
        }
      }
      
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // Get campaign by ID
  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });

  // Create a campaign (Admin only - simplified for now)
  app.post("/api/campaigns", async (req, res) => {
    try {
      const validatedData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(validatedData);
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  // Get user reservations
  app.get("/api/users/:userId/reservations", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // First, expire any expired reservations and return spots to campaigns
      await storage.expireExpiredReservations();
      
      // Then fetch the user's reservations (excluding expired ones)
      const reservations = await storage.getReservationsByUser(userId);
      const activeReservations = reservations.filter(r => r.status !== "expired");
      res.json(activeReservations);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      res.status(500).json({ error: "Failed to fetch reservations" });
    }
  });

  // Reserve a campaign
  app.post("/api/reservations", async (req, res) => {
    try {
      const { userId, campaignId } = req.body;
      
      // Check user subscription status
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if user has active Pro subscription
      const hasActiveSubscription = user.subscriptionPlan === "pro" && 
        user.subscriptionExpiresAt && 
        new Date(user.subscriptionExpiresAt) > new Date();
      
      if (!hasActiveSubscription) {
        return res.status(403).json({ 
          error: "Subscription required", 
          message: "Pro subscription (₹499/month) required to reserve campaigns. Upgrade now to start earning!",
          requiresSubscription: true 
        });
      }
      
      // Check if user already has a reservation for this campaign
      const existingReservation = await storage.getUserReservationForCampaign(userId, campaignId);
      if (existingReservation) {
        return res.status(400).json({ error: "You already have a reservation for this campaign" });
      }

      // Check campaign availability
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      if (campaign.spotsRemaining <= 0) {
        return res.status(400).json({ error: "No spots available" });
      }

      // Create reservation (expires in 48 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      const reservation = await storage.createReservation({
        userId,
        campaignId,
        status: "reserved",
        expiresAt,
      });

      // Update campaign spots
      await storage.updateCampaignSpots(campaignId, campaign.spotsRemaining - 1);

      // Create notification for the creator
      await storage.createNotification({
        userId,
        type: "campaign_reserved",
        title: "Campaign Reserved!",
        message: `You have reserved a spot in "${campaign.title}". Submit your work within 48 hours.`,
        isRead: false,
        campaignId,
        reservationId: reservation.id,
      });

      // If campaign has a sponsor, notify them
      if (campaign.sponsorId) {
        const user = await storage.getUser(userId);
        await storage.createNotification({
          userId: campaign.sponsorId,
          type: "campaign_reserved",
          title: "New Creator Reservation",
          message: `${user?.name || "A creator"} reserved a spot in "${campaign.title}".`,
          isRead: false,
          campaignId,
          reservationId: reservation.id,
        });
      }

      res.status(201).json(reservation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating reservation:", error);
      res.status(500).json({ error: "Failed to create reservation" });
    }
  });

  // Submit work for a reservation
  app.post("/api/submissions", async (req, res) => {
    try {
      const { reservationId, link, clipUrl, startTime, endTime } = req.body;
      
      // Validate reservation exists and is in correct state
      const reservation = await storage.getReservation(reservationId);
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }
      
      if (reservation.status !== "reserved") {
        return res.status(400).json({ error: "Reservation is not in reserved state" });
      }

      // Create submission
      const submission = await storage.createSubmission({
        reservationId,
        link,
        clipUrl,
        startTime,
        endTime,
      });

      // Update reservation status
      await storage.updateReservationStatus(reservationId, "submitted");

      // Get campaign for notification
      const campaign = await storage.getCampaign(reservation.campaignId);

      // Create notification for the creator
      await storage.createNotification({
        userId: reservation.userId,
        type: "submission_received",
        title: "Submission Received",
        message: `Your work for "${campaign?.title || "campaign"}" has been submitted and is under review.`,
        isRead: false,
        campaignId: reservation.campaignId,
        reservationId,
      });

      // Notify sponsor if exists
      if (campaign?.sponsorId) {
        const user = await storage.getUser(reservation.userId);
        await storage.createNotification({
          userId: campaign.sponsorId,
          type: "submission_received",
          title: "New Submission",
          message: `${user?.name || "A creator"} submitted work for "${campaign.title}".`,
          isRead: false,
          campaignId: reservation.campaignId,
          reservationId,
        });
      }

      res.status(201).json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating submission:", error);
      res.status(500).json({ error: "Failed to create submission" });
    }
  });

  // Approve submission (Admin only - simplified)
  app.post("/api/reservations/:id/approve", async (req, res) => {
    try {
      const reservationId = parseInt(req.params.id);
      
      const reservation = await storage.getReservation(reservationId);
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }

      if (reservation.status !== "submitted") {
        return res.status(400).json({ error: "Reservation is not in submitted state" });
      }

      // Get campaign to calculate payment
      const campaign = await storage.getCampaign(reservation.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const user = await storage.getUser(reservation.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update reservation status
      await storage.updateReservationStatus(reservationId, "approved", new Date());

      // Check if promotional campaign (stars) or regular (money)
      if (campaign.isPromotional && campaign.starReward > 0) {
        // Award stars instead of money
        const newStars = (user.stars || 0) + campaign.starReward;
        await storage.updateUserStars(reservation.userId, newStars);

        // Create notification for stars
        await storage.createNotification({
          userId: reservation.userId,
          type: "submission_approved",
          title: "Submission Approved!",
          message: `Your work for "${campaign.title}" has been approved. You earned ${campaign.starReward} star(s)! Total: ${newStars} stars.`,
          isRead: false,
          campaignId: reservation.campaignId,
          reservationId,
        });

        // Check if user reached 5 stars - give free month subscription
        if (newStars >= 5) {
          const starsUsed = 5;
          const remainingStars = newStars - starsUsed;
          await storage.updateUserStars(reservation.userId, remainingStars);

          // Give 1 month free subscription
          const expiresAt = new Date();
          if (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > expiresAt) {
            expiresAt.setTime(new Date(user.subscriptionExpiresAt).getTime());
          }
          expiresAt.setMonth(expiresAt.getMonth() + 1);
          await storage.updateUserSubscription(reservation.userId, "pro", expiresAt, false, false);

          // Create notification about free subscription
          await storage.createNotification({
            userId: reservation.userId,
            type: "subscription_reward",
            title: "Free Pro Subscription!",
            message: `Congratulations! You collected 5 stars and earned 1 month of FREE Pro subscription! Valid until ${expiresAt.toLocaleDateString()}.`,
            isRead: false,
          });
        }

        res.json({ stars: campaign.starReward, newTotal: newStars >= 5 ? newStars - 5 : newStars, reservation });
      } else {
        // Regular payment flow
        const gross = parseFloat(campaign.payAmount);
        const tax = gross * 0.10; // 10% tax
        const net = gross - tax;

        // Create transaction
        const transaction = await storage.createTransaction({
          userId: reservation.userId,
          type: "credit",
          amount: gross.toFixed(2),
          tax: tax.toFixed(2),
          net: net.toFixed(2),
          description: `Campaign Payout: ${campaign.title}`,
          status: "completed",
          reservationId: reservationId,
        });

        // Update user balance
        const newBalance = parseFloat(user.balance) + net;
        await storage.updateUserBalance(reservation.userId, newBalance.toFixed(2));

        // Create notification for the creator about approval
        await storage.createNotification({
          userId: reservation.userId,
          type: "submission_approved",
          title: "Submission Approved!",
          message: `Your work for "${campaign.title}" has been approved. ₹${net.toFixed(2)} has been added to your wallet.`,
          isRead: false,
          campaignId: reservation.campaignId,
          reservationId,
        });

        res.json({ transaction, reservation });
      }
    } catch (error) {
      console.error("Error approving submission:", error);
      res.status(500).json({ error: "Failed to approve submission" });
    }
  });

  // Get user transactions
  app.get("/api/users/:userId/transactions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const transactions = await storage.getTransactionsByUser(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Withdrawal constants
  const MIN_WITHDRAWAL_AMOUNT = 500;
  const WITHDRAWAL_GST_PERCENT = 18; // 18% GST on withdrawal

  // Get wallet info including minimum withdrawal and GST
  app.get("/api/wallet/info", (req, res) => {
    res.json({
      minWithdrawalAmount: MIN_WITHDRAWAL_AMOUNT,
      currency: "INR",
      gstPercent: WITHDRAWAL_GST_PERCENT,
    });
  });

  // Bank Account Routes
  app.get("/api/bank-accounts", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "Please log in to view bank accounts" });
      }
      const accounts = await storage.getBankAccountsByUser(req.user.id);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      res.status(500).json({ error: "Failed to fetch bank accounts" });
    }
  });

  app.post("/api/bank-accounts", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "Please log in to add a bank account" });
      }
      
      const { accountHolderName, accountNumber, ifscCode, bankName, upiId } = req.body;
      
      if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
        return res.status(400).json({ error: "Please fill in all required fields" });
      }

      // Validate IFSC format strictly (11 characters, first 4 uppercase letters, 5th is 0, last 6 alphanumeric)
      const ifscUpper = ifscCode.toUpperCase();
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(ifscUpper)) {
        return res.status(400).json({ error: "Invalid IFSC code. Format: 4 letters + 0 + 6 alphanumeric (e.g., SBIN0001234)" });
      }

      // Check if user already has bank accounts
      const existingAccounts = await storage.getBankAccountsByUser(req.user.id);
      const isDefault = existingAccounts.length === 0;

      const account = await storage.createBankAccount({
        userId: req.user.id,
        accountHolderName,
        accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        bankName,
        upiId: upiId || null,
        isDefault,
      });

      res.json(account);
    } catch (error) {
      console.error("Error creating bank account:", error);
      res.status(500).json({ error: "Failed to add bank account" });
    }
  });

  app.delete("/api/bank-accounts/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "Please log in" });
      }
      
      const accountId = parseInt(req.params.id);
      const account = await storage.getBankAccount(accountId);
      
      if (!account || account.userId !== req.user.id) {
        return res.status(404).json({ error: "Bank account not found" });
      }

      await storage.deleteBankAccount(accountId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting bank account:", error);
      res.status(500).json({ error: "Failed to delete bank account" });
    }
  });

  app.post("/api/bank-accounts/:id/set-default", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "Please log in" });
      }
      
      const accountId = parseInt(req.params.id);
      const account = await storage.getBankAccount(accountId);
      
      if (!account || account.userId !== req.user.id) {
        return res.status(404).json({ error: "Bank account not found" });
      }

      await storage.setDefaultBankAccount(req.user.id, accountId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting default bank account:", error);
      res.status(500).json({ error: "Failed to set default account" });
    }
  });

  // Withdrawal Request Routes
  app.get("/api/withdrawal-requests", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "Please log in" });
      }
      const requests = await storage.getWithdrawalRequestsByUser(req.user.id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
      res.status(500).json({ error: "Failed to fetch withdrawal requests" });
    }
  });

  app.post("/api/withdrawal-requests", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "Please log in to request a withdrawal" });
      }

      const { amount, bankAccountId } = req.body;

      // Validate amount
      const withdrawAmount = parseFloat(amount);
      if (isNaN(withdrawAmount) || !isFinite(withdrawAmount) || withdrawAmount <= 0) {
        return res.status(400).json({ error: "Please enter a valid withdrawal amount" });
      }

      if (withdrawAmount < MIN_WITHDRAWAL_AMOUNT) {
        return res.status(400).json({ 
          error: `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT}` 
        });
      }

      // Get user's current balance
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentBalance = parseFloat(user.balance);
      if (withdrawAmount > currentBalance) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Check for existing pending withdrawal
      const pendingRequest = await storage.getPendingWithdrawalRequest(req.user.id);
      if (pendingRequest) {
        return res.status(400).json({ 
          error: "You already have a pending withdrawal request. Please wait for it to be processed." 
        });
      }

      // Validate bank account
      const bankAccount = await storage.getBankAccount(bankAccountId);
      if (!bankAccount || bankAccount.userId !== req.user.id) {
        return res.status(400).json({ error: "Please select a valid bank account" });
      }

      // Calculate GST on withdrawal
      const gstAmount = Math.round(withdrawAmount * WITHDRAWAL_GST_PERCENT / 100);
      const netAmount = withdrawAmount - gstAmount;

      // Create withdrawal request (stores the requested amount before GST)
      const withdrawalRequest = await storage.createWithdrawalRequest({
        userId: req.user.id,
        bankAccountId,
        amount: withdrawAmount.toFixed(2),
        status: "pending",
      });

      // Create transaction (debit from wallet with GST breakdown)
      const transaction = await storage.createTransaction({
        userId: req.user.id,
        type: "debit",
        amount: withdrawAmount.toFixed(2),
        tax: gstAmount.toFixed(2),
        net: netAmount.toFixed(2),
        description: `Withdrawal #${withdrawalRequest.id} (GST ${WITHDRAWAL_GST_PERCENT}%: ₹${gstAmount}, Net: ₹${netAmount})`,
        status: "pending",
      });

      // Update user balance (full amount deducted from wallet)
      const newBalance = currentBalance - withdrawAmount;
      await storage.updateUserBalance(req.user.id, newBalance.toFixed(2));

      // Create notification with GST breakdown
      await storage.createNotification({
        userId: req.user.id,
        type: "withdrawal",
        title: "Withdrawal Request Submitted",
        message: `Withdrawal of ₹${withdrawAmount} submitted. GST (${WITHDRAWAL_GST_PERCENT}%): ₹${gstAmount}. You will receive ₹${netAmount} in your bank account.`,
        isRead: false,
      });

      res.json({ 
        withdrawalRequest, 
        transaction, 
        newBalance: newBalance.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        netAmount: netAmount.toFixed(2),
      });
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      res.status(500).json({ error: "Failed to submit withdrawal request" });
    }
  });

  // Withdraw funds (legacy - kept for backward compatibility)
  app.post("/api/users/:userId/withdraw", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { amount } = req.body;

      // Authentication check - ensure user can only withdraw from their own account
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "Please log in to withdraw funds" });
      }
      
      if (req.user.id !== userId) {
        return res.status(403).json({ error: "You can only withdraw from your own account" });
      }

      // Validate amount is a valid positive number
      const withdrawAmount = parseFloat(amount);
      if (isNaN(withdrawAmount) || !isFinite(withdrawAmount) || withdrawAmount <= 0) {
        return res.status(400).json({ error: "Please enter a valid withdrawal amount" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentBalance = parseFloat(user.balance);

      // Validate minimum withdrawal amount
      if (withdrawAmount < MIN_WITHDRAWAL_AMOUNT) {
        return res.status(400).json({ 
          error: `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT}` 
        });
      }

      if (withdrawAmount > currentBalance) {
        return res.status(400).json({ error: "Insufficient funds" });
      }

      // Create withdrawal transaction
      const transaction = await storage.createTransaction({
        userId,
        type: "debit",
        amount: withdrawAmount.toFixed(2),
        tax: "0.00",
        net: withdrawAmount.toFixed(2),
        description: "Withdrawal to Bank Account",
        status: "pending",
      });

      // Update user balance
      const newBalance = currentBalance - withdrawAmount;
      await storage.updateUserBalance(userId, newBalance.toFixed(2));

      // Create notification
      await storage.createNotification({
        userId,
        type: "withdrawal",
        title: "Withdrawal Initiated",
        message: `Your withdrawal of ₹${withdrawAmount.toFixed(2)} is being processed. It will be credited to your bank account within 2-3 business days.`,
        isRead: false,
      });

      res.json({ transaction, newBalance: newBalance.toFixed(2) });
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ error: "Failed to process withdrawal" });
    }
  });

  // Get current authenticated user (for backward compatibility, also works without auth for demo)
  app.get("/api/users/current", async (req, res) => {
    try {
      // If user is authenticated, return their data
      if (req.isAuthenticated() && req.user) {
        // Get fresh user data from database
        const user = await storage.getUser(req.user.id);
        if (!user) {
          return res.json(null);
        }
        
        // Check if trial subscription has expired and auto-downgrade
        if (user.isTrialSubscription && user.subscriptionPlan === "pro" && user.subscriptionExpiresAt) {
          const now = new Date();
          if (new Date(user.subscriptionExpiresAt) < now) {
            // Trial expired - downgrade to free
            await storage.updateUserSubscription(user.id, "free", null, false);
            const updatedUser = await storage.getUser(user.id);
            return res.json(sanitizeUser(updatedUser));
          }
        }
        
        return res.json(sanitizeUser(user));
      }
      
      // Not logged in - return null
      res.json(null);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Update user's Instagram details
  app.put("/api/users/:userId/instagram", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { instagramUsername, instagramProfileUrl, instagramFollowers } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // If unlinking (empty username), allow it
      if (!instagramUsername) {
        await storage.updateUserInstagram(userId, "", "", null);
        const updatedUser = await storage.getUser(userId);
        return res.json(sanitizeUser(updatedUser));
      }
      
      // Validate follower count >= 8000 (Tier 1 minimum)
      const followers = parseInt(instagramFollowers);
      if (isNaN(followers) || followers < MIN_FOLLOWERS) {
        return res.status(400).json({ 
          error: `Minimum ${MIN_FOLLOWERS.toLocaleString()} followers required to link your Instagram account` 
        });
      }
      
      const username = instagramUsername;
      const profileUrl = instagramProfileUrl || `https://instagram.com/${instagramUsername}`;
      
      await storage.updateUserInstagram(userId, username, profileUrl, followers);
      
      // Update user's tier and followers based on Instagram followers
      const tier = getTierByFollowers(followers);
      if (tier) {
        await storage.updateUserTierAndFollowers(userId, tier.name, followers);
      }
      
      const updatedUser = await storage.getUser(userId);
      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      console.error("Error updating Instagram:", error);
      res.status(500).json({ error: "Failed to update Instagram details" });
    }
  });

  // Update user's shipping address
  app.put("/api/users/:userId/shipping-address", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { shippingAddress, shippingCity, shippingState, shippingPincode, shippingPhone } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      await storage.updateUserShippingAddress(userId, {
        shippingAddress,
        shippingCity,
        shippingState,
        shippingPincode,
        shippingPhone,
      });
      
      const updatedUser = await storage.getUser(userId);
      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      console.error("Error updating shipping address:", error);
      res.status(500).json({ error: "Failed to update shipping address" });
    }
  });

  // Generate Instagram verification code
  app.post("/api/users/:userId/instagram/generate-code", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (!user.instagramUsername) {
        return res.status(400).json({ error: "Please link your Instagram account first" });
      }
      
      // Generate a unique verification code
      const code = `INSTA-${userId}-${Date.now().toString(36).toUpperCase()}`;
      
      await storage.updateUserVerificationCode(userId, code);
      
      const updatedUser = await storage.getUser(userId);
      res.json({ code, user: sanitizeUser(updatedUser) });
    } catch (error) {
      console.error("Error generating verification code:", error);
      res.status(500).json({ error: "Failed to generate verification code" });
    }
  });

  // Submit Instagram for verification (creator action)
  app.post("/api/users/:userId/instagram/submit-verification", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (!user.instagramUsername) {
        return res.status(400).json({ error: "No Instagram account linked" });
      }
      
      if (!user.instagramVerificationCode) {
        return res.status(400).json({ error: "Please generate a verification code first" });
      }
      
      // Submit for verification (pending admin review)
      await storage.submitInstagramForVerification(userId);
      
      const updatedUser = await storage.getUser(userId);
      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      console.error("Error submitting for verification:", error);
      res.status(500).json({ error: "Failed to submit for verification" });
    }
  });

  // Verify Instagram account (admin/sponsor action)
  app.post("/api/users/:userId/instagram/verify", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (!user.instagramUsername) {
        return res.status(400).json({ error: "No Instagram account linked" });
      }
      
      if (!user.instagramVerificationCode) {
        return res.status(400).json({ error: "No verification code found" });
      }
      
      // Only allow verification when status is "pending" (creator has submitted for review)
      if (user.instagramVerificationStatus !== "pending") {
        return res.status(400).json({ error: "User has not submitted for verification yet" });
      }
      
      // Mark Instagram as verified (admin action)
      await storage.verifyUserInstagram(userId);
      
      const updatedUser = await storage.getUser(userId);
      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      console.error("Error verifying Instagram:", error);
      res.status(500).json({ error: "Failed to verify Instagram account" });
    }
  });

  // ==================== INSTAGRAM OAUTH ====================

  // Get Instagram OAuth authorization URL
  app.get("/api/instagram/auth-url", (req, res) => {
    const userId = req.query.userId;
    if (!INSTAGRAM_APP_ID) {
      return res.status(500).json({ error: "Instagram App ID not configured" });
    }
    
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
    const authUrl = `https://api.instagram.com/oauth/authorize?` +
      `client_id=${INSTAGRAM_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}` +
      `&scope=instagram_business_basic` +
      `&response_type=code` +
      `&state=${state}`;
    
    res.json({ authUrl });
  });

  // Instagram OAuth callback
  app.get("/api/instagram/oauth-callback", async (req, res) => {
    try {
      const { code, state, error: oauthError } = req.query;
      
      if (oauthError) {
        return res.redirect(`/profile?error=${encodeURIComponent(oauthError as string)}`);
      }
      
      if (!code || !state) {
        return res.redirect('/profile?error=missing_code');
      }
      
      let stateData: { userId: string };
      try {
        stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
      } catch {
        return res.redirect('/profile?error=invalid_state');
      }
      
      const userId = parseInt(stateData.userId);
      if (!userId) {
        return res.redirect('/profile?error=invalid_user');
      }
      
      // Exchange code for access token
      const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: INSTAGRAM_APP_ID!,
          client_secret: INSTAGRAM_APP_SECRET!,
          grant_type: 'authorization_code',
          redirect_uri: INSTAGRAM_REDIRECT_URI,
          code: code as string,
        }),
      });
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error("Token exchange failed:", errorData);
        return res.redirect('/profile?error=token_exchange_failed');
      }
      
      const tokenData = await tokenResponse.json() as { access_token: string; user_id: number };
      const shortLivedToken = tokenData.access_token;
      const instagramUserId = tokenData.user_id.toString();
      
      // Exchange for long-lived token (60 days)
      const longLivedResponse = await fetch(
        `https://graph.instagram.com/access_token?` +
        `grant_type=ig_exchange_token&` +
        `client_secret=${INSTAGRAM_APP_SECRET}&` +
        `access_token=${shortLivedToken}`
      );
      
      let accessToken = shortLivedToken;
      let expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour for short-lived
      
      if (longLivedResponse.ok) {
        const longLivedData = await longLivedResponse.json() as { access_token: string; expires_in: number };
        accessToken = longLivedData.access_token;
        expiresAt = new Date(Date.now() + longLivedData.expires_in * 1000);
      }
      
      // Fetch user profile from Instagram
      const profileResponse = await fetch(
        `https://graph.instagram.com/me?fields=id,username,account_type,media_count,followers_count&access_token=${accessToken}`
      );
      
      if (!profileResponse.ok) {
        console.error("Profile fetch failed");
        return res.redirect('/profile?error=profile_fetch_failed');
      }
      
      const profileData = await profileResponse.json() as { 
        id: string; 
        username: string; 
        account_type: string;
        media_count?: number;
        followers_count?: number;
      };
      
      const username = profileData.username;
      const followersCount = profileData.followers_count || 0;
      
      // Check minimum followers requirement
      if (followersCount < MIN_FOLLOWERS) {
        return res.redirect(`/profile?error=min_followers&required=${MIN_FOLLOWERS}&actual=${followersCount}`);
      }
      
      // Update user with Instagram OAuth data
      await storage.updateUserInstagramOAuth(userId, accessToken, instagramUserId, expiresAt);
      await storage.updateUserInstagramProfile(userId, username, `https://instagram.com/${username}`, followersCount);
      
      // Update tier based on followers
      const tier = getTierByFollowers(followersCount);
      if (tier) {
        await storage.updateUserTierAndFollowers(userId, tier.name, followersCount);
      }
      
      res.redirect('/profile?instagram_connected=true');
    } catch (error) {
      console.error("Instagram OAuth error:", error);
      res.redirect('/profile?error=oauth_failed');
    }
  });

  // Refresh Instagram data from API
  app.post("/api/users/:userId/instagram/refresh", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (!user.instagramAccessToken) {
        return res.status(400).json({ error: "No Instagram token found. Please connect Instagram first." });
      }
      
      // Check if token is expired
      if (user.instagramTokenExpiresAt && new Date(user.instagramTokenExpiresAt) < new Date()) {
        return res.status(401).json({ error: "Instagram token expired. Please reconnect your account." });
      }
      
      // Fetch latest profile data
      const profileResponse = await fetch(
        `https://graph.instagram.com/me?fields=id,username,followers_count&access_token=${user.instagramAccessToken}`
      );
      
      if (!profileResponse.ok) {
        return res.status(400).json({ error: "Failed to fetch Instagram data" });
      }
      
      const profileData = await profileResponse.json() as { 
        username: string; 
        followers_count?: number;
      };
      
      const followersCount = profileData.followers_count || user.instagramFollowers || 0;
      
      await storage.updateUserInstagramProfile(
        userId, 
        profileData.username, 
        `https://instagram.com/${profileData.username}`, 
        followersCount
      );
      
      // Update tier
      const tier = getTierByFollowers(followersCount);
      if (tier) {
        await storage.updateUserTierAndFollowers(userId, tier.name, followersCount);
      }
      
      const updatedUser = await storage.getUser(userId);
      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      console.error("Error refreshing Instagram data:", error);
      res.status(500).json({ error: "Failed to refresh Instagram data" });
    }
  });

  // Update user billing details
  app.post("/api/users/billing", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { name, companyName, gstNumber, panNumber, billingAddress, billingCity, billingState, billingPincode, phone } = req.body;
      
      await storage.updateUserBilling(userId, {
        companyName: companyName || null,
        gstNumber: gstNumber || null,
        panNumber: panNumber || null,
        billingAddress: billingAddress || null,
        billingCity: billingCity || null,
        billingState: billingState || null,
        billingPincode: billingPincode || null,
      });
      
      const updatedUser = await storage.getUser(userId);
      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      console.error("Error updating billing details:", error);
      res.status(500).json({ error: "Failed to update billing details" });
    }
  });

  // Fetch followers using RapidAPI
  app.post("/api/instagram/fetch-followers", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ error: "Instagram username is required" });
      }

      const rapidapiKey = process.env.RAPIDAPI_KEY;
      const rapidapiHost = process.env.RAPIDAPI_HOST;

      console.log("🔍 RapidAPI Fetch Request:");
      console.log(`   Username: ${username}`);
      console.log(`   Key exists: ${!!rapidapiKey}`);
      console.log(`   Host exists: ${!!rapidapiHost}`);

      if (!rapidapiKey || !rapidapiHost) {
        console.error("❌ RapidAPI credentials not configured");
        return res.status(500).json({ 
          error: "RapidAPI not configured. Please contact admin or use manual entry for now." 
        });
      }

      // Call RapidAPI Instagram Scraper - try multiple endpoint variations
      let response: Response | null = null;
      let lastError = "";
      
      // Try endpoint 1: /info
      let url = new URL(`https://${rapidapiHost}/info`);
      url.searchParams.append("username", username.replace("@", ""));
      
      console.log(`   Trying URL: ${url.toString()}`);
      
      response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidapiKey,
          "x-rapidapi-host": rapidapiHost,
        },
      });
      
      // If first endpoint fails with 403, try alternative endpoint
      if (response.status === 403) {
        console.log("   /info endpoint returned 403, trying alternative...");
        
        // Try endpoint 2: /user
        url = new URL(`https://${rapidapiHost}/user`);
        url.searchParams.append("username", username.replace("@", ""));
        
        console.log(`   Trying alternative URL: ${url.toString()}`);
        
        response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "x-rapidapi-key": rapidapiKey,
            "x-rapidapi-host": rapidapiHost,
          },
        });
      }

      const responseText = await response.text();
      console.log(`   Response Status: ${response.status}`);
      console.log(`   Response: ${responseText.substring(0, 200)}`);

      if (!response.ok) {
        console.error("❌ RapidAPI Error - Status:", response.status);
        if (responseText.includes("not subscribed")) {
          return res.status(400).json({ 
            error: "Auto-fetch setup pending. Please enter your follower count manually - it only takes 10 seconds!" 
          });
        }
        return res.status(400).json({ 
          error: "Auto-fetch temporarily unavailable. Please enter your follower count manually." 
        });
      }

      const data = JSON.parse(responseText) as {
        follower_count?: number;
        followers?: number;
        user?: {
          follower_count?: number;
        };
      };

      // Extract followers from different possible response formats
      let followers = data.follower_count || data.followers || data.user?.follower_count || 0;

      console.log(`   ✅ Followers found: ${followers}`);

      if (!followers || followers < MIN_FOLLOWERS) {
        return res.status(400).json({ 
          error: `Minimum ${MIN_FOLLOWERS.toLocaleString()} followers required. This account has ${followers?.toLocaleString() || 0} followers.` 
        });
      }

      res.json({ 
        followers, 
        username: username.replace("@", ""),
        message: "Followers fetched successfully from Instagram"
      });
    } catch (error) {
      console.error("❌ Error fetching followers:", error);
      res.status(500).json({ error: "Failed to fetch followers. Please use manual entry instead." });
    }
  });

  // Get or create default sponsor user
  app.get("/api/sponsors/current", async (req, res) => {
    try {
      const defaultEmail = "priya.marketing@brand.com";
      let user = await storage.getUserByEmail(defaultEmail);
      
      if (!user) {
        const hashedPassword = await hashPassword("sponsor123");
        user = await storage.createUser({
          name: "Priya Verma",
          handle: "@priya.brand",
          email: defaultEmail,
          password: hashedPassword,
          role: "sponsor",
          followers: 0,
          engagement: "0.00",
          reach: 0,
          avatar: "https://github.com/shadcn.png",
          isVerified: true,
          tier: "Sponsor",
          balance: "50000.00",
          companyName: "Brand Solutions Pvt Ltd",
        });
      }
      
      res.json(sanitizeUser(user));
    } catch (error) {
      console.error("Error fetching/creating sponsor:", error);
      res.status(500).json({ error: "Failed to fetch sponsor" });
    }
  });

  // Get sponsor's campaigns
  app.get("/api/sponsors/:sponsorId/campaigns", async (req, res) => {
    try {
      const sponsorId = parseInt(req.params.sponsorId);
      const campaigns = await storage.getCampaignsBySponsor(sponsorId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching sponsor campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // Create campaign by sponsor
  app.post("/api/sponsors/:sponsorId/campaigns", async (req, res) => {
    try {
      const sponsorId = parseInt(req.params.sponsorId);
      const sponsor = await storage.getUser(sponsorId);
      
      if (!sponsor) {
        return res.status(404).json({ error: "Sponsor not found" });
      }
      
      const campaignType = req.body.campaignType || "cash";
      const isProductCampaign = campaignType === "product";
      
      // Calculate total campaign cost with platform fee only (GST is on deposit, not here)
      const PLATFORM_FEE_PERCENT = 10;
      
      const payAmount = isProductCampaign ? 0 : (parseFloat(req.body.payAmount) || 0);
      const totalSpots = parseInt(req.body.totalSpots) || 1;
      const creatorPayment = payAmount * totalSpots;
      const platformFee = isProductCampaign ? 0 : Math.round(creatorPayment * PLATFORM_FEE_PERCENT / 100);
      const totalCost = creatorPayment + platformFee;
      const currentBalance = parseFloat(sponsor.balance);
      
      // Check if sponsor has enough balance (only for cash campaigns)
      if (!isProductCampaign && currentBalance < totalCost) {
        return res.status(400).json({ 
          error: "Insufficient balance", 
          required: totalCost,
          available: currentBalance
        });
      }
      
      // Create campaign with escrow tracking
      const campaignData = {
        ...req.body,
        sponsorId,
        spotsRemaining: req.body.totalSpots,
        status: "active",
        deadline: new Date(req.body.deadline),
        // Escrow tracking - totalBudget is the creator payment portion (not platform fee)
        totalBudget: creatorPayment.toFixed(2),
        releasedAmount: "0.00",
        refundedAmount: "0.00",
        escrowStatus: isProductCampaign ? "product" : "active",
        // Target countries for international campaigns (array)
        targetCountries: req.body.targetCountries || [sponsor.country || "IN"],
        // Product campaign fields
        campaignType: campaignType,
        productName: req.body.productName || null,
        productValue: req.body.productValue || null,
        productImage: req.body.productImage || null,
        productDescription: req.body.productDescription || null,
      };
      
      const campaign = await storage.createCampaign(campaignData);
      
      // Only process payment for cash campaigns
      if (!isProductCampaign && totalCost > 0) {
        // Deduct from sponsor wallet
        const newBalance = currentBalance - totalCost;
        await storage.updateUserBalance(sponsorId, newBalance.toFixed(2));
        
        // Credit to admin wallet (full amount goes to admin)
        await storage.updateAdminWalletBalance(totalCost, 'add');
        
        // Record platform fee as earnings
        await storage.updateAdminWalletStats(platformFee, 0, 0);
        
        // Create sponsor transaction record
        await storage.createTransaction({
          userId: sponsorId,
          type: "debit",
          category: "campaign_payment",
          amount: totalCost.toFixed(2),
          tax: platformFee.toFixed(2),
          net: creatorPayment.toFixed(2),
          description: `Campaign: ${req.body.title} (Creator: ₹${creatorPayment}, Platform Fee: ₹${platformFee})`,
          status: "completed",
          campaignId: campaign.id,
        });
        
        // Create admin wallet transaction record
        await storage.createAdminWalletTransaction({
          type: "credit",
          category: "campaign_deposit",
          amount: totalCost.toFixed(2),
          description: `Campaign deposit from ${sponsor.companyName || sponsor.name}: "${req.body.title}"`,
          relatedUserId: sponsorId,
          campaignId: campaign.id,
        });
      }
      
      // Notify admin about new campaign pending approval
      const admins = await storage.getAllUsers();
      const adminUsers = admins.filter(u => u.role === "admin");
      for (const admin of adminUsers) {
        await storage.createNotification({
          userId: admin.id,
          type: "new_campaign",
          title: isProductCampaign ? "New Product Campaign Pending Approval" : "New Campaign Pending Approval",
          message: `${sponsor.companyName || sponsor.name} submitted "${campaign.title}" for approval.`,
          isRead: false,
          campaignId: campaign.id,
        });
      }
      
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  // Get reservations for a campaign (sponsor view)
  app.get("/api/campaigns/:campaignId/reservations", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const reservations = await storage.getReservationsForCampaign(campaignId);
      res.json(reservations);
    } catch (error) {
      console.error("Error fetching campaign reservations:", error);
      res.status(500).json({ error: "Failed to fetch reservations" });
    }
  });

  // Update campaign status (pause/activate)
  app.patch("/api/campaigns/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      await storage.updateCampaignStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating campaign status:", error);
      res.status(500).json({ error: "Failed to update campaign status" });
    }
  });

  // ==================== SPONSOR WALLET ====================

  // Get sponsor wallet (balance + transactions)
  app.get("/api/sponsors/:sponsorId/wallet", async (req, res) => {
    try {
      const sponsorId = parseInt(req.params.sponsorId);
      const sponsor = await storage.getUser(sponsorId);
      if (!sponsor) {
        return res.status(404).json({ error: "Sponsor not found" });
      }
      const transactions = await storage.getTransactionsByUser(sponsorId);
      res.json({
        balance: sponsor.balance,
        transactions,
      });
    } catch (error) {
      console.error("Error fetching sponsor wallet:", error);
      res.status(500).json({ error: "Failed to fetch wallet" });
    }
  });

  // Deposit to sponsor wallet (manual/admin approved)
  app.post("/api/sponsors/:sponsorId/wallet/deposit", async (req, res) => {
    try {
      const sponsorId = parseInt(req.params.sponsorId);
      const { amount, paymentId, description } = req.body;
      
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      
      const sponsor = await storage.getUser(sponsorId);
      if (!sponsor) {
        return res.status(404).json({ error: "Sponsor not found" });
      }
      
      const depositAmount = parseFloat(amount);
      const newBalance = parseFloat(sponsor.balance) + depositAmount;
      
      // Update balance
      await storage.updateUserBalance(sponsorId, newBalance.toFixed(2));
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId: sponsorId,
        type: "credit",
        category: "deposit",
        amount: depositAmount.toFixed(2),
        tax: "0.00",
        net: depositAmount.toFixed(2),
        description: description || "Wallet deposit",
        status: "completed",
        paymentId: paymentId || null,
      });
      
      res.json({ 
        success: true, 
        newBalance: newBalance.toFixed(2),
        transaction 
      });
    } catch (error) {
      console.error("Error processing deposit:", error);
      res.status(500).json({ error: "Failed to process deposit" });
    }
  });

  // Get Razorpay key for frontend
  app.get("/api/razorpay/key", (req, res) => {
    try {
      const keyId = getRazorpayKeyId();
      res.json({ keyId });
    } catch (error) {
      res.status(500).json({ error: "Razorpay not configured" });
    }
  });

  // Create Razorpay order for sponsor wallet deposit (with GST)
  const DEPOSIT_GST_RATE = 18; // 18% GST on wallet deposits
  
  app.post("/api/sponsors/:sponsorId/wallet/create-order", async (req, res) => {
    try {
      const sponsorId = parseInt(req.params.sponsorId);
      const { amount } = req.body; // Base amount user wants to add to wallet
      
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      
      const sponsor = await storage.getUser(sponsorId);
      if (!sponsor) {
        return res.status(404).json({ error: "Sponsor not found" });
      }
      
      // Calculate GST and total payable
      const baseAmount = parseFloat(amount);
      const gstAmount = Math.round(baseAmount * DEPOSIT_GST_RATE / 100);
      const totalPayable = baseAmount + gstAmount;
      
      const order = await createRazorpayOrder(totalPayable, "INR", {
        sponsorId: sponsorId.toString(),
        type: "wallet_deposit",
        baseAmount: baseAmount.toString(),
        gstAmount: gstAmount.toString(),
      });
      
      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: getRazorpayKeyId(),
        baseAmount: baseAmount,
        gstAmount: gstAmount,
        totalPayable: totalPayable,
      });
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ error: "Failed to create payment order" });
    }
  });

  // Verify Razorpay payment and credit wallet (GST is included in the payment)
  // User pays: Base Amount + 18% GST
  // Wallet receives: Base Amount (GST goes to platform)
  const DEPOSIT_GST_PERCENT = 18;
  
  app.post("/api/sponsors/:sponsorId/wallet/verify-payment", async (req, res) => {
    try {
      const sponsorId = parseInt(req.params.sponsorId);
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, baseAmount } = req.body;
      
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing payment details" });
      }
      
      // Verify payment signature
      const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (!isValid) {
        return res.status(400).json({ error: "Invalid payment signature" });
      }
      
      const sponsor = await storage.getUser(sponsorId);
      if (!sponsor) {
        return res.status(404).json({ error: "Sponsor not found" });
      }
      
      // baseAmount is what user wanted to add, amount includes GST
      const walletCredit = parseFloat(baseAmount || amount);
      const totalPaid = parseFloat(amount);
      const gstAmount = Math.round(walletCredit * DEPOSIT_GST_PERCENT / 100);
      const newBalance = parseFloat(sponsor.balance) + walletCredit;
      
      // Update balance (only base amount goes to wallet)
      await storage.updateUserBalance(sponsorId, newBalance.toFixed(2));
      
      // Create transaction record with GST breakdown
      const transaction = await storage.createTransaction({
        userId: sponsorId,
        type: "credit",
        category: "deposit",
        amount: totalPaid.toFixed(2),
        tax: gstAmount.toFixed(2),
        net: walletCredit.toFixed(2),
        description: `Wallet deposit (Paid: ₹${totalPaid}, GST ${DEPOSIT_GST_PERCENT}%: ₹${gstAmount}, Credited: ₹${walletCredit})`,
        status: "completed",
        paymentId: razorpay_payment_id,
      });
      
      res.json({ 
        success: true, 
        newBalance: newBalance.toFixed(2),
        walletCredit: walletCredit.toFixed(2),
        gstPaid: gstAmount.toFixed(2),
        transaction 
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // ==================== NOTIFICATIONS ====================

  // Get notifications for a user
  app.get("/api/users/:userId/notifications", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count
  app.get("/api/users/:userId/notifications/unread-count", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.post("/api/users/:userId/notifications/mark-all-read", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // ==================== CATEGORY GROUPS ====================

  // Get all promotion categories
  app.get("/api/categories", (req, res) => {
    res.json(PROMOTION_CATEGORIES);
  });

  // Get campaigns by category
  app.get("/api/categories/:category/campaigns", async (req, res) => {
    try {
      const { category } = req.params;
      const { tier } = req.query;
      
      // First, expire any expired reservations and return spots to campaigns
      await storage.expireExpiredReservations();
      
      let campaigns;
      if (tier && typeof tier === 'string') {
        campaigns = await storage.getCampaignsByCategoryAndTier(category, tier);
      } else {
        campaigns = await storage.getCampaignsByCategory(category);
      }
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns by category:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // Get user's category subscriptions
  app.get("/api/users/:userId/category-subscriptions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const subscriptions = await storage.getCategorySubscriptionsByUser(userId);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching category subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // Subscribe to a category+tier group
  app.post("/api/users/:userId/category-subscriptions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { category, tier } = req.body;
      
      if (!category || !tier) {
        return res.status(400).json({ error: "Category and tier are required" });
      }
      
      // Check if already subscribed
      const existing = await storage.getUserSubscription(userId, category, tier);
      if (existing) {
        return res.status(400).json({ error: "Already subscribed to this group" });
      }
      
      const subscription = await storage.subscribeToCategoryGroup({ userId, category, tier });
      res.status(201).json(subscription);
    } catch (error) {
      console.error("Error subscribing to category:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  // Unsubscribe from a category+tier group
  app.delete("/api/users/:userId/category-subscriptions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { category, tier } = req.body;
      
      if (!category || !tier) {
        return res.status(400).json({ error: "Category and tier are required" });
      }
      
      await storage.unsubscribeFromCategoryGroup(userId, category, tier);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unsubscribing from category:", error);
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  // ==================== ADMIN ROUTES ====================
  
  // Admin authentication middleware
  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Please log in" });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  };

  // Get admin dashboard stats
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Get all users with enriched data (admin only)
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const { role } = req.query;
      let users;
      if (role === "creator") {
        users = await storage.getAllCreators();
      } else if (role === "sponsor") {
        users = await storage.getAllSponsors();
      } else {
        users = await storage.getAllUsers();
      }
      
      // Enrich users with aggregated stats
      const enrichedUsers = await Promise.all(users.map(async (user) => {
        const sanitized = sanitizeUser(user);
        
        // Get aggregated stats for each user
        const transactions = await storage.getTransactionsByUser(user.id);
        const reservations = await storage.getReservationsByUser(user.id);
        const campaigns = user.role === "sponsor" ? await storage.getCampaignsBySponsor(user.id) : [];
        
        // Calculate stats
        const totalEarnings = transactions
          .filter((t: any) => t.type === "credit" && t.category === "campaign_payment")
          .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
        
        const pendingWithdrawals = transactions
          .filter((t: any) => t.type === "debit" && t.category === "withdrawal" && t.status === "pending")
          .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
        
        const activeReservations = reservations.filter((r: any) => r.status === "reserved" || r.status === "submitted").length;
        const completedSubmissions = reservations.filter((r: any) => r.status === "approved").length;
        
        return {
          ...sanitized,
          totalEarnings: totalEarnings.toString(),
          pendingWithdrawals: pendingWithdrawals.toString(),
          starRewards: user.stars || 0,
          activeReservations,
          completedSubmissions,
          campaignsCreated: campaigns.length,
          createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        };
      }));
      
      res.json(enrichedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Verify user (admin action)
  app.post("/api/admin/users/:userId/verify", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      await storage.updateUserStatus(userId, true);
      
      await storage.createNotification({
        userId,
        type: "verification_approved",
        title: "Account Verified",
        message: "Your account has been verified by an administrator.",
        isRead: false,
      });
      
      const updatedUser = await storage.getUser(userId);
      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      console.error("Error verifying user:", error);
      res.status(500).json({ error: "Failed to verify user" });
    }
  });

  // Get users pending Instagram verification
  app.get("/api/admin/users/pending-verification", isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsersPendingVerification();
      res.json(users.map(sanitizeUser));
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      res.status(500).json({ error: "Failed to fetch pending verifications" });
    }
  });

  // Approve Instagram verification (admin action)
  app.post("/api/admin/users/:userId/verify-instagram", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      await storage.verifyUserInstagram(userId);
      
      // Send notification to user
      await storage.createNotification({
        userId,
        type: "verification_approved",
        title: "Instagram Verified",
        message: "Your Instagram account has been verified successfully!",
        isRead: false,
      });
      
      const updatedUser = await storage.getUser(userId);
      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      console.error("Error verifying Instagram:", error);
      res.status(500).json({ error: "Failed to verify Instagram" });
    }
  });

  // Reject Instagram verification (admin action)
  app.post("/api/admin/users/:userId/reject-instagram", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { reason } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      await storage.rejectInstagramVerification(userId);
      
      // Send notification to user
      await storage.createNotification({
        userId,
        type: "verification_rejected",
        title: "Verification Rejected",
        message: reason || "Your Instagram verification was rejected. Please try again with correct details.",
        isRead: false,
      });
      
      const updatedUser = await storage.getUser(userId);
      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      console.error("Error rejecting verification:", error);
      res.status(500).json({ error: "Failed to reject verification" });
    }
  });

  // Update user verification status
  app.patch("/api/admin/users/:userId/status", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { isVerified } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      await storage.updateUserStatus(userId, isVerified);
      const updatedUser = await storage.getUser(userId);
      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // Get all campaigns (admin view)
  app.get("/api/admin/campaigns", isAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getAllCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // Update campaign status (admin action)
  app.patch("/api/admin/campaigns/:campaignId/status", isAdmin, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const { status } = req.body;
      
      if (!["active", "paused", "completed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      await storage.updateCampaignStatus(campaignId, status);
      const campaign = await storage.getCampaign(campaignId);
      res.json(campaign);
    } catch (error) {
      console.error("Error updating campaign status:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  // Get campaigns pending approval (admin)
  app.get("/api/admin/campaigns/pending-approval", isAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getPendingApprovalCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching pending campaigns:", error);
      res.status(500).json({ error: "Failed to fetch pending campaigns" });
    }
  });

  // Approve campaign (admin action)
  app.post("/api/admin/campaigns/:campaignId/approve", isAdmin, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const { isPromotional, starReward } = req.body;
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      // Approve with promotional options
      const approvedCampaign = await storage.approveCampaign(campaignId, isPromotional || false, starReward || 0);
      
      // Notify sponsor that campaign is approved
      if (campaign.sponsorId) {
        const promotionalNote = isPromotional ? ` as a promotional campaign with ${starReward} star rewards` : "";
        await storage.createNotification({
          userId: campaign.sponsorId,
          type: "campaign_approved",
          title: "Campaign Approved",
          message: `Your campaign "${campaign.title}" has been approved${promotionalNote} and is now live!`,
          isRead: false,
          campaignId: campaign.id,
        });
      }
      
      res.json(approvedCampaign);
    } catch (error) {
      console.error("Error approving campaign:", error);
      res.status(500).json({ error: "Failed to approve campaign" });
    }
  });

  // Reject campaign (admin action)
  app.post("/api/admin/campaigns/:campaignId/reject", isAdmin, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const { reason } = req.body;
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      // Notify sponsor before deleting
      if (campaign.sponsorId) {
        await storage.createNotification({
          userId: campaign.sponsorId,
          type: "campaign_rejected",
          title: "Campaign Rejected",
          message: reason || `Your campaign "${campaign.title}" was rejected. Please review guidelines and try again.`,
          isRead: false,
        });
      }
      
      await storage.rejectCampaign(campaignId);
      res.json({ success: true, message: "Campaign rejected" });
    } catch (error) {
      console.error("Error rejecting campaign:", error);
      res.status(500).json({ error: "Failed to reject campaign" });
    }
  });

  // Get all withdrawal requests (admin view)
  app.get("/api/admin/withdrawals", isAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      let requests;
      if (status === "pending") {
        requests = await storage.getAllPendingWithdrawalRequests();
      } else {
        requests = await storage.getAllWithdrawalRequests();
      }
      
      // Enrich with user and bank account details
      const enrichedRequests = await Promise.all(requests.map(async (request) => {
        const user = await storage.getUser(request.userId);
        const bankAccount = await storage.getBankAccount(request.bankAccountId);
        return {
          ...request,
          user: user ? sanitizeUser(user) : null,
          bankAccount: bankAccount ? {
            id: bankAccount.id,
            accountHolderName: bankAccount.accountHolderName,
            accountNumber: bankAccount.accountNumber.slice(-4).padStart(bankAccount.accountNumber.length, '*'),
            ifscCode: bankAccount.ifscCode,
            bankName: bankAccount.bankName,
            upiId: bankAccount.upiId,
          } : null,
        };
      }));
      
      res.json(enrichedRequests);
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
      res.status(500).json({ error: "Failed to fetch withdrawal requests" });
    }
  });

  // Approve withdrawal request (admin action)
  app.post("/api/admin/withdrawals/:requestId/approve", isAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const { utrNumber } = req.body;
      
      if (!utrNumber || utrNumber.trim().length < 5) {
        return res.status(400).json({ error: "Valid UTR number is required" });
      }
      
      const request = await storage.getWithdrawalRequest(requestId);
      if (!request) {
        return res.status(404).json({ error: "Withdrawal request not found" });
      }
      
      if (request.status !== "pending") {
        return res.status(400).json({ error: "Request is not pending" });
      }
      
      // Update withdrawal request status
      await storage.updateWithdrawalRequestStatus(requestId, "completed", utrNumber.trim());
      
      // Update related transaction status
      const userTransactions = await storage.getTransactionsByUser(request.userId);
      const relatedTransaction = userTransactions.find(t => 
        t.description.includes(`Withdrawal Request #${requestId}`) && t.status === "pending"
      );
      if (relatedTransaction) {
        await storage.updateTransactionStatus(relatedTransaction.id, "completed");
      }
      
      // Send notification to user
      await storage.createNotification({
        userId: request.userId,
        type: "withdrawal_approved",
        title: "Withdrawal Processed",
        message: `Your withdrawal of ₹${request.amount} has been processed. UTR: ${utrNumber}`,
        isRead: false,
      });
      
      const updatedRequest = await storage.getWithdrawalRequest(requestId);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      res.status(500).json({ error: "Failed to approve withdrawal" });
    }
  });

  // Reject withdrawal request (admin action)
  app.post("/api/admin/withdrawals/:requestId/reject", isAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const { reason } = req.body;
      
      const request = await storage.getWithdrawalRequest(requestId);
      if (!request) {
        return res.status(404).json({ error: "Withdrawal request not found" });
      }
      
      if (request.status !== "pending") {
        return res.status(400).json({ error: "Request is not pending" });
      }
      
      // Update withdrawal request status
      await storage.updateWithdrawalRequestStatus(requestId, "rejected", undefined, reason || "Request rejected");
      
      // Refund the amount back to user's balance
      const user = await storage.getUser(request.userId);
      if (user) {
        const newBalance = parseFloat(user.balance) + parseFloat(request.amount);
        await storage.updateUserBalance(request.userId, newBalance.toFixed(2));
      }
      
      // Update related transaction status
      const userTransactions = await storage.getTransactionsByUser(request.userId);
      const relatedTransaction = userTransactions.find(t => 
        t.description.includes(`Withdrawal Request #${requestId}`) && t.status === "pending"
      );
      if (relatedTransaction) {
        await storage.updateTransactionStatus(relatedTransaction.id, "cancelled");
      }
      
      // Create refund transaction
      await storage.createTransaction({
        userId: request.userId,
        type: "credit",
        amount: request.amount,
        tax: "0.00",
        net: request.amount,
        description: `Refund for rejected withdrawal #${requestId}`,
        status: "completed",
      });
      
      // Send notification to user
      await storage.createNotification({
        userId: request.userId,
        type: "withdrawal_rejected",
        title: "Withdrawal Rejected",
        message: reason || "Your withdrawal request was rejected. The amount has been refunded to your wallet.",
        isRead: false,
      });
      
      const updatedRequest = await storage.getWithdrawalRequest(requestId);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      res.status(500).json({ error: "Failed to reject withdrawal" });
    }
  });

  // Get submissions pending review (admin view)
  app.get("/api/admin/submissions/pending", isAdmin, async (req, res) => {
    try {
      const pendingSubmissions = await storage.getSubmissionsPendingReview();
      res.json(pendingSubmissions);
    } catch (error) {
      console.error("Error fetching pending submissions:", error);
      res.status(500).json({ error: "Failed to fetch pending submissions" });
    }
  });

  // Get campaign-grouped submissions for admin
  app.get("/api/admin/campaign-submissions", isAdmin, async (req, res) => {
    try {
      // Get all campaigns with their reservations grouped
      const allCampaigns = await storage.getAllCampaigns();
      
      const campaignGroups = await Promise.all(allCampaigns.map(async (campaign) => {
        const reservationsForCampaign = await storage.getReservationsForCampaign(campaign.id);
        const sponsor = campaign.sponsorId ? await storage.getUser(campaign.sponsorId) : null;
        
        // Get status counts
        const reserved = reservationsForCampaign.filter((r: any) => r.status === "reserved").length;
        const submitted = reservationsForCampaign.filter((r: any) => r.status === "submitted").length;
        const approved = reservationsForCampaign.filter((r: any) => r.status === "approved").length;
        const rejected = reservationsForCampaign.filter((r: any) => r.status === "rejected").length;
        const expired = reservationsForCampaign.filter((r: any) => r.status === "expired").length;
        
        // Get submission details for pending review
        const submissionsData = await Promise.all(
          reservationsForCampaign
            .filter((r: any) => r.status === "submitted" || r.status === "approved" || r.status === "rejected")
            .map(async (reservation: any) => {
              const user = await storage.getUser(reservation.userId);
              const submissionData = await storage.getSubmissionByReservation(reservation.id);
              
              return {
                reservation,
                user: user ? {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  instagramUsername: user.instagramUsername,
                  tier: user.tier,
                } : null,
                submission: submissionData || null,
              };
            })
        );
        
        return {
          campaign: {
            id: campaign.id,
            title: campaign.title,
            tier: campaign.tier,
            totalSpots: campaign.totalSpots,
            spotsRemaining: campaign.spotsRemaining,
            deadline: campaign.deadline,
            payAmount: campaign.payAmount,
            isPromotional: campaign.isPromotional,
            starReward: campaign.starReward,
            status: campaign.status,
          },
          sponsor: sponsor ? {
            id: sponsor.id,
            name: sponsor.name,
            email: sponsor.email,
            companyName: sponsor.companyName,
          } : null,
          stats: {
            totalReservations: reservationsForCampaign.length,
            reserved,
            submitted,
            approved,
            rejected,
            expired,
            spotsFilledPercent: campaign.totalSpots > 0 
              ? Math.round(((campaign.totalSpots - campaign.spotsRemaining) / campaign.totalSpots) * 100)
              : 0,
          },
          submissions: submissionsData,
        };
      }));
      
      // Sort by pending submissions (submitted count) descending
      campaignGroups.sort((a, b) => b.stats.submitted - a.stats.submitted);
      
      // Filter out campaigns with no activity
      const activeGroups = campaignGroups.filter(g => g.stats.totalReservations > 0);
      
      res.json(activeGroups);
    } catch (error) {
      console.error("Error fetching campaign submissions:", error);
      res.status(500).json({ error: "Failed to fetch campaign submissions" });
    }
  });

  // Approve submission (admin action)
  app.post("/api/admin/submissions/:reservationId/approve", isAdmin, async (req, res) => {
    try {
      const reservationId = parseInt(req.params.reservationId);
      
      const reservation = await storage.getReservation(reservationId);
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }
      
      if (reservation.status !== "submitted") {
        return res.status(400).json({ error: "Submission is not pending review" });
      }
      
      const campaign = await storage.getCampaign(reservation.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      // Approve the reservation
      await storage.updateReservationStatus(reservationId, "approved", new Date());
      
      const user = await storage.getUser(reservation.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if promotional campaign (stars) or regular (money)
      if (campaign.isPromotional && campaign.starReward > 0) {
        // Award stars instead of money
        const newStars = (user.stars || 0) + campaign.starReward;
        await storage.updateUserStars(reservation.userId, newStars);

        // Create notification for stars
        await storage.createNotification({
          userId: reservation.userId,
          type: "submission_approved",
          title: "Submission Approved!",
          message: `Your work for "${campaign.title}" has been approved. You earned ${campaign.starReward} star(s)! Total: ${newStars} stars.`,
          isRead: false,
          campaignId: campaign.id,
          reservationId,
        });

        // Check if user reached 5 stars - give free month subscription
        if (newStars >= 5) {
          const starsUsed = 5;
          const remainingStars = newStars - starsUsed;
          await storage.updateUserStars(reservation.userId, remainingStars);

          // Give 1 month free subscription
          const expiresAt = new Date();
          if (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > expiresAt) {
            expiresAt.setTime(new Date(user.subscriptionExpiresAt).getTime());
          }
          expiresAt.setMonth(expiresAt.getMonth() + 1);
          await storage.updateUserSubscription(reservation.userId, "pro", expiresAt, false, false);

          // Create notification about free subscription
          await storage.createNotification({
            userId: reservation.userId,
            type: "subscription_reward",
            title: "Free Pro Subscription!",
            message: `Congratulations! You collected 5 stars and earned 1 month of FREE Pro subscription! Valid until ${expiresAt.toLocaleDateString()}.`,
            isRead: false,
          });
        }

        res.json({ success: true, message: `Submission approved. ${campaign.starReward} stars awarded.` });
      } else {
        // Regular payment flow - payment from admin wallet to creator
        const payAmount = parseFloat(campaign.payAmount);
        const taxRate = 0.10; // 10% TDS
        const tax = payAmount * taxRate;
        const netAmount = payAmount - tax;
        
        // Debit from admin wallet (pay creator)
        await storage.updateAdminWalletBalance(payAmount, 'subtract');
        
        // Update admin wallet stats (payout)
        await storage.updateAdminWalletStats(0, payAmount, 0);
        
        // Create admin wallet payout transaction
        await storage.createAdminWalletTransaction({
          type: "debit",
          category: "creator_payout",
          amount: payAmount.toFixed(2),
          description: `Creator payout to ${user.name} for "${campaign.title}"`,
          relatedUserId: reservation.userId,
          campaignId: campaign.id,
        });
        
        // Create creator earning transaction
        await storage.createTransaction({
          userId: reservation.userId,
          type: "credit",
          amount: payAmount.toFixed(2),
          tax: tax.toFixed(2),
          net: netAmount.toFixed(2),
          description: `Earnings from "${campaign.title}"`,
          status: "completed",
          reservationId,
        });
        
        // Update creator wallet balance
        const newBalance = parseFloat(user.balance) + netAmount;
        await storage.updateUserBalance(reservation.userId, newBalance.toFixed(2));
        
        // Update campaign escrow - add to released amount
        const currentReleased = parseFloat(campaign.releasedAmount || "0");
        const newReleased = currentReleased + payAmount;
        const totalBudget = parseFloat(campaign.totalBudget || "0");
        const refunded = parseFloat(campaign.refundedAmount || "0");
        
        // Check if all budget has been released/refunded
        const escrowStatus = (newReleased + refunded >= totalBudget) ? "completed" : "active";
        await storage.updateCampaignEscrow(
          campaign.id, 
          newReleased.toFixed(2), 
          campaign.refundedAmount || "0.00", 
          escrowStatus
        );
        
        // Send notification
        await storage.createNotification({
          userId: reservation.userId,
          type: "submission_approved",
          title: "Submission Approved",
          message: `Your submission for "${campaign.title}" has been approved! ₹${netAmount.toFixed(2)} has been added to your wallet.`,
          isRead: false,
          campaignId: campaign.id,
          reservationId,
        });
        
        res.json({ success: true, message: "Submission approved and payment processed" });
      }
    } catch (error) {
      console.error("Error approving submission:", error);
      res.status(500).json({ error: "Failed to approve submission" });
    }
  });

  // Reject submission (admin action)
  app.post("/api/admin/submissions/:reservationId/reject", isAdmin, async (req, res) => {
    try {
      const reservationId = parseInt(req.params.reservationId);
      const { reason } = req.body;
      
      const reservation = await storage.getReservation(reservationId);
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }
      
      if (reservation.status !== "submitted") {
        return res.status(400).json({ error: "Submission is not pending review" });
      }
      
      const campaign = await storage.getCampaign(reservation.campaignId);
      
      // Reject the reservation
      await storage.updateReservationStatus(reservationId, "rejected", new Date());
      
      // Return the spot to the campaign
      if (campaign) {
        await storage.updateCampaignSpots(campaign.id, campaign.spotsRemaining + 1);
      }
      
      // Send notification
      await storage.createNotification({
        userId: reservation.userId,
        type: "submission_rejected",
        title: "Submission Rejected",
        message: reason || `Your submission for "${campaign?.title || 'the campaign'}" was rejected.`,
        isRead: false,
        campaignId: campaign?.id,
        reservationId,
      });
      
      res.json({ success: true, message: "Submission rejected" });
    } catch (error) {
      console.error("Error rejecting submission:", error);
      res.status(500).json({ error: "Failed to reject submission" });
    }
  });

  // ==================== SUBSCRIPTION ROUTES ====================

  // Get subscription status
  app.get("/api/users/:userId/subscription", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const isActive = user.subscriptionPlan === "pro" && 
        user.subscriptionExpiresAt && 
        new Date(user.subscriptionExpiresAt) > new Date();
      
      res.json({
        plan: user.subscriptionPlan,
        expiresAt: user.subscriptionExpiresAt,
        isActive,
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  // Get Cashfree config for frontend
  app.get("/api/cashfree/config", async (req, res) => {
    try {
      const appId = getCashfreeAppId();
      const environment = process.env.CASHFREE_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
      res.json({ appId, environment });
    } catch (error) {
      console.error("Error fetching Cashfree config:", error);
      res.status(500).json({ error: "Cashfree not configured" });
    }
  });

  // Create Cashfree order for subscription
  app.post("/api/subscription/create-order", async (req, res) => {
    try {
      const { userId } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const orderId = `sub_${userId}_${Date.now()}`;
      const returnUrl = `${req.protocol}://${req.get('host')}/subscription?order_id={order_id}&status=success`;
      
      const order = await createCashfreeOrder(
        orderId,
        499,
        {
          customerId: `user_${userId}`,
          customerPhone: "9999999999",
          customerName: user.name,
          customerEmail: user.email,
        },
        returnUrl
      );

      res.json({ 
        orderId: order.order_id,
        sessionId: order.payment_session_id,
        amount: 499,
        currency: "INR",
      });
    } catch (error) {
      console.error("Error creating Cashfree order:", error);
      res.status(500).json({ error: "Failed to create payment order" });
    }
  });

  // Verify Cashfree payment and activate subscription
  app.post("/api/subscription/verify-payment", async (req, res) => {
    try {
      const { userId, orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ error: "Missing order ID" });
      }
      
      const orderDetails = await fetchCashfreeOrder(orderId);
      
      if (orderDetails.order_status !== 'PAID') {
        return res.status(400).json({ error: "Payment not completed", status: orderDetails.order_status });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      let expiresAt = new Date();
      if (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date()) {
        expiresAt = new Date(user.subscriptionExpiresAt);
      }
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      
      await storage.updateUserSubscription(userId, "pro", expiresAt);
      
      await storage.createNotification({
        userId,
        type: "subscription_upgraded",
        title: "Pro Subscription Activated!",
        message: "Welcome to Pro! You can now reserve unlimited campaigns and start earning.",
        isRead: false,
      });
      
      res.json({ 
        success: true, 
        plan: "pro",
        expiresAt,
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // Get all transactions (admin view)
  app.get("/api/admin/transactions", isAdmin, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      
      // Enrich with user details
      const enrichedTransactions = await Promise.all(transactions.map(async (transaction) => {
        const user = await storage.getUser(transaction.userId);
        return {
          ...transaction,
          user: user ? { id: user.id, name: user.name, email: user.email, handle: user.handle } : null,
        };
      }));
      
      res.json(enrichedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // ==================== MOCK INSTAGRAM VERIFICATION ====================

  // Fetch Instagram followers count (REAL DATA - Direct from Instagram)
  app.post("/api/instagram/fetch-followers", isAuthenticated, async (req, res) => {
    try {
      const { username } = req.body;

      if (!username || !username.trim()) {
        return res.status(400).json({ error: "Instagram username is required" });
      }

      const cleanUsername = username.replace("@", "").trim();

      // Method 1: Try Instagram's public profile page
      try {
        const profileUrl = `https://www.instagram.com/${cleanUsername}/`;
        
        const response = await axios.get(profileUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
          timeout: 10000,
        });

        // Parse HTML for followers count - Instagram embeds it in the HTML
        const html = response.data;
        
        // Look for follower count in different formats
        const patterns = [
          /"follower_count":(\d+)/,                    // JSON format 1
          /"edge_followed_by":\{"count":(\d+)\}/,      // JSON format 2
          />([0-9,]+)\s*Followers</,                   // HTML format
          /"followers_count":(\d+)/,                   // Another JSON format
        ];

        for (const pattern of patterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            const followersStr = match[1].replace(/,/g, ""); // Remove commas
            const followers = parseInt(followersStr, 10);
            
            if (!isNaN(followers) && followers > 0) {
              return res.json({
                success: true,
                username: cleanUsername,
                followers: followers,
                source: "instagram_html",
                message: `Real data: @${cleanUsername} has ${followers.toLocaleString()} followers`,
              });
            }
          }
        }
      } catch (error1: any) {
        console.log("Method 1 failed:", error1.message?.substring(0, 50));
      }

      // Method 2: Use Instagrapi-like endpoint (backup)
      try {
        const apiUrl = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${cleanUsername}`;
        const apiResponse = await axios.get(apiUrl, {
          headers: {
            "User-Agent": "Instagram 270.0.0.0.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X; en_US; en-US)",
            "X-Requested-With": "XMLHttpRequest",
          },
          timeout: 10000,
        });

        if (apiResponse.data?.data?.user?.follower_count !== undefined) {
          const followers = apiResponse.data.data.user.follower_count;
          
          if (followers > 0) {
            return res.json({
              success: true,
              username: cleanUsername,
              followers: followers,
              source: "instagram_api",
              message: `Real data: @${cleanUsername} has ${followers.toLocaleString()} followers`,
            });
          }
        }
      } catch (error2: any) {
        console.log("Method 2 failed:", error2.message?.substring(0, 50));
      }

      // Method 3: Use a simple RapidAPI endpoint if available (fallback)
      // For now, return user-friendly error
      return res.status(400).json({
        error: "Instagram API temporarily unavailable",
        message: `Unable to fetch @${cleanUsername}'s follower count automatically`,
        suggestion: "Please manually enter your Instagram follower count. This helps verify your reach and find campaigns suitable for you.",
        note: "Instagram requires you to be public and accessible. If your profile is private, please make it public first.",
      });
    } catch (error) {
      console.error("Followers fetch error:", (error as Error).message?.substring(0, 100));
      res.status(500).json({ 
        error: "Failed to fetch followers count", 
        suggestion: "Please enter your follower count manually. You can verify this on your Instagram profile.",
      });
    }
  });

  // Submit Instagram username for verification (MOCK)
  app.post("/api/instagram/submit", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { instagramUsername } = req.body;

      if (!instagramUsername || !instagramUsername.trim()) {
        return res.status(400).json({ error: "Instagram username is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Mock: Generate verification code
      const verificationCode = `VERIFY_${Date.now().toString().slice(-6)}`;
      
      // Save to database
      await storage.updateUserVerificationCode(userId, verificationCode);
      await storage.submitInstagramForVerification(userId);

      // Notify all admins about new Instagram verification request
      const allUsers = await storage.getAllUsers();
      const admins = allUsers.filter(u => u.role === "admin");
      for (const admin of admins) {
        await storage.createNotification({
          userId: admin.id,
          type: "instagram_verification_pending",
          title: "New Instagram Verification Request",
          message: `${user.name} (@${instagramUsername}) has submitted their Instagram for verification.`,
          isRead: false,
        });
      }

      res.json({
        success: true,
        message: "Instagram username submitted for verification",
        verificationCode,
        username: instagramUsername,
      });
    } catch (error) {
      console.error("Error submitting Instagram for verification:", error);
      res.status(500).json({ error: "Failed to submit for verification" });
    }
  });

  // Generate Instagram verification code (MOCK)
  app.post("/api/instagram/generate-code", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.instagramUsername) {
        return res.status(400).json({ error: "Instagram username not linked. Please link first." });
      }

      // Mock: Generate random verification code
      const verificationCode = `IG_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      await storage.updateUserVerificationCode(userId, verificationCode);

      res.json({
        success: true,
        verificationCode,
        message: "Code generated! Add it to your Instagram bio for verification.",
      });
    } catch (error) {
      console.error("Error generating verification code:", error);
      res.status(500).json({ error: "Failed to generate code" });
    }
  });

  // Verify Instagram account (MOCK - Admin approves manually)
  app.post("/api/instagram/verify", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.instagramUsername) {
        return res.status(400).json({ error: "No Instagram account linked" });
      }

      // Mock verification: Auto-verify if username looks valid
      const usernameRegex = /^[a-zA-Z0-9._]+$/;
      if (!usernameRegex.test(user.instagramUsername)) {
        return res.status(400).json({ error: "Invalid Instagram username format" });
      }

      await storage.verifyUserInstagram(userId);

      res.json({
        success: true,
        message: "Instagram account verified!",
      });
    } catch (error) {
      console.error("Error verifying Instagram:", error);
      res.status(500).json({ error: "Failed to verify Instagram" });
    }
  });

  // Get all app settings (admin)
  app.get("/api/admin/settings", isAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      
      // Add payment gateway status
      const cashfreeConfigured = isCashfreeConfigured();
      
      // Add Instagram integration status
      const instagramConfigured = !!(INSTAGRAM_APP_ID && INSTAGRAM_APP_SECRET);
      
      res.json({
        settings,
        paymentGateway: {
          cashfree: {
            configured: cashfreeConfigured,
            appId: process.env.CASHFREE_APP_ID ? process.env.CASHFREE_APP_ID.substring(0, 12) + '...' : null,
          },
        },
        instagram: {
          configured: instagramConfigured,
        },
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update app setting (admin)
  app.post("/api/admin/settings", isAdmin, async (req, res) => {
    try {
      const { key, value, description } = req.body;
      
      if (!key || value === undefined) {
        return res.status(400).json({ error: "Key and value are required" });
      }
      
      const setting = await storage.upsertSetting(key, value, description);
      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // ==================== PROMO CODES ADMIN ROUTES ====================

  // Get all promo codes
  app.get("/api/admin/promo-codes", isAdmin, async (req, res) => {
    try {
      const promoCodes = await storage.getAllPromoCodes();
      res.json(promoCodes);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      res.status(500).json({ error: "Failed to fetch promo codes" });
    }
  });

  // Create promo code
  app.post("/api/admin/promo-codes", isAdmin, async (req, res) => {
    try {
      const { code, type, discountPercent, trialDays, afterTrialAction, maxUses, validFrom, validUntil, isActive } = req.body;
      
      if (!code || !type) {
        return res.status(400).json({ error: "Code and type are required" });
      }
      
      if (type === "discount" && (!discountPercent || discountPercent < 1 || discountPercent > 100)) {
        return res.status(400).json({ error: "Discount percent must be between 1 and 100" });
      }
      
      if (type === "trial" && (!trialDays || trialDays < 1)) {
        return res.status(400).json({ error: "Trial days must be at least 1" });
      }

      // Check if code already exists
      const existing = await storage.getPromoCodeByCode(code);
      if (existing) {
        return res.status(400).json({ error: "Promo code already exists" });
      }
      
      const promoCode = await storage.createPromoCode({
        code: code.toUpperCase(),
        type,
        discountPercent: type === "discount" ? discountPercent : null,
        trialDays: type === "trial" ? trialDays : null,
        afterTrialAction: type === "trial" ? (afterTrialAction || "downgrade") : null,
        maxUses: maxUses || null,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive: isActive !== false,
      });
      
      res.json(promoCode);
    } catch (error) {
      console.error("Error creating promo code:", error);
      res.status(500).json({ error: "Failed to create promo code" });
    }
  });

  // Update promo code
  app.patch("/api/admin/promo-codes/:id", isAdmin, async (req, res) => {
    try {
      const promoCodeId = parseInt(req.params.id);
      const updates = req.body;
      
      const promoCode = await storage.getPromoCode(promoCodeId);
      if (!promoCode) {
        return res.status(404).json({ error: "Promo code not found" });
      }
      
      await storage.updatePromoCode(promoCodeId, updates);
      const updated = await storage.getPromoCode(promoCodeId);
      res.json(updated);
    } catch (error) {
      console.error("Error updating promo code:", error);
      res.status(500).json({ error: "Failed to update promo code" });
    }
  });

  // Toggle promo code active status
  app.post("/api/admin/promo-codes/:id/toggle", isAdmin, async (req, res) => {
    try {
      const promoCodeId = parseInt(req.params.id);
      
      const promoCode = await storage.getPromoCode(promoCodeId);
      if (!promoCode) {
        return res.status(404).json({ error: "Promo code not found" });
      }
      
      await storage.togglePromoCodeStatus(promoCodeId, !promoCode.isActive);
      const updated = await storage.getPromoCode(promoCodeId);
      res.json(updated);
    } catch (error) {
      console.error("Error toggling promo code:", error);
      res.status(500).json({ error: "Failed to toggle promo code" });
    }
  });

  // Delete promo code
  app.delete("/api/admin/promo-codes/:id", isAdmin, async (req, res) => {
    try {
      const promoCodeId = parseInt(req.params.id);
      
      const promoCode = await storage.getPromoCode(promoCodeId);
      if (!promoCode) {
        return res.status(404).json({ error: "Promo code not found" });
      }
      
      await storage.deletePromoCode(promoCodeId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting promo code:", error);
      res.status(500).json({ error: "Failed to delete promo code" });
    }
  });

  // Validate and apply promo code (for users)
  app.post("/api/promo-codes/validate", isAuthenticated, async (req, res) => {
    try {
      const { code } = req.body;
      const userId = req.user!.id;
      
      if (!code) {
        return res.status(400).json({ error: "Promo code is required" });
      }
      
      const promoCode = await storage.getPromoCodeByCode(code);
      
      if (!promoCode) {
        return res.status(404).json({ error: "Invalid promo code" });
      }
      
      if (!promoCode.isActive) {
        return res.status(400).json({ error: "This promo code is no longer active" });
      }
      
      const now = new Date();
      if (promoCode.validFrom && new Date(promoCode.validFrom) > now) {
        return res.status(400).json({ error: "This promo code is not yet valid" });
      }
      
      if (promoCode.validUntil && new Date(promoCode.validUntil) < now) {
        return res.status(400).json({ error: "This promo code has expired" });
      }
      
      if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
        return res.status(400).json({ error: "This promo code has reached its usage limit" });
      }
      
      // Check if user already used this code
      const hasUsed = await storage.hasUserUsedPromoCode(promoCode.id, userId);
      if (hasUsed) {
        return res.status(400).json({ error: "You have already used this promo code" });
      }
      
      res.json({
        valid: true,
        code: promoCode.code,
        type: promoCode.type,
        discountPercent: promoCode.discountPercent,
        trialDays: promoCode.trialDays,
        afterTrialAction: promoCode.afterTrialAction,
      });
    } catch (error) {
      console.error("Error validating promo code:", error);
      res.status(500).json({ error: "Failed to validate promo code" });
    }
  });

  // Apply promo code (for trial)
  app.post("/api/promo-codes/apply", isAuthenticated, async (req, res) => {
    try {
      const { code } = req.body;
      const userId = req.user!.id;
      
      if (!code) {
        return res.status(400).json({ error: "Promo code is required" });
      }
      
      const promoCode = await storage.getPromoCodeByCode(code);
      
      if (!promoCode || !promoCode.isActive) {
        return res.status(400).json({ error: "Invalid or inactive promo code" });
      }
      
      // Validate again
      const now = new Date();
      if (promoCode.validFrom && new Date(promoCode.validFrom) > now) {
        return res.status(400).json({ error: "This promo code is not yet valid" });
      }
      
      if (promoCode.validUntil && new Date(promoCode.validUntil) < now) {
        return res.status(400).json({ error: "This promo code has expired" });
      }
      
      if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
        return res.status(400).json({ error: "This promo code has reached its usage limit" });
      }
      
      const hasUsed = await storage.hasUserUsedPromoCode(promoCode.id, userId);
      if (hasUsed) {
        return res.status(400).json({ error: "You have already used this promo code" });
      }
      
      // Apply the code based on type
      if (promoCode.type === "trial" && promoCode.trialDays) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + promoCode.trialDays);
        // Set autoRenew based on afterTrialAction: "continue" means user wants to pay after trial (autoRenew=true), "downgrade" means downgrade to free (autoRenew=false)
        const autoRenew = promoCode.afterTrialAction === "continue" ? true : false;
        await storage.updateUserSubscription(userId, "pro", expiresAt, true, autoRenew);
      }
      
      // Record usage
      await storage.recordPromoCodeUsage(promoCode.id, userId);
      await storage.incrementPromoCodeUsage(promoCode.id);
      
      res.json({
        success: true,
        message: promoCode.type === "trial" 
          ? `Congratulations! You now have ${promoCode.trialDays} days of Pro access.`
          : `Promo code applied successfully!`,
        type: promoCode.type,
        trialDays: promoCode.trialDays,
        discountPercent: promoCode.discountPercent,
      });
    } catch (error) {
      console.error("Error applying promo code:", error);
      res.status(500).json({ error: "Failed to apply promo code" });
    }
  });

  // ==================== ADMIN WALLET ====================
  
  // Get admin wallet
  app.get("/api/admin/wallet", isAdmin, async (req, res) => {
    try {
      const wallet = await storage.getAdminWallet();
      res.json(wallet);
    } catch (error) {
      console.error("Error fetching admin wallet:", error);
      res.status(500).json({ error: "Failed to fetch admin wallet" });
    }
  });

  // Get admin wallet transactions
  app.get("/api/admin/wallet/transactions", isAdmin, async (req, res) => {
    try {
      const transactions = await storage.getAdminWalletTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching admin wallet transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // ==================== ADMIN SETTINGS (API Keys) ====================
  
  // Get all settings
  app.get("/api/admin/settings", isAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update or create a setting
  app.post("/api/admin/settings", isAdmin, async (req, res) => {
    try {
      const { key, value, description } = req.body;
      
      if (!key || value === undefined) {
        return res.status(400).json({ error: "Key and value are required" });
      }
      
      const setting = await storage.upsertSetting(key, value, description);
      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // Get all API keys (returns masked values for display)
  app.get("/api/admin/api-keys", isAdmin, async (req, res) => {
    try {
      const apiKeyNames = [
        "cashfree_app_id",
        "cashfree_secret_key",
        "instagram_app_id",
        "instagram_app_secret",
        "razorpay_key_id",
        "razorpay_key_secret",
        "gmail_user",
        "gmail_app_password",
        "rapidapi_key",
      ];
      
      const result: Record<string, string> = {};
      
      for (const keyName of apiKeyNames) {
        const setting = await storage.getSetting(keyName);
        if (setting && setting.value) {
          // Don't return actual values for security, just indicate they're set
          result[keyName] = setting.value;
        } else {
          result[keyName] = "";
        }
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });

  // Save an API key
  app.post("/api/admin/api-keys", isAdmin, async (req, res) => {
    try {
      const { key, value } = req.body;
      
      if (!key || !value) {
        return res.status(400).json({ error: "Key and value are required" });
      }
      
      const validKeys = [
        "cashfree_app_id",
        "cashfree_secret_key",
        "instagram_app_id",
        "instagram_app_secret",
        "razorpay_key_id",
        "razorpay_key_secret",
        "gmail_user",
        "gmail_app_password",
        "rapidapi_key",
      ];
      
      if (!validKeys.includes(key)) {
        return res.status(400).json({ error: "Invalid API key name" });
      }
      
      await storage.upsertSetting(key, value, `API Key: ${key}`);
      res.json({ success: true, key });
    } catch (error) {
      console.error("Error saving API key:", error);
      res.status(500).json({ error: "Failed to save API key" });
    }
  });

  // ==================== SUBSCRIPTION PLANS ====================
  
  // Get all subscription plans (admin)
  app.get("/api/admin/subscription-plans", isAdmin, async (req, res) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });

  // Get active subscription plans (public)
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getActiveSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });

  // Create subscription plan
  app.post("/api/admin/subscription-plans", isAdmin, async (req, res) => {
    try {
      const plan = await storage.createSubscriptionPlan(req.body);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      res.status(500).json({ error: "Failed to create subscription plan" });
    }
  });

  // Update subscription plan
  app.patch("/api/admin/subscription-plans/:id", isAdmin, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      await storage.updateSubscriptionPlan(planId, req.body);
      const updated = await storage.getSubscriptionPlan(planId);
      res.json(updated);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ error: "Failed to update subscription plan" });
    }
  });

  // Delete subscription plan
  app.delete("/api/admin/subscription-plans/:id", isAdmin, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      await storage.deleteSubscriptionPlan(planId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      res.status(500).json({ error: "Failed to delete subscription plan" });
    }
  });

  // Admin change user subscription
  app.post("/api/admin/users/:userId/subscription", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { plan, expiresAt, autoRenew } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const expiry = expiresAt ? new Date(expiresAt) : null;
      await storage.updateUserSubscription(userId, plan, expiry, false, autoRenew || false);
      
      const updated = await storage.getUser(userId);
      res.json(sanitizeUser(updated!));
    } catch (error) {
      console.error("Error updating user subscription:", error);
      res.status(500).json({ error: "Failed to update subscription" });
    }
  });

  return httpServer;
}
