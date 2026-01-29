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
  
  // Add payment link URL for mobile apps (redirect-based flow)
  const paymentSessionId = response.data.payment_session_id;
  const environment = process.env.CASHFREE_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
  const paymentLinkBase = environment === 'production' 
    ? 'https://payments.cashfree.com/forms' 
    : 'https://sandbox.cashfree.com/pg/orders/sessions';
  
  // Direct payment URL for mobile
  response.data.payment_link = `${paymentLinkBase}/${paymentSessionId}`;
  
  return response.data;
}

export async function fetchCashfreeOrder(orderId: string) {
  const baseUrl = getBaseUrl();
  
  const response = await axios.get(`${baseUrl}/orders/${orderId}`, {
    headers: getHeaders(),
  });
  
  return response.data;
}

// Create a Payment Link (returns direct URL for mobile apps)
export async function createCashfreePaymentLink(
  linkId: string,
  amount: number,
  purpose: string,
  customerDetails: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
  },
  returnUrl: string
) {
  const baseUrl = getBaseUrl();
  
  // Set expiry to 24 hours from now
  const expiryTime = new Date();
  expiryTime.setHours(expiryTime.getHours() + 24);
  
  const request = {
    link_id: linkId,
    link_amount: amount,
    link_currency: "INR",
    link_purpose: purpose,
    customer_details: {
      customer_name: customerDetails.customerName,
      customer_phone: customerDetails.customerPhone,
      customer_email: customerDetails.customerEmail,
    },
    link_meta: {
      return_url: returnUrl,
      payment_methods: "upi,cc,dc,nb",
    },
    link_expiry_time: expiryTime.toISOString(),
  };
  
  console.log('Creating Cashfree payment link:', { baseUrl, linkId, amount });
  
  const response = await axios.post(`${baseUrl}/links`, request, {
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
