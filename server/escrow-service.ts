import { storage } from "./storage";
import { log } from "./index";

async function sendRefundEmail(email: string, sponsorName: string, amount: number, campaignTitle: string, spotsUnfilled: number): Promise<void> {
  log(`Email notification placeholder - SendGrid/Resend integration needed`, "escrow");
  log(`Would send to: ${email}, Amount: ₹${amount}, Campaign: ${campaignTitle}`, "escrow");
}

export async function processEscrowRefunds(): Promise<void> {
  try {
    log("Running escrow refund check...", "escrow");
    
    const expiredCampaigns = await storage.getExpiredCampaignsForRefund();
    
    for (const campaign of expiredCampaigns) {
      if (!campaign.sponsorId) {
        continue;
      }
      
      const totalBudget = parseFloat(campaign.totalBudget || "0");
      const releasedAmount = parseFloat(campaign.releasedAmount || "0");
      const refundedAmount = parseFloat(campaign.refundedAmount || "0");
      
      const pendingAmount = totalBudget - releasedAmount - refundedAmount;
      
      if (pendingAmount <= 0) {
        await storage.updateCampaignEscrow(
          campaign.id,
          campaign.releasedAmount || "0.00",
          campaign.refundedAmount || "0.00",
          "completed"
        );
        continue;
      }
      
      log(`Processing refund for campaign ${campaign.id}: ₹${pendingAmount}`, "escrow");
      
      const sponsor = await storage.getUser(campaign.sponsorId);
      if (!sponsor) {
        log(`Sponsor not found for campaign ${campaign.id}`, "escrow");
        continue;
      }
      
      const spotsUnfilled = campaign.spotsRemaining;
      
      // Debit from admin wallet (refund to sponsor)
      await storage.updateAdminWalletBalance(pendingAmount, 'subtract');
      
      // Update admin wallet stats (refund)
      await storage.updateAdminWalletStats(0, 0, pendingAmount);
      
      // Create admin wallet refund transaction
      await storage.createAdminWalletTransaction({
        type: "debit",
        category: "sponsor_refund",
        amount: pendingAmount.toFixed(2),
        description: `Refund to ${sponsor.companyName || sponsor.name} for unfilled spots in "${campaign.title}"`,
        relatedUserId: campaign.sponsorId,
        campaignId: campaign.id,
      });
      
      // Credit sponsor wallet
      const newBalance = parseFloat(sponsor.balance) + pendingAmount;
      await storage.updateUserBalance(campaign.sponsorId, newBalance.toFixed(2));
      
      await storage.createTransaction({
        userId: campaign.sponsorId,
        type: "credit",
        category: "escrow_refund",
        amount: pendingAmount.toFixed(2),
        tax: "0.00",
        net: pendingAmount.toFixed(2),
        description: `Refund for unfilled spots (${spotsUnfilled}) in "${campaign.title}"`,
        status: "completed",
        campaignId: campaign.id,
      });
      
      const newRefundedAmount = refundedAmount + pendingAmount;
      await storage.updateCampaignEscrow(
        campaign.id,
        campaign.releasedAmount || "0.00",
        newRefundedAmount.toFixed(2),
        "completed"
      );
      
      await storage.createNotification({
        userId: campaign.sponsorId,
        type: "escrow_refund",
        title: "Campaign Refund Processed",
        message: `₹${pendingAmount.toFixed(0)} has been refunded to your wallet for ${spotsUnfilled} unfilled spot(s) in "${campaign.title}".`,
        isRead: false,
        campaignId: campaign.id,
      });
      
      await sendRefundEmail(
        sponsor.email,
        sponsor.name || sponsor.companyName || "Sponsor",
        pendingAmount,
        campaign.title,
        spotsUnfilled
      );
      
      log(`Refund processed for campaign ${campaign.id}: ₹${pendingAmount} returned to sponsor ${campaign.sponsorId}`, "escrow");
    }
    
    if (expiredCampaigns.length > 0) {
      log(`Processed ${expiredCampaigns.length} expired campaigns for refunds`, "escrow");
    }
  } catch (error) {
    log(`Error processing escrow refunds: ${error}`, "escrow");
  }
}

export function startEscrowRefundScheduler(): void {
  const REFUND_CHECK_INTERVAL = 60 * 60 * 1000;
  
  setInterval(async () => {
    await processEscrowRefunds();
  }, REFUND_CHECK_INTERVAL);
  
  setTimeout(async () => {
    await processEscrowRefunds();
  }, 10000);
  
  log("Escrow refund scheduler started (runs every hour)", "escrow");
}
