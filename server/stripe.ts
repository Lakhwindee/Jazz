import Stripe from 'stripe';
import { storage } from './storage';

let stripeInstance: Stripe | null = null;

async function getStripeInstance(): Promise<Stripe | null> {
  try {
    const setting = await storage.getSetting('stripe_secret_key');
    if (!setting?.value) {
      return null;
    }
    
    if (!stripeInstance) {
      stripeInstance = new Stripe(setting.value, {
        apiVersion: '2025-11-17.clover',
      });
    }
    return stripeInstance;
  } catch (error) {
    console.error('Error initializing Stripe:', error);
    return null;
  }
}

export async function isStripeConfigured(): Promise<boolean> {
  const stripe = await getStripeInstance();
  return stripe !== null;
}

export async function getStripePublishableKey(): Promise<string | null> {
  try {
    const setting = await storage.getSetting('stripe_publishable_key');
    return setting?.value || null;
  } catch (error) {
    return null;
  }
}

// Currency mapping based on country
export function getCurrencyForCountry(countryCode: string): { currency: string; symbol: string } {
  const currencyMap: Record<string, { currency: string; symbol: string }> = {
    'US': { currency: 'usd', symbol: '$' },
    'GB': { currency: 'gbp', symbol: '£' },
    'EU': { currency: 'eur', symbol: '€' },
    'DE': { currency: 'eur', symbol: '€' },
    'FR': { currency: 'eur', symbol: '€' },
    'IT': { currency: 'eur', symbol: '€' },
    'ES': { currency: 'eur', symbol: '€' },
    'NL': { currency: 'eur', symbol: '€' },
    'BE': { currency: 'eur', symbol: '€' },
    'AT': { currency: 'eur', symbol: '€' },
    'PT': { currency: 'eur', symbol: '€' },
    'IE': { currency: 'eur', symbol: '€' },
    'FI': { currency: 'eur', symbol: '€' },
    'GR': { currency: 'eur', symbol: '€' },
    'CA': { currency: 'cad', symbol: 'C$' },
    'AU': { currency: 'aud', symbol: 'A$' },
    'JP': { currency: 'jpy', symbol: '¥' },
    'SG': { currency: 'sgd', symbol: 'S$' },
    'AE': { currency: 'aed', symbol: 'د.إ' },
    'SA': { currency: 'sar', symbol: 'ر.س' },
    'MY': { currency: 'myr', symbol: 'RM' },
    'TH': { currency: 'thb', symbol: '฿' },
    'PH': { currency: 'php', symbol: '₱' },
    'ID': { currency: 'idr', symbol: 'Rp' },
    'VN': { currency: 'vnd', symbol: '₫' },
    'KR': { currency: 'krw', symbol: '₩' },
    'NZ': { currency: 'nzd', symbol: 'NZ$' },
    'ZA': { currency: 'zar', symbol: 'R' },
    'MX': { currency: 'mxn', symbol: 'MX$' },
    'BR': { currency: 'brl', symbol: 'R$' },
    'CH': { currency: 'chf', symbol: 'CHF' },
    'SE': { currency: 'sek', symbol: 'kr' },
    'NO': { currency: 'nok', symbol: 'kr' },
    'DK': { currency: 'dkk', symbol: 'kr' },
    'PL': { currency: 'pln', symbol: 'zł' },
    'CZ': { currency: 'czk', symbol: 'Kč' },
    'HU': { currency: 'huf', symbol: 'Ft' },
    'RO': { currency: 'ron', symbol: 'lei' },
    'HK': { currency: 'hkd', symbol: 'HK$' },
    'TW': { currency: 'twd', symbol: 'NT$' },
  };
  
  return currencyMap[countryCode] || { currency: 'usd', symbol: '$' };
}

// Convert amount to smallest currency unit (cents, pence, etc.)
export function getAmountInSmallestUnit(amount: number, currency: string): number {
  // Zero-decimal currencies (no cents)
  const zeroDecimalCurrencies = ['jpy', 'krw', 'vnd', 'idr', 'huf', 'twd'];
  
  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return Math.round(amount);
  }
  
  // Standard currencies (multiply by 100 for cents)
  return Math.round(amount * 100);
}

// Create a Stripe Checkout Session for wallet deposit
export async function createStripeCheckoutSession(
  sponsorId: number,
  totalAmount: number,      // Total amount user pays (includes processing fee)
  baseAmount: number,       // Amount to credit to wallet
  processingFee: number,    // Processing fee amount
  currency: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string } | null> {
  const stripe = await getStripeInstance();
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  const amountInSmallestUnit = getAmountInSmallestUnit(totalAmount, currency);
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: 'Wallet Deposit',
            description: `Add ${currency.toUpperCase()} ${baseAmount} to your Mingree wallet (includes ${currency.toUpperCase()} ${processingFee} processing fee)`,
          },
          unit_amount: amountInSmallestUnit,
        },
        quantity: 1,
      },
    ],
    metadata: {
      sponsorId: sponsorId.toString(),
      totalAmount: totalAmount.toString(),
      baseAmount: baseAmount.toString(),      // This is what gets credited to wallet
      processingFee: processingFee.toString(),
      currency: currency.toLowerCase(),
      type: 'wallet_deposit',
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  
  return {
    sessionId: session.id,
    url: session.url || '',
  };
}

// Verify and retrieve Stripe Checkout Session
export async function verifyStripeSession(sessionId: string): Promise<{
  success: boolean;
  sponsorId?: number;
  baseAmount?: number;       // Amount to credit to wallet
  totalAmount?: number;      // Total paid by user
  processingFee?: number;    // Processing fee
  currency?: string;
  paymentIntentId?: string;
} | null> {
  const stripe = await getStripeInstance();
  if (!stripe) {
    return null;
  }
  
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      return {
        success: true,
        sponsorId: parseInt(session.metadata?.sponsorId || '0'),
        baseAmount: parseFloat(session.metadata?.baseAmount || session.metadata?.amount || '0'),
        totalAmount: parseFloat(session.metadata?.totalAmount || '0'),
        processingFee: parseFloat(session.metadata?.processingFee || '0'),
        currency: session.metadata?.currency || 'usd',
        paymentIntentId: session.payment_intent as string,
      };
    }
    
    return { success: false };
  } catch (error) {
    console.error('Error verifying Stripe session:', error);
    return null;
  }
}
