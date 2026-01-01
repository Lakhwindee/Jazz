# Instagram Auto-Fetch Setup Guide

## ⚡ Current Status: RapidAPI Integration Ready

### What's Already Done:
✅ Backend endpoint created: `/api/instagram/fetch-followers`
✅ Frontend "Fetch" button added to Profile
✅ Environment variables saved:
- `RAPIDAPI_KEY` = Your API key
- `RAPIDAPI_HOST` = instagram-scraper-stable-api.p.rapidapi.com

---

## 🎯 Next Step: Activate RapidAPI Subscription

If the "Fetch" button shows error:

### 1. Go to RapidAPI Dashboard
https://rapidapi.com/dashboard

### 2. Find "Instagram Scraper Stable API"
In your subscribed APIs list

### 3. Check Subscription Status
- **Active?** ✅ Everything works!
- **Inactive?** ❌ Click "Subscribe" or upgrade plan
- **Free tier exhausted?** → Upgrade to paid plan

### 4. Test the API
Go back to Profile:
1. Enter Instagram username (e.g., `cristiano`)
2. Click "Fetch" button
3. ✅ Followers auto-populate!

---

## How It Works

### Manual Entry (Current Default - Always Works)
```
1. Go to Profile
2. Enter username: @cristiano
3. Enter followers manually: 600000
4. Click "Link Instagram Manually"
✅ Account linked!
```

### Auto-Fetch (When RapidAPI Active)
```
1. Go to Profile
2. Enter username: @cristiano
3. Click "Fetch" button
4. ✅ Followers auto-populate from Instagram!
5. Click "Link Instagram Manually" to save
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "RapidAPI not configured" | API key/host not saved. Check Secrets tab. |
| "RapidAPI not responding" | Subscription might be inactive. Check RapidAPI dashboard. |
| "Minimum followers required" | Account has <8,000 followers. Need 8K+ to join. |
| Button doesn't work | Manual entry always works as fallback. |

---

## Long-term: Meta API (Free After Approval)

When Meta verifies your developer account (3-4 days):
1. Add Meta credentials to Secrets
2. Auto-fetch becomes FREE forever
3. No more RapidAPI limitations

See end of this file for Meta setup.

---

## Why Two Options?

1. **RapidAPI** → Instant, costs money
2. **Meta API** → Free, but 3-4 day wait

You can use RapidAPI now and switch to Meta API later!

---

## Frontend "Fetch" Button

Location: Profile → "Your Follower Count" section

### What It Does:
```
Input: Instagram username
→ Click "Fetch" button
→ API calls RapidAPI
→ Gets real follower count
→ Auto-fills input field
```

### Fallback:
If RapidAPI fails, manual entry always works!

---

## Testing

### Test with Known Accounts:
- `cristiano` - 600M+ followers ✅
- `instagram` - 600M+ followers ✅
- `leomessi` - 85M+ followers ✅

All should work if RapidAPI is active!

---

---

# Meta API Setup (Alternative - Free)

## Timeline
- **Day 1-3**: Meta reviewing
- **Day 4**: Account approved
- **Day 4+**: Switch to Meta (FREE auto-fetch!)

## When Meta Approves

### Get Meta Credentials:
1. Go to https://developers.facebook.com/
2. My Apps → Your App
3. Settings → Basic → Copy `App ID` and `App Secret`
4. Graph API Explorer → Generate long-lived token
5. Get Instagram Business Account ID

### Add to Replit:
```
Secret: INSTAGRAM_APP_ID = your_app_id
Secret: INSTAGRAM_APP_SECRET = your_app_secret
Secret: INSTAGRAM_ACCESS_TOKEN = long_lived_token
Secret: INSTAGRAM_USER_ID = business_account_id
```

### Auto-Fetch Works!
✅ No more RapidAPI costs
✅ Real Instagram API
✅ Unlimited requests

---

**Status: Ready to use!** 🚀
