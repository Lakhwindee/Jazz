export interface Tier {
  id: number;
  name: string;
  minFollowers: number;
  maxFollowers: number;
  basePayment: number; // in INR
}

// 20 tiers starting from 500 followers, 20 INR per tier
export const TIERS: Tier[] = [
  { id: 1, name: "Tier 1", minFollowers: 500, maxFollowers: 1000, basePayment: 20 },
  { id: 2, name: "Tier 2", minFollowers: 1000, maxFollowers: 2000, basePayment: 40 },
  { id: 3, name: "Tier 3", minFollowers: 2000, maxFollowers: 5000, basePayment: 60 },
  { id: 4, name: "Tier 4", minFollowers: 5000, maxFollowers: 10000, basePayment: 80 },
  { id: 5, name: "Tier 5", minFollowers: 10000, maxFollowers: 20000, basePayment: 100 },
  { id: 6, name: "Tier 6", minFollowers: 20000, maxFollowers: 35000, basePayment: 120 },
  { id: 7, name: "Tier 7", minFollowers: 35000, maxFollowers: 50000, basePayment: 140 },
  { id: 8, name: "Tier 8", minFollowers: 50000, maxFollowers: 75000, basePayment: 160 },
  { id: 9, name: "Tier 9", minFollowers: 75000, maxFollowers: 100000, basePayment: 180 },
  { id: 10, name: "Tier 10", minFollowers: 100000, maxFollowers: 150000, basePayment: 200 },
  { id: 11, name: "Tier 11", minFollowers: 150000, maxFollowers: 200000, basePayment: 220 },
  { id: 12, name: "Tier 12", minFollowers: 200000, maxFollowers: 300000, basePayment: 240 },
  { id: 13, name: "Tier 13", minFollowers: 300000, maxFollowers: 500000, basePayment: 260 },
  { id: 14, name: "Tier 14", minFollowers: 500000, maxFollowers: 750000, basePayment: 280 },
  { id: 15, name: "Tier 15", minFollowers: 750000, maxFollowers: 1000000, basePayment: 300 },
  { id: 16, name: "Tier 16", minFollowers: 1000000, maxFollowers: 2000000, basePayment: 320 },
  { id: 17, name: "Tier 17", minFollowers: 2000000, maxFollowers: 3000000, basePayment: 340 },
  { id: 18, name: "Tier 18", minFollowers: 3000000, maxFollowers: 5000000, basePayment: 360 },
  { id: 19, name: "Tier 19", minFollowers: 5000000, maxFollowers: 10000000, basePayment: 380 },
  { id: 20, name: "Tier 20", minFollowers: 10000000, maxFollowers: 100000000, basePayment: 400 },
];

export const MIN_FOLLOWERS = 500;

export function getTierByFollowers(followers: number): Tier | null {
  if (followers < MIN_FOLLOWERS) return null;
  return TIERS.find(t => followers >= t.minFollowers && followers < t.maxFollowers) || TIERS[TIERS.length - 1];
}

export function getTierById(id: number): Tier | undefined {
  return TIERS.find(t => t.id === id);
}

export function formatFollowers(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
  return count.toString();
}

export const PROMOTION_STYLE_MULTIPLIERS: Record<string, number> = {
  face_ad: 1.0,       // Face on Camera - full base price
  share_only: 0.90,   // Direct Share - 10% less
  lyricals: 0.60,     // Lyricals/Page - 60% of base price
};

export function getPaymentByStyle(basePayment: number, promotionStyle: string): number {
  const multiplier = PROMOTION_STYLE_MULTIPLIERS[promotionStyle] || 1.0;
  return Math.round(basePayment * multiplier);
}

// Tax and Fee Constants
export const TAX_RATES = {
  PLATFORM_FEE_PERCENT: 10,      // 10% platform fee for sponsors on campaigns
  GST_PERCENT: 18,               // 18% GST on wallet deposits (India)
  INTERNATIONAL_FEE_PERCENT: 5,  // 5% processing fee for international deposits
};

// Calculate sponsor campaign payment (platform fee only, no GST here)
export interface SponsorPaymentBreakdown {
  creatorPayment: number;        // Total payment to creators
  platformFee: number;           // 10% platform fee
  totalPayable: number;          // Total amount from wallet
}

export function calculateSponsorPayment(creatorPayment: number): SponsorPaymentBreakdown {
  const platformFee = Math.round(creatorPayment * TAX_RATES.PLATFORM_FEE_PERCENT / 100);
  const totalPayable = creatorPayment + platformFee;
  
  return {
    creatorPayment,
    platformFee,
    totalPayable,
  };
}

// Calculate sponsor deposit with GST
export interface DepositBreakdown {
  baseAmount: number;            // Amount that goes to wallet
  gstAmount: number;             // GST amount
  totalPayable: number;          // Total amount sponsor pays
}

export function calculateDepositWithGST(baseAmount: number): DepositBreakdown {
  const gstAmount = Math.round(baseAmount * TAX_RATES.GST_PERCENT / 100);
  const totalPayable = baseAmount + gstAmount;
  
  return {
    baseAmount,
    gstAmount,
    totalPayable,
  };
}

// Calculate international deposit with processing fee
export interface InternationalDepositBreakdown {
  baseAmount: number;            // Amount that goes to wallet
  processingFee: number;         // 5% processing fee
  totalPayable: number;          // Total amount user pays
}

export function calculateInternationalDeposit(baseAmount: number): InternationalDepositBreakdown {
  const processingFee = Math.round(baseAmount * TAX_RATES.INTERNATIONAL_FEE_PERCENT) / 100;
  const totalPayable = baseAmount + processingFee;
  
  return {
    baseAmount,
    processingFee: Math.round(processingFee * 100) / 100, // Round to 2 decimal places
    totalPayable: Math.round(totalPayable * 100) / 100,
  };
}
