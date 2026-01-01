import { Cashfree } from 'cashfree-pg';

let cashfreeInstance: any = null;

export function initCashfree() {
  if (cashfreeInstance) return cashfreeInstance;
  
  const clientId = process.env.CASHFREE_APP_ID;
  const clientSecret = process.env.CASHFREE_SECRET_KEY;
  
  if (!clientId || !clientSecret) {
    throw new Error('CASHFREE_APP_ID and CASHFREE_SECRET_KEY are required');
  }
  
  const CashfreeClass = Cashfree as any;
  const environment = process.env.CASHFREE_ENVIRONMENT === 'production' 
    ? CashfreeClass.PRODUCTION 
    : CashfreeClass.SANDBOX;
  
  cashfreeInstance = new CashfreeClass(environment, clientId, clientSecret);
  return cashfreeInstance;
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
  const cashfree = initCashfree();
  
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
  
  const response = await cashfree.PGCreateOrder(request);
  return response.data;
}

export async function fetchCashfreeOrder(orderId: string) {
  const cashfree = initCashfree();
  const response = await cashfree.PGFetchOrder(orderId);
  return response.data;
}

export function verifyCashfreeWebhook(
  signature: string,
  rawBody: string,
  timestamp: string
): boolean {
  try {
    const cashfree = initCashfree();
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
