# Facebook Login Status Feature

## Overview
This feature enhances the login page UX by detecting if users are already logged into Facebook and displaying a visual indicator.

## Implementation

### 1. Global Type Definitions
**File**: `src/types/facebook.d.ts`

Centralized Facebook SDK type definitions to avoid duplicate declarations:
- `FacebookAuthResponse`: Auth token response structure
- `FacebookStatusResponse`: Login status response
- `FacebookSDK`: Complete SDK interface
- Global `Window.FB` and `Window.fbAsyncInit` declarations

### 2. Facebook Login Status Hook
**File**: `src/presentation/hooks/useFacebookLoginStatus.ts`

Custom React hook that:
- Polls for Facebook SDK availability (max 5 seconds)
- Calls `FB.getLoginStatus()` once SDK loads
- Provides reactive login status updates
- Exposes manual refresh capability

**Returns**:
```typescript
{
  status: FacebookLoginStatus          // 'connected' | 'not_authorized' | 'unknown' | 'loading'
  authResponse: FacebookAuthResponse | null
  isSDKLoaded: boolean
  refreshStatus: () => void
  isConnected: boolean                 // Convenience flag
  isLoading: boolean                   // Convenience flag
}
```

### 3. FacebookSDK Component Update
**File**: `src/presentation/components/common/FacebookSDK.tsx`

Changed from `lazyOnload` to `afterInteractive` strategy so the SDK loads earlier for login status checking.

### 4. Login Page Enhancement
**File**: `src/app/(auth)/login/page.tsx`

Updated to:
- Import and use `useFacebookLoginStatus` hook
- Display "Facebook에 이미 로그인되어 있습니다" message when connected
- Change button text to "Meta로 계속하기 (연결됨)" when connected

## User Experience

### Before
- User clicks Meta login button
- Redirected to Facebook for authentication
- May already be logged in but sees no indication

### After
- User sees green indicator if already logged into Facebook
- Button shows "(연결됨)" text
- User knows authentication will be faster
- Reduces confusion about login state

## Technical Details

### SDK Loading Strategy
1. Script loads with `afterInteractive` strategy
2. Hook polls `window.FB` every 100ms
3. Timeout after 5 seconds if SDK doesn't load
4. Automatic status check on first SDK detection

### Error Handling
- Gracefully handles SDK load failures
- Falls back to 'unknown' status after timeout
- Safe null checks for `window.FB`

### Performance
- No blocking operations
- Async polling with cleanup
- TypeScript strict mode compatible

## Testing

### Manual Testing Scenarios
1. **Already logged into Facebook**
   - Visit login page
   - Should see green text indicator
   - Button should show "(연결됨)"

2. **Not logged into Facebook**
   - Visit login page
   - No indicator shown
   - Button shows normal text

3. **SDK fails to load**
   - Block Facebook domain
   - Visit login page
   - Should timeout gracefully
   - No errors in console

## Files Modified
- `src/types/facebook.d.ts` (NEW)
- `src/presentation/hooks/useFacebookLoginStatus.ts` (NEW)
- `src/presentation/hooks/index.ts`
- `src/presentation/components/common/FacebookSDK.tsx`
- `src/app/(auth)/login/page.tsx`

## Dependencies
- Next.js Script component
- React hooks (useState, useEffect, useCallback)
- Facebook SDK v21.0

## Future Enhancements
- Add analytics tracking for login status
- Show estimated login time based on status
- Cache status in sessionStorage
- Add tooltip with more login info
