# Mobile APK Distribution

This directory contains the Android APK file for the TaskTracker mobile app.

## Setup

1. Build your Android APK in Android Studio
2. Copy the APK file to this directory:
   ```bash
   cp frontend-web/android/app/build/outputs/apk/release/app-release.apk mobile/app-release.apk
   ```

3. The APK will be included in the Docker image and served at:
   ```
   http://<EC2_IP>/trackapp/app-release.apk
   ```

## Download URL

Users can download the app from:
- **Production:** `http://<YOUR_EC2_IP>/trackapp/app-release.apk`
- **Local:** `http://localhost:3000/trackapp/app-release.apk`

## File Structure

```
mobile/
├── app-release.apk    # Your built Android APK
└── README.md          # This file
```

## Notes

- The APK file is served with the filename `TaskTracker.apk` when downloaded
- Make sure to rebuild and push the Docker image after updating the APK
- The health check endpoint (`/trackapp/health`) will show the APK download URL
