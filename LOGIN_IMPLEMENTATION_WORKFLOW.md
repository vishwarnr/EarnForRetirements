# Login Implementation Process

This is the login process used by the app.

## 1. Create the Authentication Service

Create one Axios client with the backend base URL:

```ts
const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});
```

Use `expo-secure-store` for the access and refresh tokens.

```ts
const ACCESS_KEY = 'auth_access_token';
const REFRESH_KEY = 'auth_refresh_token';
```

Implement these helpers:

```ts
saveTokens(access, refresh)
getAccessToken()
clearTokens()
```

`saveTokens` stores both tokens. `getAccessToken` reads the access token.
`clearTokens` deletes both tokens.

## 2. Implement Login API Call

Send the username and password to:

```http
POST {EXPO_PUBLIC_API_BASE_URL}/auth-login/
Content-Type: application/json
```

```json
{
  "username": "username",
  "password": "password"
}
```

Handle the responses as two possible results.

### Successful login: HTTP 200

```json
{
  "access": "access-token",
  "refresh": "refresh-token",
  "needs_2fa": false,
  "user": {}
}
```

Save both tokens and navigate to the authenticated home route:

```ts
await saveTokens(response.access, response.refresh);
router.replace('/');
```

### 2FA required: HTTP 403

```json
{
  "needs_2fa": true,
  "email": "user@example.com",
  "message": "..."
}
```

Treat this response as an expected login branch, not as a fatal error.

## 3. Implement the Login Screen

1. Store `username`, `password`, `loading`, and `error` in component state.
2. Disable submission when the username or password is empty.
3. Trim the username before submitting it.
4. Call `loginUser(username, password)`.
5. If `needs_2fa` is false, save the tokens and replace the route with Home.
6. If `needs_2fa` is true, request the email code:

```http
POST {EXPO_PUBLIC_API_BASE_URL}/auth-2fa/initiate/
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "purpose": "login"
}
```

7. Navigate to the verification screen with the email and pending login
   information.
8. Show API errors and clear the loading state in `finally`.

## 4. Implement the 2FA Verification Screen

1. Display six numeric input fields.
2. Collect the six digits into one code string.
3. Submit the code to:

```http
POST {EXPO_PUBLIC_API_BASE_URL}/auth-2fa/verify/
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

4. After verification succeeds, call the login endpoint again with the pending
   username and password. The verify endpoint only confirms 2FA; it does not
   issue login tokens in this workflow.
5. Save the access and refresh tokens returned by the second login call.
6. Replace the route with Home.
7. If verification fails, clear the code and show the error.
8. For resend, call the initiate endpoint again with the email.

## 5. Attach the Access Token to Requests

Add an Axios request interceptor that reads the access token from SecureStore:

```ts
const token = await SecureStore.getItemAsync(ACCESS_KEY);

if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

Protected API requests use:

```http
Authorization: Bearer <access-token>
```

## 6. Refresh Expired Access Tokens

Add an Axios response interceptor for HTTP 401 responses:

1. Check that the request has not already been retried.
2. Read the refresh token from SecureStore.
3. Send it to:

```http
POST {EXPO_PUBLIC_API_BASE_URL}/auth-token/refresh/
Content-Type: application/json
```

```json
{
  "refresh": "refresh-token"
}
```

4. Save the returned access token.
5. Add the new token to the failed request.
6. Retry the failed request.
7. Queue simultaneous 401 requests while the first refresh is running.
8. If refresh fails, delete both tokens and require login again.

Use a retry flag to prevent an infinite refresh loop.

## 7. Protect the Home Route

When the Home screen opens or receives focus:

```ts
const token = await getAccessToken();

if (!token) {
  router.replace('/login');
}
```

If a token exists, continue loading the authenticated screen. Use
`router.replace` after login and when redirecting to Login so the user cannot
navigate back to bypass the login route.

## 8. Required Configuration

Add the backend URL to the environment file:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-api.example.com/api
```

Install the authentication dependencies:

```bash
npm install axios expo-secure-store
```

Add the SecureStore plugin to `app.json`:

```json
{
  "expo": {
    "plugins": ["expo-secure-store"]
  }
}
```

Store authentication tokens in secure storage, not AsyncStorage.
