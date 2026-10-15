// ─────────────────────────────────────────────────────────────
// services/authService.ts
// Handles all authentication API calls for the Login + 2FA flow.
//
// WHY AXIOS?
//   Axios gives us a clean instance with a shared base URL and
//   lets us attach interceptors later (e.g. auto token refresh)
//   without touching every individual fetch() call.
//
// WHY EXPO-SECURE-STORE?
//   Tokens must NEVER be stored in AsyncStorage — it is plain text
//   and readable by anyone with physical device access.
//   SecureStore uses the device's Keychain (iOS) / Keystore (Android).
// ─────────────────────────────────────────────────────────────

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ── Base URL ─────────────────────────────────────────────────
// Set this in your .env file as EXPO_PUBLIC_API_BASE_URL
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://your-domain.com';

// ── Secure Store Keys ─────────────────────────────────────────
// Using constants prevents typos when reading/writing tokens
export const TOKEN_KEYS = {
  ACCESS:  'auth_access_token',
  REFRESH: 'auth_refresh_token',
} as const;

// ── Axios Instance ────────────────────────────────────────────
// One shared instance means one place to change the base URL or
// add headers (like Authorization) for the whole app.
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 seconds — fail fast rather than hang
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Token Refresh Interceptor ─────────────────────────────────
//
// WHY THIS IS NEEDED:
//   Access tokens expire (typically in 5–60 minutes). Without this,
//   every API call would fail with a silent 401 after expiry and the
//   user would have to manually log in again.
//
// HOW IT WORKS:
//   1. Every response passes through here.
//   2. If a response is 401 (Unauthorized), we intercept it BEFORE
//      it reaches the screen/component that made the call.
//   3. We use the saved refresh token to silently get a new access token.
//   4. We retry the original failed request with the new token.
//   5. The screen never knows any of this happened — it just gets its data.
//
// THE QUEUE PATTERN (isRefreshing + failedQueue):
//   Imagine 3 API calls fire at the same moment and all get 401.
//   Without a queue, all 3 would try to refresh simultaneously,
//   causing 3 parallel refresh requests — a race condition that
//   breaks everything. The queue holds requests 2 and 3 while
//   request 1 does the refresh, then replays them all at once.

let isRefreshing = false;
type QueueItem = { resolve: (token: string) => void; reject: (err: any) => void };
let failedQueue: QueueItem[] = [];

/** Resolves or rejects all queued requests after a refresh attempt. */
function processQueue(error: any, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
}

// ── Request Interceptor ───────────────────────────────────────
// Automatically attaches the current access token to every outgoing
// request so screens never need to manually set Authorization headers.
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ──────────────────────────────────────
apiClient.interceptors.response.use(
  // Pass through all successful responses unchanged
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 Unauthorized errors.
    // _retry flag prevents an infinite loop if the refresh call itself
    // returns 401 (i.e. the refresh token is also expired/invalid).
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Another request is already doing a refresh.
        // Queue this request and wait for the refresh to finish.
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Mark this request so it won't loop if it fails again
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to get a new access token using the refresh token
        const refreshToken = await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH);

        if (!refreshToken) {
          // No refresh token stored at all → user must log in from scratch
          throw new Error('No refresh token available.');
        }

        // Call the server's token refresh endpoint directly (no interceptor
        // loop risk since this uses the base axios, not apiClient)
        const { data } = await axios.post(
          `${BASE_URL}/auth-token/refresh/`,
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const newAccessToken: string = data.access;

        // Save the new token to secure storage for future requests
        await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS, newAccessToken);

        // Tell all queued requests to retry with the new token
        processQueue(null, newAccessToken);

        // Retry the original request that triggered the 401
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);

      } catch (refreshError: any) {
        // Refresh token is expired or invalid → full logout required.
        // Clear all stored tokens so the auth guard in index.tsx will
        // detect no token and redirect to the login screen automatically.
        processQueue(refreshError, null);
        await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS);
        await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH);

        // Re-throw so the calling screen gets a clear error if needed
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For all other errors (400, 403, 404, 500 etc.) pass through normally
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────
// TypeScript Interfaces
// These define exactly what shape the API responses will have,
// giving us type safety and autocomplete across the whole app.
// ─────────────────────────────────────────────────────────────

export interface LoggedInUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  role: string;
  company_registration_ids: number[];
}

/** Returned by POST /api/auth-login/ on SUCCESS (200) */
export interface LoginSuccessResponse {
  access: string;
  refresh: string;
  needs_2fa: false;
  two_factor_valid_until: string;
  user: LoggedInUser;
}

/** Returned by POST /api/auth-login/ when 2FA is REQUIRED (403) */
export interface LoginNeeds2FAResponse {
  needs_2fa: true;
  email: string;
  message: string;
}

/** Union type — the login function can return one of two shapes */
export type LoginResponse = LoginSuccessResponse | LoginNeeds2FAResponse;

/** Returned by POST /api/auth-2fa/initiate/ on success */
export interface Initiate2FAResponse {
  sent: boolean;
  email: string;
}

/** Returned by POST /api/auth-2fa/verify/ on success */
export interface Verify2FAResponse {
  success: boolean;
  two_factor_valid_until: string;
}

// ─────────────────────────────────────────────────────────────
// Token Helpers
// Keep all SecureStore logic in one place so screens never
// need to know HOW tokens are stored — only THAT they are.
// ─────────────────────────────────────────────────────────────

/** Saves both tokens to device secure storage after a successful login. */
export async function saveTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS, access);
  await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH, refresh);
}

/** Reads the stored access token (null if not logged in). */
export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEYS.ACCESS);
}

/** Clears both tokens from storage (used for logout). */
export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS);
  await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH);
}

// ─────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────

/**
 * STEP 1 of Login Flow: Submit credentials.
 *
 * The server checks if 2FA is still valid for this device.
 * - If valid: returns 200 with JWT tokens → login is complete.
 * - If expired/first time: returns 403 with needs_2fa:true.
 *
 * WHY we return a union type: the caller (login screen) must
 * check `needs_2fa` and branch the UI accordingly.
 */
export async function loginUser(
  username: string,
  password: string
): Promise<LoginResponse> {
  try {
    const response = await apiClient.post<LoginSuccessResponse>(
      '/auth-login/',
      { username, password }
    );
    // 200 OK — tokens received, login is fully complete
    return response.data;
  } catch (error: any) {
    // WHY catch 403 here: Axios throws on non-2xx. A 403 with
    // needs_2fa:true is expected business logic, not a real error.
    if (error.response?.status === 403 && error.response.data?.needs_2fa) {
      return error.response.data as LoginNeeds2FAResponse;
    }
    // Any other error (400 bad credentials, 500 server error) re-throws
    throw new Error(
      error.response?.data?.detail ?? 'Login failed. Please try again.'
    );
  }
}

/**
 * STEP 2 of 2FA Flow: Request a new code to be sent via email.
 * Called immediately when the server tells us 2FA is required.
 */
export async function initiate2FA(email: string): Promise<Initiate2FAResponse> {
  try {
    const response = await apiClient.post<Initiate2FAResponse>(
      '/auth-2fa/initiate/',
      { email, purpose: 'login' }
    );
    return response.data;
  } catch (error: any) {
    // Handle rate limit (too many requests) gracefully
    if (error.response?.status === 429) {
      throw new Error('A code was recently sent. Please wait 30 seconds and try again.');
    }
    throw new Error(
      error.response?.data?.message ?? 'Failed to send verification code.'
    );
  }
}

/**
 * STEP 3 of 2FA Flow: Verify the 6-digit code from the user's email.
 * On success, the server marks this device as 2FA-verified for 30 days.
 * After this, the caller must re-run loginUser() to get the actual tokens.
 */
export async function verify2FACode(
  email: string,
  code: string
): Promise<Verify2FAResponse> {
  try {
    const response = await apiClient.post<Verify2FAResponse>(
      '/auth-2fa/verify/',
      { email, code }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? 'Invalid or expired verification code.'
    );
  }
}
