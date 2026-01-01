import jsSHA from 'jssha';
import { storage } from './storage';

interface PayUConfig {
  merchantKey: string;
  merchantSalt: string;
  isProduction: boolean;
}

let payuConfig: PayUConfig | null = null;

async function getPayUConfig(): Promise<PayUConfig | null> {
  try {
    const keySetting = await storage.getSetting('payu_merchant_key');
    const saltSetting = await storage.getSetting('payu_merchant_salt');
    const modeSetting = await storage.getSetting('payu_mode');
    
    if (!keySetting?.value || !saltSetting?.value) {
      return null;
    }
    
    payuConfig = {
      merchantKey: keySetting.value,
      merchantSalt: saltSetting.value,
      isProduction: modeSetting?.value === 'production'
    };
    
    return payuConfig;
  } catch (error) {
    console.error('Error getting PayU config:', error);
    return null;
  }
}

export async function isPayUConfigured(): Promise<boolean> {
  const config = await getPayUConfig();
  return config !== null;
}

export function getPayUBaseUrl(isProduction: boolean): string {
  return isProduction 
    ? 'https://secure.payu.in/_payment'
    : 'https://test.payu.in/_payment';
}

export function generatePayUHash(
  key: string,
  txnid: string,
  amount: string,
  productinfo: string,
  firstname: string,
  email: string,
  salt: string
): string {
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
  
  const sha = new jsSHA('SHA-512', 'TEXT');
  sha.update(hashString);
  return sha.getHash('HEX');
}

export function verifyPayUHash(
  salt: string,
  status: string,
  email: string,
  firstname: string,
  productinfo: string,
  amount: string,
  txnid: string,
  key: string,
  receivedHash: string
): boolean {
  const reverseHashString = `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  
  const sha = new jsSHA('SHA-512', 'TEXT');
  sha.update(reverseHashString);
  const calculatedHash = sha.getHash('HEX');
  
  return calculatedHash === receivedHash;
}

export interface PayUPaymentData {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
  payuBaseUrl: string;
}

export async function createPayUPayment(
  sponsorId: number,
  totalAmount: number,
  baseAmount: number,
  gstAmount: number,
  firstname: string,
  email: string,
  phone: string,
  successUrl: string,
  failureUrl: string
): Promise<PayUPaymentData | null> {
  const config = await getPayUConfig();
  if (!config) {
    throw new Error('PayU not configured');
  }
  
  const txnid = `PAYU_${sponsorId}_${Date.now()}`;
  const amount = totalAmount.toFixed(2);
  const productinfo = `Wallet Deposit - Base: ${baseAmount}, GST: ${gstAmount}`;
  
  const hash = generatePayUHash(
    config.merchantKey,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    config.merchantSalt
  );
  
  await storage.createTransaction({
    type: 'credit',
    category: 'deposit',
    amount: baseAmount.toFixed(2),
    tax: gstAmount.toFixed(2),
    net: baseAmount.toFixed(2),
    status: 'pending',
    description: `Wallet deposit via PayU (Txn: ${txnid})`,
    userId: sponsorId,
    paymentId: txnid
  });
  
  return {
    key: config.merchantKey,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    phone,
    surl: successUrl,
    furl: failureUrl,
    hash,
    payuBaseUrl: getPayUBaseUrl(config.isProduction)
  };
}

export async function handlePayUCallback(
  txnid: string,
  status: string,
  mihpayid: string,
  hash: string,
  email: string,
  firstname: string,
  productinfo: string,
  amount: string
): Promise<{ success: boolean; message: string; sponsorId?: number }> {
  const config = await getPayUConfig();
  if (!config) {
    return { success: false, message: 'PayU not configured' };
  }
  
  const isValidHash = verifyPayUHash(
    config.merchantSalt,
    status,
    email,
    firstname,
    productinfo,
    amount,
    txnid,
    config.merchantKey,
    hash
  );
  
  if (!isValidHash) {
    console.error('PayU hash verification failed');
    return { success: false, message: 'Hash verification failed' };
  }
  
  const sponsorIdMatch = txnid.match(/PAYU_(\d+)_/);
  if (!sponsorIdMatch) {
    return { success: false, message: 'Invalid transaction ID format' };
  }
  
  const sponsorId = parseInt(sponsorIdMatch[1], 10);
  const user = await storage.getUser(sponsorId);
  
  if (!user) {
    return { success: false, message: 'User not found' };
  }
  
  if (status.toLowerCase() === 'success') {
    const baseAmount = parseFloat(productinfo.match(/Base: ([\d.]+)/)?.[1] || '0');
    const gstAmount = parseFloat(productinfo.match(/GST: ([\d.]+)/)?.[1] || '0');
    const totalAmount = parseFloat(amount);
    
    const newBalance = (parseFloat(user.balance || '0') + baseAmount).toFixed(2);
    await storage.updateUserBalance(sponsorId, newBalance);
    
    await storage.createTransaction({
      type: 'credit',
      category: 'deposit',
      amount: baseAmount.toFixed(2),
      tax: gstAmount.toFixed(2),
      net: baseAmount.toFixed(2),
      status: 'completed',
      description: `Wallet deposit via PayU (PayU ID: ${mihpayid})`,
      userId: sponsorId,
      paymentId: mihpayid
    });
    
    await storage.updateAdminWalletBalance(totalAmount, 'add');
    
    await storage.createAdminWalletTransaction({
      type: 'deposit',
      category: 'sponsor_deposit',
      amount: totalAmount.toFixed(2),
      description: `Sponsor deposit via PayU - Base: ${baseAmount}, GST: ${gstAmount}`,
      relatedUserId: sponsorId
    });
    
    return { success: true, message: 'Payment successful', sponsorId };
  } else {
    return { success: false, message: 'Payment failed', sponsorId };
  }
}
