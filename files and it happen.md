## Project File Structure

| File | Purpose |
|---|---|
| **`types/models.ts`** | TypeScript interfaces: `MaterialAnalysis`, `RecyclingFacility`, `ScanHistoryItem` |
| **`mock/mockAIResult.ts`** | 4 realistic mock AI results: Copper Wire, Aluminum, Scrap Steel, E-Waste |
| **`mock/mockFacilities.ts`** | 5 mock recycling centers with distance, hours, and accepted materials |
| **`services/aiService.ts`** | Mock/Live AI toggle, multi-stage callbacks, and base64 image encoding |
| **`services/recyclingService.ts`** | Mock/Live facility fetching with Google Places structure |
| **`utils/storage.ts`** | AsyncStorage-based scan history: load, save, and clear |
| **`constants/theme.ts`** | Full sustainability design system: colors, spacing, typography, and shadows |
| **`components/ui/Button.tsx`** | Reusable 4-variant Button with loading state and icon slots |
| **`components/domain/FacilityCard.tsx`** | Recycling facility card with directions and call actions |
| **`components/domain/RecentScanCard.tsx`** | Compact scan history card for the Home screen |
| **`app/_layout.tsx`** | Expo Router Stack navigator with themed headers |
| **`app/index.tsx`** | **Screen 1:** Hero section, Camera/Gallery CTAs, How It Works, and scan history |
| **`app/preview.tsx`** | **Screen 3:** Photo preview, retake, and analyze actions |
| **`app/analyzing.tsx`** | **Screen 4:** Multi-stage spinner animation and AI analysis call |
| **`app/result.tsx`** | **Screen 5:** Material identification, estimated price range, disclaimer, and tips |
| **`app/facilities.tsx`** | **Screen 6:** Recycling facility list with loading, empty, and error states |
| **`.env`** | Development configuration with `EXPO_PUBLIC_MOCK_AI=true` as the safe default |