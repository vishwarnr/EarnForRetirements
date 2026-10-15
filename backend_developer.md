# Technical Specification: AI Image Analysis & Pricing Engine Integration (v3)

**Platform:** React Native (Expo) | **Architecture:** Backend-Driven Logic

## 1. System Architecture & Separation of Concerns
To ensure a scalable, secure, and maintainable application, we are adopting a strict separation of concerns:
*   **Mobile Client:** Responsible solely for UI rendering, device integrations (Camera/Gallery via `expo-image-picker`), and managing asynchronous network states. Will conditionally render UI warnings based on AI data (e.g., wash instructions if contaminated).
*   **LLM Service (Backend):** Strictly scoped to visual identification and contextual analysis (Extracting `itemName`, `materialType`, `condition`, `isContaminated`, `sizeCategory`, and `isHazardous`). 
*   **Pricing Engine (Backend):** Acts as the aggregator. It blends national commodity indices with regional partner rates to dynamically compute the estimated value based on the LLM's identification and contamination status. *No pricing logic or third-party API keys will reside on the mobile client.*

---

## 2. API Contract 1: Image Upload & Detailed AI Analysis

**Flow:** The user selects an image, previews it locally, and triggers an explicit upload. The client sends a multipart payload. The backend processes the upload, queries the LLM for expanded data points, passes the result to the Pricing Engine (which adjusts rates based on contamination/condition), and returns a unified response.

*   **Endpoint:** `/api/v1/foodbank/analyze` 
*   **Method:** `POST`
*   **Content-Type:** `multipart/form-data`
*   **Request Payload:**
    *   `image`: Binary file (JPEG/PNG)

*   **Expected JSON Response:**
```json
{
  "success": true,
  "message": "Analysis and pricing computed successfully.",
  "data": {
    "itemName": "PET Water Bottle",
    "materialType": "Plastic",
    "condition": "Used",
    "sizeCategory": "Small",
    "isContaminated": true,
    "isHazardous": false,
    "recyclabilityNote": "Highly recyclable, but must be rinsed.",
    "estimatedPriceRange": {
      "minPrice": 110.00,
      "maxPrice": 140.00,
      "currency": "LKR",
      "unit": "per kg"
    },
    "pricingDisclaimer": "* Estimated value. Final price is subject to in-person weighing and quality inspection."
  }
}
```

---

### 2.2. API Contract 2: Geospatial Location Search

Once the mobile app receives the analysis data, it will call this endpoint to fetch nearby recycling centers that accept the identified material.

**Endpoint:** `/api/v1/foodbank/nearby-locations`
**Method:** `POST`
**Content-Type:** `application/json`

#### Request Payload

```json
{
  "latitude": 7.2008,
  "longitude": 79.8737,
  "materialType": "Plastic",
  "radiusInKm": 15,
  "limit": 10
}
```

#### Expected JSON Response

**Note:** Array must be sorted by `distanceInKm` (closest first).

```json
{
  "success": true,
  "data": [
    {
      "id": "loc_001",
      "name": "Greenbless Recycling Center",
      "address": "123 Main Street, Negombo",
      "contact": "0112345678",
      "distanceInKm": 2.5,
      "isOpenNow": true,
      "operatingHours": "08:00 AM - 05:00 PM",
      "coordinates": {
        "latitude": 7.2105,
        "longitude": 79.8800
      },
      "acceptedMaterials": [
        "Plastic",
        "Glass",
        "Paper"
      ]
    },
    {
      "id": "loc_002",
      "name": "Ocean Care Point",
      "address": "45 Beach Road, Negombo",
      "contact": "0771234567",
      "distanceInKm": 4.1,
      "isOpenNow": false,
      "operatingHours": "09:00 AM - 04:00 PM",
      "coordinates": {
        "latitude": 7.2250,
        "longitude": 79.8710
      },
      "acceptedMaterials": [
        "Plastic",
        "E-Waste"
      ]
    }
  ]
}
```
