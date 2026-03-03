import axios from "axios";
import crypto from "crypto";

const INSTAMOJO_API_KEY = process.env.INSTAMOJO_API_KEY;
const INSTAMOJO_AUTH_TOKEN = process.env.INSTAMOJO_AUTH_TOKEN;
const INSTAMOJO_SALT = process.env.INSTAMOJO_SALT;

const BASE_URL = "https://www.instamojo.com/api/1.1";

export function isInstamojoConfigured(): boolean {
  return !!(INSTAMOJO_API_KEY && INSTAMOJO_AUTH_TOKEN);
}

export async function createInstamojoPaymentRequest(params: {
  amount: number;
  purpose: string;
  buyerName: string;
  email: string;
  phone?: string;
  redirectUrl: string;
  webhookUrl?: string;
}): Promise<{ paymentRequestId: string; paymentUrl: string }> {
  if (!isInstamojoConfigured()) {
    throw new Error("Instamojo is not configured");
  }

  const payload: any = {
    amount: params.amount.toFixed(2),
    purpose: params.purpose,
    buyer_name: params.buyerName,
    email: params.email,
    redirect_url: params.redirectUrl,
    send_email: false,
    send_sms: false,
    allow_repeated_payments: false,
  };

  if (params.phone) {
    payload.phone = params.phone;
  }
  if (params.webhookUrl) {
    payload.webhook = params.webhookUrl;
  }

  const response = await axios.post(`${BASE_URL}/payment-requests/`, payload, {
    headers: {
      "X-Api-Key": INSTAMOJO_API_KEY!,
      "X-Auth-Token": INSTAMOJO_AUTH_TOKEN!,
    },
  });

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to create payment request");
  }

  return {
    paymentRequestId: response.data.payment_request.id,
    paymentUrl: response.data.payment_request.longurl,
  };
}

export async function getInstamojoPaymentStatus(paymentRequestId: string): Promise<{
  status: string;
  paymentId: string | null;
  amount: number;
  purpose: string;
  paid: boolean;
}> {
  if (!isInstamojoConfigured()) {
    throw new Error("Instamojo is not configured");
  }

  const response = await axios.get(`${BASE_URL}/payment-requests/${paymentRequestId}/`, {
    headers: {
      "X-Api-Key": INSTAMOJO_API_KEY!,
      "X-Auth-Token": INSTAMOJO_AUTH_TOKEN!,
    },
  });

  const pr = response.data.payment_request;
  const payment = pr.payments && pr.payments.length > 0 ? pr.payments[0] : null;

  return {
    status: pr.status,
    paymentId: payment?.payment_id || null,
    amount: parseFloat(pr.amount),
    purpose: pr.purpose,
    paid: payment?.status === "Credit",
  };
}
