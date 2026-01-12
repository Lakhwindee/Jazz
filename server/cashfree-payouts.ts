import axios from 'axios';

function getPayoutBaseUrl() {
  return process.env.CASHFREE_ENVIRONMENT === 'production'
    ? 'https://api.cashfree.com/payout/v1'
    : 'https://sandbox.cashfree.com/payout/v1';
}

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getAuthToken(): Promise<string> {
  const clientId = process.env.CASHFREE_PAYOUT_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_PAYOUT_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Cashfree Payouts not configured. Enable Payouts in Cashfree dashboard and add CASHFREE_PAYOUT_CLIENT_ID and CASHFREE_PAYOUT_CLIENT_SECRET');
  }
  
  if (cachedToken !== null && Date.now() < tokenExpiresAt) {
    return cachedToken as string;
  }
  
  const baseUrl = getPayoutBaseUrl();
  
  try {
    const response = await axios.post(`${baseUrl}/authorize`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': clientId,
        'X-Client-Secret': clientSecret,
      },
    });
    
    const data = response.data;
    console.log('Cashfree auth response:', { status: data.status, subCode: data.subCode });
    
    if (data.status === 'SUCCESS' && data.data?.token) {
      const token: string = data.data.token;
      cachedToken = token;
      tokenExpiresAt = Date.now() + (data.data.expiry * 1000) - 60000;
      return token;
    }
    
    throw new Error(data.message || 'Failed to get auth token');
  } catch (error: any) {
    console.error('Cashfree auth error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Authentication failed');
  }
}

export function isPayoutsConfigured(): boolean {
  return !!(process.env.CASHFREE_PAYOUT_CLIENT_ID && 
    process.env.CASHFREE_PAYOUT_CLIENT_SECRET && 
    !process.env.CASHFREE_PAYOUT_CLIENT_ID.includes('placeholder'));
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
  beneficiaryEmail: string = 'payout@mingree.com',
  beneficiaryPhone: string = '9999999999'
): Promise<PayoutResult> {
  const baseUrl = getPayoutBaseUrl();
  
  try {
    const token = await getAuthToken();
    
    const beneId = `BENE_${transferId}`;
    
    try {
      await axios.post(`${baseUrl}/addBeneficiary`, {
        beneId: beneId,
        name: beneficiaryName,
        email: beneficiaryEmail,
        phone: beneficiaryPhone,
        vpa: upiId,
        transferMode: 'upi',
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('Beneficiary added:', beneId);
    } catch (beneError: any) {
      const beneData = beneError.response?.data;
      if (beneData?.subCode !== '409') {
        console.log('Beneficiary may already exist or error:', beneData?.message);
      }
    }
    
    console.log('Initiating Cashfree payout:', { transferId, amount, upiId, beneficiaryName });
    
    const response = await axios.post(`${baseUrl}/requestTransfer`, {
      beneId: beneId,
      amount: amount.toString(),
      transferId: transferId,
      transferMode: 'upi',
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = response.data;
    console.log('Cashfree payout response:', data);
    
    if (data.status === 'ERROR') {
      return {
        success: false,
        transferId,
        status: 'FAILED',
        error: data.message || 'Payout failed',
      };
    }
    
    return {
      success: true,
      transferId: data.data?.transferId || transferId,
      cfTransferId: data.data?.referenceId,
      utr: data.data?.utr || data.data?.referenceId,
      status: data.status,
      statusDescription: data.message,
    };
  } catch (error: any) {
    console.error('Cashfree payout error:', error.response?.data || error.message);
    
    const errorData = error.response?.data;
    const errorMessage = errorData?.message || 
                         errorData?.error || 
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
    const token = await getAuthToken();
    
    const response = await axios.get(`${baseUrl}/getTransferStatus?transferId=${transferId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = response.data;
    
    return {
      success: data.data?.status === 'SUCCESS',
      transferId: data.data?.transferId,
      cfTransferId: data.data?.referenceId,
      utr: data.data?.utr,
      status: data.data?.status,
      statusDescription: data.message,
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
