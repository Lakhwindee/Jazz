import Razorpay from "razorpay";
import crypto from "crypto";

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

export function isRazorpayPaymentConfigured(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function getRazorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID || "";
}

export async function createRazorpayOrder(
  amount: number,
  currency: string = "INR",
  receipt: string,
  notes: Record<string, string> = {}
): Promise<any> {
  const razorpay = getRazorpayInstance();
  
  if (!razorpay) {
    throw new Error("Razorpay not configured");
  }
  
  const amountInPaise = Math.round(amount * 100);
  
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency,
    receipt,
    notes,
  });
  
  console.log("[RAZORPAY] Order created:", order.id, "Amount:", amount);
  return order;
}

export function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  
  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  
  return expectedSignature === signature;
}

export async function fetchRazorpayPayment(paymentId: string): Promise<any> {
  const razorpay = getRazorpayInstance();
  if (!razorpay) throw new Error("Razorpay not configured");
  
  return await razorpay.payments.fetch(paymentId);
}

export async function fetchRazorpayOrder(orderId: string): Promise<any> {
  const razorpay = getRazorpayInstance();
  if (!razorpay) throw new Error("Razorpay not configured");
  
  return await razorpay.orders.fetch(orderId);
}
