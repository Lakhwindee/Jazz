# RapidAPI Testing & Troubleshooting

## Quick Test

### 1. Check If RapidAPI is Working

Go to Profile, enter username `cristiano`, click "Fetch" button.

**If it works:**
- Followers count auto-fills ✅
- Shows: ~600 million followers
- Ready to go! 🎉

**If it shows error:**
- See troubleshooting below ↓

---

## Common Errors & Solutions

### Error: "RapidAPI not responding"
**Cause:** Subscription might be inactive or API tier exhausted

**Fix:**
1. Go to https://rapidapi.com/dashboard
2. Find "Instagram Scraper Stable API"
3. Check subscription status
4. If inactive, click "Subscribe"
5. Wait 5 minutes, try again

### Error: "Failed to fetch followers"
**Cause:** Username doesn't exist or account is private

**Fix:**
1. Double-check Instagram username (no @ symbol)
2. Make sure account is public
3. Try well-known accounts: `cristiano`, `instagram`, `leomessi`

### Error: "Minimum X followers required"
**Cause:** Account has fewer than 8,000 followers

**Fix:**
- Creator needs 8,000+ followers to join platform
- This is intentional - minimum requirement

---

## Manual Testing

### Test RapidAPI Directly:

```bash
curl -H "x-rapidapi-key: YOUR_KEY" \
     -H "x-rapidapi-host: instagram-scraper-stable-api.p.rapidapi.com" \
     "https://instagram-scraper-stable-api.p.rapidapi.com/info?username=cristiano"
```

**Expected Response:**
```json
{
  "follower_count": 600000000,
  "username": "cristiano",
  ...
}
```

If you get:
- `{"message":"You are not subscribed to this API"}` → Subscription inactive
- Follower data → API working! ✅
- Other error → Contact RapidAPI support

---

## Fallback: Manual Entry Always Works

If RapidAPI fails:
1. Go to Profile
2. Manually enter followers count
3. Click "Link Instagram Manually"
✅ Account linked!

No RapidAPI needed for manual entry.

---

## Next Step: Meta API (Free)

When Meta approves (3-4 days):
- Switch to free Meta API
- No more RapidAPI costs
- Unlimited requests

See `META_SETUP.md` for details.

---

**Status:** Waiting for RapidAPI subscription activation
