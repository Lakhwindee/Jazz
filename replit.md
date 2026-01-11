# Mingree - Project Documentation

## Project Overview
International influencer marketing platform connecting Instagram creators with brand campaigns across 25+ countries. Tier-based system (Tier 1-20) with follower requirements and multi-currency support.

## Current Status

### ✅ Completed Features
- User authentication (creator, sponsor, admin)
- 20-tier campaign system with multi-currency pricing
- **International Country System**: Country selection at signup, target country in campaigns
- **Country-Based Targeting**: Creators only see campaigns targeting their country
- Instagram linking (username + follower count entry)
- Campaign discovery and reservation with countdown timer
- Creator wallet with earnings tracking and withdrawal
- Sponsor wallet with deposits (GST applied), withdrawals, and campaign payment deductions
- Subscription system with admin-managed plans
- Instagram OAuth infrastructure (ready for Meta credentials)
- **Promo Code System**: 4 types with role-specific validation
  - Discount: Percentage off on subscriptions (creators only)
  - Trial: Free Pro days with configurable after-trial behavior (creators only)
  - Tax Exempt: Waives GST on sponsor wallet deposits (sponsors only)
  - Credit: Gives free wallet balance (sponsors only)
- **Cashfree Payment Gateway**: Primary payment gateway for Indian sponsors (UPI, Cards, Net Banking)
- Stripe payment integration for international sponsors
- Professional checkout flow with GST-compliant billing details collection
- Multi-tier campaign selection with cumulative pricing
- Tax system: 10% platform fee on campaigns, 18% GST on wallet deposits, 18% GST on creator withdrawals
- Star Reward System for promotional campaigns
- Auto-expiry of reservations (48 hours) with spot recovery
- **Admin Wallet System**: Centralized payment flow where all sponsor payments go to admin wallet
- **Admin Settings Panel**: Three tabs for Admin Wallet, Subscription Plans (CRUD), and API Keys setup
- **Payment Flow**: Sponsor pays admin → Admin pays creators on approval → Refunds from admin wallet
- **Campaign-Grouped Submissions**: Admin can view all submissions grouped by campaign with status tracking (reserved, submitted, approved, rejected), progress bars, and filter options
- **Forgot Password System**: 3-step OTP-based password reset (enter email → verify OTP → set new password)
- **Admin User Management**: Full user management capabilities in admin panel
  - Ban/Unban users with optional reason
  - Delete users permanently  
  - Disconnect Instagram accounts
  - Ban/Unban Instagram accounts separately
- **Campaign Folder View**: Sponsor campaigns grouped by title with collapsible tiers
  - Same title campaigns shown as folder
  - Expand to see individual tier cards
  - Summary stats (total spots, budget) per group
- **Account Management**:
  - Subscription cancellation (disables auto-renewal, access until period end)
  - Account deletion with safety checks (blocks if balance > 0, pending withdrawals, or active campaigns)
  - Cascade cleanup of user data on deletion
- **Admin Data Reset**: Settings > Data Reset tab for complete data wipe
  - Requires typing "RESET" to confirm
  - Deletes all users (except admins), campaigns, transactions, reservations
  - Resets admin wallet to zero
  - Wrapped in database transaction for safety

## Supported Countries
195 countries worldwide with multi-country targeting support:
- Sponsors can target multiple countries per campaign
- Creators can filter campaigns by country
- Database uses targetCountries array for flexible multi-country selection

## Tax Structure

### Sponsor Wallet Deposits
- Base amount entered by sponsor
- 18% GST applied to base amount
- Total payable = Base + GST
- Only base amount credited to wallet
- Example: Deposit ₹1,000 → Pay ₹1,180 → Wallet receives ₹1,000

### Campaign Creation
- Creator payment calculated per tier
- 10% platform fee applied (no GST on platform fee)
- Total deducted from wallet = Creator payment + Platform fee
- Example: ₹1,000 to creators → ₹100 platform fee → ₹1,100 from wallet

### Creator Withdrawals
- **UPI Only**: Creators add their Google Pay, PhonePe, Paytm or any UPI ID
- 18% GST deducted from withdrawal amount
- Net amount = Withdrawal - GST
- Example: Withdraw ₹1,000 → GST ₹180 → Receive ₹820

### Sponsor Withdrawals
- Sponsors can withdraw unused wallet balance
- 18% GST deducted from withdrawal amount
- Minimum withdrawal: ₹500
- Admin approval required before processing
- UPI ID required for payment
- Example: Withdraw ₹1,000 → GST ₹180 → Receive ₹820

### 🔧 Ready for Future: Auto-Fetch Followers
The app is fully prepared for automatic Instagram follower fetching via Meta OAuth.
Just add Meta credentials when ready (see setup below).

## Test Credentials

```
Admin:
Email: admin@instacreator.com
Password: admin123

Test Creator:
Email: creator@instacreator.com
Password: creator123

Test Sponsor:
Email: sponsor@instacreator.com
Password: sponsor123
```

## Instagram Auto-Fetch Setup (When Ready)

### How to Enable Auto-Fetch Later

1. **Create Meta Developer App:**
   - Go to: https://developers.facebook.com
   - Click "My Apps" → "Create App"
   - Choose "Consumer" type
   - Select "Instagram Basic Display" product

2. **Configure OAuth Settings:**
   - Add Redirect URI: `https://instacreator-hub.replit.app/api/instagram/oauth-callback`
   - Copy App ID and App Secret

3. **Add Environment Variables:**
   ```
   INSTAGRAM_APP_ID = your_app_id
   INSTAGRAM_APP_SECRET = your_app_secret
   INSTAGRAM_REDIRECT_URI = https://instacreator-hub.replit.app/api/instagram/oauth-callback
   ```

4. **That's it!** Auto-fetch will work automatically when users connect their Instagram.

## API Endpoints

### Instagram
- `POST /api/instagram/fetch-followers` - Fetch real followers from Instagram (ready for Meta API)
- `POST /api/instagram/submit` - Submit username for verification (mock)
- `POST /api/instagram/generate-code` - Generate verification code (mock)
- `POST /api/instagram/verify` - Verify Instagram account (mock)

### Campaigns
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns/reserve` - Reserve campaign
- `GET /api/campaigns/{id}/submissions` - Get submissions for campaign

### Users
- `GET /api/users/current` - Get current user profile
- `POST /api/auth/login` - Login
- `POST /api/auth/signup` - Signup

### Promo Codes
- `GET /api/admin/promo-codes` - List all promo codes (admin only)
- `POST /api/admin/promo-codes` - Create promo code (admin only)
- `POST /api/promo-codes/validate` - Validate a promo code
- `POST /api/promo-codes/apply` - Apply a promo code

### Sponsor Wallet
- `GET /api/sponsors/:id/wallet` - Get wallet balance and transactions
- `POST /api/sponsors/:id/wallet/deposit` - Add funds to wallet

### Admin Wallet
- `GET /api/admin/wallet` - Get admin wallet balance and stats
- `GET /api/admin/wallet/transactions` - Get admin wallet transaction history

### Admin Campaign Submissions
- `GET /api/admin/campaign-submissions` - Get all campaigns grouped with submissions, status counts, and progress metrics
- `POST /api/admin/submissions/:reservationId/approve` - Approve a submission and pay creator
- `POST /api/admin/submissions/:reservationId/reject` - Reject a submission and return spot

### Admin Settings
- `GET /api/admin/settings` - Get all app settings
- `POST /api/admin/settings` - Update a setting

### Subscription Plans
- `GET /api/subscription-plans` - Get active subscription plans (public)
- `GET /api/admin/subscription-plans` - Get all subscription plans (admin)
- `POST /api/admin/subscription-plans` - Create subscription plan
- `PATCH /api/admin/subscription-plans/:id` - Update subscription plan
- `DELETE /api/admin/subscription-plans/:id` - Delete subscription plan

## Architecture

### Frontend
- React + TypeScript
- TanStack Query for data fetching
- Shadcn UI components
- Wouter for routing

### Backend
- Express.js
- PostgreSQL database
- Drizzle ORM
- Passport.js for auth

### Database Schema
- Users (creators, sponsors, admins)
- Campaigns (by tier with INR pricing)
- Reservations (campaign participations)
- Submissions (content from creators)
- Transactions (payments)

## Deployment
- Production ready
- Environment variables required:
  - Database credentials (auto-managed by Replit)
  - `CASHFREE_APP_ID` - Cashfree App ID (required for payments)
  - `CASHFREE_SECRET_KEY` - Cashfree Secret Key (required for payments)
  - `CASHFREE_ENVIRONMENT` - "sandbox" for testing, "production" for live
  - `INSTAGRAM_ACCESS_TOKEN` (when Meta approves)
  - `INSTAGRAM_USER_ID` (when Meta approves)

## User Flow

### Creator Signup & Campaign Earning
1. Sign up as creator
2. Link Instagram account (manual entry for now)
3. Browse campaigns by tier
4. Reserve campaign
5. Submit content
6. Get paid to wallet
7. Withdraw balance

### Sponsor/Brand Flow
1. Sign up as sponsor
2. Create campaigns with tier targeting
3. Set payment amounts in INR
4. Review creator submissions
5. Approve & pay creators

## Production-Ready Features (Jan 2026)

### Security
- **Helmet.js**: Security headers (XSS protection, content type sniffing prevention)
- **Rate Limiting**: 500 requests/15min for API, 20 requests/15min for auth endpoints
- **Input Validation**: Request body size limits (10MB)
- **Session Security**: Secure cookies with proper expiry

### SEO & Social
- Full meta tags (title, description, keywords, author, robots)
- Open Graph tags for social media sharing
- Twitter Card support
- Apple mobile web app support
- Theme color configuration

### Error Handling
- Global ErrorBoundary component for React crashes
- Professional 404 page with navigation options
- Proper error messages for API failures
- Loading screen components

### Code Quality
- TypeScript throughout
- Proper separation of concerns
- Reusable components
- Clean API structure

## Known Limitations
- Instagram followers must be entered manually until Meta API approval
- No real-time sync with Instagram until Meta approval
- Mock verification system for now (manual verification)

## Next Steps (After Meta Approval)
1. Add environment variables for Meta API
2. Auto-fetch followers works
3. Real-time Instagram data syncing
4. Enhanced creator verification

---

**Last Updated:** Jan 09, 2026
**Status:** Production-ready with security, SEO, and error handling improvements
