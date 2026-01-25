# Mingree Mobile App - COMPLETE BUILD PROMPT

## COPY EVERYTHING BELOW AND PASTE TO NEW AGENT

---

Build a complete React Native mobile app for "Mingree" - an international influencer marketing platform. The app must be an EXACT replica of the website with ALL features.

## API BASE URL (PRODUCTION)
```
https://mingree.com
```

---

## COMPLETE COLOR THEME

### Light Mode
```javascript
const colors = {
  primary: '#FF3399',           // Vibrant Pink
  primaryForeground: '#FAFAFA',
  background: '#FAFAFA',
  foreground: '#0A0A0B',
  card: '#FFFFFF',
  cardForeground: '#0A0A0B',
  secondary: '#F5F0FF',
  secondaryForeground: '#5B3D99',
  muted: '#F4F4F5',
  mutedForeground: '#71717A',
  accent: '#FFF5EB',
  accentForeground: '#CC6600',
  border: '#E4E4E7',
  success: '#22C55E',
  warning: '#EAB308',
  error: '#DC2626',
  star: '#FBBF24',
  pro: '#8B5CF6',
};
```

### Dark Mode
```javascript
const darkColors = {
  primary: '#FF3399',
  primaryForeground: '#FAFAFA',
  background: '#0A0A0B',
  foreground: '#FAFAFA',
  card: '#18181B',
  cardForeground: '#FAFAFA',
  secondary: '#27272A',
  secondaryForeground: '#FAFAFA',
  muted: '#27272A',
  mutedForeground: '#A1A1AA',
  border: '#27272A',
  success: '#22C55E',
  warning: '#EAB308',
  error: '#DC2626',
  star: '#FBBF24',
  pro: '#8B5CF6',
};
```

### Gradients
```javascript
const gradients = {
  primary: ['#FF3399', '#FF6B6B'],
  star: ['#F97316', '#FBBF24'],
  pro: ['#8B5CF6', '#EC4899'],
  success: ['#22C55E', '#10B981'],
};
```

---

## COMPLETE FEATURE LIST

### USER ROLES
1. **Creator** - Instagram influencers who complete campaigns
2. **Sponsor** - Brands who create campaigns
3. **Admin** - Platform administrators

---

## CREATOR APP SCREENS (18 SCREENS)

### 1. SPLASH SCREEN
- Mingree logo
- Pink gradient background
- Auto-navigate to login/dashboard

### 2. LOGIN SCREEN
- Email input
- Password input (with show/hide toggle)
- "Forgot Password?" link
- Login button (pink)
- "Don't have account? Sign Up" link
- "Login as Sponsor" link at bottom

### 3. SIGNUP SCREEN
- Email input
- Password input
- Confirm Password input
- Username input
- Country dropdown (195 countries - use country-list)
- Role toggle: Creator / Sponsor
- Terms checkbox
- Sign Up button
- "Already have account? Login" link

### 4. FORGOT PASSWORD (3 STEPS)
**Step 1:** Enter email → Send OTP
**Step 2:** Enter 6-digit OTP → Verify
**Step 3:** Enter new password + confirm → Reset
- Show countdown timer for OTP expiry (10 min)
- Resend OTP button

### 5. CREATOR DASHBOARD
- Welcome message: "Hey, {username}!"
- Pro badge if subscribed (purple gradient)
- Stats cards in grid:
  - Total Earnings (green) - ₹X,XXX
  - Wallet Balance (blue) - ₹X,XXX
  - Stars Earned (gold) - X ⭐
  - Active Campaigns (pink) - X
- Quick action buttons:
  - Browse Campaigns
  - View Earnings
  - My Campaigns
- Recent activity list

### 6. CAMPAIGNS LIST
- Search bar at top
- Filter buttons: All Tiers, Tier 1, Tier 2... Tier 20
- Country filter dropdown
- Campaign cards:
  - Brand logo (left)
  - Title, Brand name
  - Tier badge (e.g., "Tier 5")
  - Payment OR Stars:
    - Regular: "₹1,000" (green)
    - Promotional: "⭐ 5 Stars" (gold)
  - Spots remaining: "3/10 spots left"
  - Deadline: "Ends in 5 days"
- Pull to refresh
- Infinite scroll pagination

### 7. CAMPAIGN DETAILS SCREEN
- Hero image/Brand logo (large)
- Title, Brand name
- Badges row:
  - Tier badge
  - "Promotional" badge (if promotional, gold color)
  - "Pro Required" badge (if pro only)
- Payment/Stars display
- Description (full text)
- Requirements list (bullet points)
- Target countries list
- Deadline with countdown
- Spots remaining progress bar
- **Reserve Spot** button (pink, full width)
- Show error if:
  - Not enough followers for tier
  - Already reserved
  - No spots left
  - Pro required but not pro

### 8. MY CAMPAIGNS
- Tabs: Active | Completed | Expired
- Each reservation card:
  - Campaign info (logo, title, brand)
  - Status badge:
    - Reserved (yellow) - "Submit within 48 hours"
    - Submitted (blue) - "Under review"
    - Approved (green) - "Payment credited!"
    - Rejected (red) - "Submission rejected"
    - Expired (gray) - "Deadline passed"
  - 48-hour countdown timer (for Reserved status)
  - Payment/Stars earned
  - **Submit Content** button (if reserved)
  - **View Submission** button (if submitted)

### 9. SUBMIT CONTENT MODAL/SCREEN
- Campaign info at top
- Link input (required):
  - Label: "Instagram Post/Reel URL"
  - Placeholder: "https://instagram.com/p/..."
  - Validate Instagram URL format
- Clip URL input (optional):
  - Label: "Backup Video URL"
  - Placeholder: "https://drive.google.com/..."
- Submit button
- Cancel button

### 10. OFFERS PAGE (PROMO CODES)
- Header: "My Offers"
- Stars summary card:
  - Total stars: "X ⭐"
  - Progress bar to next code (every 5 stars)
  - Text: "X more stars for next promo code!"
- Info card: "Complete promotional campaigns → Earn stars → Every 5 stars = 1 month FREE Pro!"
- Promo codes list:
  - Each code card:
    - "FREE Pro Month" badge
    - Code: "XXXXXX" (large, monospace)
    - Copy button
    - Date earned
- How to use section:
  1. Go to Subscription
  2. Click "Have a promo code?"
  3. Paste code
  4. Enjoy free Pro!

### 11. EARNINGS/WALLET
- Balance card (large):
  - "Available Balance"
  - "₹X,XXX" (large number)
  - Withdraw button
- Pending withdrawals section (if any)
- Transaction history:
  - Filter: All, Earnings, Withdrawals
  - Each transaction:
    - Icon (arrow up for earning, arrow down for withdrawal)
    - Description
    - Amount (green for +, red for -)
    - Date
    - Status badge

### 12. WITHDRAW SCREEN
- Current balance display
- Amount input (number keyboard)
- Quick amount buttons: ₹500, ₹1000, ₹2000, ₹5000
- UPI ID selection:
  - List of saved UPI IDs
  - Add new UPI button
- GST notice: "18% GST will be deducted"
- Breakdown:
  - Withdrawal amount: ₹1,000
  - GST (18%): -₹180
  - You'll receive: ₹820
- Minimum withdrawal: ₹500
- **Withdraw** button

### 13. ADD UPI ID SCREEN
- UPI ID input: "username@upi"
- Account holder name input
- Save button
- Cancel button

### 14. SUBSCRIPTION PAGE
- Current plan card:
  - "Free Plan" or "Pro Plan"
  - If Pro: Expiry date, Cancel button
  - Pro badge with purple gradient
- Pro benefits list:
  - Access to premium campaigns
  - Priority support
  - Higher visibility
  - Exclusive offers
- Plan cards:
  - 1 Month - ₹299
  - 3 Months - ₹799
  - 6 Months - ₹1499
  - 12 Months - ₹2499
- "Have a promo code?" expandable section:
  - Input field
  - Apply button
  - Show discount/trial after applying
- Subscribe button

### 15. PROFILE PAGE
- Profile picture (editable)
- Username display
- Email display
- **Instagram Section:**
  - If not linked:
    - "Link Instagram" button
    - Opens Instagram linking modal
  - If linked:
    - Instagram username
    - Follower count
    - Verified badge
    - "Refresh Followers" button
    - "Disconnect" button
- **Billing Details** (expandable):
  - Full name
  - Phone
  - Address
  - City
  - State
  - Pincode
  - GST Number (optional)
  - Save button
- Country display
- Dark mode toggle
- Logout button

### 16. LINK INSTAGRAM MODAL
- Instagram username input
- Follower count input (number)
- Info: "We'll verify your account"
- Submit button
- Cancel button

### 17. NOTIFICATIONS
- IMPORTANT: Bell icon appears ONLY in Dashboard header (not in bottom navigation)
- Shows unread count badge when notifications exist
- Notification list:
  - Group by date: Today, Yesterday, This Week, Older
  - Each notification:
    - Icon based on type
    - Title
    - Message
    - Time
    - Unread indicator (dot)
  - Mark as read on tap
- Types:
  - Campaign approved (green checkmark)
  - Payment received (green dollar)
  - Campaign rejected (red x)
  - New campaign available (pink megaphone)
  - Promo code earned (gold star)
  - Subscription expiring (yellow warning)

### 18. HELP & SUPPORT
- FAQ section (expandable)
- Contact email
- Report issue form

---

## SPONSOR APP SCREENS (12 SCREENS)

### 1. SPONSOR DASHBOARD
- Welcome message
- Stats cards:
  - Active Campaigns
  - Total Spent
  - Wallet Balance
  - Pending Approvals
- Recent campaigns list
- Quick actions:
  - Create Campaign
  - View Wallet
  - My Campaigns

### 2. CREATE CAMPAIGN (MULTI-STEP)
**Step 1: Basic Info**
- Campaign title input
- Brand name input
- Brand logo upload
- Description textarea

**Step 2: Target Countries**
- Multi-select country list
- Search countries
- Select all / Clear all

**Step 3: Select Tiers**
- Checkboxes for Tier 1-20
- Show follower range for each tier
- Select multiple tiers

**Step 4: Payment & Spots**
- For each selected tier:
  - Payment per creator input (₹)
  - Number of spots input
- Auto-calculate totals

**Step 5: Deadline**
- Date picker
- Minimum 3 days from now

**Step 6: Review & Create**
- Summary of all details
- Cost breakdown:
  - Creator payments: ₹X
  - Platform fee (10%): ₹X
  - Total: ₹X
- Create Campaign button
- Shows error if insufficient wallet balance

### 3. MY CAMPAIGNS (SPONSOR)
- Tabs: Active | Pending Approval | Paused | Completed
- Campaign cards grouped by title (folder view)
- Each group shows:
  - Brand logo, Title
  - Tiers included
  - Total spots, Filled spots
  - Total budget
  - Status badge
- Expand to see individual tier cards
- Tap card for details

### 4. CAMPAIGN DETAILS (SPONSOR VIEW)
- All campaign info
- Progress: X/Y spots filled
- Status toggle: Active/Paused
- View Submissions button
- Edit button (if no submissions yet)
- Delete button (with confirmation)

### 5. VIEW SUBMISSIONS
- List of creator submissions
- Each submission:
  - Creator username
  - Instagram handle + followers
  - Submission link (tappable)
  - Submitted date
  - Status badge
  - Approve / Reject buttons
- Filter by status

### 6. SPONSOR WALLET
- Balance card:
  - "Wallet Balance"
  - "₹X,XXX"
  - Deposit button
  - Withdraw button
- Transaction history:
  - Deposits (green)
  - Campaign payments (red)
  - Refunds (blue)
  - Withdrawals (orange)

### 7. DEPOSIT SCREEN
- Amount input
- Quick buttons: ₹5000, ₹10000, ₹25000, ₹50000
- GST notice: "18% GST will be added"
- Breakdown:
  - Base amount: ₹10,000
  - GST (18%): +₹1,800
  - Total payable: ₹11,800
  - Wallet credit: ₹10,000
- Billing details form (if not saved)
- Payment method: Cashfree (for India) / Stripe (international)
- Pay button

### 8. SPONSOR WITHDRAW
- Available balance
- Amount input
- UPI ID selection
- GST deduction notice
- Withdraw button
- Pending withdrawals list

### 9. SPONSOR PROFILE
- Company info
- Contact details
- Billing details
- Country
- Logout

### 10. SPONSOR SETTINGS
- Account settings
- Notification preferences
- Delete account

---

## API ENDPOINTS - COMPLETE LIST

### Authentication
```
POST /api/auth/signup
Body: { email, password, username, role: "creator"|"sponsor", country }

POST /api/auth/login
Body: { email, password }

POST /api/auth/logout

GET /api/auth/user

POST /api/auth/forgot-password
Body: { email }

POST /api/auth/verify-reset-otp
Body: { email, otp }

POST /api/auth/reset-password
Body: { email, otp, newPassword }
```

### User Profile
```
GET /api/users/current
Returns: { id, email, username, role, country, walletBalance, stars, isPro, proExpiresAt, instagramUsername, instagramFollowers, isInstagramVerified, ... }

POST /api/users/billing
Body: { billingName, billingPhone, billingAddress, billingCity, billingState, billingPincode, gstNumber }
```

### Campaigns
```
GET /api/campaigns
Query: ?country=IN&tier=5
Returns: Array of campaigns

GET /api/campaigns/:id
Returns: Single campaign with details
```

### Reservations
```
GET /api/users/:userId/reservations
Returns: Array of user's campaign reservations with campaign details

POST /api/reservations
Body: { campaignId, userId }
Returns: New reservation

DELETE /api/reservations/:id
```

### Submissions
```
POST /api/submissions
Body: { reservationId, link, clipUrl }
```

### Wallet & Transactions
```
GET /api/users/:userId/transactions
Returns: Array of transactions

POST /api/users/:userId/withdraw
Body: { amount }
```

### Bank/UPI Accounts
```
GET /api/bank-accounts
Returns: Array of saved UPI IDs

POST /api/bank-accounts
Body: { accountType: "upi", upiId, accountHolderName }

DELETE /api/bank-accounts/:id

POST /api/bank-accounts/:id/set-default
```

### Subscription
```
GET /api/users/:userId/subscription
Returns: { isPro, expiresAt, plan }

GET /api/subscription-plans
Returns: Array of available plans

POST /api/subscription/create-order
Body: { planId, months, promoCode }

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
```

### Instagram
```
POST /api/instagram/submit
Body: { userId, instagramUsername, followerCount }
```

### Notifications
```
GET /api/notifications/:userId
Returns: Array of notifications

POST /api/notifications/:notificationId/read
```

### Sponsor APIs
```
GET /api/sponsors/current
Returns: Sponsor profile

GET /api/sponsors/:sponsorId/campaigns
Returns: Sponsor's campaigns

POST /api/sponsors/:sponsorId/campaigns
Body: { title, brand, brandLogo, description, targetCountries, tiers: [{tier, payAmount, spots}], deadline }

GET /api/campaigns/:campaignId/reservations
Returns: Submissions for campaign

GET /api/sponsors/:sponsorId/wallet
Returns: { balance, transactions }

POST /api/sponsors/:sponsorId/wallet/create-order
Body: { amount, billingDetails }

POST /api/sponsors/:sponsorId/wallet/verify-payment
Body: { orderId, paymentId }
```

---

## 20-TIER SYSTEM

```javascript
const TIERS = [
  { tier: 1, label: "Tier 1", min: 1000, max: 5000, basePrice: 100 },
  { tier: 2, label: "Tier 2", min: 5000, max: 10000, basePrice: 150 },
  { tier: 3, label: "Tier 3", min: 10000, max: 25000, basePrice: 300 },
  { tier: 4, label: "Tier 4", min: 25000, max: 50000, basePrice: 500 },
  { tier: 5, label: "Tier 5", min: 50000, max: 100000, basePrice: 1000 },
  { tier: 6, label: "Tier 6", min: 100000, max: 150000, basePrice: 1500 },
  { tier: 7, label: "Tier 7", min: 150000, max: 200000, basePrice: 2000 },
  { tier: 8, label: "Tier 8", min: 200000, max: 300000, basePrice: 3000 },
  { tier: 9, label: "Tier 9", min: 300000, max: 400000, basePrice: 4000 },
  { tier: 10, label: "Tier 10", min: 400000, max: 500000, basePrice: 5000 },
  { tier: 11, label: "Tier 11", min: 500000, max: 600000, basePrice: 6000 },
  { tier: 12, label: "Tier 12", min: 600000, max: 700000, basePrice: 7000 },
  { tier: 13, label: "Tier 13", min: 700000, max: 800000, basePrice: 8000 },
  { tier: 14, label: "Tier 14", min: 800000, max: 900000, basePrice: 9000 },
  { tier: 15, label: "Tier 15", min: 900000, max: 1000000, basePrice: 10000 },
  { tier: 16, label: "Tier 16", min: 1000000, max: 2000000, basePrice: 15000 },
  { tier: 17, label: "Tier 17", min: 2000000, max: 3000000, basePrice: 25000 },
  { tier: 18, label: "Tier 18", min: 3000000, max: 5000000, basePrice: 40000 },
  { tier: 19, label: "Tier 19", min: 5000000, max: 10000000, basePrice: 75000 },
  { tier: 20, label: "Tier 20", min: 10000000, max: 999999999, basePrice: 100000 },
];
```

---

## STAR REWARD SYSTEM

- Promotional campaigns give 1-10 stars (NO money)
- Stars accumulate forever (never reset)
- Every 5 stars = 1 FREE Pro month promo code
- Milestones: 5, 10, 15, 20, 25, 30... stars
- Show gold color (#FBBF24) for stars
- Show ⭐ emoji with stars

---

## TAX STRUCTURE

### Creator Withdrawals
```
Withdrawal: ₹1,000
GST (18%): -₹180
Net receive: ₹820
Minimum: ₹500
```

### Sponsor Deposits
```
Base amount: ₹10,000
GST (18%): +₹1,800
Total pay: ₹11,800
Wallet credit: ₹10,000
```

### Campaign Fees
```
Creator payment: ₹1,000
Platform fee (10%): ₹100
Total deducted: ₹1,100
```

---

## 195 COUNTRIES LIST

Use npm package: `country-list` or similar
All countries with ISO codes (IN, US, GB, etc.)

---

## UI/UX REQUIREMENTS

1. **Navigation:**
   - Bottom tabs: Dashboard, Campaigns, My Campaigns, Wallet, Profile
   - Stack navigation for details screens
   - Tab bar hidden on detail screens

2. **Design:**
   - Pink gradient headers (#FF3399 → #FF6B6B)
   - Card-based layouts with shadows
   - Rounded corners (12px)
   - Inter font for text
   - Loading skeletons
   - Pull to refresh
   - Empty states with illustrations

3. **Interactions:**
   - Button press feedback
   - Smooth transitions
   - Toast notifications for success/error
   - Confirmation modals for destructive actions
   - Form validation with error messages

4. **Dark Mode:**
   - Toggle in Profile
   - Save preference
   - All screens support dark mode

5. **Offline:**
   - Show offline banner
   - Cache critical data
   - Retry failed requests

---

## IMPORTANT IMPLEMENTATION NOTES

1. **API Calls:**
```javascript
const api = async (endpoint, options = {}) => {
  const response = await fetch(`https://mingree.com${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });
  return response.json();
};
```

2. **Session Handling:**
   - Use cookies for session (credentials: 'include')
   - Handle 401 → redirect to login
   - Store user data in context/state

3. **Currency Formatting:**
```javascript
const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};
```

4. **Countdown Timer:**
```javascript
const getTimeRemaining = (deadline) => {
  const total = Date.parse(deadline) - Date.now();
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  return { total, hours, minutes };
};
```

5. **Star Display:**
```javascript
// Promotional campaign
<Text style={{color: '#FBBF24'}}>⭐ {starReward} Stars</Text>

// Regular campaign
<Text style={{color: '#22C55E'}}>₹{payAmount}</Text>
```

---

## BUILD ORDER

1. Auth screens (Login, Signup, Forgot Password)
2. Creator Dashboard
3. Campaigns list + Details
4. My Campaigns + Submission
5. Wallet + Withdraw
6. Profile + Instagram linking
7. Subscription + Promo codes
8. Offers page
9. Notifications
10. Sponsor screens
11. Dark mode
12. Polish + Testing

---

## START BUILDING NOW

Create the exact replica of mingree.com as a mobile app. Test all features with the production API.

---

## END OF PROMPT
