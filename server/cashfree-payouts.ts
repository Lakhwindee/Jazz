import axios from 'axios';

function getPayoutBaseUrl() {
  return process.env.CASHFREE_ENVIRONMENT === 'production'
    ? 'https://api.cashfree.com/payout/v1'
    : 'https://sandbox.cashfree.com/payout/v1';
}

function getPayoutHeaders() {
  const clientId = process.env.CASHFREE_APP_ID;
  const clientSecret = process.env.CASHFREE_SECRET_KEY;
  
  if (!clientId || !clientSecret) {
    throw new Error('CASHFREE_APP_ID and CASHFREE_SECRET_KEY are required for payouts');
  }
  
  return {
    'Content-Type': 'application/json',
    'x-client-id': clientId,
    'x-client-secret': clientSecret,
    'x-api-version': '2024-01-01',
  };
}

export function isPayoutsConfigured(): boolean {
  return !!(process.env.CASHFREE_APP_ID && 
    process.env.CASHFREE_SECRET_KEY && 
    !process.env.CASHFREE_APP_ID.includes('placeholder'));
}

export interface PayoutResult {
  success: boolean;
  transferId: string;
  cfTransferId?: string;
  utr?: string;
  status: string;
  statusDescription?: string;
  error?: string;
}

export async function initiateUpiPayout(
  transferId: string,
  amount: number,
  upiId: string,
  beneficiaryName: string,
  purpose: string = 'withdrawal'
): Promise<PayoutResult> {
  const baseUrl = getPayoutBaseUrl();
  
  const request = {
    transfer_id: transferId,
    transfer_amount: amount,
    transfer_mode: "upi",
    beneficiary_details: {
      beneficiary_instrument_details: {
        vpa: upiId,
      },
      beneficiary_name: beneficiaryName,
    },
    transfer_remarks: purpose,
  };
  
  console.log('Initiating Cashfree payout:', { transferId, amount, upiId, beneficiaryName });
  
  try {
    const response = await axios.post(`${baseUrl}/transfers`, request, {
      headers: getPayoutHeaders(),
    });
    
    const data = response.data;
    console.log('Cashfree payout response:', data);
    
    return {
      success: true,
      transferId: data.transfer_id,
      cfTransferId: data.cf_transfer_id,
      utr: data.utr || data.cf_transfer_id,
      status: data.status,
      statusDescription: data.status_description,
    };
  } catch (error: any) {
    console.error('Cashfree payout error:', error.response?.data || error.message);
    
    const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         'Payout failed';
    
    return {
      success: false,
      transferId,
      status: 'FAILED',
      error: errorMessage,
    };
  }
}

export async function getPayoutStatus(transferId: string): Promise<PayoutResult> {
  const baseUrl = getPayoutBaseUrl();
  
  try {
    const response = await axios.get(`${baseUrl}/transfers?transfer_id=${transferId}`, {
      headers: getPayoutHeaders(),
    });
    
    const data = response.data;
    
    return {
      success: data.status === 'SUCCESS',
      transferId: data.transfer_id,
      cfTransferId: data.cf_transfer_id,
      utr: data.utr,
      status: data.status,
      statusDescription: data.status_description,
    };
  } catch (error: any) {
    console.error('Error fetching payout status:', error.response?.data || error.message);
    
    return {
      success: false,
      transferId,
      status: 'UNKNOWN',
      error: error.message,
    };
  }
}
