import axios from "axios";

const BULKPE_API_URL = "https://api.bulkpe.in";

export function isBulkpeConfigured(): boolean {
  return !!(process.env.BULKPE_API_KEY);
}

interface PayoutResult {
  success: boolean;
  transactionId?: string;
  referenceId?: string;
  status?: string;
  error?: string;
}

export async function initiateBulkpePayout(
  upiId: string,
  amount: number,
  beneficiaryName: string,
  referenceId: string,
  note?: string
): Promise<PayoutResult> {
  const apiKey = process.env.BULKPE_API_KEY;
  
  if (!apiKey) {
    return {
      success: false,
      error: "Bulkpe API key not configured. Please add BULKPE_API_KEY."
    };
  }

  try {
    console.log("[BULKPE] Initiating payout to:", upiId, "Amount:", amount);
    
    const response = await axios.post(
      `${BULKPE_API_URL}/client/initiatepayout`,
      {
        amount: amount,
        payment_mode: "UPI",
        upi: upiId,
        beneficiaryName: beneficiaryName,
        reference_id: referenceId,
        transaction_note: note || `Mingree Payout - ${referenceId}`
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    console.log("[BULKPE] Response:", JSON.stringify(response.data, null, 2));

    if (response.data.status === true || response.data.statusCode === 200) {
      const data = response.data.data || response.data;
      return {
        success: true,
        transactionId: data.transaction_id || data.transcation_id,
        referenceId: data.reference_id || referenceId,
        status: data.status || "PENDING"
      };
    } else {
      return {
        success: false,
        error: response.data.message || "Payout failed"
      };
    }

  } catch (error: any) {
    console.error("[BULKPE] Error:", error.response?.data || error.message);
    
    const errorMessage = error.response?.data?.message || 
                         error.message || 
                         "Unknown error during payout";
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

export async function checkBulkpePayoutStatus(transactionId: string): Promise<PayoutResult> {
  const apiKey = process.env.BULKPE_API_KEY;
  
  if (!apiKey) {
    return {
      success: false,
      error: "Bulkpe API key not configured"
    };
  }

  try {
    const response = await axios.get(
      `${BULKPE_API_URL}/client/transaction/${transactionId}`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    const data = response.data.data || response.data;
    
    return {
      success: data.status === "SUCCESS",
      transactionId: data.transaction_id,
      status: data.status
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to check payout status"
    };
  }
}
