# Mingree Mobile App Specification

## API Base URL
```
https://cdbf1bba-b349-4251-a56a-3e6cc25306af-00-2xja8oyyl2oop.pike.replit.dev
```

---

## Color Palette (HEX Values)

### Light Theme
```javascript
const LightTheme = {
  // Main Colors
  primary: '#FF3399',           // Vibrant Pink (Instagram-inspired)
  primaryForeground: '#FAFAFA', // White text on primary
  
  // Background Colors
  background: '#FAFAFA',        // Very light grey
  foreground: '#0A0A0B',        // Almost black text
  
  // Card Colors
  card: '#FFFFFF',              // Pure white
  cardForeground: '#0A0A0B',    // Dark text
  
  // Secondary (Light Purple)
  secondary: '#F5F0FF',         // Very light purple
  secondaryForeground: '#5B3D99', // Deep purple text
  
  // Muted (Grey)
  muted: '#F4F4F5',             // Light grey
  mutedForeground: '#71717A',   // Grey text
  
  // Accent (Orange)
  accent: '#FFF5EB',            // Light orange tint
  accentForeground: '#CC6600',  // Deep orange text
  
  // Status Colors
  success: '#22C55E',           // Green
  warning: '#EAB308',           // Yellow
  error: '#DC2626',             // Red
  info: '#3B82F6',              // Blue
  
  // Stars (Promotional)
  star: '#FBBF24',              // Yellow/Gold
  
  // Borders
  border: '#E4E4E7',            // Light border
  input: '#E4E4E7',             // Input border
};
```

### Dark Theme
```javascript
const DarkTheme = {
  // Main Colors
  primary: '#FF3399',           // Same vibrant pink
  primaryForeground: '#FAFAFA', // White text
  
  // Background Colors
  background: '#0A0A0B',        // Almost black
  foreground: '#FAFAFA',        // White text
  
  // Card Colors
  card: '#0A0A0B',              // Dark card
  cardForeground: '#FAFAFA',    // White text
  
  // Secondary
  secondary: '#27272A',         // Dark grey
  secondaryForeground: '#FAFAFA', // White text
  
  // Muted
  muted: '#27272A',             // Dark grey
  mutedForeground: '#A1A1AA',   // Light grey text
  
  // Accent
  accent: '#27272A',            // Dark grey
  accentForeground: '#FAFAFA',  // White text
  
  // Status Colors (same)
  success: '#22C55E',
  warning: '#EAB308',
  error: '#DC2626',
  info: '#3B82F6',
  
  // Stars
  star: '#FBBF24',
  
  // Borders
  border: '#27272A',
  input: '#27272A',
};
```

### Gradient Colors (for headers, buttons)
```javascript
const Gradients = {
  instagramPink: ['#FF3399', '#FF6B6B'],     // Pink to coral
  purplePink: ['#8B5CF6', '#EC4899'],         // Purple to pink
  orangeYellow: ['#F97316', '#FBBF24'],       // Orange to yellow (stars)
  bluePurple: ['#3B82F6', '#8B5CF6'],         // Blue to purple
};
```

---

## Typography
```javascript
const Typography = {
  fontFamily: {
    sans: 'Inter',
    display: 'Outfit',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  borderRadius: 12, // 0.75rem = 12px
};
```

---

## API Endpoints

### Authentication
```
POST /api/auth/signup
Body: { email, password, username, role: "creator" | "sponsor", country }

POST /api/auth/login
Body: { email, password }

POST /api/auth/logout

GET /api/auth/user
Returns: Current logged-in user

POST /api/auth/forgot-password
Body: { email }

POST /api/auth/verify-reset-otp
Body: { email, otp }

POST /api/auth/reset-password
Body: { email, otp, newPassword }
```

### User/Profile
```
GET /api/users/current
Returns: User profile with wallet, subscription, stars

POST /api/users/billing
Body: { billingName, billingPhone, billingAddress, billingCity, billingState, billingPincode, gstNumber }
```

### Campaigns (Creator)
```
GET /api/campaigns
Query: ?country=IN
Returns: List of available campaigns

GET /api/campaigns/:id
Returns: Campaign details

GET /api/users/:userId/reservations
Returns: User's campaign reservations
```

### Reservations (Creator)
```
POST /api/reservations
Body: { campaignId, userId }
Returns: New reservation

DELETE /api/reservations/:id
Cancel a reservation

POST /api/reservations/:id/approve
Approve own content (if allowed)
```

### Submissions (Creator)
```
POST /api/submissions
Body: { reservationId, link, clipUrl? }
Submit content for campaign
```

### Instagram
```
POST /api/instagram/submit
Body: { userId, instagramUsername, followerCount }
Manual Instagram entry

POST /api/instagram/fetch-followers
Body: { accessToken, userId }
Fetch from Instagram API (when enabled)
```

### Wallet (Creator)
```
GET /api/users/:userId/transactions
Returns: Transaction history

POST /api/users/:userId/withdraw
Body: { amount }
Request withdrawal
```

### Bank Accounts
```
GET /api/bank-accounts
POST /api/bank-accounts
Body: { accountType: "upi", upiId, accountHolderName }

DELETE /api/bank-accounts/:id
POST /api/bank-accounts/:id/set-default
```

### Subscription
```
GET /api/users/:userId/subscription
Returns: Current subscription status

GET /api/subscription-plans
Returns: Available plans

POST /api/subscription/create-order
Body: { planId, months, promoCode? }

POST /api/subscription/verify-payment
Body: { orderId, paymentId }
```

### Promo Codes
```
POST /api/promo-codes/validate
Body: { code }
Returns: { valid, type, value, message }

POST /api/promo-codes/apply
Body: { code }
Apply promo code to user
```

### Notifications
```
GET /api/notifications/:userId
Returns: User notifications

POST /api/notifications/:notificationId/read
Mark as read
```

### Sponsor APIs
```
GET /api/sponsors/current
POST /api/sponsors/:sponsorId/campaigns
GET /api/sponsors/:sponsorId/campaigns
GET /api/sponsors/:sponsorId/wallet
POST /api/sponsors/:sponsorId/wallet/create-order
POST /api/sponsors/:sponsorId/wallet/verify-payment
```

---

## Data Models

### User
```typescript
interface User {
  id: number;
  email: string;
  username: string;
  role: "creator" | "sponsor" | "admin";
  country: string;
  walletBalance: string; // Decimal as string
  stars: number;
  isPro: boolean;
  proExpiresAt: string | null;
  instagramUsername: string | null;
  instagramFollowers: number | null;
  isInstagramVerified: boolean;
  profileImage: string | null;
  createdAt: string;
}
```

### Campaign
```typescript
interface Campaign {
  id: number;
  sponsorId: number;
  title: string;
  description: string;
  brand: string;
  brandLogo: string | null;
  tier: string; // "Tier 1" to "Tier 20"
  minFollowers: number;
  maxFollowers: number;
  payAmount: string;
  currency: string; // "INR", "USD", etc.
  targetCountries: string[]; // ["IN", "US", etc.]
  totalSpots: number;
  remainingSpots: number;
  status: "pending_approval" | "active" | "paused" | "completed";
  isPromotional: boolean;
  starReward: number; // 1-10 stars for promotional
  deadline: string;
  createdAt: string;
}
```

### Reservation
```typescript
interface Reservation {
  id: number;
  campaignId: number;
  userId: number;
  status: "reserved" | "submitted" | "approved" | "rejected" | "expired";
  submissionLink: string | null;
  clipUrl: string | null;
  reservedAt: string;
  submittedAt: string | null;
  deadline: string;
}
```

### Transaction
```typescript
interface Transaction {
  id: number;
  userId: number;
  type: "earning" | "withdrawal" | "deposit" | "platform_fee" | "subscription";
  amount: string;
  status: "completed" | "pending" | "failed";
  description: string;
  createdAt: string;
}
```

### SubscriptionPlan
```typescript
interface SubscriptionPlan {
  id: number;
  name: string;
  price: string;
  currency: string;
  durationMonths: number;
  features: string[];
  isActive: boolean;
}
```

---

## Key Features to Implement

### Creator App Screens
1. **Login/Signup** - Email + Password, Country selection
2. **Dashboard** - Stats, recent campaigns, earnings overview
3. **Campaigns** - Browse by tier, filter by country
4. **Campaign Details** - Reserve spots, view requirements
5. **My Campaigns** - Track reservations, submit content
6. **Offers** - View earned promo codes, star count
7. **Earnings/Wallet** - Balance, transactions, withdraw
8. **Subscription** - Pro plans, apply promo codes
9. **Profile** - Instagram linking, billing info
10. **Notifications** - All alerts and updates

### Sponsor App Screens
1. **Login/Signup** - Sponsor registration
2. **Dashboard** - Campaign stats, spending
3. **Create Campaign** - Multi-tier creation
4. **My Campaigns** - Manage, pause, view submissions
5. **Wallet** - Deposit (Cashfree/Stripe), withdraw
6. **Profile** - Company info, billing

---

## Tier System (20 Tiers)

```javascript
const TIERS = [
  { tier: "Tier 1", minFollowers: 1000, maxFollowers: 5000, basePrice: 100 },
  { tier: "Tier 2", minFollowers: 5000, maxFollowers: 10000, basePrice: 150 },
  { tier: "Tier 3", minFollowers: 10000, maxFollowers: 25000, basePrice: 300 },
  { tier: "Tier 4", minFollowers: 25000, maxFollowers: 50000, basePrice: 500 },
  { tier: "Tier 5", minFollowers: 50000, maxFollowers: 100000, basePrice: 1000 },
  { tier: "Tier 6", minFollowers: 100000, maxFollowers: 150000, basePrice: 1500 },
  { tier: "Tier 7", minFollowers: 150000, maxFollowers: 200000, basePrice: 2000 },
  { tier: "Tier 8", minFollowers: 200000, maxFollowers: 300000, basePrice: 3000 },
  { tier: "Tier 9", minFollowers: 300000, maxFollowers: 400000, basePrice: 4000 },
  { tier: "Tier 10", minFollowers: 400000, maxFollowers: 500000, basePrice: 5000 },
  { tier: "Tier 11", minFollowers: 500000, maxFollowers: 600000, basePrice: 6000 },
  { tier: "Tier 12", minFollowers: 600000, maxFollowers: 700000, basePrice: 7000 },
  { tier: "Tier 13", minFollowers: 700000, maxFollowers: 800000, basePrice: 8000 },
  { tier: "Tier 14", minFollowers: 800000, maxFollowers: 900000, basePrice: 9000 },
  { tier: "Tier 15", minFollowers: 900000, maxFollowers: 1000000, basePrice: 10000 },
  { tier: "Tier 16", minFollowers: 1000000, maxFollowers: 2000000, basePrice: 15000 },
  { tier: "Tier 17", minFollowers: 2000000, maxFollowers: 3000000, basePrice: 25000 },
  { tier: "Tier 18", minFollowers: 3000000, maxFollowers: 5000000, basePrice: 40000 },
  { tier: "Tier 19", minFollowers: 5000000, maxFollowers: 10000000, basePrice: 75000 },
  { tier: "Tier 20", minFollowers: 10000000, maxFollowers: 999999999, basePrice: 100000 },
];
```

---

## Star Reward System

- Promotional campaigns give 1-10 stars (no money)
- Every 5 stars = 1 FREE month Pro subscription promo code
- Stars accumulate forever (don't reset)
- Next promo code at: 5, 10, 15, 20, 25... stars

---

## Tax Structure

### Creator Withdrawals
- 18% GST deducted
- Net = Amount - 18%

### Sponsor Deposits
- 18% GST added on top
- Total = Amount + 18%

### Platform Fee
- 10% on campaign payments

---

## 195 Countries Supported

Full list available at `/api/countries` or use standard ISO country codes.

---

## Authentication

All authenticated requests need session cookie. Use:
```javascript
fetch(url, {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})
```

---

## Sample App Prompt for New Agent

```
Create a React Native app for "Mingree" - an influencer marketing platform.

Use this API: https://[your-domain]/api

Colors:
- Primary: #FF3399 (Pink)
- Background Light: #FAFAFA
- Background Dark: #0A0A0B
- Success: #22C55E
- Star/Gold: #FBBF24

Features:
1. Login/Signup with email
2. Dashboard with stats
3. Browse campaigns by tier
4. Reserve and submit to campaigns
5. View earnings and withdraw
6. Track stars and promo codes
7. Subscription management
8. Instagram account linking

Use Expo/React Native with:
- React Navigation
- AsyncStorage for tokens
- Axios for API calls

See MOBILE_APP_SPECIFICATION.md for full API docs.
```
