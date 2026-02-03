---
description: Build TaskTracker Android APK
---

# Build TaskTracker Android APK

Follow these steps to build the Android APK for the TaskTracker mobile app.

## Prerequisites
- Android Studio must be installed
- JDK 11+ must be installed

## Steps

1. Navigate to the frontend directory:
```bash
cd study-tracker/frontend
```

2. Install dependencies if not already done:
```bash
npm install
```

3. Build the React web app:
// turbo
```bash
npm run build:mobile
```

4. Sync with Android project:
// turbo
```bash
npx cap sync android
```

5. Open Android Studio:
```bash
npx cap open android
```

6. In Android Studio:
   - Wait for Gradle sync to complete (this may take a few minutes)
   - Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - Click "locate" when build completes to find the APK

7. The debug APK will be at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

## For Release APK
1. In Android Studio: **Build** → **Generate Signed Bundle / APK**
2. Select **APK**
3. Create keystore or use existing
4. Select **release** variant
5. Build

## Quick Rebuild
If you only changed web code (not native):
// turbo
```bash
npm run build:mobile && npx cap sync android
```
Then rebuild in Android Studio.

## Running the Backend
The mobile app relies on the backend API. Ensure it is running before testing the APK.

1. Navigate to the project root:
```bash
cd study-tracker
```

2. Start the server (ensure you have installed dependencies in `backend/`):
```bash
node backend/server.js
```
*Note: Ensure your computer and mobile device are on the same Wi-Fi network.*
