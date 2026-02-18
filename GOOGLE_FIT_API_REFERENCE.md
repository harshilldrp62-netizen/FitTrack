# Google Fit Integration - API Reference

## Quick Start

### 1. No Setup Required (Auto-works via StepContext)
```typescript
import { useStep } from "@/context/StepContext";

export function MyComponent() {
  const { stepsToday, loading } = useStep();
  return <div>{stepsToday} steps</div>;
}
```

### 2. Using useGoogleFit Hook
```typescript
import { useGoogleFit } from "@/hooks/useGoogleFit";

const { steps, loading, error } = useGoogleFit({ autoFetch: true });
```

### 3. Direct Service Usage
```typescript
import { getTodaySteps } from "@/services/GoogleFitService";

const steps = await getTodaySteps();
```

---

## Service API

### GoogleFitService Class

#### `getTodaySteps(): Promise<number>`
Fetch total steps for today (midnight to current time).

```typescript
import googleFitService from "@/services/GoogleFitService";

const steps = await googleFitService.getTodaySteps();
// Returns: number (e.g., 8234)
```

**Throws:** `GoogleFitError`

---

#### `getStepsForPeriod(startDate, endDate): Promise<number>`
Fetch steps for a custom date range.

```typescript
const steps = await googleFitService.getStepsForPeriod("2024-01-01", "2024-01-07");
// Returns: 45000 (example: 7 days of steps)
```

**Parameters:**
- `startDate` (string): ISO format "YYYY-MM-DD"
- `endDate` (string): ISO format "YYYY-MM-DD"

**Returns:** Total steps in the period as `number`

**Throws:** `GoogleFitError`

---

#### `hasGoogleFitPermission(): Promise<boolean>`
Check if user has granted Google Fit permission.

```typescript
const hasPermission = await googleFitService.hasGoogleFitPermission();
if (!hasPermission) {
  console.log("User needs to sign in with Google");
}
```

**Returns:** `boolean`

**Throws:** `GoogleFitError`

---

### Convenience Functions

#### `getTodaySteps(): Promise<number>`
```typescript
import { getTodaySteps } from "@/services/GoogleFitService";

const steps = await getTodaySteps();
```

---

#### `getStepsForPeriod(startDate, endDate): Promise<number>`
```typescript
import { getStepsForPeriod } from "@/services/GoogleFitService";

const weeklySteps = await getStepsForPeriod("2024-01-01", "2024-01-07");
```

---

#### `checkGoogleFitPermission(): Promise<boolean>`
```typescript
import { checkGoogleFitPermission } from "@/services/GoogleFitService";

const hasPermission = await checkGoogleFitPermission();
```

---

### Error Handling

#### GoogleFitError Class
```typescript
import { getTodaySteps, GoogleFitError } from "@/services/GoogleFitService";

try {
  const steps = await getTodaySteps();
} catch (error) {
  if (error instanceof GoogleFitError) {
    console.error(`Error: [${error.code}] ${error.message}`);
  }
}
```

**Error Codes:**
- `AUTH_NOT_AUTHENTICATED` - User not signed in
- `TOKEN_RETRIEVAL_FAILED` - Can't get auth token
- `PERMISSION_DENIED` - User denied fitness scope
- `UNAUTHORIZED` - Token expired (401)
- `NOT_FOUND` - No fitness data for date range
- `API_ERROR_XXX` - Generic API error (XXX = HTTP status)
- `NETWORK_ERROR` - Network connectivity issue
- `FETCH_FAILED` - General fetch failure

---

## Authentication API

### Auth Service Functions

#### `googleLoginWithUserCheck(): Promise<{ user, isNewUser }>`
Sign in with Google (detects new vs existing user).

```typescript
import { googleLoginWithUserCheck } from "@/services/auth";

try {
  const { user, isNewUser } = await googleLoginWithUserCheck();
  if (isNewUser) {
    // Redirect to onboarding
  } else {
    // Redirect to home
  }
} catch (error) {
  console.error("Login failed:", error);
}
```

**Returns:** Object with:
- `user: User` - Firebase user object
- `isNewUser: boolean` - Whether this is first sign-in

---

#### `getOAuthAccessToken(): Promise<string>`
Get the current user's Google OAuth access token.

```typescript
import { getOAuthAccessToken } from "@/services/auth";

const token = await getOAuthAccessToken();
// Token automatically includes fitness.activity.read scope
```

**Returns:** OAuth access token string

**Throws:** Error if user not authenticated

---

#### `handleAuthRedirect(): Promise<{ user, isNewUser } | null>`
Check for auth redirect result (for native apps).

```typescript
import { handleAuthRedirect } from "@/services/auth";

// Call on app mount
const result = await handleAuthRedirect();
if (result) {
  console.log("User redirected back from auth");
}
```

**Returns:** Auth result or `null` if no redirect

---

## Hook API

### useGoogleFit Hook

```typescript
import { useGoogleFit } from "@/hooks/useGoogleFit";

const {
  steps,           // Current step count (number)
  loading,         // Loading state (boolean)
  error,          // Error object (GoogleFitError | Error | null)
  hasPermission,  // Has fitness permission (boolean)
  fetchSteps,     // Manual fetch function
  fetchStepsForPeriod,  // Fetch custom period
  checkPermission,     // Check permission manually
} = useGoogleFit({
  autoFetch: true,        // Auto-fetch on mount (default: true)
  refreshInterval: 300000 // Refresh every 5 min (default: 60000, 0 = disable)
});
```

**Example:**
```typescript
export function StepsWidget() {
  const { steps, loading, error, hasPermission, fetchSteps } = useGoogleFit();

  if (error) {
    return (
      <div>
        Error: {error.message}
        <button onClick={fetchSteps}>Retry</button>
      </div>
    );
  }

  if (!hasPermission) {
    return <div>Please sign in with Google</div>;
  }

  if (loading) return <div>Loading...</div>;

  return <div>Steps: {steps}</div>;
}
```

---

### useStep Hook

```typescript
import { useStep } from "@/context/StepContext";

const {
  stepsToday,    // Steps for today (number)
  weeklyTarget,  // Target steps per week (number)
  last7Days,     // Array of last 7 days data
  streak,        // Consecutive completed days (number)
  loading,       // Loading state (boolean)
  refresh,       // Manual refresh function
  saveSteps,     // Save steps to Firestore
} = useStep();
```

**Example:**
```typescript
export function Dashboard() {
  const { stepsToday, weeklyTarget, refresh } = useStep();

  return (
    <div>
      <h2>{stepsToday} / {weeklyTarget} steps</h2>
      <button onClick={refresh}>Sync</button>
    </div>
  );
}
```

---

## TypeScript Types

### Public Types

```typescript
// Error type
export class GoogleFitError extends Error {
  code: string;
  originalError?: Error;
}

// Hook result type
interface UseGoogleFitResult {
  steps: number;
  loading: boolean;
  error: GoogleFitError | Error | null;
  hasPermission: boolean;
  fetchSteps: () => Promise<void>;
  fetchStepsForPeriod: (startDate: string, endDate: string) => Promise<void>;
  checkPermission: () => Promise<void>;
}

// Hook options type
interface UseGoogleFitOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
}

// Step context type
type StepContextValue = {
  stepsToday: number;
  weeklyTarget: number;
  last7Days: DailyStepDoc[];
  streak: number;
  loading: boolean;
  refresh: () => Promise<void>;
  saveSteps: (dateId: string, steps: number) => Promise<void>;
};
```

---

## Common Patterns

### Pattern 1: Display Today's Steps
```typescript
export function TodaySteps() {
  const { stepsToday } = useStep();
  return <div className="counter">{stepsToday.toLocaleString()}</div>;
}
```

### Pattern 2: Weekly Stats
```typescript
export function WeeklyStats() {
  const { last7Days, weeklyTarget } = useStep();
  
  const total = last7Days.reduce((sum, day) => sum + day.steps, 0);
  const avg = Math.round(total / 7);

  return (
    <div>
      <p>Weekly Total: {total}</p>
      <p>Daily Avg: {avg}</p>
      <p>Target: {weeklyTarget}</p>
    </div>
  );
}
```

### Pattern 3: Manual Refresh
```typescript
export function RefreshButton() {
  const { refresh, loading } = useStep();
  
  return (
    <button onClick={() => void refresh()} disabled={loading}>
      {loading ? "Syncing..." : "Sync Steps"}
    </button>
  );
}
```

### Pattern 4: Error Display
```typescript
export function StepsWithError() {
  const { steps, error, hasPermission, fetchSteps } = useGoogleFit();

  if (!hasPermission) {
    return <p>⚠️ Please sign in with Google for automatic step tracking</p>;
  }

  if (error instanceof GoogleFitError) {
    return (
      <div className="error">
        <p>🔴 Error: {error.message}</p>
        <pre>{error.code}</pre>
        <button onClick={fetchSteps}>Retry</button>
      </div>
    );
  }

  return <p>✅ {steps} steps</p>;
}
```

### Pattern 5: Date Range Query
```typescript
export function StepsForWeek() {
  const [weekSteps, setWeekSteps] = useState(0);
  const { fetchStepsForPeriod } = useGoogleFit();

  useEffect(() => {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    
    void fetchStepsForPeriod(startDate, endDate).then(
      () => setWeekSteps(steps) // Hook updates state
    );
  }, []);

  return <div>Last 7 days: {weekSteps} steps</div>;
}
```

---

## Development Console Testing

### Check if Google Fit is working
```javascript
// In browser console
import googleFitService from '@services/GoogleFitService'
const steps = await googleFitService.getTodaySteps()
console.log(steps)
```

### Check permissions
```javascript
import { checkGoogleFitPermission } from '@services/GoogleFitService'
const has = await checkGoogleFitPermission()
console.log('Has permission:', has)
```

### Get access token
```javascript
import { getOAuthAccessToken } from '@services/auth'
const token = await getOAuthAccessToken()
console.log('Token:', token)
```

### Check cached credential
```javascript
import { getOAuthCredential } from '@services/auth'
const cred = getOAuthCredential()
console.log('Credential:', cred)
console.log('Access token:', cred?.accessToken)
```

---

## Performance Tips

1. **Use autoFetch in useGoogleFit**
   - Automatically handles loading states
   - Respects user session

2. **Set appropriate refreshInterval**
   - Default: 60 seconds (too frequent)
   - Recommended: 300 seconds (5 minutes)
   - Too frequent = more API calls + battery drain

3. **Cache results in state**
   - Don't call API in every render
   - Use hooks which handle caching

4. **Handle errors gracefully**
   - Show user-friendly messages
   - Offer retry mechanism
   - Fall back to manual entry

5. **Use StepContext for global state**
   - Single source of truth
   - Shared across app
   - Better than multiple hooks

---

## Debugging

### Enable Debug Logging
```typescript
// Add this to your auth.ts or GoogleFitService.ts
const DEBUG = true;

if (DEBUG) {
  console.log(`[GoogleFit] API Call...`);
  console.log(`[GoogleFit] Response:`, response);
  console.log(`[GoogleFit] Error:`, error?.code);
}
```

### Check Network Requests
1. Open DevTools → Network tab
2. Look for requests to `www.googleapis.com/fitness/v1/users/me/dataset:aggregate`
3. Check response status and body

### Android Logcat
```bash
adb logcat | grep -i "google\|fitness\|firebase"
```

### Browser Console
```javascript
// Check auth state
firebase.auth().currentUser

// Check context value
useStep() // In component

// Test API directly
import { getTodaySteps } from '@services/GoogleFitService'
getTodaySteps().then(console.log).catch(console.error)
```

---

## Troubleshooting Quick Guide

| Issue | Cause | Solution |
|-------|-------|----------|
| 0 steps | No activity | Walk around, wait 5-10 sec |
| Permission denied | User didn't grant | Re-sign in, click "Allow" |
| 401 Unauthorized | Token expired | Re-authenticate |
| 403 Forbidden | Insufficient scope | Check OAuth scope includes fitness |
| 404 Not found | No device data | Enable Google Fit on device |
| Network error | No internet | Check connection |
| Black screen | Redirect stuck | Check auth redirect handler |

---

## Version Info

- **Google Fit API:** v1
- **Scope:** `https://www.googleapis.com/auth/fitness.activity.read`
- **Firebase Auth:** v9+
- **Capacitor:** v8+

---

Last Updated: February 2026
