import { Cashfree } from 'cashfree-pg';

function getCashfreeClient() {
  const clientId = process.env.CASHFREE_APP_ID;
  const clientSecret = process.env.CASHFREE_SECRET_KEY;
  
  if (!clientId || !clientSecret) {
    throw new Error('CASHFREE_APP_ID and CASHFREE_SECRET_KEY are required');
  }
  
  const CashfreeClass = Cashfree as any;
  const environment = process.env.CASHFREE_ENVIRONMENT === 'production' 
    ? CashfreeClass.PRODUCTION 
    : CashfreeClass.SANDBOX;
  
  return new CashfreeClass(environment, clientId, clientSecret);
}

export async function createCashfreeOrder(
  orderId: string,
  amount: number,
  customerDetails: {
    customerId: string;
    customerPhone: string;
    customerName?: string;
    customerEmail?: string;
  },
  returnUrl: string
) {
  const cashfree = getCashfreeClient();
  
  const request = {
    order_amount: amount,
    order_currency: "INR",
    order_id: orderId,
    customer_details: {
      customer_id: customerDetails.customerId,
      customer_phone: customerDetails.customerPhone,
      customer_name: customerDetails.customerName,
      customer_email: customerDetails.customerEmail,
    },
    order_meta: {
      return_url: returnUrl,
    },
  };
  
  const response = await cashfree.PGCreateOrder("2023-08-01", request);
  return response.data;
}

export async function fetchCashfreeOrder(orderId: string) {
  const cashfree = getCashfreeClient();
  const response = await cashfree.PGFetchOrder("2023-08-01", orderId);
  return response.data;
}

export function verifyCashfreeWebhook(
  signature: string,
  rawBody: string,
  timestamp: string
): boolean {
  try {
    const cashfree = getCashfreeClient();
    cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);
    return true;
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return false;
  }
}

export function getCashfreeAppId(): string {
  const appId = process.env.CASHFREE_APP_ID;
  if (!appId) {
    throw new Error('CASHFREE_APP_ID is required');
  }
  return appId;
}

export function isCashfreeConfigured(): boolean {
  return !!(process.env.CASHFREE_APP_ID && 
    process.env.CASHFREE_SECRET_KEY && 
    !process.env.CASHFREE_APP_ID.includes('placeholder'));
}
