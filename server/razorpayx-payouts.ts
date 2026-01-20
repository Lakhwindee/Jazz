import Razorpay from "razorpay";

let razorpayInstance: Razorpay | null = null;

function getRazorpayInstance(): Razorpay | null {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  
  return razorpayInstance;
}

export function isRazorpayXConfigured(): boolean {
  return !!(
    process.env.RAZORPAY_KEY_ID && 
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAYX_ACCOUNT_NUMBER
  );
}

interface PayoutResult {
  success: boolean;
  payoutId?: string;
  utr?: string;
  status?: string;
  error?: string;
}

export async function initiateRazorpayXPayout(
  upiId: string,
  amount: number,
  userName: string,
  userEmail: string,
  userPhone: string | null,
  referenceId: string
): Promise<PayoutResult> {
  const razorpay = getRazorpayInstance();
  
  if (!razorpay) {
    return {
      success: false,
      error: "RazorpayX not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
    };
  }

  const accountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER;
  if (!accountNumber) {
    return {
      success: false,
      error: "RazorpayX account number not configured. Please add RAZORPAYX_ACCOUNT_NUMBER."
    };
  }

  try {
    console.log("[RAZORPAYX] Creating contact for:", userName);
    
    const contact = await (razorpay as any).contacts.create({
      name: userName,
      email: userEmail,
      contact: userPhone || undefined,
      type: "customer"
    });

    console.log("[RAZORPAYX] Contact created:", contact.id);

    console.log("[RAZORPAYX] Creating fund account for UPI:", upiId);
    
    const fundAccount = await (razorpay as any).fundAccounts.create({
      contact_id: contact.id,
      account_type: "vpa",
      vpa: {
        address: upiId
      }
    });

    console.log("[RAZORPAYX] Fund account created:", fundAccount.id);

    const amountInPaise = Math.round(amount * 100);
    const idempotencyKey = `payout_${referenceId}_${Date.now()}`;

    console.log("[RAZORPAYX] Creating payout for amount:", amount, "INR (", amountInPaise, "paise)");

    const payout = await (razorpay as any).payouts.create({
      account_number: accountNumber,
      fund_account_id: fundAccount.id,
      amount: amountInPaise,
      currency: "INR",
      mode: "UPI",
      purpose: "payout",
      queue_if_low_balance: false,
      reference_id: referenceId,
      narration: `Mingree Creator Payout - ${referenceId}`
    }, {
      headers: {
        'X-Payout-Idempotency': idempotencyKey
      }
    });

    console.log("[RAZORPAYX] Payout response:", JSON.stringify(payout, null, 2));

    if (payout.status === 'processed') {
      return {
        success: true,
        payoutId: payout.id,
        utr: payout.utr || payout.id,
        status: payout.status
      };
    } else if (payout.status === 'processing' || payout.status === 'pending' || payout.status === 'queued') {
      return {
        success: true,
        payoutId: payout.id,
        utr: payout.id,
        status: payout.status
      };
    } else {
      return {
        success: false,
        payoutId: payout.id,
        status: payout.status,
        error: `Payout status: ${payout.status}`
      };
    }

  } catch (error: any) {
    console.error("[RAZORPAYX] Error:", error);
    
    const errorMessage = error?.error?.description || 
                         error?.message || 
                         "Unknown error during payout";
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

export async function checkPayoutStatus(payoutId: string): Promise<PayoutResult> {
  const razorpay = getRazorpayInstance();
  
  if (!razorpay) {
    return {
      success: false,
      error: "RazorpayX not configured"
    };
  }

  try {
    const payout = await (razorpay as any).payouts.fetch(payoutId);
    
    return {
      success: payout.status === 'processed',
      payoutId: payout.id,
      utr: payout.utr || payout.id,
      status: payout.status
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to fetch payout status"
    };
  }
}
