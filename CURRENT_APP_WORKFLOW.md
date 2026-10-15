# EarnForRetirement: Current App Workflow and Data Inventory

> This document describes the current Expo mobile application based on the existing source code in this project. It does not use or depend on `Vishva_putha.md`. Backend behavior that cannot be proven by this mobile source is marked as unverified.

## Scope

The current app allows a user to:

1. Sign in with a username and password.
2. Complete email-based two-factor authentication when required.
3. Capture a recyclable-item photo with the camera.
4. Select a recyclable-item photo from the photo library.
5. Review or retake the photo.
6. Send the image to Google Gemini for material analysis.
7. Calculate and display an estimated recycling value.
8. Upload the image and limited metadata to the configured application backend.
9. Save a recent scan record locally on the device.
10. Find nearby recycling facilities using the user's foreground location.
11. Open Google Maps directions or the phone application for a facility.

## App Launch and Navigation

The app uses Expo Router with these screens:

- `index`: Home and recent scan history
- `login`: Username and password login
- `verify-2fa`: Email six-digit verification code
- `preview`: Local photo review and retake
- `analyzing`: AI analysis loading state
- `result`: Material analysis and estimated value
- `facilities`: Nearby recycling facilities

When the Home screen receives focus, it checks whether an access token exists in
Expo SecureStore. If no access token exists, the app redirects to Login.

## Authentication Workflow

### Login request

The user enters:

- Username
- Password

The app performs a client-side check that both fields are non-empty, then sends:

```text
POST {EXPO_PUBLIC_API_BASE_URL}/auth-login/
Content-Type: application/json
```

```json
{
  "username": "user-entered username",
  "password": "user-entered password"
}
```

The configured API base URL comes from `EXPO_PUBLIC_API_BASE_URL`. If the
variable is absent, the source falls back to `http://your-domain.com`.

### Successful login

A successful response may contain:

- Access token
- Refresh token
- 2FA validity timestamp
- User profile object

The declared `LoggedInUser` model contains:

- `id`
- `username`
- `email`
- `first_name`
- `last_name`
- `phone_number`
- `address`
- `role`
- `company_registration_ids`

The current mobile UI does not collect or display all of those profile fields.
Their actual server-side collection is not proven by the mobile source alone.

The access and refresh tokens are saved in Expo SecureStore. The user is then
redirected to Home.

### Two-factor authentication

If the login response says `needs_2fa: true`:

1. The app receives an email address from the backend.
2. It requests an email code:

```text
POST {EXPO_PUBLIC_API_BASE_URL}/auth-2fa/initiate/
```

```json
{
  "email": "user@example.com",
  "purpose": "login"
}
```

3. The backend is expected to send a six-digit code by email.
4. The user enters the code in the app.
5. The app verifies the code:

```text
POST {EXPO_PUBLIC_API_BASE_URL}/auth-2fa/verify/
```

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

6. After verification, the app submits the username and password again to obtain
   access and refresh tokens.
7. The tokens are stored in SecureStore.

The username and password are passed as route parameters from Login to the 2FA
screen. They are not written to AsyncStorage, but temporarily exist in
navigation state and application memory.

### Token refresh

The Axios request interceptor reads the access token from SecureStore and adds:

```http
Authorization: Bearer <access-token>
```

If an authenticated request returns HTTP 401:

1. The refresh token is read from SecureStore.
2. The app sends it to:

```text
POST {EXPO_PUBLIC_API_BASE_URL}/auth-token/refresh/
```

```json
{
  "refresh": "stored refresh token"
}
```

3. The new access token is saved in SecureStore.
4. The failed request is retried.
5. Requests that fail while refresh is running are queued and retried afterward.
6. If refresh fails, both tokens are deleted.

A `clearTokens()` helper exists, but the current screens do not expose a visible
logout button.

## Photo and Device Permission Workflow

The Home screen offers two options.

### Camera

1. The app requests camera permission.
2. If permission is denied, it shows an explanatory alert.
3. If permission is granted, it opens the camera.
4. The image picker uses image media, approximately 85% quality, and no editing.
5. The resulting local image URI is passed to the Preview screen.

### Photo library

1. The app requests photo-library permission.
2. If permission is denied, it shows an explanatory alert.
3. If permission is granted, it opens the device photo library.
4. The selected local image URI is passed to the Preview screen.

### Retake

The Preview screen can open the camera again. The replacement image URI is held
in screen state and replaces the previous URI.

The Expo configuration explicitly disables microphone permission. The source
contains no microphone capture logic.

## Current AI Analysis Workflow

When the user selects Analyze Item:

1. The app displays the Analyzing screen.
2. The local image file is read using Expo FileSystem.
3. The image is converted to Base64.
4. The mobile app sends the Base64 image directly to Google Gemini through the
   `@google/generative-ai` package.
5. The request includes a prompt asking Gemini to return JSON with:
   - `isRecyclable`
   - `materialCategory`
   - `materialName`
   - `condition`
   - `estimatedWeightKg`
   - `confidenceScore`
   - `rejectionReason`
6. The app parses the Gemini JSON response.
7. The app maps the response to its `MaterialAnalysis` model.
8. The app calculates an estimated price locally using an embedded price table.
9. The app applies a condition multiplier.
10. The app generates recyclability notes and preparation tips locally.
11. The app navigates to the Result screen.

The source currently requests the Gemini model named `gemini-3.6-flash`. Some
comments refer to Gemini 1.5 Flash, but the executable model value is the model
name in the service code.

The Gemini API key comes from `EXPO_PUBLIC_GEMINI_API_KEY`. Because this is an
Expo public environment variable, the production configuration must be checked
to determine whether the key is bundled into the client application.

## Current Backend Image Upload

After Gemini analysis succeeds, the Analyzing screen starts a separate background
upload. The upload is not required for the Result screen to appear. If it fails,
the app only logs a warning.

The app sends:

```text
POST {EXPO_PUBLIC_API_BASE_URL}/foodbank/upload-image
Content-Type: multipart/form-data
```

Current multipart fields:

```text
file         image binary
 title       detected material name
description  generated recyclability note
category     detected material category
uploaded_by  not supplied by the current mobile screen
```

The upload request uses plain Axios rather than the authenticated `apiClient`,
so the current upload function does not attach the user's access token.

The mobile source proves that the image and the listed metadata are sent to the
configured backend. It does not prove what the deployed backend does afterward.
Cloud storage, database storage, retention, server logs, and server-side AI
processing must be verified in the backend implementation and deployment.

## Result Screen

The Result screen receives the image URI and serialized analysis result through
navigation parameters and displays:

- Image thumbnail
- Recyclable or not-recyclable status
- Material name
- Material category
- Condition
- Estimated weight
- AI confidence
- Estimated minimum and maximum value
- Currency
- Rejection reason, when present
- Recyclability explanation
- Preparation tips
- Pricing disclaimer that final payout depends on facility weighing

The result data is parsed locally from the navigation parameter. There is no
current result-fetching API call from the Result screen.

## Local Storage

The app uses AsyncStorage with the key:

```text
@efr_scan_history
```

After a result is displayed, it saves a record containing:

```json
{
  "id": "timestamp",
  "imageUri": "local device URI",
  "materialName": "detected material name",
  "date": "ISO timestamp",
  "estimatedValue": 0.0,
  "currency": "USD"
}
```

Only the first 20 records are retained. The Home screen loads the records when
it receives focus and displays at most the five newest records.

The current mobile source does not upload scan history, synchronize history
between devices, or store the full analysis JSON in AsyncStorage. The image URI
is stored, but the image bytes are not embedded in the history JSON.

SecureStore separately stores the access and refresh tokens described above.
Passwords and 2FA codes are not intentionally persisted in AsyncStorage or
SecureStore by the current mobile code.

## Nearby Facilities Workflow

When the user taps Find Drop-off Locations:

1. The Result screen passes the detected material category to Facilities.
2. Facilities requests foreground location permission.
3. If permission is granted, it reads the current latitude and longitude.
4. If permission is denied, the app logs the denial and uses fallback
   coordinates in `recyclingService.ts`.
5. The app creates an OpenStreetMap Overpass query.
6. The query searches recycling-related nodes and ways within approximately
   5,000 metres.
7. The query is sent to:

```text
https://overpass-api.de/api/interpreter
```

8. The response is parsed locally.
9. The app calculates distance using the Haversine formula.
10. The app extracts facility name, address, accepted materials, opening hours,
    coordinates, and phone number.
11. The facilities are sorted from nearest to farthest.
12. The results are displayed in the Facilities screen.

The current Overpass request includes the user's latitude and longitude in the
query. It does not include the username, email, password, access token, or
photo. The current mobile implementation does not call a backend facility
endpoint from the Facilities screen.

The source uses a San Francisco coordinate fallback when location is unavailable
for development/testing. This fallback is not the user's actual location.

## External Actions

### Directions

When the user taps Directions, the app opens a Google Maps URL containing the
facility name and address as a search query.

The app does not send the user's username, email, password, access token, or
photo in this URL.

### Phone call

When the user taps Call, the app opens the device phone application using the
facility phone number. The source does not place, record, or analyze calls.

## Data Inventory Based on Current Mobile Code

| Data | How obtained | Current mobile action | Current destination/storage | Purpose |
|---|---|---|---|---|
| Username | Login TextInput | Sent in login JSON; temporarily passed to 2FA route | Configured backend; navigation memory | Authentication |
| Password | Login TextInput | Sent in login JSON; temporarily passed to 2FA route | Configured backend; navigation memory | Authentication |
| Email address | Login response / route parameter | Sent to 2FA initiate and verify endpoints | Configured backend; email delivery is outside mobile code | 2FA |
| 2FA code | User email and OTP inputs | Sent to verification endpoint | Configured backend | Authentication |
| Access token | Login or refresh response | Stored and read by SecureStore | Android Keystore/iOS Keychain through SecureStore | Session authentication |
| Refresh token | Login response | Stored and sent during refresh | SecureStore and configured backend refresh endpoint | Session renewal |
| Recyclable-item photo | Camera or photo library | Read, Base64 encoded, sent to Gemini, and uploaded to backend | Gemini; configured backend; local URI during workflow | AI analysis and upload |
| Material name | Gemini response | Displayed, saved in local history, sent as upload title | Local UI/history and configured backend upload | Classification |
| Material category | Gemini response | Displayed, used for upload metadata and facility context | Local UI/history context and configured backend upload | Classification/facility search |
| Condition, weight, confidence | Gemini response | Displayed and used in local mapping/pricing | Local application state and Result navigation state | Analysis/value estimate |
| Recyclability note | Generated locally from Gemini result | Displayed and sent as upload description | Local application state and configured backend upload | User guidance |
| Preparation tips | Generated locally | Displayed only | Application memory during result flow | User guidance |
| Estimated price | Calculated locally | Displayed and midpoint saved to local history | Application memory and AsyncStorage | Value estimate |
| Scan date | Generated locally | Saved in local history | AsyncStorage | Recent activity |
| Precise latitude/longitude | Foreground device location | Included in Overpass query | OpenStreetMap Overpass request | Nearby facility search |
| Facility name/address | Overpass response | Displayed and included in Google Maps URL if selected | Application memory and external Maps URL | Directions |
| Facility phone number | Overpass response | Passed to phone URL if selected | Device phone application | Calling facility |

## Permissions and Device Access

The current Expo configuration includes:

- Camera permission
- Photo-library permission
- Foreground location permission
- SecureStore access
- Local AsyncStorage access
- Phone and external-link launch through React Native Linking

The configuration explicitly sets microphone permission to false. No background
location permission is configured or requested.

## Third-Party and External Destinations

Confirmed by current mobile source:

- Google Gemini: receives the recyclable-item image and analysis prompt.
- Configured application backend: receives login, 2FA, refresh, and image-upload
  requests when the API base URL is live.
- OpenStreetMap Overpass: receives latitude and longitude for facility search.
- Google Maps: opened with facility name/address when Directions is selected.
- Device phone application: opened with facility phone number when Call is
  selected.
- Expo SecureStore: local authentication-token storage.
- React Native AsyncStorage: local scan-history storage.

No current source or dependency usage was found for:

- Advertising SDKs
- Analytics SDKs
- Firebase services
- Crash-reporting SDKs
- Push notifications
- Contacts
- Microphone recording
- Payments
- Bluetooth
- Background location
- SMS access
- Calendar access
- Health data

## Current Code Paths That Are Not Used by Screens

These functions exist in the current source but are not called by the current
screen flow:

- `getFoodBankImages()`
- `deleteFoodBankImage()`
- `getFoodBankImageUrl()`
- `getAllFacilities()`
- `clearScanHistory()` from the current visible UI
- `clearTokens()` from the current visible UI

Their presence alone does not prove that the installed app executes them.

## Current Error and Logging Behavior

- Camera denial shows a native permission alert.
- Photo-library denial shows a native permission alert.
- Gemini failure shows an Analysis Failed screen.
- Background image-upload failure is logged with `console.warn` and hidden from
  the user.
- Location permission denial logs a message and uses fallback coordinates.
- Overpass failure shows a facility-loading error state.
- Empty facility results show an empty state.
- Local scan-history failures are caught and logged with `console.warn`.
- AI stage callbacks write stage messages to `console.log`.
- Haptic feedback is used for button actions and success/error states; it does
  not collect user data.

## What Cannot Be Determined From the Mobile Source

The following require backend, environment, provider, or production-build
verification:

1. The actual production value of `EXPO_PUBLIC_API_BASE_URL`.
2. Whether the configured backend stores uploaded images.
3. Whether the backend stores images in R2 or metadata in MongoDB.
4. Backend retention periods and deletion behavior.
5. Backend access logs, IP logging, request-body logging, and monitoring.
6. The email provider used for 2FA and its retention behavior.
7. Whether the backend sends uploaded images to another AI service.
8. Whether production uses direct Gemini or a backend-only AI flow.
9. Whether the public Gemini key is restricted or exposed in the app bundle.
10. Whether scan history will later synchronize with a user account.
11. Whether analytics, crash reporting, advertising, or other services are added
    during production build configuration.
12. Whether all production network endpoints use HTTPS.

## Google Play Data Safety Review Checklist

Use the current production build and backend configuration to evaluate:

- Personal information: username, email, and any actual account profile fields.
- Authentication information: password, 2FA code, access token, and refresh
  token.
- Photos and videos: recyclable-item photos sent to Gemini and the backend.
- Location: precise foreground location sent to Overpass.
- App activity: local scan history is currently not remotely collected; this
  changes if synchronization is added.
- Device identifiers: declare only if production SDKs or backend logs collect
  them.
- Diagnostics: declare only if a diagnostics or crash-reporting service is
  actually added.

For each applicable category, confirm:

1. Whether the data leaves the device.
2. Whether the developer collects it.
3. Whether it is shared with another company.
4. Whether collection is required or optional.
5. The purpose of collection.
6. Encryption in transit.
7. Retention duration.
8. User deletion and account-deletion behavior.

## Source Files Reviewed

- `app/_layout.tsx`
- `app/index.tsx`
- `app/login.tsx`
- `app/verify-2fa.tsx`
- `app/preview.tsx`
- `app/analyzing.tsx`
- `app/result.tsx`
- `app/facilities.tsx`
- `services/authService.ts`
- `services/aiService.ts`
- `services/foodbankService.ts`
- `services/recyclingService.ts`
- `utils/storage.ts`
- `types/models.ts`
- `app.json`
- `package.json`
