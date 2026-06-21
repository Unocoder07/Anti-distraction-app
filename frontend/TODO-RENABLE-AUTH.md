# ⚠️ TODO: Re-enable Authentication

## Current Status: **AUTH BYPASSED FOR TESTING**

Authentication has been temporarily disabled to allow faster testing of main features.

## What Was Changed:

**File:** `frontend/app/_splash.tsx`

- ✅ Modified to skip login/signup screens
- ✅ App now goes directly to home screen (tabs)
- ✅ Original auth code is commented out (not deleted)

## To Re-enable Authentication:

1. Open `frontend/app/_splash.tsx`
2. Find the section marked `BYPASS AUTH FOR TESTING`
3. Delete the bypass code (lines with "BYPASS")
4. Uncomment the original auth code below it
5. Save and restart the app

## Original Behavior:

- Show splash screen
- Check if user is logged in
- If logged in → Go to home (tabs)
- If NOT logged in → Go to login screen

## Test Behavior (Current):

- Show splash screen (1.5 seconds)
- Skip auth check
- **Always** go directly to home (tabs)

## When to Re-enable:

- ✅ When all main features are complete
- ✅ When backend authentication is stable
- ✅ When ready for production testing
- ✅ Before final deployment

## Backend Status:

The backend authentication endpoints are still working:
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout

They're just not being called by the frontend right now.

---

**Created:** June 12, 2026
**Reason:** Backend connection issues causing delays in testing
**Impact:** Can test all app features without waiting for auth
