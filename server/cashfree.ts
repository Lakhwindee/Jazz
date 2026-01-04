import axios from 'axios';

function getBaseUrl() {
  return process.env.CASHFREE_ENVIRONMENT === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
}

function getHeaders() {
  const clientId = process.env.CASHFREE_APP_ID;
  const clientSecret = process.env.CASHFREE_SECRET_KEY;
  
  if (!clientId || !clientSecret) {
    throw new Error('CASHFREE_APP_ID and CASHFREE_SECRET_KEY are required');
  }
  
  return {
    'Content-Type': 'application/json',
    'x-client-id': clientId,
    'x-client-secret': clientSecret,
    'x-api-version': '2023-08-01',
  };
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
  const baseUrl = getBaseUrl();
  
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
  
  console.log('Creating Cashfree order:', { baseUrl, orderId, amount });
  
  const response = await axios.post(`${baseUrl}/orders`, request, {
    headers: getHeaders(),
  });
  
  return response.data;
}

export async function fetchCashfreeOrder(orderId: string) {
  const baseUrl = getBaseUrl();
  
  const response = await axios.get(`${baseUrl}/orders/${orderId}`, {
    headers: getHeaders(),
  });
  
  return response.data;
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
