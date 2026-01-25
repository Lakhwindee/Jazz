# Mingree Mobile App - Complete Build Prompt

Copy everything below this line and paste it to the new Replit Agent:

---

## PROMPT START - COPY FROM HERE

Build a complete React Native mobile app for "Mingree" - an international influencer marketing platform that connects Instagram creators with brand campaigns.

### API Configuration
```
BASE_URL: https://cdbf1bba-b349-4251-a56a-3e6cc25306af-00-2xja8oyyl2oop.pike.replit.dev
```

All API calls should use this base URL with credentials included for session cookies.

---

## COLOR THEME

### Light Mode Colors
```javascript
const colors = {
  primary: '#FF3399',           // Vibrant Pink (main brand color)
  primaryForeground: '#FAFAFA', // White text on pink
  background: '#FAFAFA',        // Light grey background
  foreground: '#0A0A0B',        // Almost black text
  card: '#FFFFFF',              // White cards
  cardForeground: '#0A0A0B',    // Dark text on cards
  secondary: '#F5F0FF',         // Light purple tint
  secondaryForeground: '#5B3D99', // Purple text
  muted: '#F4F4F5',             // Grey backgrounds
  mutedForeground: '#71717A',   // Grey text
  accent: '#FFF5EB',            // Light orange
  accentForeground: '#CC6600',  // Orange text
  border: '#E4E4E7',            // Light borders
  success: '#22C55E',           // Green
  warning: '#EAB308',           // Yellow
  error: '#DC2626',             // Red
  star: '#FBBF24',              // Gold/Yellow for stars
};
```

### Dark Mode Colors
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
};
```

### Gradients
```javascript
const gradients = {
  primaryGradient: ['#FF3399', '#FF6B6B'],     // Pink header/buttons
  starGradient: ['#F97316', '#FBBF24'],        // Orange-yellow for stars
  proGradient: ['#8B5CF6', '#EC4899'],         // Purple-pink for Pro badge
};
```

---

## APP SCREENS TO BUILD

### 1. Auth Screens
- **Splash Screen** - App logo with pink gradient background
- **Login Screen** - Email + Password fields, "Forgot Password" link, "Sign Up" link
- **Signup Screen** - Email, Password, Username, Country dropdown (195 countries), Role selection (Creator/Sponsor)
- **Forgot Password** - 3 steps: Enter email → Verify OTP → Set new password

### 2. Creator Screens (role: "creator")

#### Dashboard
- Welcome message with username
- Stats cards: Total Earnings, Pending Campaigns, Stars Earned, Wallet Balance
- Quick actions: Browse Campaigns, View Earnings
- Recent activity

#### Campaigns
- List of available campaigns (cards with brand logo, title, tier, payment/stars)
- Filter by tier dropdown
- Each campaign card shows:
  - Brand logo & name
  - Campaign title
  - Tier badge (e.g., "Tier 5")
  - Payment amount (green, "₹1,000") OR Stars (gold, "⭐ 5 Stars") for promotional
  - Remaining spots
  - Deadline countdown

#### Campaign Details Modal/Screen
- Full description
- Requirements list
- Reserve button (if eligible based on follower count)
- Show "Promotional Campaign" badge with star reward if applicable

#### My Campaigns
- Tabs: Active | Completed | Expired
- Each reservation card shows:
  - Campaign info
  - Status badge (Reserved/Submitted/Approved/Rejected/Expired)
  - 48-hour countdown timer for reserved ones
  - Submit button (opens submission form)
  - Payment/Stars earned

#### Submit Content Form
- Link input (required) - Instagram post/reel URL
- Clip URL input (optional) - backup video link
- Submit button

#### Offers Page
- Total stars count with progress to next promo code
- "Every 5 stars = 1 month FREE Pro subscription"
- List of earned promo codes with copy button
- Instructions on how to use promo codes

#### Earnings/Wallet
- Current balance (large)
- Transaction history list
- Withdraw button
- Add UPI ID section

#### Withdraw Screen
- Amount input
- UPI ID selection
- 18% GST notice
- Net amount preview
- Confirm withdraw button

#### Subscription
- Current plan status (Free/Pro)
- Pro benefits list
- Plan cards with pricing
- "Have a promo code?" expandable section
- Payment button (Cashfree for India, Stripe for international)

#### Profile
- Profile picture
- Username, Email
- Instagram section:
  - Link Instagram button (if not linked)
  - Username + Follower count display (if linked)
  - Refresh followers button
- Billing details form
- Logout button

#### Notifications
- Bell icon in header with unread count badge
- List of notifications (grouped by date)
- Mark as read on tap
- Different icons for different notification types

### 3. Sponsor Screens (role: "sponsor")

#### Sponsor Dashboard
- Stats: Active Campaigns, Total Spent, Wallet Balance
- Recent campaigns list
- Quick create campaign button

#### Create Campaign
- Step 1: Basic info (Title, Brand, Description, Logo upload)
- Step 2: Select target countries (multi-select)
- Step 3: Select tiers (checkboxes for Tier 1-20)
- Step 4: Set payment per spot for each tier
- Step 5: Set spots per tier
- Step 6: Review & Create
- Show total cost breakdown with 10% platform fee

#### My Campaigns (Sponsor)
- List of created campaigns grouped by title
- Status badges (Pending Approval, Active, Paused, Completed)
- Tap to see submissions
- Pause/Resume toggle

#### Campaign Submissions View
- List of creator submissions
- Each shows: Creator username, Instagram handle, Submission link
- Approve/Reject buttons
- Filter by status

#### Sponsor Wallet
- Balance display
- Deposit button
- Transaction history
- Withdraw unused balance option

#### Deposit Screen
- Amount input
- GST 18% notice (for India)
- Total payable preview
- Billing details form
- Pay button (Cashfree/Stripe)

---

## API ENDPOINTS

### Authentication
```
POST /api/auth/signup
Body: { email, password, username, role, country }

POST /api/auth/login
Body: { email, password }

POST /api/auth/logout

GET /api/auth/user
Returns current user

POST /api/auth/forgot-password
Body: { email }

POST /api/auth/verify-reset-otp
Body: { email, otp }

POST /api/auth/reset-password
Body: { email, otp, newPassword }
```

### User
```
GET /api/users/current
Returns full user profile with wallet, stars, subscription

POST /api/users/billing
Body: { billingName, billingPhone, billingAddress, billingCity, billingState, billingPincode, gstNumber }
```

### Campaigns
```
GET /api/campaigns
Returns all active campaigns

GET /api/campaigns?country=IN
Filter by target country

GET /api/campaigns/:id
Single campaign details
```

### Reservations
```
GET /api/users/:userId/reservations
User's campaign reservations

POST /api/reservations
Body: { campaignId, userId }

DELETE /api/reservations/:id
Cancel reservation
```

### Submissions
```
POST /api/submissions
Body: { reservationId, link, clipUrl }
```

### Wallet
```
GET /api/users/:userId/transactions

POST /api/users/:userId/withdraw
Body: { amount }
```

### Bank/UPI
```
GET /api/bank-accounts
POST /api/bank-accounts
Body: { accountType: "upi", upiId, accountHolderName }
DELETE /api/bank-accounts/:id
```

### Subscription
```
GET /api/users/:userId/subscription
GET /api/subscription-plans
POST /api/subscription/create-order
Body: { planId, months, promoCode }
POST /api/subscription/verify-payment
Body: { orderId, paymentId }
```

### Promo Codes
```
POST /api/promo-codes/validate
Body: { code }

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
POST /api/notifications/:notificationId/read
```

### Sponsor APIs
```
GET /api/sponsors/current
GET /api/sponsors/:sponsorId/campaigns
POST /api/sponsors/:sponsorId/campaigns
GET /api/sponsors/:sponsorId/wallet
POST /api/sponsors/:sponsorId/wallet/create-order
POST /api/sponsors/:sponsorId/wallet/verify-payment
```

---

## KEY FEATURES

### Star Reward System
- Promotional campaigns give 1-10 stars (no money payment)
- Every 5 stars earned = 1 FREE month Pro subscription promo code
- Show star icon (gold color #FBBF24) for promotional campaigns
- Show rupee/currency for paid campaigns

### Tier System (20 Tiers)
```
Tier 1:   1K-5K followers      ₹100 base
Tier 2:   5K-10K followers     ₹150 base
Tier 3:   10K-25K followers    ₹300 base
Tier 4:   25K-50K followers    ₹500 base
Tier 5:   50K-100K followers   ₹1,000 base
Tier 6:   100K-150K followers  ₹1,500 base
Tier 7:   150K-200K followers  ₹2,000 base
Tier 8:   200K-300K followers  ₹3,000 base
Tier 9:   300K-400K followers  ₹4,000 base
Tier 10:  400K-500K followers  ₹5,000 base
Tier 11:  500K-600K followers  ₹6,000 base
Tier 12:  600K-700K followers  ₹7,000 base
Tier 13:  700K-800K followers  ₹8,000 base
Tier 14:  800K-900K followers  ₹9,000 base
Tier 15:  900K-1M followers    ₹10,000 base
Tier 16:  1M-2M followers      ₹15,000 base
Tier 17:  2M-3M followers      ₹25,000 base
Tier 18:  3M-5M followers      ₹40,000 base
Tier 19:  5M-10M followers     ₹75,000 base
Tier 20:  10M+ followers       ₹100,000 base
```

### Reservation Deadline
- 48 hours to submit after reserving
- Show countdown timer
- Auto-expire if not submitted

### Taxes
- Creator withdrawal: 18% GST deducted
- Sponsor deposit: 18% GST added
- Campaign: 10% platform fee

---

## UI/UX REQUIREMENTS

1. **Bottom Tab Navigation** for main screens (Dashboard, Campaigns, My Campaigns, Wallet, Profile)
2. **Pink gradient header** with white text
3. **Card-based design** for campaigns and stats
4. **Pull-to-refresh** on all lists
5. **Loading skeletons** while fetching data
6. **Toast notifications** for success/error messages
7. **Modal sheets** for quick actions
8. **Badge indicators** for notifications
9. **Dark mode support** with toggle in profile

---

## IMPORTANT NOTES

1. Always include `credentials: 'include'` in fetch requests for session cookies
2. Handle 401 responses by redirecting to login
3. Format currency as ₹X,XXX for INR
4. Show stars with ⭐ emoji and gold color for promotional campaigns
5. Use Inter font for body text, Outfit for headings
6. Border radius: 12px (rounded-xl equivalent)

---

## START BUILDING

Begin with the auth screens (Login, Signup), then build the creator dashboard and campaigns screens. Test with the live API using the base URL provided above.

## PROMPT END
