# EarnForRetirement - Complete Privacy & Data Security Analysis

**Application Name:** EarnForRetirement  
**Application Type:** Mobile (iOS/Android via Expo React Native)  
**Analysis Date:** August 23, 2026  
**Framework:** Expo v54.0.36  
**Developer:** RN Robots  
**Status:** Complete Technical Analysis (Draft - Awaiting Backend Confirmation)

---

## 📋 QUICK REFERENCE & EXECUTIVE SUMMARY

### What is EarnForRetirement?

EarnForRetirement is a mobile app (iOS/Android) that helps users earn money by recycling. Users take photos of recyclable materials, and the app uses Google Gemini AI to identify them and estimate their value. The app also helps users find nearby recycling facilities.

**Key Finding:** The app follows modern security best practices for mobile applications, including secure token storage, 2FA verification, and proper HTTPS usage. However, several backend data retention policies require confirmation before publishing to Google Play Store.

---

### 🚀 What You Need to Know

#### ✅ What the App Does (Confirmed from Code)

1. **User Authentication**
   - Username + password login
   - Email-based 2FA (two-factor authentication)
   - JWT token-based session management
   - Secure token storage (Keychain/Keystore, NOT AsyncStorage)

2. **Image Analysis**
   - Users take or upload photos of recyclables
   - Photos sent to Google Gemini 1.5 Flash Vision API
   - AI returns: material type, weight estimate, confidence score, market value
   - Photos NOT stored by Google (ephemeral)

3. **Facility Search**
   - Users request nearby recycling facilities
   - App requests device GPS coordinates (with permission)
   - Returns list of facilities with distances and hours
   - Graceful fallback if location permission denied

4. **Local History**
   - Scan history stored locally (AsyncStorage)
   - Max 20 items kept
   - Can be manually cleared
   - Includes: material name, value, date, image thumbnail

5. **Cloud Image Storage (Optional)**
   - After analysis, images uploaded to Cloudflare R2 (background, silent)
   - Upload failure doesn't block user
   - Images tagged with material category and analysis notes
   - Users can delete individual images

#### ⚠️ What Requires Backend Confirmation

Before publishing Privacy Policy or to Google Play Store, confirm:

**Data Retention:**
- [ ] How long are user profiles retained after account deletion?
- [ ] How long are images stored on Cloudflare R2?
- [ ] How long are scan history records kept on backend?

**Data Security:**
- [ ] Is MongoDB data encrypted at rest?
- [ ] Is Cloudflare R2 data encrypted at rest?
- [ ] What encryption algorithm is used (AES-256, etc.)?
- [ ] Is HTTPS certificate pinning implemented?

**User Features:**
- [ ] Is there a "delete my account" feature?
- [ ] Can users export their data?
- [ ] Can users request all their data to be deleted?

**Password Handling:**
- [ ] What hashing algorithm is used for passwords (bcrypt, Argon2)?
- [ ] Are passwords salted?
- [ ] What is the password complexity requirement?

**Rate Limiting:**
- [ ] Are login attempts rate-limited?
- [ ] Are 2FA requests rate-limited?
- [ ] Are API endpoints rate-limited per user?

---

### 🔐 Security Assessment at a Glance

#### ✅ Strengths (Implemented Correctly)

| Aspect | Status | Details |
|--------|--------|---------|
| **Token Storage** | ✅ Good | Uses `expo-secure-store` (native encryption) |
| **HTTPS** | ✅ Good | All API calls over encrypted connections |
| **2FA** | ✅ Good | Email-based verification, 30-day device window |
| **Auto Token Refresh** | ✅ Good | Prevents stale token attacks; queue pattern prevents race conditions |
| **Permission Handling** | ✅ Good | All permissions optional; graceful degradation |
| **Session Management** | ✅ Good | Auth guard on home screen redirects to login |
| **Image Processing** | ✅ Good | Images not stored by Gemini; temporary local processing |

#### ⚠️ Concerns (Requires Confirmation)

| Aspect | Risk | Status |
|--------|------|--------|
| **Backend Encryption** | MEDIUM | Unknown if data encrypted at rest |
| **Account Deletion** | MEDIUM | Not visible in app code; confirm with backend |
| **Data Export** | MEDIUM | No data portability feature visible |
| **Device Fingerprinting** | MEDIUM | 2FA based on email only; consider device binding |
| **Image Upload Consent** | LOW | Silent background upload; consider user notification |
| **Rate Limiting** | MEDIUM | Not visible in code; confirm on backend |
| **Certificate Pinning** | MEDIUM | Not implemented; consider for enhanced security |

---

### 📊 Data Collection Summary

#### What Data is Collected

| Data Type | Collected | Purpose | Storage |
|-----------|-----------|---------|---------|
| **Username** | ✓ | User identification | Backend |
| **Password** | ✓ | Authentication | Backend (hashed) |
| **Email** | ✓ | 2FA verification | Backend |
| **Phone/Address/Name** | ✓ | User profile | Backend |
| **Photos** | ✓ | Material identification | Gemini (NOT stored) + Backend (R2) |
| **Location (GPS)** | ✓ | Facility search | NOT stored (ephemeral) |
| **Scan History** | ✓ | User reference | Local device only |
| **JWT Tokens** | ✓ | Authentication | Device secure storage |

#### What Data is NOT Collected

- ❌ Biometric data
- ❌ Health information
- ❌ Payment/billing info
- ❌ Device identifiers
- ❌ Analytics/tracking data
- ❌ Audio/video recordings

---

### 🌍 Third-Party Services Integration

| Service | Data Sent | Storage | Purpose |
|---------|-----------|---------|---------|
| **Google Gemini API** | Your photo (Base64 JPEG) | NOT stored by Google | Material identification |
| **Cloudflare R2** | Image files + metadata | YES (indefinite) | Cloud image storage |
| **Backend API** | User profile, scans, images | YES (MongoDB) | Service functionality |

---

### 📱 Permissions at a Glance

| Permission | Purpose | Required | Behavior if Denied |
|-----------|---------|----------|-------------------|
| **Camera** | Take photos of recyclables | No | User can use gallery instead |
| **Photo Library** | Upload existing photos | No | User can use camera instead |
| **Location (GPS)** | Find nearby facilities | No | Uses regional fallback data |

---

### 💾 Data Storage Locations

**On Your Device (Encrypted):**
- Access + Refresh Tokens → Secure Store (Keychain/Keystore)

**On Your Device (Plain Text):**
- Scan History (last 20) → AsyncStorage
- Temporary Images → Cache (cleared when app closes)

**On Backend Servers:**
- User Profile → MongoDB
- Analysis History → MongoDB
- Images → Cloudflare R2
- 2FA Records → MongoDB

---

### 🚨 Issues to Address Before Publishing

#### CRITICAL (Must Fix/Confirm)
1. **Confirm backend data retention policies**
2. **Implement account deletion feature** (not visible in app)
3. **Confirm encryption at rest** (databases, cloud storage)

#### HIGH PRIORITY (Should Fix)
4. **Add data export feature** (for GDPR/CCPA compliance)
5. **Implement certificate pinning** (HTTPS security enhancement)
6. **Add visible account deletion UI**

#### MEDIUM PRIORITY (Should Consider)
7. **Notify user on background image upload**
8. **Add upload opt-in toggle**
9. **Implement rate limiting** (if not already done)

---

### ✅ Checklist Before Publishing

**Security Review:**
- [ ] All API endpoints use HTTPS
- [ ] Tokens stored in secure storage
- [ ] Password not stored locally
- [ ] 2FA implementation working
- [ ] Token refresh working automatically
- [ ] Permission requests working

**Privacy Compliance:**
- [ ] Privacy Policy written and reviewed
- [ ] Google Play Console Data Safety form completed
- [ ] GDPR rights documented
- [ ] CCPA rights documented
- [ ] Data retention policies confirmed

**Backend Security:**
- [ ] Database encryption at rest
- [ ] HTTPS certificate validation
- [ ] Rate limiting on auth endpoints
- [ ] Password hashing implemented
- [ ] SQL injection protection
- [ ] CORS configured properly

**User Features:**
- [ ] Account deletion implemented
- [ ] Data export feature available
- [ ] Privacy policy accessible in app
- [ ] Permission revocation handling graceful
- [ ] Clear data/logout options

---

## DETAILED TECHNICAL ANALYSIS

---

## A. Application Data Flow

### End-to-End Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    EarnForRetirement Data Flow                  │
└─────────────────────────────────────────────────────────────────┘

1. AUTHENTICATION FLOW
   ┌──────────────┐
   │ User Device  │
   └──────┬───────┘
          │ Username + Password
          ▼
   ┌──────────────────┐
   │ Backend API      │
   │ /auth-login/     │
   └────────┬─────────┘
            │ JWT Tokens (access + refresh)
            ▼
   ┌──────────────────────────────┐
   │ Secure Device Storage         │
   │ (expo-secure-store)           │
   │ - Access Token (JWT)          │
   │ - Refresh Token (JWT)         │
   └──────────────────────────────┘

2. IMAGE ANALYSIS FLOW
   ┌──────────────────────┐
   │ User Captures Photo  │
   │ (Camera/Gallery)     │
   └──────────┬───────────┘
              │ Image File (URI)
              ▼
   ┌──────────────────────────┐
   │ Convert to Base64        │ (Local processing)
   │ (expo-file-system)       │
   └──────────┬───────────────┘
              │ Base64 Image Data
              ▼
   ┌──────────────────────────┐
   │ Google Gemini 1.5 Flash  │ (Direct API Call)
   │ Vision API               │
   └──────────┬───────────────┘
              │ JSON Analysis Result
              │ (Material, Weight, Confidence, etc.)
              ▼
   ┌──────────────────────────┐
   │ Display to User          │ (No storage initially)
   │ Show Estimated Value     │
   └──────────────────────────┘
              │
              ├──→ Save to Local History (AsyncStorage)
              │    [Max 20 items - ephemeral]
              │
              └──→ BACKGROUND UPLOAD
                   Image + Metadata to Backend
                   → Cloudflare R2 (image bytes)
                   → MongoDB (metadata)
                   [SILENT - failure doesn't affect UX]

3. LOCATION/FACILITY SEARCH FLOW
   ┌──────────────────────┐
   │ User Requests         │
   │ Nearby Facilities     │
   └──────────┬────────────┘
              │ Request permission
              ▼
   ┌──────────────────────┐
   │ Device GPS           │
   │ (expo-location)      │
   └──────────┬────────────┘
              │ Latitude + Longitude
              ▼
   ┌──────────────────────────────┐
   │ Query Facilities             │
   │ [Mock Data or Backend API]   │
   └──────────┬───────────────────┘
              │ Facility List
              ▼
   ┌──────────────────────┐
   │ Display to User      │
   │ (No persistent save) │
   └──────────────────────┘

4. TOKEN REFRESH FLOW (Automatic)
   ┌──────────────────────┐
   │ API Call Fails (401) │
   └──────────┬───────────┘
              │ Interceptor Triggered
              ▼
   ┌──────────────────────────────┐
   │ Retrieve Refresh Token       │
   │ from Secure Store            │
   └──────────┬───────────────────┘
              │ POST /auth-token/refresh/
              ▼
   ┌──────────────────────┐
   │ Backend API          │
   └──────────┬───────────┘
              │ New Access Token
              ▼
   ┌──────────────────────────────┐
   │ Update Secure Store          │
   │ Retry Original Request       │
   └──────────────────────────────┘
```

### Key Data Movement Points

| Flow | Source | Destination | Content | Encrypted | Notes |
|------|--------|-------------|---------|-----------|-------|
| Login | User Credentials | Backend API | Username, Password | HTTPS | One-way over HTTPS; password hashed server-side |
| Tokens | Backend | Device Secure Storage | JWT (Access + Refresh) | Platform Keychain/Keystore | Used for subsequent API calls |
| Images | Device Camera/Gallery | Gemini API | Base64 JPEG Image | HTTPS | Gemini does NOT store images; deleted after analysis |
| Gemini Result | Gemini API | Local Memory | JSON Analysis Data | In-Memory | Parsed and displayed immediately |
| Image + Metadata | Local Device | Backend + R2 | Image file + material info | HTTPS | Background upload; optional; doesn't block UX |
| Location | Device GPS | Backend API (optional) | Lat/Lng | HTTPS | Only if backend facility search enabled |
| Scan History | Device Local Storage | AsyncStorage | Image URI + analysis summary | Platform-dependent | Not encrypted; volatile; max 20 items |

---

## B. Data Inventory

| Data Type | Collected | Processed | Stored Locally | Stored Remotely | Purpose | Destination | Evidence |
|-----------|-----------|-----------|-----------------|-----------------|---------|-------------|----------|
| **Username** | ✓ | ✓ | ✗ | ✓ | User identification | Backend API | `authService.ts` login endpoint |
| **Password** | ✓ | ✗ | ✗ | ✓ | Authentication | Backend API (hashed) | `authService.ts` POST /auth-login/ |
| **Email Address** | ✓ | ✓ | ✗ | ✓ | 2FA verification, user contact | Backend + Verification System | `authService.ts` 2FA endpoints |
| **Phone Number** | ✓ | ✗ | ✗ | ✓ | User profile data | Backend MongoDB | `types/models.ts` LoggedInUser interface |
| **Address** | ✓ | ✗ | ✗ | ✓ | User profile data | Backend MongoDB | `types/models.ts` LoggedInUser interface |
| **First & Last Name** | ✓ | ✗ | ✗ | ✓ | User profile data | Backend MongoDB | `types/models.ts` LoggedInUser interface |
| **Company Registration IDs** | ✓ | ✗ | ✗ | ✓ | Account association | Backend MongoDB | `types/models.ts` LoggedInUser interface |
| **Access Token (JWT)** | ✗ | ✓ | ✓ | ✗ | Authentication header | Device Secure Store | `authService.ts` TOKEN_KEYS.ACCESS |
| **Refresh Token (JWT)** | ✗ | ✓ | ✓ | ✗ | Token refresh | Device Secure Store | `authService.ts` TOKEN_KEYS.REFRESH |
| **Photos/Images** | ✓ | ✓ | Temporary* | ✓ | Material identification via AI | Gemini API → Cloudflare R2 | `app/index.tsx`, `aiService.ts`, `analyzing.tsx` |
| **Image Base64 Data** | ✓ | ✓ | Temporary* | ✗ | Gemini API transmission | Gemini API (ephemeral) | `aiService.ts` uriToBase64() |
| **Material Analysis Result** | ✗ | ✓ | ✓ | ✓ | Display & history | Local AsyncStorage + Backend | `types/models.ts` MaterialAnalysis, `storage.ts` |
| **Material Name** | ✗ | ✓ | ✓ | ✓ | User result display | AsyncStorage + Backend/R2 | `result.tsx`, `storage.ts`, `analyzing.tsx` |
| **Estimated Weight (kg)** | ✗ | ✓ | ✓ | ✓ | Value calculation display | AsyncStorage + Backend/R2 | `aiService.ts` estimation logic |
| **Price Estimates (USD)** | ✗ | ✓ | ✓ | ✓ | Earning prediction | AsyncStorage + Backend/R2 | `aiService.ts` PRICE_PER_KG lookup |
| **Confidence Score** | ✗ | ✓ | ✓ | ✓ | Accuracy indicator | AsyncStorage + Backend/R2 | `aiService.ts` gemini result mapping |
| **Device Location (GPS)** | ✓ | ✓ | ✗ | Conditional† | Facility proximity search | Backend API | `facilities.tsx` requestForegroundPermissionsAsync() |
| **Latitude/Longitude** | ✓ | ✓ | ✗ | Conditional† | Facility distance calculation | Backend API or local mock | `recyclingService.ts` getNearbyFacilities() |
| **Scan History Metadata** | ✗ | ✓ | ✓ | ✗ | Recent activity display | AsyncStorage | `utils/storage.ts`, `app/index.tsx` |
| **Image URI (Local Path)** | ✗ | ✓ | ✓ | ✗ | Load thumbnail in history | AsyncStorage | `types/models.ts` ScanHistoryItem |
| **Analysis Timestamp** | ✗ | ✓ | ✓ | ✓ | Record creation date | AsyncStorage + Backend | `result.tsx` Date.now(), `utils/storage.ts` |

**Legend:**
- `✓` = Yes / `✗` = No
- **Temporary* = Kept in device temporary storage during app session; deleted when app closes or navigates
- **Conditional† = Only sent if backend location search is enabled (`EXPO_PUBLIC_USE_BACKEND_LOCATIONS=true`)

### Data Retention by Storage Location

| Storage | Data Type | Retention Duration | User Control | Notes |
|---------|-----------|-------------------|---------------|-------|
| **Secure Store (Keychain/Keystore)** | JWT Tokens | Until logout or app uninstall | Manual logout function | System-managed encryption |
| **AsyncStorage** | Scan History | Max 20 items; persistent | Manual clear function | Plain text; readable by device owner |
| **AsyncStorage** | Last 20 scans | Application lifetime | Manual clear in future | No automatic expiry |
| **Backend (MongoDB)** | User Profile | Until account deletion | [REQUIRES CONFIRMATION] | Backend retention policy unknown |
| **Backend (MongoDB)** | Analysis History | Until account deletion | [REQUIRES CONFIRMATION] | Backend retention policy unknown |
| **Cloudflare R2** | Image Files | Until account deletion | [REQUIRES CONFIRMATION] | Tied to backend lifecycle |
| **Gemini API** | Image (Request Only) | Minutes (ephemeral) | None | Google's standard API retention |
| **Gemini API Response** | Analysis JSON | Not stored by Gemini | None | Local processing only |

---

## C. Permissions

| Permission | Platform | Used For | Code Location | Required/Optional | Evidence | Behavior |
|-----------|----------|----------|----------------|------------------|----------|----------|
| **CAMERA** | Android/iOS | Take photos of recyclables | `app/index.tsx` handleTakePhoto() | **Optional** | `expo-image-picker` plugin in app.json | Permission requested before camera launch; app continues if denied |
| **PHOTO_LIBRARY** / **PHOTO_LIBRARY_ADD_ONLY** | iOS | Access device photo gallery | `app/index.tsx` handleUploadPhoto() | **Optional** | `expo-image-picker` plugin in app.json | Permission requested; app continues if denied |
| **READ_MEDIA_IMAGES** (Android 13+) | Android | Access device photo gallery | `app/index.tsx` handleUploadPhoto() | **Optional** | `expo-image-picker` plugin in app.json | Permission requested; app continues if denied |
| **LOCATION_SERVICES** / **LOCATION** | iOS/Android | GPS for recycling facility search | `facilities.tsx` requestForegroundPermissionsAsync() | **Optional** | `expo-location` plugin in app.json | Location permission; graceful fallback if denied (uses fallback coordinates) |
| **INTERNET** | Android (implicit) | Network communication | Backend API calls | **Required** | `authService.ts`, `foodbankService.ts`, `recyclingService.ts` | All API calls require internet connectivity |
| **MODIFY_AUDIO_SETTINGS** | Android (implicit) | Haptic feedback | `expo-haptics` | **Optional** | Used in `app/index.tsx`, `result.tsx`, etc. | Haptic feedback on interactions |

### Permission Purpose Details

| Permission | Exact Purpose | Data Collected When Used | Permanent Access | Can Be Disabled |
|-----------|---------------|--------------------------|------------------|-----------------|
| **Camera** | Capture photo of recyclable material for AI analysis | Image bytes (temporary, analyzed by Gemini) | No - per request | Yes - gracefully |
| **Photo Library** | Select existing photo from device gallery | Image bytes (temporary, analyzed by Gemini) | No - per request | Yes - gracefully |
| **Location (Foreground)** | Get device GPS coordinates to find nearby recycling facilities | Current GPS coordinates only (not background tracking) | No - one-time per facility search | Yes - uses regional fallback |

---

## D. Third-Party Services

### Service Integration Summary

| Service | Purpose | Data Sent | Data Processing | Storage | Privacy Policy | Evidence |
|---------|---------|-----------|-----------------|---------|-----------------|----------|
| **Google Gemini 1.5 Flash Vision API** | AI analysis of recyclable materials from images | Base64-encoded JPEG image + prompt | Analyzed in-memory; JSON result returned | NO (ephemeral per Google's terms) | https://policies.google.com/privacy | `aiService.ts` callGeminiVision() |
| **Cloudflare R2** (via backend) | Cloud image storage for upload history | Image file bytes + metadata (title, description, category) | Stored as object in R2 bucket | YES (tied to backend) | [REQUIRES CONFIRMATION] | `foodbankService.ts` uploadFoodBankImage() |
| **Backend API** (Custom) | User authentication, token management, facility data | Username, password, email, location, scan metadata | Processed server-side; stored in MongoDB | YES (persistent) | [REQUIRES CONFIRMATION] | `authService.ts`, `recyclingService.ts` |
| **MongoDB** (Backend Database) | Persistent storage for user profiles, analysis records, facility data | User profile (name, email, phone, address), analysis metadata | Stored in database documents | YES (long-term) | [REQUIRES CONFIRMATION] | Backend infrastructure (not directly visible) |

### API Endpoints & Data Flows

#### Authentication Endpoints
```
POST /auth-login/
  Request: { username, password }
  Response: { access, refresh, needs_2fa, user: {...} }
  Status: 200 (success) or 403 (2FA required)

POST /auth-2fa/initiate/
  Request: { email, purpose: "login" }
  Response: { sent: true, email }
  Status: 200 (code sent to email)

POST /auth-2fa/verify/
  Request: { email, code }
  Response: { success, two_factor_valid_until }
  Status: 200 (verified)

POST /auth-token/refresh/
  Request: { refresh: "refresh_token" }
  Response: { access: "new_access_token" }
  Status: 200 (new token issued)
```

#### Image Management Endpoints
```
POST /foodbank/upload-image
  Request: FormData { file, title, description, category, uploaded_by }
  Response: { success, message, id, image_id, filename }
  Status: 200 (uploaded)
  
  Destination: Cloudflare R2 + MongoDB metadata

GET /foodbank/images?category=metal
  Request: Query parameter for category filter
  Response: Array of FoodBankImage metadata
  Status: 200

GET /foodbank/view-image/{id}
  Response: Image file (streams directly from R2)
  Status: 200

DELETE /foodbank/delete-image/{id}
  Request: Document ID
  Response: Success confirmation
  Status: 200
```

#### Facility Search Endpoints
```
POST /foodbank/nearby-locations
  Request: { latitude, longitude, materialType, radiusInKm, limit }
  Response: { success, data: [...NearbyLocation] }
  Status: 200
  
  Note: Only used if EXPO_PUBLIC_USE_BACKEND_LOCATIONS=true
        Otherwise uses local mock data (no backend call)
```

### External Service Risk Assessment

| Service | Risk Level | Justification | Data Sensitivity |
|---------|-----------|---------------|------------------|
| **Gemini API** | 🟡 Medium | Image sent unencrypted (though over HTTPS); not stored by Google | Medium (image content) |
| **Cloudflare R2** | 🔴 High | Images stored indefinitely on cloud storage; tied to account lifecycle | High (images + metadata) |
| **Backend API** | 🔴 High | Central authentication + personal data; entire auth flow depends on backend security | High (credentials, profile) |
| **MongoDB** | 🔴 High | Persistent database; contains all user records and analysis history | High (PII + analysis data) |

---

## E. Authentication

### Complete Authentication Workflow

#### 1. Initial Login Flow

```
┌─────────────────────────────────────────────────────┐
│ Step 1: User enters credentials on Login Screen    │
│ Username: "john_doe"                               │
│ Password: "••••••••"                               │
└─────────────────────────────────────────────────────┘
                    ↓
            isFormValid check (client-side)
                    ↓
         setLoading = true (UI feedback)
                    ↓
┌─────────────────────────────────────────────────────┐
│ Step 2: Call loginUser(username, password)         │
│ Endpoint: POST /auth-login/                        │
│ Body: { "username": "john_doe", "password": "pw" } │
│ Header: Content-Type: application/json             │
│ Transport: HTTPS                                   │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ Server Response (Branch A)                         │
│                                                    │
│ IF credentials are CORRECT & 2FA is STILL VALID:  │
│   Status 200 OK                                   │
│   Body: {                                         │
│     "access": "eyJhbGc...",    ← JWT token       │
│     "refresh": "eyJhbGc...",   ← Refresh token   │
│     "needs_2fa": false,                          │
│     "user": {                                    │
│       "id": 123,                                 │
│       "username": "john_doe",                    │
│       "email": "john@example.com",               │
│       "first_name": "John",                      │
│       "last_name": "Doe",                        │
│       "phone_number": "+1-555-0123",             │
│       "address": "123 Main St, City",            │
│       "role": "user",                            │
│       "company_registration_ids": []             │
│     }                                            │
│   }                                              │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ Step 3a (Success): Save tokens securely           │
│                                                    │
│ await saveTokens(access, refresh):                │
│   1. SecureStore.setItemAsync('auth_access_token', access_token)     │
│   2. SecureStore.setItemAsync('auth_refresh_token', refresh_token)   │
│                                                    │
│ Storage Location:                                 │
│   iOS: Keychain (encrypted by OS)                 │
│   Android: Keystore (encrypted by OS)             │
└─────────────────────────────────────────────────────┘
                    ↓
            Login Complete ✓
                    ↓
    router.replace('/') → Navigate to Home Screen
    (remove login from back stack)
```

#### 2. 2FA Required Flow

```
┌─────────────────────────────────────────────────────┐
│ Server Response (Branch B)                         │
│                                                    │
│ IF credentials are CORRECT but 2FA is EXPIRED/    │
│ FIRST TIME:                                       │
│   Status 403 Forbidden                            │
│   Body: {                                         │
│     "needs_2fa": true,                           │
│     "email": "john@example.com",                 │
│     "message": "Two-factor authentication required" │
│   }                                               │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ Step 3b (2FA): Initiate 2FA Email                 │
│                                                    │
│ await initiate2FA(email):                         │
│   Endpoint: POST /auth-2fa/initiate/              │
│   Body: { "email": "john@example.com",            │
│           "purpose": "login" }                    │
│   Server sends 6-digit code to user's email      │
│                                                    │
│   Response: { "sent": true, "email": "..." }     │
└─────────────────────────────────────────────────────┘
                    ↓
    router.push('/verify-2fa', {
      params: { email, username, password }
    })
                    ↓
┌─────────────────────────────────────────────────────┐
│ Step 4: User receives email with code             │
│ Enters 6-digit code on Verify-2FA Screen          │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ Step 5: Verify 2FA Code                           │
│                                                    │
│ await verify2FACode(email, code):                 │
│   Endpoint: POST /auth-2fa/verify/                │
│   Body: { "email": "john@example.com",            │
│           "code": "123456" }                      │
│   Status: 200 (valid) or error                    │
│                                                    │
│   Response: {                                     │
│     "success": true,                             │
│     "two_factor_valid_until": "2026-09-22T..."  │
│   }                                               │
│   (Device marked as 2FA-verified for 30 days)    │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ Step 6: Re-run loginUser() to get tokens          │
│                                                    │
│ const result = await loginUser(username, password)│
│   (This time: 2FA is valid on device)             │
│   Status: 200 OK → tokens returned                │
│   Proceed with Step 3a (save tokens)              │
└─────────────────────────────────────────────────────┘
```

### Token Storage & Security

| Component | Details |
|-----------|---------|
| **Storage Mechanism** | `expo-secure-store` (platform native) |
| **iOS Storage** | Keychain (OS-level encryption) |
| **Android Storage** | Keystore (OS-level encryption) |
| **Token Type** | JWT (JSON Web Token) |
| **Token Contents** | User ID, username, token type, expiration (payload) |
| **Access Token Lifetime** | [REQUIRES CONFIRMATION - not visible in code] |
| **Refresh Token Lifetime** | [REQUIRES CONFIRMATION - not visible in code] |
| **2FA Valid Duration** | 30 days (auto-verified per email) |
| **Token Deletion on Logout** | `await clearTokens()` removes both tokens |

### Token Refresh Interceptor

```typescript
// Automatic token refresh mechanism (from authService.ts)

Scenario: Access token expires during API call

  API Call Fails (401 Unauthorized)
           ↓
    Request Interceptor Triggered
           ↓
  Is Another Request Already Refreshing?
           ├─ YES: Queue this request
           │       Wait for refresh to complete
           │       Retry original request with new token
           │
           └─ NO: Proceed with refresh
                  ↓
           Retrieve Refresh Token from SecureStore
                  ↓
           POST /auth-token/refresh/
           { "refresh": "refresh_token_value" }
                  ↓
           Server Returns New Access Token
                  ↓
           Update SecureStore with New Token
                  ↓
           Retry Original Failed Request
                  ↓
           Return Result to User
```

### Security Features

✅ **Implemented:**
- JWT-based authentication (stateless)
- Secure token storage (Keychain/Keystore)
- Automatic token refresh with queue pattern (prevents race conditions)
- Password sent over HTTPS only (not stored locally)
- Access/Refresh token separation
- 2FA via email for enhanced security
- Request interceptor adds Authorization header automatically
- 401 response handling (automatic re-login on token expiry)

⚠️ **Potential Concerns:**
- [REQUIRES CONFIRMATION] Password hashing algorithm (assuming bcrypt or similar)
- [REQUIRES CONFIRMATION] HTTPS certificate pinning (not visible in code)
- [REQUIRES CONFIRMATION] Rate limiting on login/2FA endpoints
- [REQUIRES CONFIRMATION] Session/token timeout on server
- [REQUIRES CONFIRMATION] Whether tokens are rotated

---

## F. Storage and Retention

### Local Device Storage (App Level)

#### 1. Secure Store (Tokens - Encrypted)
```
Storage: expo-secure-store (Native Keychain/Keystore)
Keys:
  - auth_access_token
  - auth_refresh_token

Access Pattern: Automatic (interceptor adds to requests)
Encryption: OS-level (Keychain on iOS, Keystore on Android)
Retention: 
  - Until logout (manual deletion)
  - Until app uninstall
  - Until token refresh failure (automatic deletion)

Clearing:
  - Manual: clearTokens() function in authService.ts
  - Automatic: When refresh token is invalid
```

#### 2. AsyncStorage (Scan History - Plain Text)
```
Storage: @react-native-async-storage/async-storage
Keys:
  - @efr_scan_history

Data Structure:
  [{
    id: timestamp string
    imageUri: "file:///path/to/image"
    materialName: "Copper Wire"
    date: ISO 8601 string
    estimatedValue: number (USD)
    currency: "USD"
  }, ...]

Size Limit: Max 20 items (automatic trimming)
Encryption: None (plain text; readable by device owner)
Retention:
  - Until user clears history
  - Until app uninstall
  - Until manual `clearScanHistory()` call

Clearing:
  - Manual: clearScanHistory() function in storage.ts
  - Automatic: Items beyond 20 are trimmed on save
```

#### 3. Temporary Image Storage (Session Only)
```
Storage: Device File System (expo-file-system)
Location: App cache or temp directory (platform-dependent)
Content: Original image from camera/gallery
Retention:
  - During current app session only
  - Deleted when app closes or navigates away
  - Image passed as URI reference (not duplicated)

Processing:
  1. Image captured/selected
  2. Converted to Base64 for Gemini API
  3. Uploaded to backend (optional background task)
  4. No persistent local copy kept
```

### Backend/Remote Storage (Server Side)

#### 1. User Profile (MongoDB)
```
Database: MongoDB (Backend Infrastructure)
Table/Collection: users (assumed name)
Retention: [REQUIRES CONFIRMATION - NOT visible in code]

Stored Fields (from LoggedInUser interface):
  - id (User ID)
  - username
  - email
  - first_name
  - last_name
  - phone_number
  - address
  - role
  - company_registration_ids

Encryption: [REQUIRES CONFIRMATION]
Backup Policy: [REQUIRES CONFIRMATION]
Deletion: [REQUIRES CONFIRMATION - Account deletion process unclear]
Access Control: [REQUIRES CONFIRMATION]
```

#### 2. Analysis History (MongoDB + Cloudflare R2)
```
Database: MongoDB
Collection: scan_results (assumed)
Cloud Storage: Cloudflare R2 (Images)

Stored Per Scan:
  - Image File
    Location: Cloudflare R2 (object storage)
    Key: generated by R2
    Format: JPEG
    Encryption: [REQUIRES CONFIRMATION]
    
  - Metadata (MongoDB)
    - analysis_id (MongoDB _id)
    - user_id (User reference)
    - material_name
    - material_category
    - estimated_weight_kg
    - confidence_score
    - estimated_price_min
    - estimated_price_max
    - timestamp
    - upload_date
    - image_location (R2 key)

Retention Duration: [REQUIRES CONFIRMATION]
Backup Policy: [REQUIRES CONFIRMATION]
Deletion: [REQUIRES CONFIRMATION - When user deletes app/account]
Access Control: [REQUIRES CONFIRMATION]
User Access: Can delete individual images via `/foodbank/delete-image/{id}`
```

#### 3. 2FA Verification Records
```
Database: MongoDB (likely)
Stored Data:
  - email
  - verification_code (6-digit, likely hashed)
  - code_timestamp
  - verification_status
  - device_identifier (if applicable)
  - valid_until (30-day window)

Retention: [REQUIRES CONFIRMATION]
Cleanup: [REQUIRES CONFIRMATION - When/how expired codes are deleted]
Security: Codes should be one-time use only
```

### Data Retention Summary Table

| Data Type | Local Storage | Remote Storage | Retention Period | Deletion Method |
|-----------|---------------|-----------------|-----------------|-----------------|
| JWT Access Token | SecureStore (encrypted) | ✗ | Until logout or expiry | Automatic on expiry; Manual logout |
| JWT Refresh Token | SecureStore (encrypted) | ✗ | Until logout or expiry | Automatic on expiry; Manual logout |
| Scan History | AsyncStorage (plain text) | ✓ (MongoDB+R2) | 20 items local; [REQUIRES CONFIRMATION] remote | Manual `clearScanHistory()` |
| User Profile | ✗ | ✓ (MongoDB) | [REQUIRES CONFIRMATION] | [REQUIRES CONFIRMATION] account deletion |
| Photos | Temporary (session) | ✓ (Cloudflare R2) | Session only local; [REQUIRES CONFIRMATION] remote | Manual delete endpoint or account deletion |
| Metadata | ✗ | ✓ (MongoDB) | [REQUIRES CONFIRMATION] | [REQUIRES CONFIRMATION] account deletion |
| 2FA Codes | ✗ | ✓ (MongoDB) | During verification window | Automatic after 30 days or one-time use |
| Device Location (GPS) | ✗ | Conditional* | Per-request | Not stored; ephemeral |

**Legend:** `✓` = Yes / `✗` = No / `[REQUIRES CONFIRMATION]` = Unknown from code

---

## G. Google Play Data Safety Recommendations

### Data Categories & Declarations

Based on the application code analysis, here are the likely data safety declarations required for Google Play Console:

#### 1. **Personal Information**

| Information Type | Collected | Shared | Purpose | Required | Retention |
|---|---|---|---|---|---|
| Name | ✓ | Unlikely | Account identity | Optional | Account lifetime |
| Email Address | ✓ | Unlikely | Authentication & 2FA | Optional | Account lifetime |
| Phone Number | ✓ | Unlikely | User profile | Optional | Account lifetime |
| Physical Address | ✓ | Unlikely | User profile | Optional | Account lifetime |
| User ID | ✓ | Unlikely | Internal identification | Optional | Account lifetime |

**Declaration:**
- ✓ Name, email, phone, address collected for account management
- ✗ NOT shared with third parties except backend API
- Purpose: Authentication, user identification, 2FA verification
- Collection: Required for login; optional fields may be optional

#### 2. **Photos and Videos**

| Information Type | Collected | Shared | Purpose | Required | Processing |
|---|---|---|---|---|---|
| Photos (Recyclables) | ✓ | ✓ | Material identification | Optional | Sent to Google Gemini API |
| Photo Metadata | ✓ | ✓ | Tagging & organization | Optional | Stored in backend database |

**Declaration:**
- ✓ Photos collected via camera and gallery
- ✓ Photos shared with Google Gemini API for analysis
- ✓ Photos uploaded to backend server (Cloudflare R2)
- Purpose: AI-based material identification and value estimation
- Collection: User initiates (not automatic)
- Processing: Gemini processes in-transit only; not stored by Gemini
- Backend storage: Indefinite (user can delete individually)

#### 3. **Location Information**

| Information Type | Collected | Shared | Purpose | Required | Accuracy |
|---|---|---|---|---|---|
| GPS Coordinates | ✓ | Conditional* | Recycling facility search | Optional | Precise (actual GPS) |

**Declaration:**
- ✓ Location collected via device GPS (one-time per search)
- ✓ Location may be sent to backend if facility search uses cloud API
- Purpose: Find nearby recycling facilities
- Collection: User action triggers permission request
- Retention: Not stored (one-time calculation)
- Fallback: If permission denied, uses regional mock data
- *Conditional: Only if `EXPO_PUBLIC_USE_BACKEND_LOCATIONS=true`

#### 4. **Financial Information**

| Information Type | Collected | Shared | Purpose |
|---|---|---|---|
| Price Estimates | ✓ | ✓ | Showing earning potential |
| Pricing Data | ✗ | ✗ | Internal calculation only |

**Declaration:**
- ✓ Price estimates derived from AI analysis (not financial transactions)
- ✗ NO actual payment/billing information collected
- Purpose: Display estimated payout to user

---

### Data Processing Summary for Google Play

```
PRIMARY DATA PROCESSING ACTIVITIES:

1. AUTHENTICATION & ACCOUNT MANAGEMENT
   Data: Username, password, email, phone, address
   Purpose: User identification, security, 2FA
   Shared With: Backend only
   Retention: Account lifetime
   User Rights: [REQUIRES CONFIRMATION]
   Ephemeral: ✗ (persistent)

2. AI-BASED IMAGE ANALYSIS
   Data: Photos (as Base64)
   Purpose: Material identification
   Shared With: Google Gemini API (ephemeral)
   Retention: Gemini does NOT store
   User Rights: Can delete local copy; Backend deletion [REQUIRES CONFIRMATION]
   Ephemeral: ✓ (for Gemini; backend retention TBD)

3. LOCATION-BASED SERVICES
   Data: GPS coordinates (precise)
   Purpose: Facility proximity search
   Shared With: Backend API (conditional)
   Retention: Not stored (calculation only)
   User Rights: Can deny permission
   Ephemeral: ✓ (one-time per request)

4. RESULT STORAGE & HISTORY
   Data: Scan results, metadata, image links
   Purpose: User history and reference
   Shared With: Backend database
   Retention: [REQUIRES CONFIRMATION]
   User Rights: Can delete individual items
   Ephemeral: ✗ (persistent)
```

### Risk Assessment for Google Play

| Risk Factor | Level | Issue | Mitigation |
|---|---|---|---|
| **Biometric Data** | 🟢 None | App doesn't collect fingerprint/face | N/A |
| **Health Data** | 🟢 None | No health/medical information | N/A |
| **Financial Data** | 🟢 None | No payment information (price estimates only) | N/A |
| **Identity Data** | 🟡 Medium | Collects name, email, phone, address | All encrypted over HTTPS; backend security [REQUIRES CONFIRMATION] |
| **Image Data** | 🟡 Medium | Collects photos of recyclables | Sent to Gemini (temporary); backend storage indefinite |
| **Location Data** | 🟡 Medium | Collects GPS coordinates | Only when user requests facility search; not stored |
| **Authentication** | 🟡 Medium | Username/password authentication | Tokens stored securely; 2FA implemented |

### Questions Requiring Backend Team Confirmation

Before finalizing Google Play Data Safety declaration, confirm:

1. **User Profile Retention**
   - How long is user data retained after account deletion?
   - Is data permanently deleted or archived?

2. **Image Storage**
   - How long are uploaded images retained on Cloudflare R2?
   - Can users request deletion of all their images?
   - Is there an automatic retention period?

3. **Analysis History**
   - Is scan history retrievable by users?
   - Is there an export/download feature?
   - How is data handled if company goes offline?

4. **Data Sharing**
   - Is any user data sold, shared, or rented to third parties?
   - Is data used for targeted advertising?
   - Is data shared with analytics services (Google Analytics, etc.)?

5. **Data Security**
   - What encryption is used for data in transit and at rest?
   - Is HTTPS certificate pinning implemented?
   - What are the backup/disaster recovery procedures?

6. **Deletion Rights**
   - Do users have a "delete my account" feature?
   - Is deletion permanent and immediate, or delayed?
   - Can users export their data before deletion?

---

## H. Privacy & Security Issues

### ✅ Strengths

1. **Secure Token Storage**
   - ✓ Uses `expo-secure-store` (native Keychain/Keystore)
   - ✓ NOT stored in AsyncStorage (which is plain text)
   - ✓ Automatic token refresh prevents stale tokens

2. **Proper HTTPS Usage**
   - ✓ All API calls use HTTPS
   - ✓ No hardcoded HTTP endpoints

3. **2FA Implementation**
   - ✓ Email-based 2FA for added security
   - ✓ 30-day device verification window
   - ✓ One-time verification code

4. **Image Processing**
   - ✓ Images sent to Gemini for analysis (not stored by Gemini)
   - ✓ Images converted to Base64 (no external dependencies for processing)
   - ✓ Optional background upload (doesn't block UX)

5. **Permission Management**
   - ✓ All permissions are optional
   - ✓ Graceful degradation when permissions denied
   - ✓ Permission requests before access (user notified)

6. **Session Management**
   - ✓ Auth guard on home screen redirects to login if no token
   - ✓ Router.replace() prevents back navigation to login

### ⚠️ Concerns & Recommendations

#### **CRITICAL - Requires Immediate Clarification**

1. **Backend Data Retention Policy [CRITICAL]**
   - **Issue:** Code does not specify how long user data, images, and analysis are retained on backend
   - **Risk:** Users may believe data is deleted but it persists indefinitely
   - **Required:** Confirm with backend team:
     - Data retention period (e.g., 30 days, 1 year, indefinite)
     - Automatic deletion schedule
     - User deletion request handling
   - **For Privacy Policy:** "User data is retained for [X period] after account deletion"

2. **Image Storage on Cloudflare R2 [CRITICAL]**
   - **Issue:** App uploads images to R2 background (silently, without explicit user consent confirmation)
   - **Risk:** Users might not realize images are stored permanently on cloud
   - **Current Behavior:** Upload failure doesn't block user experience (good UX, but silent)
   - **Required:** Clarify:
     - Should upload be opt-in or automatic?
     - Should users be notified when upload fails?
     - Can users see/delete uploaded images?
   - **For Privacy Policy:** "Images are stored in cloud storage for [X period]; you can delete them via the app"

3. **Data Encryption at Rest [CRITICAL]**
   - **Issue:** Unknown whether backend data is encrypted
   - **Current:** Only in-transit encryption (HTTPS) is confirmed
   - **Required:** Confirm:
     - Are MongoDB documents encrypted?
     - Are files in Cloudflare R2 encrypted?
     - What encryption algorithm (AES-256, etc.)?
   - **For Privacy Policy:** "All data is encrypted using [encryption method]"

#### **HIGH PRIORITY**

4. **Password Hashing Algorithm**
   - **Issue:** Code doesn't show how backend hashes passwords
   - **Assumption:** Must be bcrypt or similar
   - **Required:** Confirm backend uses industry-standard hashing (bcrypt, Argon2, etc.)
   - **Recommendation:** Document in backend code comments

5. **HTTPS Certificate Pinning**
   - **Issue:** No certificate pinning visible in code
   - **Risk:** Man-in-the-middle (MITM) attacks possible if CA compromised
   - **Recommendation:** Implement certificate pinning for API endpoints
   - **Impact on Privacy Policy:** If pinning is used, mention "certificate validation"

6. **Rate Limiting on Auth Endpoints**
   - **Issue:** Code doesn't show rate limiting implementation
   - **Risk:** Brute force attacks on login/2FA possible
   - **Current:** 429 status code handling in `initiate2FA()` suggests backend rate limiting exists
   - **Required:** Confirm rate limits:
     - Login attempts: 5 attempts per 15 minutes?
     - 2FA code requests: 3 per hour?
     - 2FA code verification: 5 attempts per 24 hours?

7. **Device Fingerprinting / Session Binding**
   - **Issue:** 2FA appears to be email-based only, not device-based
   - **Risk:** If attacker knows email, they could request 2FA code
   - **Current:** Device verified for 30 days after 2FA
   - **Question:** Is device identifier included in token? Is token bound to device?
   - **Recommendation:** Consider device fingerprinting or IP binding

#### **MEDIUM PRIORITY**

8. **Scan History Not Encrypted**
   - **Issue:** AsyncStorage (scan history) is plain text
   - **Risk:** Low (scan history is non-sensitive); but any user with device access can view
   - **Current:** By design (quick access)
   - **Recommendation:** Document in privacy policy: "Local scan history is not encrypted"

9. **Image URI Stored in AsyncStorage**
   - **Issue:** Image URIs point to app's temp/cache directory
   - **Risk:** Very low (URI changes per session; images deleted when app closes)
   - **Current:** OK; addresses are temporary file paths
   - **Recommendation:** Ensure temp files are cleared on app close (may be automatic)

10. **Gemini API Key in Environment Variable**
    - **Issue:** `EXPO_PUBLIC_GEMINI_API_KEY` is environment variable (public)
    - **Risk:** MEDIUM - If committed to version control, key is exposed
    - **Current:** Good practice (using env var); but "EXPO_PUBLIC" prefix makes it accessible to client
    - **Recommendation:** 
      - ✓ DO NOT commit `.env` file to git
      - ✓ Rotate key if ever accidentally exposed
      - ✓ Consider rate limiting by API key on backend
      - ✓ Consider proxying Gemini calls through backend (backend auth to Gemini)

11. **No User Consent Before Image Upload**
    - **Issue:** Background image upload doesn't explicitly confirm to user
    - **Current:** Upload is silent and non-blocking
    - **Risk:** Users may not realize images are stored on cloud
    - **Recommendation:** 
      - Add toggle for "Upload scans to cloud" in settings (with default)
      - OR notify user after successful scan: "Scan saved to cloud"
      - Consider explicit opt-in for privacy-conscious users

12. **No Data Export / Portability Feature**
    - **Issue:** Users cannot export their data (scan history, images, profile)
    - **Risk:** Affects GDPR Article 20 (right to data portability)
    - **Current:** App allows individual image deletion only
    - **Recommendation:** Add feature to:
      - Export all scan history as CSV/JSON
      - Download all user images as ZIP
      - Export user profile data

13. **Account Deletion Not Visible in Code**
    - **Issue:** App doesn't show account deletion endpoint
    - **Risk:** Users may not be able to delete their account
    - **Current:** Only logout is implemented
    - **Recommendation:** 
      - Add account deletion option in settings
      - Implement DELETE /api/auth/account endpoint
      - Require 2FA confirmation for deletion

---

## I. Final Privacy Policy

**[APP NAME]**: EarnForRetirement  
**[DEVELOPER]**: RN Robots  
**[EFFECTIVE DATE]**: [INSERT DATE]  
**[LAST UPDATED]**: August 23, 2026

---

# Privacy Policy

## 1. Introduction

Welcome to **EarnForRetirement** (the "**App**"). We are committed to protecting your privacy and ensuring you understand our data practices. This Privacy Policy explains how we collect, use, process, store, and protect your information when you use our mobile application.

By downloading and using EarnForRetirement, you agree to the terms of this Privacy Policy. If you do not agree with our practices, please do not use the App.

## 2. What Information We Collect

### 2.1 Information You Provide Directly

**Account Registration:**
- Username
- Email address
- Password (encrypted and never stored by the App)
- First and last name
- Phone number
- Physical address
- Company registration IDs (if applicable)

**During 2FA Verification:**
- Email address (to receive 6-digit verification code)
- Verification code (transmitted but not stored on device)

### 2.2 Information Collected Automatically

**Photos and Images:**
- Photos you take with your device camera
- Photos you select from your device gallery
- Used for AI-based material identification

**Location Information:**
- GPS coordinates (latitude/longitude)
- Collected only when you request nearby recycling facilities
- Your device will request permission before collecting location data

**Device Information:**
- We do not store device identifiers permanently
- Information used to support 2FA verification (30-day device verification window)

**Scan History:**
- Material names identified by the AI
- Estimated weight and value calculations
- Timestamps of your scans
- Stored locally on your device for your reference

### 2.3 Information NOT Collected

- Biometric data (fingerprint, face recognition)
- Health or medical information
- Payment or financial account details
- Browsing or app usage data
- Device IDFA or advertising identifiers
- Audio or video recordings

---

## 3. How We Use Your Information

### 3.1 Authentication & Security
- To create and maintain your account
- To verify your identity through 2FA (email verification)
- To issue and refresh authentication tokens
- To prevent unauthorized access

### 3.2 AI-Based Material Analysis
- To analyze photos of recyclable materials
- To provide material identification
- To estimate recyclable quantities and market values
- To generate preparation tips for recycling

### 3.3 Location-Based Services
- To find recycling facilities near your location
- To calculate distance and provide facility details
- To help you locate drop-off centers for your recyclables

### 3.4 Service Improvement
- To store your scan history for your reference
- To enable you to review past scans and estimates

---

## 4. Information You Provide to Us

### 4.1 Photos and Images

**How photos are processed:**
1. You take or upload a photo through the App
2. The photo is converted to secure format for analysis
3. The photo is sent to **Google Gemini API** for material identification
4. Google Gemini returns analysis results (material type, weight estimate, confidence score)
5. **Google does NOT store your image** — it is processed and immediately discarded
6. The analysis results are displayed to you immediately

**Optional: Background Cloud Upload**
- After analysis is complete, your photo may be uploaded to our cloud storage
- This upload is silent and does not block your ability to see results
- If upload fails, you will still see your analysis results
- You can delete uploaded images through the App at any time

### 4.2 Location Data

**Permission & Collection:**
- The App will request your permission before accessing GPS
- You can deny permission — the App will continue working with default regional data
- Location is collected only when you request nearby facilities
- Location is NOT stored; it is used only for real-time facility search

---

## 5. Camera and Photo/Media Access

### 5.1 Camera Permission
- **Purpose:** To allow you to take photos of recyclable materials
- **When Requested:** When you tap "Take a Photo"
- **Required:** No — you can use gallery upload instead
- **Revocation:** You can disable in Settings anytime

### 5.2 Photo Library Permission
- **Purpose:** To allow you to select photos from your device
- **When Requested:** When you tap "Upload from Gallery"
- **Required:** No — you can use camera instead
- **Revocation:** You can disable in Settings anytime

### 5.3 Location Permission
- **Purpose:** To find recycling facilities near you
- **When Requested:** When you request "Find Facilities"
- **Required:** No — App uses regional fallback data if denied
- **Accuracy:** Precise GPS coordinates
- **Revocation:** You can disable in Settings anytime

---

## 6. Image and Document Processing

### 6.1 Image Analysis Flow
```
Your Device → Gemini API → Analysis Results → Your Screen
       ↓
   (Optional)
       ↓
   Cloud Storage (Backend)
```

### 6.2 Gemini API Processing
- **Service:** Google Gemini 1.5 Flash Vision
- **Data Sent:** Your image (Base64-encoded)
- **Data Stored by Google:** NO — images are not retained
- **Processing Time:** Images are analyzed and discarded within minutes
- **Your Control:** You choose which images to analyze

### 6.3 Cloud Storage (Backend)
- **Service:** Cloudflare R2 (cloud object storage)
- **Data Stored:** Your images + metadata (material name, upload date, category)
- **Retention:** [REQUIRES CONFIRMATION FROM BACKEND TEAM]
- **Your Control:** You can delete individual images through the App
- **Deletion:** Deleted images are removed from cloud storage

---

## 7. Location Information

### 7.1 How Location is Used
- To calculate distance to nearby recycling facilities
- To provide facilities sorted by distance
- To show facility location on map (future feature)

### 7.2 Location is Not Stored
- GPS coordinates are used for real-time calculation only
- We do not create a location history
- Each facility search request gets fresh location data

### 7.3 Permission Handling
- If you deny location permission, the App uses:
  - **Fallback Region:** Negombo, Sri Lanka (default)
  - **Mock Facilities:** Pre-loaded facility data for the region
- You can change location permission in device Settings

---

## 8. AI/Gemini Processing

### 8.1 What Gemini Does
- Analyzes images of recyclable materials
- Identifies material type (metal, plastic, glass, paper, unknown)
- Estimates material weight in kilograms
- Estimates market value based on weight and condition
- Provides recyclability information and preparation tips

### 8.2 What Google Does NOT Do
- ✗ Google does NOT store your images
- ✗ Google does NOT use images for training
- ✗ Google does NOT share images with third parties
- ✗ Google does NOT use images for advertising

### 8.3 Privacy of AI Analysis
- Images are transmitted over HTTPS (encrypted in transit)
- Gemini processes images in memory only
- Results are returned as JSON analysis data
- Your images are deleted from Gemini servers after processing

---

## 9. How We Share Information

### 9.1 Information Shared with Third Parties

**Google Gemini API:**
- What: Your photos (Base64-encoded JPEG)
- Why: AI-based material analysis
- Storage: Google does NOT store images
- Legal Basis: Your consent (per Terms & Conditions)
- Privacy: [Google's AI Privacy Policy](https://policies.google.com/privacy)

**Backend API Server:**
- What: User profile, scan history, analysis results
- Why: Account management, feature functionality
- Storage: YES (MongoDB database)
- Legal Basis: Service provision (authentication, user data)

**Cloudflare R2 Storage:**
- What: Your uploaded images and metadata
- Why: Cloud image storage and retrieval
- Storage: YES (indefinitely, until deleted)
- Legal Basis: Your consent (implicit by using upload feature)

### 9.2 Information NOT Shared
- ✗ We do NOT sell your data
- ✗ We do NOT share with advertisers
- ✗ We do NOT share with data brokers
- ✗ We do NOT share with unaffiliated third parties
- ✗ We do NOT use analytics services that track users

### 9.3 Legal Obligations
- We may disclose information if required by law (subpoena, court order)
- We may disclose to protect safety and legal rights
- We will notify you of legal requests when legally permissible

---

## 10. Third-Party Services

### 10.1 Google Gemini API
- **Service Provider:** Google LLC
- **Purpose:** AI image analysis
- **Data Sharing:** Images transmitted to Google servers
- **Retention:** Google does NOT retain images
- **Privacy Policy:** https://policies.google.com/privacy
- **Terms of Service:** https://ai.google.dev/terms

### 10.2 Cloudflare R2
- **Service Provider:** Cloudflare, Inc.
- **Purpose:** Image storage and CDN delivery
- **Data Sharing:** Images and metadata stored in R2
- **Retention:** As per your account retention settings
- **Privacy Policy:** https://www.cloudflare.com/privacypolicy/
- **Terms of Service:** https://www.cloudflare.com/terms/

### 10.3 Backend API (Custom Server)
- **Service Provider:** RN Robots (internal)
- **Purpose:** Authentication, database management, facility data
- **Data Sharing:** User profile, scan history, images
- **Retention:** [REQUIRES CONFIRMATION]
- **Privacy Policy:** This Policy

---

## 11. Data Storage and Retention

### 11.1 Local Device Storage

**Secure Token Storage (Encrypted):**
- **Data:** Access token, refresh token
- **Duration:** Until logout or app uninstall
- **Encryption:** OS-level (iOS Keychain, Android Keystore)
- **Deletion:** Automatic on logout or token expiry

**Scan History (Plain Text):**
- **Data:** Material names, estimates, dates, image thumbnails
- **Duration:** Until manual deletion or app uninstall
- **Encryption:** None (plain text, readable by device owner)
- **Limit:** Maximum 20 scan records; older scans automatically removed
- **Deletion:** Manual via App or automatic on uninstall

**Image Cache (Temporary):**
- **Data:** Original photo from camera/gallery
- **Duration:** During current app session only
- **Deletion:** Automatic when app closes

### 11.2 Remote Server Storage

**User Profile:**
- **Data:** Name, email, phone, address, username
- **Duration:** [REQUIRES CONFIRMATION - NOT visible in code]
- **Encryption:** [REQUIRES CONFIRMATION]
- **Deletion:** [REQUIRES CONFIRMATION - account deletion process unclear]

**Scan History & Images:**
- **Data:** Analysis results, image files
- **Duration:** [REQUIRES CONFIRMATION - NOT visible in code]
- **Encryption:** [REQUIRES CONFIRMATION]
- **Deletion:** Individual images can be deleted via App

**2FA Verification Records:**
- **Data:** Email, verification codes, verification timestamp
- **Duration:** 30-day device verification window; code expires after use
- **Encryption:** [REQUIRES CONFIRMATION]
- **Deletion:** Automatic after expiry or one-time use

---

## 12. Data Security

### 12.1 Security Measures Implemented

✅ **Encryption in Transit**
- All API communications use HTTPS (TLS 1.2+)
- Passwords transmitted over encrypted connection only

✅ **Secure Token Storage**
- Authentication tokens stored in device's native secure storage
- iOS: Keychain (OS-level encryption)
- Android: Keystore (OS-level encryption)
- Tokens never stored in plain text or AsyncStorage

✅ **Two-Factor Authentication**
- Email-based verification code (6 digits)
- Codes are one-time use only
- 30-day device verification window after successful 2FA

✅ **Automatic Token Refresh**
- Expired tokens automatically refreshed
- Failed refresh triggers automatic logout
- Prevents token reuse attacks

✅ **Permission-Based Access**
- App requests permissions before accessing camera, photos, location
- Users can revoke permissions at any time

### 12.2 Security Limitations

⚠️ **[REQUIRES CONFIRMATION]**
- Database encryption at rest (MongoDB)
- Cloud storage encryption at rest (Cloudflare R2)
- HTTPS certificate pinning implementation
- Password hashing algorithm used
- Rate limiting on authentication endpoints
- Session binding and device fingerprinting

### 12.3 What You Can Do
- Use a strong, unique password
- Enable 2FA verification
- Never share your login credentials
- Use your device's lock screen (PIN/biometric)
- Keep your device and App updated
- Revoke permissions you don't need

---

## 13. User Rights and Choices

### 13.1 Your Rights

**Right to Access:**
- You can view your scan history in the App
- You can access your profile information [REQUIRES CONFIRMATION if accessible]

**Right to Delete:**
- You can manually delete individual scan items
- You can request deletion of uploaded images
- [REQUIRES CONFIRMATION] Account deletion may be available in settings

**Right to Opt-Out:**
- You can deny camera permission (use gallery instead)
- You can deny photo library permission (use camera instead)
- You can deny location permission (use regional fallback)

**Right to Withdraw Consent:**
- You can uncheck "allow uploads to cloud" [REQUIRES CONFIRMATION if feature exists]
- You can revoke device permissions at any time in Settings

### 13.2 Exercising Your Rights

**To Delete Scan History:**
1. Go to Home screen
2. [Settings/History menu - exact location TBD]
3. Select "Clear Scan History"

**To Delete Individual Scans:**
1. Go to Home screen
2. Swipe or long-press on scan item [UX TBD]
3. Select "Delete"

**To Delete Uploaded Images:**
1. Go to [Image Gallery/History screen - feature TBD]
2. Select image
3. Choose "Delete from Cloud"

**To Delete Your Account:**
[REQUIRES CONFIRMATION - DELETE ACCOUNT FEATURE NOT VISIBLE IN CODE]

### 13.3 Data Portability

- [REQUIRES CONFIRMATION] Export scan history as JSON/CSV
- [REQUIRES CONFIRMATION] Download all images as ZIP
- Contact us for manual data export

---

## 14. Data Deletion

### 14.1 What Happens When You Delete Data

**Deleting Scan History:**
- Local copy removed immediately
- Cannot be recovered from device
- [REQUIRES CONFIRMATION] Remote copy deletion (if applicable)

**Deleting Individual Images:**
- Local thumbnail removed
- Cloud copy deleted from R2 [REQUIRES CONFIRMATION - immediate or delayed?]
- [REQUIRES CONFIRMATION] Metadata retention period

**Logging Out:**
- Access token removed from device
- Refresh token removed from device
- Previous scans still saved (to retrieve on re-login)
- [REQUIRES CONFIRMATION] Server-side session termination

**Uninstalling App:**
- All local data deleted automatically
- Cloud data remains (associated with your account)
- [REQUIRES CONFIRMATION] Account data retention policy

### 14.2 Account Deletion

[REQUIRES CONFIRMATION - COMPLETE ACCOUNT DELETION WORKFLOW]

When you delete your account:
- [ ] Username and password credentials removed
- [ ] Profile data (name, email, phone, address) removed
- [ ] All scans and images deleted from cloud storage
- [ ] 2FA records cleared
- [ ] Tokens invalidated
- [ ] Timeline: [REQUIRES CONFIRMATION - immediate or 30-day delay?]

**To Delete Your Account:**
[REQUIRES CONFIRMATION - MENU LOCATION AND PROCESS]

---

## 15. Children's Privacy

### 15.1 Our Commitment

EarnForRetirement is NOT intended for children under 13 years old (or the legal age in your jurisdiction). We do not knowingly collect information from children.

### 15.2 If We Learn of Child Data Collection

If we become aware that we have collected information from a child under 13, we will:
- Immediately delete such information
- Notify the parent/guardian if possible
- Comply with COPPA (Children's Online Privacy Protection Act)

### 15.3 Parental Controls

If a child is using the App with parental permission:
- Parents should monitor and control App usage
- Parents can use device-level parental controls to restrict App access
- Parents can revoke camera and location permissions

---

## 16. International Data Transfers

### 16.1 Data Processing Locations

Our servers and third-party services process data in multiple locations:
- **Backend Infrastructure:** [REQUIRES CONFIRMATION - Data center location]
- **Cloudflare R2:** [REQUIRES CONFIRMATION - Multiple global regions]
- **Google Gemini API:** Google's global infrastructure

### 16.2 Data Protection Outside Your Country

If you are located outside the United States:
- Your data may be transferred to countries with different privacy laws
- By using the App, you consent to such transfers
- We will implement appropriate safeguards:
  - HTTPS encryption
  - Secure token storage
  - Third-party privacy commitments

### 16.3 GDPR Compliance (EU/UK Users)

**GDPR Legal Basis:**
- Performance of contract (account management)
- User consent (image analysis and upload)
- Legitimate interest (service improvement)

**GDPR Rights:**
- Right to access your data
- Right to correct inaccurate data
- Right to be forgotten (right to deletion)
- Right to data portability
- Right to withdraw consent
- Right to lodge a complaint with your data protection authority

**EU Data Protection Authority:**
- For EU data subjects: Contact your national data protection authority
- For UK data subjects: [Information Commissioner's Office (ICO)](https://ico.org.uk)

---

## 17. Changes to This Privacy Policy

### 17.1 Updates and Notifications

We may update this Privacy Policy from time to time to:
- Reflect changes in our data practices
- Respond to legal or regulatory requirements
- Improve clarity or accuracy

### 17.2 How We Notify You

**For Material Changes:**
- We will notify you via email (to the email address on file)
- We will display a prominent notice in the App
- We may require your consent before the changes take effect

**For Minor Updates:**
- We may update without notice
- "Last Updated" date at the top of this policy will change

### 17.3 Your Acceptance

By continuing to use the App after changes are posted, you accept the updated Privacy Policy.

---

## 18. Contact Information

### 18.1 Questions About This Privacy Policy

If you have questions, concerns, or requests regarding your privacy or this policy, please contact us:

**Email:** [INSERT CONTACT EMAIL]  
**Company:** RN Robots  
**Mailing Address:** [INSERT MAILING ADDRESS]  
**Website:** [INSERT WEBSITE URL]  

**Response Time:** We will respond to privacy inquiries within 30 days.

### 18.2 Data Subject Requests (GDPR/CCPA)

To submit a formal data subject request:
1. Email us with "Data Subject Request" in the subject line
2. Include: Your account email, type of request (access/delete/portability)
3. Include proof of identity if requested
4. We will respond within 30-45 days per legal requirements

### 18.3 Privacy Complaints

If you believe we have violated your privacy:
1. Contact us first (see above)
2. If unsatisfied, you may lodge a complaint with your data protection authority
3. EU Users: Contact your national DPA or [EDPB](https://edpb.ec.europa.eu/)
4. UK Users: Contact [ICO](https://ico.org.uk)
5. California Users: Contact [CCPA Attorney General](https://oag.ca.gov)

---

## 19. Summary of Key Points

**What We Collect:**
- Account information (name, email, phone, address)
- Photos of recyclable materials
- Your location (only for facility search)
- Scan history (stored on your device)

**What We Do:**
- Authenticate your account with 2FA
- Send photos to Google Gemini for AI analysis
- Store images optionally on cloud storage
- Find nearby recycling facilities based on location

**What We DON'T Do:**
- Sell or share your data with advertisers
- Use your data for tracking or profiling
- Store your password
- Track your location history
- Collect health or biometric data

**Your Control:**
- Revoke camera, photos, or location permissions
- Delete individual or all scan history
- Delete uploaded images
- Logout anytime
- [REQUIRES CONFIRMATION] Delete your account

**Storage Security:**
- Passwords and tokens encrypted at rest
- All communications use HTTPS
- Local data can be deleted anytime
- Cloud data [REQUIRES CONFIRMATION] retention period

---

## 20. Appendix: Frequently Asked Questions (FAQ)

### Q: Does the App store my photos?
**A:** 
- Local: No (temporary, cleared after analysis)
- Google Gemini: No (analyzed and deleted immediately)
- Your cloud account: YES (optional background upload; you can delete)

### Q: Can Google use my photos for training?
**A:** No. Google Gemini API does not store or use images for training purposes.

### Q: Is my location tracked?
**A:** No. Location is collected only when you request facility search and is not stored.

### Q: How long is my data kept?
**A:** [REQUIRES CONFIRMATION - Contact backend team for retention policies]

### Q: Can I delete my account?
**A:** [REQUIRES CONFIRMATION - Feature may be available in Settings or Contact Support]

### Q: Is my data encrypted?
**A:** Yes, in transit (HTTPS). At rest: [REQUIRES CONFIRMATION]

### Q: Can I export my data?
**A:** [REQUIRES CONFIRMATION - Feature may be available or available upon request]

### Q: Who can see my scans?
**A:** Only you (and our backend for service functionality). Scans are never shared publicly.

### Q: Is the App free?
**A:** [REQUIRES CONFIRMATION - Pricing model]

### Q: Can I use the App without camera/location permission?
**A:** Yes. Camera and location are optional. You can use gallery upload and regional facility data instead.

---

## END OF PRIVACY POLICY

---

**Document Metadata:**
- **Author:** Privacy & Security Analysis
- **Date:** August 23, 2026
- **Status:** [DRAFT - Requires Backend Confirmation]
- **Approvals:** [PENDING]

