1. Camera & Gallery Permissions
If a user denies access to their camera or photo gallery, the app catches this and shows a native pop-up Alert explaining exactly why the permission is needed, instead of silently failing or crashing.

2. Network & AI Failures (Analyzing Screen)
When the app sends the photo to the AI (services/aiService.ts), it is wrapped in a secure try...catch block. If your internet disconnects or the AI API fails, the app catches the error and displays a custom "Analysis Failed" screen with a warning icon and a button to easily "Go Back and Try Again".

3. Maps & Location Failures (Facilities Screen)
When fetching nearby recycling centers, if the API fails, it displays a dedicated "Couldn't Load Facilities" error screen with a "Tap to try again" button.

Additionally, it handles "Empty States" gracefully. If the API succeeds but finds 0 recycling centers nearby, it shows a clean "No Centers Found" screen instead of a blank white page.
4. Navigation Errors
If the app accidentally navigates to the Result Screen or Preview Screen without an image attached (which would normally cause a fatal crash), the code detects the missing data and automatically sends the user safely back to the Home screen.

5. Local Storage Errors
When saving your "Recent Scans" to the phone's local memory (AsyncStorage), the operations are wrapped in try...catch blocks. If the phone's memory is full or corrupted, it will safely ignore the save operation rather than crashing the app.

The app is structurally very stable and ready for real-world MVP testing!