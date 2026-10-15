# EarnForRetirement: Complete App Workflow and Google Play Data Safety Inventory

> Read-only inventory prepared from the Expo mobile source, the mobile project
> documentation, and the FoodBank backend specification below. This document
> separates behavior implemented in the current mobile build from behavior
> described as a future backend design. Google Play Data Safety answers must be
> based on the production build, production configuration, backend logs, and
> provider retention policies.

## 1. Executive Summary

EarnForRetirement lets a user sign in, capture or select a photo of a recyclable
item, obtain an AI material analysis and estimated value, save a local scan
history, and find nearby recycling facilities.

The current mobile source contains two different data paths:

1. The image is converted to Base64 and sent directly from the mobile app to
   Google Gemini for vision analysis.
2. After analysis, the same image is uploaded in the background to the
   configured application backend. The backend specification says that images
   are stored in private Cloudflare R2 and metadata is stored in MongoDB.

The current mobile facility search uses OpenStreetMap Overpass directly. A
future backend contract proposes moving image analysis, pricing, and facility
search behind the application backend. These paths must not be treated as the
same implementation when completing Data Safety declarations.

## 2. Application Screens and User Journey

### 2.1 Startup and authentication

1. Expo Router starts the application.
2. The Home screen checks for an access token in Expo SecureStore.
3. If no token exists, the user is redirected to Login.
4. The user enters a username and password.
5. The app sends the credentials to the configured API base URL:

```text
POST /auth-login/
Content-Type: application/json
```

```json
{
  "username": "user-entered username",
  "password": "user-entered password"
}
```

6. A successful response can contain access and refresh tokens, 2FA validity,
   and a user profile.
7. The declared profile model includes `id`, `username`, `email`, `first_name`,
   `last_name`, `phone_number`, `address`, `role`, and
   `company_registration_ids`. The current UI does not collect or display all
   of these fields, so backend behavior must be verified separately.

### 2.2 Two-factor authentication

If the server returns `needs_2fa: true`:

1. The app receives the user's email address.
2. It requests an email code:

```text
POST /auth-2fa/initiate/
```

```json
{
  "email": "user@example.com",
  "purpose": "login"
}
```

3. The backend sends a six-digit code to the email address.
4. The user enters the code in the app.
5. The app verifies it:

```text
POST /auth-2fa/verify/
```

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

6. The app submits the username and password again to obtain tokens.
7. Access and refresh tokens are stored in SecureStore.

The username and password are passed as navigation parameters from Login to the
2FA screen. They are not saved in AsyncStorage, but temporarily exist in
navigation state and memory.

### 2.3 Token storage and refresh

The app stores these values locally using Expo SecureStore, backed by Android
Keystore or iOS Keychain:

- Access token
- Refresh token

The access token is attached to API requests as a Bearer token. If a request
returns HTTP 401, the app sends the refresh token to:

```text
POST /auth-token/refresh/
```

The new access token is stored and the failed request is retried. If refresh
fails, both tokens are deleted. A `clearTokens()` helper exists, but the current
UI does not expose a visible logout control.

### 2.4 Photo capture and selection

The user can:

- Take a photo using the camera.
- Select a photo from the device photo library.
- Retake the photo.
- Review the photo before analysis.
- Explicitly tap Analyze Item.

The app requests camera and photo-library permissions. Microphone permission is
disabled in the Expo configuration. The selected media is referenced by a local
device URI. The image picker requests approximately 85% quality and the upload
code labels the file as JPEG.

### 2.5 Current AI analysis path

In the current mobile implementation:

1. The app reads the local image file.
2. It converts the image to Base64.
3. It sends the image directly to Google Gemini using the Google Generative AI
   SDK and the configured mobile environment key.
4. The prompt asks Gemini to return JSON containing:
   - `isRecyclable`
   - `materialCategory`
   - `materialName`
   - `condition`
   - `estimatedWeightKg`
   - `confidenceScore`
   - `rejectionReason`
5. The mobile app parses the response.
6. The mobile app calculates the estimated price using an embedded price table,
   condition multiplier, and USD currency.
7. The mobile app generates recyclability notes and preparation tips locally.

The code currently requests the model name `gemini-3.6-flash`, although some
comments describe Gemini 1.5 Flash. The deployed model and Google retention
settings must be confirmed.

### 2.6 Current background image upload

After AI analysis succeeds, the app starts a non-blocking upload to the
configured application backend:

```text
POST /foodbank/upload-image
Content-Type: multipart/form-data
```

Current multipart fields:

```text
file         image binary
title        detected material name
description  generated recyclability note
category     detected material category
uploaded_by  not currently supplied by the mobile screen
```

The upload uses plain Axios and currently does not attach the user's access
token. Upload failure is logged silently and does not prevent the result screen
from appearing.

According to the backend specification below, the backend stores the image in
private Cloudflare R2 and stores metadata, AI output, and pricing data in
MongoDB. The backend can also send the image to Gemini server-side.

### 2.7 Result and local scan history

The result screen displays:

- Original image thumbnail
- Material name and category
- Condition
- Estimated weight or quantity
- AI confidence
- Estimated minimum and maximum value
- Currency
- Recyclability status
- Rejection reason, when present
- Recyclability explanation
- Preparation tips

The app saves up to 20 scan records in AsyncStorage under
`@efr_scan_history`. Each record contains:

```json
{
  "id": "timestamp",
  "imageUri": "local device URI",
  "materialName": "PET Water Bottle",
  "date": "ISO timestamp",
  "estimatedValue": 0.04,
  "currency": "USD"
}
```

The current mobile source does not synchronize this history with the backend.
The stored image URI may allow the device-local thumbnail to be displayed again;
the image bytes are not copied into the history JSON itself.

### 2.8 Nearby facility search

When the user requests drop-off locations:

1. The app requests foreground location permission.
2. If granted, it reads the current latitude and longitude.
3. If denied, it uses development fallback coordinates for San Francisco.
4. The app sends the coordinates in a query to the OpenStreetMap Overpass API:

```text
GET https://overpass-api.de/api/interpreter?data=<encoded-query>
```

The query searches for recycling locations within approximately 5 km. The
mobile app locally calculates distances and extracts facility name, address,
accepted materials, opening-hours text, coordinates, and phone number.

OpenStreetMap Overpass receives the user's coordinates. It does not currently
receive the user's username, email, password, access token, or photo.

### 2.9 External directions and phone actions

When the user taps Directions, the app opens a Google Maps search URL containing
the selected facility's name and address.

When the user taps Call, the app opens the device phone application with the
facility phone number. The app itself does not place or record calls.

## 3. Data Inventory

| Data | Source | Current destination or storage | Purpose |
|---|---|---|---|
| Username | User login form | Application backend; temporary navigation state | Authentication |
| Password | User login form | Application backend over the configured API URL; temporary navigation state | Authentication |
| Email address | Backend response / 2FA flow | Application backend and email delivery provider used by backend | 2FA |
| 2FA code | User email and input | Application backend | Authentication |
| Access token | Backend response | SecureStore only | Authenticated requests |
| Refresh token | Backend response | SecureStore; sent to token refresh endpoint | Session renewal |
| Name, phone, address, role, registration IDs | Declared backend user model | Unknown; verify backend implementation | User profile/account |
| Photo of recyclable item | Camera or photo library | Google Gemini directly; application backend; intended R2 storage | AI analysis and image storage |
| Material name/category | Gemini result | Local result/history; backend upload metadata | Classification and facility context |
| Condition, weight, confidence, recyclability | Gemini result | Local result; backend may persist it | Analysis and pricing |
| Price estimate and tips | Mobile calculation currently; backend in future design | Local result/history; backend may persist it | User guidance |
| Precise latitude/longitude | Device location | OpenStreetMap Overpass currently; future backend endpoint may receive it | Nearby facilities |
| Facility name/address/phone | OpenStreetMap response | Displayed locally; Google Maps URL or phone app when selected | Directions and calling |
| Scan date and estimated value | Local app calculation | AsyncStorage only currently | Recent scan history |

## 4. Current Third-Party Services

- Google Gemini Generative AI: receives the recyclable-item image and prompt in
  the current mobile flow.
- Application backend: receives credentials, 2FA data, refresh tokens, and
  background image uploads.
- Cloudflare R2: intended backend storage for uploaded image bytes.
- MongoDB: intended backend storage for image metadata, AI output, and pricing.
- OpenStreetMap Overpass: receives coordinates for facility search.
- Google Maps: receives facility search text when Directions is selected.
- Device phone application: receives a facility phone number when Call is
  selected.
- Expo SecureStore: local token storage.
- React Native AsyncStorage: local scan history storage.

No active source-code integration was found for advertising, analytics,
Firebase, crash reporting, contacts, microphone, payments, Bluetooth, background
location, SMS, calendar, health data, or push notifications.

## 5. Future Backend-Driven Workflow

The separate project design proposes that the mobile app send the photo to:

```text
POST /api/v1/foodbank/analyze
```

The future backend would then:

1. Store or process the image.
2. Send the image to an LLM service.
3. Extract item name, material type, condition, contamination, size, and hazard
   status.
4. Send the classification to a pricing engine.
5. Calculate regional pricing and return the analysis and price range.
6. Receive a location request at:

```text
POST /api/v1/foodbank/nearby-locations
```

The future location payload is expected to contain latitude, longitude,
material type, radius, and result limit. The backend would return facility IDs,
names, addresses, contact numbers, distances, hours, coordinates, and accepted
materials.

This future design moves AI and pricing away from the mobile client, but the
backend and its AI/pricing providers would still process the image and analysis
data. It should replace, rather than silently coexist with, the current direct
Gemini and Overpass paths.

## 6. Candidate Google Play Data Safety Categories

The following are candidate categories for the AI to evaluate. They are not a
final legal or Play Console declaration.

- Personal information: username, email, name, phone number, address, and
  account identifiers if actually collected by the backend.
- Authentication information: password, 2FA code, access token, and refresh
  token. Tokens are stored locally, while credentials and 2FA values are sent to
  the authentication backend.
- Photos and videos: recyclable-item photos sent to Gemini and/or the backend,
  and potentially retained in Cloudflare R2.
- Location: precise foreground location sent to Overpass currently or to the
  future backend.
- App activity: scan results and scan history only if the future backend
  synchronizes them. Current history is local only.
- Device or other identifiers: declare only if production backend logs, SDKs, or
  analytics actually collect them.
- Diagnostics: declare only if a production crash-reporting or diagnostics SDK is
  added. Console logging alone is not such an SDK.

For each data category, determine:

1. Whether it leaves the device.
2. Whether the developer collects it.
3. Whether it is shared with another company.
4. Whether collection is required or optional.
5. The purpose of collection.
6. Whether it is encrypted in transit.
7. Retention duration and deletion behavior.
8. Whether users can delete the data or their account.

## 7. Questions Required Before Final Submission

1. Will production builds call Gemini directly, or only through the backend?
2. What production value is used for `EXPO_PUBLIC_API_BASE_URL`?
3. Are uploaded images retained in R2 permanently, temporarily, or until user
   deletion?
4. Are images and analysis results associated with a user account?
5. Does the backend log request bodies, IP addresses, coordinates, image IDs, or
   authentication events?
6. Which email provider sends 2FA codes, and what does it retain?
7. Does the backend send images to Gemini or another AI provider?
8. Will facility search remain with Overpass or move to the backend?
9. Will local scan history later synchronize across devices?
10. Can users delete their account, uploaded images, tokens, and scan history?
11. Are analytics, crash reporting, advertising, or push notifications planned
    before release?
12. Are all production endpoints HTTPS, and are third-party provider data
    processing and retention terms documented?

## 8. Source Evidence

Mobile workflow and screens:

- `app/_layout.tsx`
- `app/index.tsx`
- `app/login.tsx`
- `app/verify-2fa.tsx`
- `app/preview.tsx`
- `app/analyzing.tsx`
- `app/result.tsx`
- `app/facilities.tsx`

Services and storage:

- `services/authService.ts`
- `services/aiService.ts`
- `services/foodbankService.ts`
- `services/recyclingService.ts`
- `utils/storage.ts`
- `types/models.ts`

Configuration and architecture:

- `app.json`
- `package.json`
- `backend_developer.md`

---

# FoodBank Image Storage API

A standalone image-upload/retrieval API that stores images in **Cloudflare R2** under
the `FoodBank/` folder, completely separate from the PDF/Excel document pipeline
elsewhere in this backend. Metadata is kept in its own MongoDB collection
(`FoodBank`, database `pdf_database`), so it never mixes with `pdf_collection`.

Every upload is also run through **Gemini vision classification** and a
**pricing engine** — the item's material/condition/contamination get identified
and turned into an estimated LKR/kg price range, returned in the same response.
This AI step is wired into the FoodBank upload route only — the other image
pipelines in this backend (`data-capture/images`, `email-attachments/images`,
etc., which serve different companies/purposes) are untouched, so the AI+pricing
behavior is effectively exclusive to FoodBank without needing a separate
per-tenant auth/company-flag system that doesn't exist elsewhere in this file.

A second, related feature — geospatial search for nearby recycling/collection
centers — lives in its own small collection (`FoodBankLocations`) with no
dependency on the image/AI pipeline.

Implemented in `main.py` (search for `FoodBank Image Storage API`).

## Base URL

```
http://localhost:8003
```

The port comes from `PORT` in `.env` (defaults to `8003` if unset). Replace
`localhost:8003` below with your actual host/port (or the deployed URL) in every
example.

## How storage works

- Each uploaded image is written to Cloudflare R2 at a key shaped like:
  `<environment-prefix>/FoodBank/<random-uuid>/<original-filename>`
  (the `FoodBank/` segment comes from `prefix="FoodBank"` passed to the shared
  `CloudflareR2Storage.upload_bytes()` helper — the same helper already used for
  `data-capture/images`, `email-attachments/images`, etc., just with a different
  folder).
- The returned R2 object key is saved as `image_id` on a MongoDB document in the
  `FoodBank` collection, along with whatever metadata you sent.
- The bucket is **private** — there is no public HTTPS URL for an uploaded image.
  You always fetch the image back through this API (`GET /foodbank/view-image/{id}`),
  which streams the bytes from R2 through the backend.
- No authentication is enforced on these routes today (matching the rest of this
  backend — CORS is fully open and no auth dependency exists anywhere in
  `main.py`). Add auth before exposing this publicly if that's a concern.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/foodbank/upload-image` | Upload an image → stores it **and** returns AI classification + estimated price |
| GET | `/foodbank/images` | List uploaded images (metadata + AI/pricing) |
| GET | `/foodbank/view-image/{id}` | Stream an image's bytes back |
| DELETE | `/foodbank/delete-image/{id}` | Delete an image (R2 object + metadata) |
| POST | `/foodbank/locations` | Register a recycling/collection center |
| GET | `/foodbank/locations` | List every registered center |
| POST | `/foodbank/nearby-locations` | Centers near a point, filtered by material, sorted by distance |

---

### 1. Upload an image

```
POST /foodbank/upload-image
Content-Type: multipart/form-data
```

**Form fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | file | yes | Allowed types: `image/jpeg`, `image/png`, `image/webp`, `image/gif` |
| `title` | text | no | Short label, e.g. `"Canned goods shelf"` |
| `description` | text | no | Free text |
| `category` | text | no | e.g. `"produce"`, `"canned"`, `"dairy"` — used by the list filter |
| `uploaded_by` | text | no | Name/ID of the uploader |

**Sample request**

```bash
curl -X POST http://localhost:8003/foodbank/upload-image \
  -F "file=@/path/to/photo.jpg;type=image/jpeg" \
  -F "title=Canned goods shelf" \
  -F "description=Weekly stock photo for aisle 3" \
  -F "category=canned" \
  -F "uploaded_by=jane.doe"
```

**Sample response — `201 Created`** (this exact shape was captured from a real
run against Gemini — see the "Verified working" note further down)

```json
{
  "success": true,
  "message": "Analysis and pricing computed successfully.",
  "id": "66c1f2a4b7e2a1a2b3c4d5e6",
  "image_id": "data-capture-storage-live/FoodBank/9f3a2e1c4b8d4a6e9f0a1b2c3d4e5f6a/photo.jpg",
  "filename": "photo.jpg",
  "data": {
    "itemName": "PET Water Bottle",
    "materialType": "Plastic",
    "condition": "Used",
    "sizeCategory": "Small",
    "isContaminated": true,
    "isHazardous": false,
    "recyclabilityNote": "Highly recyclable, but must be rinsed before recycling.",
    "estimatedPriceRange": {
      "minPrice": 56.0,
      "maxPrice": 105.0,
      "currency": "LKR",
      "unit": "per kg"
    },
    "pricingDisclaimer": "* Estimated value. Final price is subject to in-person weighing and quality inspection. (reduced for visible contamination)"
  }
}
```

- `id` — the MongoDB document ID. Use this for `view-image` / `delete-image`.
- `image_id` — the raw Cloudflare R2 object key (returned for reference/debugging;
  you normally don't need it directly).
- `data` — the Gemini classification (`itemName`/`materialType`/`condition`/
  `sizeCategory`/`isContaminated`/`isHazardous`/`recyclabilityNote`) plus the
  pricing engine's output for that classification. Also persisted on the Mongo
  document (`analysis` / `pricing` fields), so `GET /foodbank/images` and any
  future read of the same doc can see it without re-running the AI step.
- **If the AI step fails** (Gemini quota/network/parse error — anything other
  than the upload itself failing), the image is still stored and the response
  is still `201`, but `data` is `null` and an `analysisError` field carries the
  failure reason instead:
  ```json
  { "success": true, "message": "Image uploaded successfully; AI analysis unavailable.",
    "id": "...", "image_id": "...", "filename": "...",
    "data": null, "analysisError": "GEMINI_API_KEY is not configured" }
  ```
  An upload never fails just because the AI classification did — only R2/Mongo
  failures return a non-201 response.
- The pricing figures come from a small, editable rules table in
  `common/foodbank_pricing.py` (`BASE_PRICE_RANGES_LKR_PER_KG` /
  `CONDITION_MULTIPLIER`), **not** a live external commodity-price feed — there
  isn't one integrated anywhere in this codebase. Update that file directly as
  real rates become available.

**Error responses**

```json
// 400 — unsupported file type
{ "detail": "Unsupported file type 'application/pdf'. Allowed: image/gif, image/jpeg, image/png, image/webp" }
```
```json
// 500 — upload failed (R2/Mongo error — NOT an AI-analysis failure, see above)
{ "detail": "FoodBank image upload error: <details>" }
```

---

### 2. List images

```
GET /foodbank/images
GET /foodbank/images?category=canned
```

Returns metadata only (no image bytes), newest first.

**Sample request**

```bash
curl http://localhost:8003/foodbank/images

# filtered by category
curl "http://localhost:8003/foodbank/images?category=canned"
```

**Sample response — `200 OK`**

```json
[
  {
    "id": "66c1f2a4b7e2a1a2b3c4d5e6",
    "filename": "photo.jpg",
    "title": "Canned goods shelf",
    "description": "Weekly stock photo for aisle 3",
    "category": "canned",
    "uploaded_by": "jane.doe",
    "uploadDate": { "$date": "2026-08-18T13:45:09.123Z" },
    "analysis": {
      "itemName": "PET Water Bottle",
      "materialType": "Plastic",
      "condition": "Used",
      "sizeCategory": "Small",
      "isContaminated": true,
      "isHazardous": false,
      "recyclabilityNote": "Highly recyclable, but must be rinsed before recycling."
    },
    "pricing": {
      "minPrice": 56.0,
      "maxPrice": 105.0,
      "currency": "LKR",
      "unit": "per kg",
      "disclaimer": "* Estimated value. Final price is subject to in-person weighing and quality inspection. (reduced for visible contamination)"
    }
  }
]
```

`analysis`/`pricing` are `null` for uploads where the AI step failed (see the
Upload section above).

> `uploadDate` is serialized via `bson.json_util`, so it comes through as an
> Extended JSON date object (`{"$date": "..."}"`) rather than a plain string.

---

### 3. View / download an image

```
GET /foodbank/view-image/{id}
```

`{id}` is the MongoDB document `id` returned by the upload response (**not** the
`image_id` R2 key).

**Sample request**

```bash
curl http://localhost:8003/foodbank/view-image/66c1f2a4b7e2a1a2b3c4d5e6 --output downloaded.jpg
```

Or open directly in a browser: `http://localhost:8003/foodbank/view-image/66c1f2a4b7e2a1a2b3c4d5e6`

Response is the raw image bytes with the correct `Content-Type` (renders inline,
no `Content-Disposition: attachment` header).

**Error responses**

```json
// 400 — malformed id
{ "detail": "Invalid image ID" }
```
```json
// 404 — no such document
{ "detail": "Image not found" }
```

---

### 4. Delete an image

```
DELETE /foodbank/delete-image/{id}
```

Deletes the object from Cloudflare R2 **and** its metadata document. This cannot
be undone.

**Sample request**

```bash
curl -X DELETE http://localhost:8003/foodbank/delete-image/66c1f2a4b7e2a1a2b3c4d5e6
```

**Sample response — `200 OK`**

```json
{ "message": "Image deleted successfully" }
```

**Error responses**

```json
// 400 — malformed id
{ "detail": "Invalid image ID" }
```
```json
// 404 — no such document
{ "detail": "Image not found" }
```

---

### 5. Register a recycling location

```
POST /foodbank/locations
Content-Type: application/json
```

There is **no seed data** — `nearby-locations` will always return an empty
array until you register at least one center here (or insert directly into
the `FoodBankLocations` collection).

**Request body**

```json
{
  "name": "Greenbless Recycling Center",
  "address": "123 Main Street, Negombo",
  "contact": "0112345678",
  "latitude": 7.2105,
  "longitude": 79.8800,
  "operatingHours": "08:00 AM - 05:00 PM",
  "openTime": "08:00",
  "closeTime": "17:00",
  "acceptedMaterials": ["Plastic", "Glass", "Paper"]
}
```

- `operatingHours` is the free-text display string shown back in responses.
- `openTime`/`closeTime` are separate 24-hour `"HH:MM"` fields used to compute
  `isOpenNow` in the nearby-search response — they're kept apart from
  `operatingHours` because reliably parsing an arbitrary display string
  ("8am–5pm", "08:00-17:00", …) at query time isn't practical. Omit them if you
  don't need `isOpenNow` to work for that center (it comes back `null`, not
  `false`, when unknown).
- `acceptedMaterials` is matched case-insensitively by `nearby-locations`, but
  store it however you want it *displayed* (e.g. `"E-Waste"`, not `"e-waste"`).

**Sample response — `201 Created`** (verified against a real run)

```json
{
  "success": true,
  "id": "66c1f2a4b7e2a1a2b3c4d5e7",
  "name": "Greenbless Recycling Center",
  "address": "123 Main Street, Negombo",
  "contact": "0112345678",
  "operatingHours": "08:00 AM - 05:00 PM",
  "coordinates": { "latitude": 7.2105, "longitude": 79.88 },
  "acceptedMaterials": ["Plastic", "Glass", "Paper"]
}
```

### 6. List / search nearby recycling locations

```
GET /foodbank/locations
```
Lists every registered center (admin/sanity check — not distance-sorted).

```
POST /foodbank/nearby-locations
Content-Type: application/json
```

**Request body**

```json
{
  "latitude": 7.2008,
  "longitude": 79.8737,
  "materialType": "Plastic",
  "radiusInKm": 15,
  "limit": 10
}
```

`materialType` is optional (omit it to search across all materials);
`radiusInKm` defaults to `25`, `limit` defaults to `10`.

**Sample response — `200 OK`** (verified: two seeded centers, sorted
closest-first, `isOpenNow` correctly computed against the server's real
current time for each center's `openTime`/`closeTime`)

```json
{
  "success": true,
  "data": [
    {
      "id": "66c1f2a4b7e2a1a2b3c4d5e7",
      "name": "Greenbless Recycling Center",
      "address": "123 Main Street, Negombo",
      "contact": "0112345678",
      "operatingHours": "08:00 AM - 05:00 PM",
      "coordinates": { "latitude": 7.2105, "longitude": 79.88 },
      "acceptedMaterials": ["Plastic", "Glass", "Paper"],
      "distanceInKm": 1.28,
      "isOpenNow": true
    },
    {
      "id": "66c1f2a4b7e2a1a2b3c4d5e8",
      "name": "Ocean Care Point",
      "address": "45 Beach Road, Negombo",
      "contact": "0771234567",
      "operatingHours": "09:00 AM - 04:00 PM",
      "coordinates": { "latitude": 7.225, "longitude": 79.871 },
      "acceptedMaterials": ["Plastic", "E-Waste"],
      "distanceInKm": 2.71,
      "isOpenNow": false
    }
  ]
}
```

Distance is plain haversine, computed in Python over every registered
location (no Mongo geospatial index) — fine at the scale of one food bank's
center list; revisit if this ever needs to scale to thousands of locations.

---

## Quick end-to-end test

```bash
BASE=http://localhost:8003

# 1. Upload
RESPONSE=$(curl -s -X POST $BASE/foodbank/upload-image \
  -F "file=@./sample.png;type=image/png" \
  -F "title=Test image" \
  -F "category=test")
echo "$RESPONSE"

# 2. Extract the id (requires jq)
ID=$(echo "$RESPONSE" | jq -r '.id')

# 3. List
curl -s "$BASE/foodbank/images?category=test"

# 4. View
curl -s "$BASE/foodbank/view-image/$ID" --output round-trip.png

# 5. Delete
curl -s -X DELETE "$BASE/foodbank/delete-image/$ID"
```

## Testing with Postman

**Verified working (2026-08-20):** all 7 routes were exercised end-to-end
against a locally-run instance of this backend (`python main.py`, port `8003`
from `.env`) — upload with a **real Gemini classification + computed price**,
filtered list, view (byte-identical round-trip), delete, delete-again (404),
view-after-delete (404), an invalid id (400), an unsupported content type
(400), creating two recycling locations, listing them, a `nearby-locations`
search that correctly sorted by distance and case-insensitively filtered by
material, a tiny-radius search that correctly returned empty, and `isOpenNow`
computed correctly against each center's hours vs. the real current time.
Every response matched what's documented above exactly. If your Postman run
isn't behaving, it's much more likely one of the gotchas below than a bug in
the routes themselves; check those first.

### Collection setup

1. Create a Postman **Environment** (e.g. "FoodBank local") with one variable:
   - `base_url` = `http://localhost:8003` (swap for your deployed URL — see
     the reverse-proxy note below if that's not `localhost`).
2. Create a Postman **Collection** ("FoodBank Image API") with the 4 requests
   below, each using `{{base_url}}` in its URL.
3. On the **Upload** request's **Tests** tab, add this script so the returned
   Mongo `id` is captured automatically and the other 3 requests can reuse it
   as `{{image_id}}` without copy-pasting:
   ```js
   const body = pm.response.json();
   if (body.id) {
     pm.environment.set("image_id", body.id);
   }
   pm.test("Upload returned 201 with an id", function () {
     pm.response.to.have.status(201);
     pm.expect(body.id).to.be.a("string");
   });
   ```

### Request 1 — Upload

- **Method / URL**: `POST {{base_url}}/foodbank/upload-image`
- **Body tab**: select **form-data** (not raw/JSON — this endpoint only
  accepts `multipart/form-data`).
- **Body fields**:

  | Key | Type (right-hand dropdown) | Value |
  |---|---|---|
  | `file` | **File** | pick a real `.jpg`/`.png`/`.webp`/`.gif` from disk |
  | `title` | Text | `Canned goods shelf` |
  | `description` | Text | `Weekly stock photo for aisle 3` |
  | `category` | Text | `canned` |
  | `uploaded_by` | Text | `jane.doe` |

  The `file` row's type dropdown defaults to "Text" until you click it and
  switch to **File** — if you forget that step, Postman sends the file's path
  as a text string instead of the file itself, and you'll get a 422 (missing
  required field `file`) or a type mismatch, not the FoodBank code's own logic.
- **Headers tab**: leave it empty. Do **not** manually add
  `Content-Type: multipart/form-data` — Postman generates that header itself
  with the correct `boundary=...` parameter when you pick form-data in the
  Body tab, and a hand-typed one without a boundary breaks parsing (FastAPI
  reports this as a generic 422, which reads as "nothing happens").
- **Send** → expect **201** and the JSON body shown in the Upload section
  above. `{{image_id}}` is now set from the Tests script.

### Request 2 — List (with filter)

- **Method / URL**: `GET {{base_url}}/foodbank/images`
- **Params tab**: add `category` = `canned` (or whatever you uploaded with) to
  exercise the filter, or leave Params empty to list everything.
- **Send** → expect **200** and an array containing the document you just
  uploaded. If the array is empty right after an upload that returned 201,
  check that `category` here matches exactly what you sent on upload (it's an
  exact-match filter, not case-insensitive/partial).

### Request 3 — View image

- **Method / URL**: `GET {{base_url}}/foodbank/view-image/{{image_id}}`
- **Send** → expect **200** with the image rendered directly in Postman's
  response preview pane (it detects the `Content-Type` and shows an Image tab).
- Common mistake: pasting the **`image_id`** field from the upload response
  (the long R2 key like `data-capture-storage-local/FoodBank/...`) into this
  URL instead of the short Mongo **`id`**. That R2 key isn't a valid
  `ObjectId`, so you'll get `400 Invalid image ID` — which looks like a broken
  endpoint but is actually the wrong identifier.

### Request 4 — Delete image

- **Method / URL**: `DELETE {{base_url}}/foodbank/delete-image/{{image_id}}`
- **Send** → expect **200** `{"message": "Image deleted successfully"}`.
- Re-sending the same request again should now return **404** `{"detail":
  "Image not found"}` — that's correct, not a bug (the doc/R2 object are
  already gone).

### Request 5 — Register a location

- **Method / URL**: `POST {{base_url}}/foodbank/locations`
- **Body tab**: select **raw** → **JSON**, paste the request body from the
  "Register a recycling location" section above.
- **Send** → expect **201**. On this request's **Tests** tab, add
  `pm.environment.set("location_id", pm.response.json().id);` so requests 6/7
  below can reference `{{location_id}}` if you need it (the nearby-search
  response doesn't require it, but it's handy for manual checks).
- Repeat with a second location (different coordinates/materials) before
  testing nearby-search, so distance sorting has something to sort.

### Request 6 — List locations

- **Method / URL**: `GET {{base_url}}/foodbank/locations`
- **Send** → expect **200** and an array of every location you've registered.

### Request 7 — Nearby locations search

- **Method / URL**: `POST {{base_url}}/foodbank/nearby-locations`
- **Body tab**: **raw** → **JSON**:
  ```json
  { "latitude": 7.2008, "longitude": 79.8737, "materialType": "Plastic", "radiusInKm": 15, "limit": 10 }
  ```
- **Send** → expect **200** with `data` sorted closest-first. Try dropping
  `materialType` (searches all materials), shrinking `radiusInKm` to something
  tiny (should return `data: []`, not an error), and changing the case of
  `materialType` (e.g. `"plastic"` vs `"Plastic"` — matching is
  case-insensitive, so both should return the same results).

### Error-case requests worth adding to the collection

| What to send | Expected |
|---|---|
| Upload with `file` = a `.pdf` or `.txt` | `400` `{"detail": "Unsupported file type '...'. Allowed: ..."}` |
| `GET /foodbank/view-image/not-an-id` | `400` `{"detail": "Invalid image ID"}` |
| `GET /foodbank/view-image/000000000000000000000000` (valid format, no such doc) | `404` `{"detail": "Image not found"}` |
| `DELETE /foodbank/delete-image/not-an-id` | `400` `{"detail": "Invalid image ID"}` |

### If it still isn't working

- **Wrong base URL against a deployed environment**: `main.py` creates the
  app with `FastAPI(root_path="/fastapi")`. That only matters if this backend
  sits behind a reverse proxy that forwards a `/fastapi/*` prefix to it — if
  so, your Postman `base_url` against the deployed host needs
  `https://<host>/fastapi` (not the bare host), while local direct testing
  (`http://localhost:8003`, no proxy in front) needs no prefix at all. Check
  `GET {{base_url}}/docs` first — if that 404s, the prefix is the problem, not
  the FoodBank routes specifically.
- **R2 or Mongo misconfiguration**: an upload that returns `500 "FoodBank
  image upload error: ..."` means the R2 or Mongo call itself failed — the
  error detail after the colon is the real exception message (bad
  credentials, wrong bucket name, network-blocked endpoint, etc.); check
  `CLOUDFLARE_R2_*` and `MONGO_URI`/`MONGO_URI_LIVE` in `.env` against that
  message rather than assuming the route logic is at fault.
- **Nothing at all responds** (connection refused): the server isn't running,
  or isn't running on the port your `base_url` points at — confirm with
  `GET {{base_url}}/docs` (Swagger UI) before touching the FoodBank routes.

## Configuration

Image storage reuses the Cloudflare R2/MongoDB config already set up for the
rest of the backend; the AI classification step needs one more variable that
was already present in `.env` for this project:

- `CLOUDFLARE_R2_BUCKET_NAME`, `CLOUDFLARE_R2_ACCOUNT_ID`,
  `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`,
  `CLOUDFLARE_R2_ENDPOINT_URL` — read by `common/r2_storage.py`.
- `MONGO_URI` / `MONGO_URI_LIVE` — read by `main.py`.
- `GEMINI_API_KEY` (required for the AI step — see the "AI step fails"
  behavior in the Upload section if it's missing) and `GEMINI_MODEL` (optional,
  defaults to `gemini-2.5-flash`) — read by `common/GeminiFunctions.py`.
- The pricing engine (`common/foodbank_pricing.py`) needs no configuration —
  it's a plain Python rules table, edit it directly.

## Notes

- There is no existing "company image" Cloudflare endpoint in this codebase to
  copy from — this API was modeled on the closest real precedent instead: the
  generic image-upload branch already used for `data-capture/images` (same
  `upload_bytes()` / `download_bytes()` / `delete_object()` helper, same
  view/delete route shape as `/view-pdf/{id}` and `/delete-pdf/{id}`), just
  pointed at its own `FoodBank` R2 folder and its own Mongo collection.
- The allowed content types (`image/jpeg`, `image/png`, `image/webp`,
  `image/gif`) are defined in `FOODBANK_ALLOWED_CONTENT_TYPES` in `main.py` —
  extend that set there if you need to accept more formats.
- The Gemini vision call (`gemini_analyze_foodbank_item` in
  `common/GeminiFunctions.py`) reuses the same HTTP request plumbing as the
  pre-existing (but previously unwired) `gemini_extract_table` function —
  that one was built for a table-OCR use case and is untouched; the new
  function just sends a different prompt/schema through a shared helper.
- The pricing engine (`common/foodbank_pricing.py`) is a plain rules table —
  there's no "national commodity index" or "regional partner rate" feed
  anywhere in this codebase or its sibling repos to integrate with, so this
  is intentionally simple and meant to be edited directly as real rates
  become available, rather than a stand-in for a real integration that
  doesn't exist yet.
- The `FoodBankLocations` collection has no seed data and no existing
  precedent to source it from — the sibling `RnR_GreenBless` project shares
  a name with the sample location in the original spec, but it's a
  brand-name coincidence: that project has no recycling-center/location
  model to integrate with. Register real centers via `POST
  /foodbank/locations`.
