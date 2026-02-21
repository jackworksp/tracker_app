# Vela Mobile Build Guide

Complete guide for building and deploying the Vela Android app using Capacitor.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Building the App](#building-the-app)
5. [Mobile-Specific Features](#mobile-specific-features)
6. [Testing](#testing)
7. [Publishing](#publishing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Vela's mobile app is built using **Capacitor 8**, which wraps the React web application in a native Android container. This approach allows:

- Single codebase for web and mobile
- Access to native device features (camera, filesystem, notifications)
- Share target integration for capturing content from other apps
- Full Android Studio integration for native customization

**Key Technologies:**
- **Capacitor 8.0**: Native container framework
- **Android Studio**: IDE for building APK/AAB files
- **Gradle**: Android build system
- **Vite**: Frontend build tool with mobile mode

**App Identifier:** `com.vela.app`
**App Name:** Vela

---

## Prerequisites

### Required Software

#### 1. Node.js and npm
- **Version**: Node.js 20+ (LTS recommended)
- **Install**: [nodejs.org](https://nodejs.org)
- **Verify**:
  ```bash
  node --version  # Should be v20.x or higher
  npm --version   # Should be v10.x or higher
  ```

#### 2. Java Development Kit (JDK)
- **Version**: JDK 21 (required by Gradle 8.13)
- **Install**:
  - **Windows**: Download from [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) or [Adoptium](https://adoptium.net/)
  - **macOS**: `brew install openjdk@21`
  - **Linux**: `sudo apt install openjdk-21-jdk`
- **Set JAVA_HOME**:
  ```bash
  # Windows (PowerShell)
  $env:JAVA_HOME = "C:\Program Files\Java\jdk-21"

  # macOS/Linux
  export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
  ```
- **Verify**:
  ```bash
  java -version  # Should show version 21.x
  ```

#### 3. Android Studio
- **Version**: Android Studio Ladybug (2024.2.1) or newer
- **Download**: [developer.android.com/studio](https://developer.android.com/studio)
- **Install Components** (via SDK Manager):
  - Android SDK Platform 35 (Android 15)
  - Android SDK Build-Tools 35.x
  - Android SDK Command-line Tools
  - Android Emulator (for testing)
  - Intel/AMD x86 Emulator Accelerator (HAXM) - for emulator performance

#### 4. Android SDK Environment Variables
Add these to your system PATH:
```bash
# Windows (add to System Environment Variables)
ANDROID_HOME = C:\Users\<YourUsername>\AppData\Local\Android\Sdk
PATH += %ANDROID_HOME%\platform-tools
PATH += %ANDROID_HOME%\cmdline-tools\latest\bin

# macOS/Linux (.bashrc or .zshrc)
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk          # Linux
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

**Verify**:
```bash
adb --version       # Android Debug Bridge
sdkmanager --version
```

#### 5. Capacitor CLI
- **Install Globally** (optional, for convenience):
  ```bash
  npm install -g @capacitor/cli
  ```
- **Verify**:
  ```bash
  npx cap --version  # Should show 7.4.4 or 8.x
  ```

---

## Initial Setup

### 1. Project Structure

The mobile app lives in the `frontend-web/` directory:

```
frontend-web/
├── android/                    # Native Android project (auto-generated)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml   # Permissions & intent filters
│   │   │   ├── assets/               # Web app files (after sync)
│   │   │   ├── res/                  # App icons, splash screens
│   │   │   └── java/com/vela/app/    # Native code
│   │   ├── build.gradle              # App-level Gradle config
│   │   └── google-services.json      # (Optional) Firebase config
│   ├── build.gradle                  # Project-level Gradle config
│   ├── variables.gradle              # SDK versions
│   └── gradle.properties
├── src/                        # React source code
├── dist/                       # Built web assets (output of Vite)
├── capacitor.config.json       # Capacitor configuration
├── .env.mobile                 # Mobile environment variables
├── package.json                # Dependencies
└── vite.config.js              # Vite build config
```

### 2. Install Dependencies

```bash
cd frontend-web
npm install
```

This installs:
- React 19 and dependencies
- Capacitor core and Android platform
- Capacitor plugins (Camera, Filesystem, Local Notifications, etc.)

### 3. Configure Environment Variables

**File**: `frontend-web/.env.mobile`

```bash
# Production API URL (replace with your backend)
VITE_API_URL=http://seiyul.in/vela/api

# For local development testing:
# VITE_API_URL=http://192.168.1.8:3000/vela/api
```

**Important**:
- The mobile app cannot use `localhost` - use your computer's local IP address
- For production builds, use your deployed backend URL
- The app uses a **relative base path** (`./`) instead of `/vela/` for web builds

### 4. Capacitor Configuration

**File**: `frontend-web/capacitor.config.json`

```json
{
  "appId": "com.vela.app",
  "appName": "Vela",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "plugins": {
    "Camera": {
      "permissionType": "prompt"
    },
    "LocalNotifications": {
      "presentationOptions": ["badge", "sound", "alert"]
    },
    "SplashScreen": {
      "launchShowDuration": 2000,
      "launchAutoHide": true,
      "backgroundColor": "#1a1a2e",
      "androidSplashResourceName": "splash",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": false
    },
    "StatusBar": {
      "style": "DARK",
      "backgroundColor": "#1a1a2e"
    }
  },
  "android": {
    "allowMixedContent": true,
    "captureInput": true,
    "webContentsDebuggingEnabled": true,
    "overscrollHistoryNavigation": false,
    "backgroundColor": "#1a1a2e"
  },
  "server": {
    "androidScheme": "https"
  }
}
```

**Key Settings:**
- `webDir`: Points to Vite's output directory (`dist/`)
- `webContentsDebuggingEnabled`: Allows Chrome DevTools debugging on device
- `allowMixedContent`: Enables HTTP API calls (for development)
- `androidScheme`: Uses HTTPS for local file loading (security requirement)

### 5. Initialize Android Platform

**First-time setup only:**

```bash
cd frontend-web
npx cap add android
```

This creates the `android/` directory with the native Android project.

**If the android/ directory already exists**, skip this step.

---

## Building the App

### Step 1: Build Web Assets

Run Vite in **mobile mode** to generate optimized assets:

```bash
cd frontend-web
npm run build:mobile
```

**What this does:**
- Runs `vite build --mode mobile`
- Loads `.env.mobile` configuration
- Sets base path to `./` (relative, not `/vela/`)
- Outputs to `dist/` directory
- Minifies and optimizes React code

**Output:**
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [images, fonts, etc.]
└── ...
```

### Step 2: Sync to Capacitor

Copy the web assets to the Android project:

```bash
npx cap sync android
```

**What this does:**
1. Copies `dist/` contents to `android/app/src/main/assets/public/`
2. Updates Capacitor plugins in native code
3. Syncs `capacitor.config.json` settings to Android project
4. Links Capacitor plugin dependencies in Gradle

**Output:**
```
✔ Copying web assets from dist to android/app/src/main/assets/public
✔ Copying native bridge in android/app/src/main/assets/public
✔ Copying Capacitor plugins to android/capacitor-plugins
✔ Updating Android plugins
```

**Troubleshooting Sync Issues:**
- If sync fails, try: `npx cap sync android --inline`
- To force clean rebuild: `rm -rf android/app/src/main/assets/public && npx cap sync android`

### Step 3: Open in Android Studio

```bash
npx cap open android
```

This launches Android Studio with the `frontend-web/android/` project.

**On first open:**
1. Android Studio will index the project (wait for completion)
2. Gradle will download dependencies (may take 5-10 minutes)
3. Check the "Build" tab for any errors

### Step 4: Build APK in Android Studio

#### Debug Build (for testing)

1. **Connect a device or start an emulator**
2. **Select build variant**: `Build > Select Build Variant > debug`
3. **Run the app**: Click the green "Run" button (▶) or press `Shift + F10`
4. Android Studio will:
   - Compile the app
   - Install on device/emulator
   - Launch the app

**Debug APK location:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

#### Release Build (for distribution)

1. **Generate signing key** (first time only):
   ```bash
   cd frontend-web/android/app
   keytool -genkey -v -keystore vela-release.keystore \
     -alias vela -keyalg RSA -keysize 2048 -validity 10000
   ```
   - Enter a strong password (save it securely!)
   - Fill in organizational details
   - Store `vela-release.keystore` in a secure location (DO NOT commit to Git)

2. **Create key.properties** (ignored by Git):

   **File**: `android/key.properties`
   ```properties
   storePassword=YOUR_KEYSTORE_PASSWORD
   keyPassword=YOUR_KEY_PASSWORD
   keyAlias=vela
   storeFile=/absolute/path/to/vela-release.keystore
   ```

3. **Update app/build.gradle** to use signing config:

   Add before `android { }` block:
   ```gradle
   def keystoreProperties = new Properties()
   def keystorePropertiesFile = rootProject.file('key.properties')
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
   }
   ```

   Inside `android { }` block, add:
   ```gradle
   signingConfigs {
       release {
           keyAlias keystoreProperties['keyAlias']
           keyPassword keystoreProperties['keyPassword']
           storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
           storePassword keystoreProperties['storePassword']
       }
   }
   buildTypes {
       release {
           signingConfig signingConfigs.release
           minifyEnabled false
           proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
       }
   }
   ```

4. **Build release APK**:

   **Option A: Android Studio UI**
   - `Build > Generate Signed Bundle / APK`
   - Select `APK`
   - Choose keystore file and enter passwords
   - Select `release` build variant
   - Click `Finish`

   **Option B: Command Line**
   ```bash
   cd frontend-web/android
   ./gradlew assembleRelease
   ```

**Release APK location:**
```
android/app/build/outputs/apk/release/app-release.apk
```

#### Android App Bundle (AAB) - For Google Play Store

AAB is the preferred format for Play Store uploads (smaller download size).

```bash
cd frontend-web/android
./gradlew bundleRelease
```

**Output:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## Mobile-Specific Features

Vela uses Capacitor plugins to access native device features. Here's how they're implemented:

### 1. Camera Integration

**Plugins**: `@capacitor/camera`

**Usage**: Take photos or select from gallery for attachments

**Implementation**: `frontend-web/src/utils/capacitor.js`

```javascript
import { takePhoto, pickImage } from './utils/capacitor';

// Take a photo
const result = await takePhoto({
  quality: 90,
  allowEditing: false
});
if (result.success) {
  const base64Image = result.data;
  // Upload or display image
}

// Pick from gallery
const gallery = await pickImage({ quality: 90 });
```

**Permissions**: Automatically requested on first use (defined in `capacitor.config.json`)

**Manifest Permissions** (auto-added by Capacitor):
- `android.permission.CAMERA`
- `android.permission.READ_EXTERNAL_STORAGE`
- `android.permission.WRITE_EXTERNAL_STORAGE` (Android <13)
- `android.permission.READ_MEDIA_IMAGES` (Android 13+)

### 2. File System Access

**Plugin**: `@capacitor/filesystem`

**Usage**: Store files in app-specific directories (Documents, Cache)

**Implementation**:
```javascript
import { writeFile, readFile, deleteFile, listFiles } from './utils/capacitor';

// Write a file
await writeFile('notes.txt', 'My note content', 'DOCUMENTS');

// Read a file
const result = await readFile('notes.txt', 'DOCUMENTS');

// List files
const files = await listFiles('', 'DOCUMENTS');
```

**Directories Available**:
- `DOCUMENTS`: Persistent user files
- `DATA`: App-specific data
- `CACHE`: Temporary cache (may be cleared by system)
- `EXTERNAL`: SD card (requires permission)

### 3. Local Notifications

**Plugin**: `@capacitor/local-notifications`

**Usage**: Task reminders with snooze/dismiss actions

**Implementation**: `frontend-web/src/services/notificationService.js`

**Features**:
- Schedule notifications at specific times
- Custom notification channels (basic vs. alarm)
- Action buttons (Snooze 10m, Dismiss)
- Repeating notifications for persistent alarms
- Custom ringtone (`ringtone.wav` in `res/raw/`)

**Setup**:
```javascript
import { notificationService } from './services/notificationService';

// Request permission
await notificationService.requestPermission();

// Schedule a basic notification
await notificationService.scheduleReminder(
  { id: 'task-1', title: 'Complete homework' },
  new Date(Date.now() + 3600000), // 1 hour from now
  'basic'
);

// Schedule a persistent alarm (repeating)
await notificationService.scheduleReminder(
  { id: 'task-2', title: 'Important deadline!' },
  new Date('2026-03-01 09:00:00'),
  'persistent'
);
```

**Notification Channels**:
- **Basic**: Standard notification with sound
- **Alarm (V6)**: Loud ringtone, vibration, LED, repeats every minute

**Custom Ringtone**:
Place `ringtone.wav` in `android/app/src/main/res/raw/ringtone.wav` for alarm notifications.

**Permissions** (auto-added to manifest):
- `android.permission.POST_NOTIFICATIONS` (Android 13+)
- `android.permission.SCHEDULE_EXACT_ALARM` (Android 12+)
- `android.permission.USE_EXACT_ALARM`
- `android.permission.VIBRATE`

### 4. Share Target Integration

**Plugin**: `@capgo/capacitor-share-target`

**Usage**: Capture content shared from other apps (e.g., YouTube links)

**How it works**:
1. User shares a URL from YouTube, Chrome, etc.
2. Android shows "Share with Vela" option
3. Vela receives the shared text/URL
4. App adds it as an attachment or link

**Implementation**: `frontend-web/src/App.jsx`

```javascript
import { CapacitorShareTarget } from '@capgo/capacitor-share-target';

// Listen for shared content
CapacitorShareTarget.addListener('shareReceived', (result) => {
  if (result.texts && result.texts.length > 0) {
    const sharedText = result.texts[0];
    const urlRegex = /(https?:\/\/[^\s]+)/;
    const match = sharedText.match(urlRegex);

    if (match) {
      const url = match[0];
      // Add to attachments, create task, etc.
      console.log('Received shared URL:', url);
    }
  }
});
```

**Intent Filters**: Defined in `AndroidManifest.xml` (lines 26-45)

```xml
<!-- Accept text/plain (URLs, copied text) -->
<intent-filter>
    <action android:name="android.intent.action.SEND" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:mimeType="text/plain" />
</intent-filter>
```

**Testing Share Target**:
1. Open YouTube app on device
2. Share a video
3. Select "Vela" from share sheet
4. Check app logs for received URL

### 5. Splash Screen

**Plugin**: `@capacitor/splash-screen`

**Usage**: Show branded splash screen during app startup

**Configuration** (in `capacitor.config.json`):
```json
"SplashScreen": {
  "launchShowDuration": 2000,
  "launchAutoHide": true,
  "backgroundColor": "#1a1a2e",
  "androidSplashResourceName": "splash",
  "androidScaleType": "CENTER_CROP"
}
```

**Splash Image**: Place in `android/app/src/main/res/drawable/splash.png`

**Recommended Sizes**:
- `drawable-mdpi/splash.png`: 320x480px
- `drawable-hdpi/splash.png`: 480x800px
- `drawable-xhdpi/splash.png`: 720x1280px
- `drawable-xxhdpi/splash.png`: 1080x1920px
- `drawable-xxxhdpi/splash.png`: 1440x2560px

**Manual Control**:
```javascript
import { hideSplashScreen } from './utils/capacitor';

// Hide manually after app initialization
await hideSplashScreen();
```

### 6. Status Bar

**Plugin**: `@capacitor/status-bar`

**Usage**: Customize status bar appearance (color, style)

```javascript
import { setStatusBarStyle, setStatusBarColor } from './utils/capacitor';

// Dark icons (light background)
await setStatusBarStyle(false);

// Light icons (dark background)
await setStatusBarStyle(true);

// Set background color
await setStatusBarColor('#1a1a2e');
```

**Auto-configured** on app launch in `initCapacitor()`.

### 7. Platform Detection

**Usage**: Conditionally enable features based on platform

```javascript
import { isNativePlatform, getPlatform } from './utils/capacitor';

if (isNativePlatform()) {
  // Android-specific code
  console.log(`Running on ${getPlatform()}`); // "android"
} else {
  // Web fallback
  console.log('Running on web');
}
```

**Example Use Cases**:
- Show camera button only on mobile
- Use native file picker vs. web input
- Display "Install App" banner on web

---

## Testing

### 1. Testing on Emulator

**Create an Emulator** (first time):
1. Open Android Studio
2. `Tools > Device Manager`
3. Click `Create Device`
4. Select a phone (e.g., Pixel 6)
5. Download a system image (Android 14 or 15 recommended)
6. Finish setup

**Run on Emulator**:
```bash
cd frontend-web
npm run build:mobile
npx cap sync android
npx cap open android
```

In Android Studio:
1. Select emulator from device dropdown
2. Click "Run" (▶)
3. App will install and launch

**Emulator Tips**:
- Enable "Use Host GPU" in AVD settings for better performance
- Allocate sufficient RAM (2-4GB)
- Take emulator snapshots for quick boot

### 2. Testing on Physical Device

**Enable Developer Options**:
1. Open Settings on device
2. Go to "About Phone"
3. Tap "Build Number" 7 times
4. Go back, open "Developer Options"
5. Enable "USB Debugging"

**Connect Device**:
1. Connect phone via USB cable
2. Allow USB debugging prompt on phone
3. Verify connection:
   ```bash
   adb devices
   # Should list your device
   ```

**Run on Device**:
1. In Android Studio, select your device from dropdown
2. Click "Run" (▶)
3. App installs and launches on device

**Wireless Debugging** (Android 11+):
1. Enable "Wireless Debugging" in Developer Options
2. Note the IP address and port
3. Connect:
   ```bash
   adb pair <ip>:<port>
   # Enter pairing code from device
   adb connect <ip>:<port>
   ```

### 3. Debugging Mobile-Specific Issues

#### Chrome DevTools Remote Debugging

1. Connect device via USB (or wireless ADB)
2. Enable `webContentsDebuggingEnabled` in `capacitor.config.json`
3. Open Chrome on desktop: `chrome://inspect`
4. Select your device from the list
5. Click "Inspect" to open DevTools
6. Debug React code, check console logs, inspect network requests

**Debugging Capacitor Plugins**:
- Check Android Studio Logcat for native errors
- Filter by "Capacitor" tag: `tag:Capacitor`
- Look for plugin-specific logs (e.g., "Camera", "Notifications")

#### Common Issues

**Issue**: App crashes on startup
**Solution**: Check Logcat for stack traces, ensure all plugins are synced

**Issue**: Camera not working
**Solution**: Verify permissions in AndroidManifest.xml, check device settings

**Issue**: Notifications not showing
**Solution**: Request permissions, check notification channel settings

**Issue**: Share target not appearing
**Solution**: Verify intent filters in AndroidManifest.xml, restart device

**Issue**: API calls fail
**Solution**: Check `.env.mobile` API URL, ensure backend is accessible from device

### 4. Testing Build Variants

**Debug Build** (development):
- Includes source maps
- No code minification
- Larger APK size (~20-30MB)
- Faster build times

**Release Build** (production):
- Minified and optimized
- No source maps
- Smaller APK size (~10-15MB)
- Slower build times
- Requires signing key

**Test both variants** before publishing to catch environment-specific bugs.

---

## Publishing

### 1. Pre-Publishing Checklist

- [ ] Test app thoroughly on multiple devices/emulators
- [ ] Update version in `android/app/build.gradle`:
  ```gradle
  versionCode 3        // Increment for each release
  versionName "1.2"    // User-facing version
  ```
- [ ] Set `VITE_API_URL` to production backend in `.env.mobile`
- [ ] Generate release build with signing key
- [ ] Test release APK on device (install manually)
- [ ] Create app icons for all densities (see below)
- [ ] Write release notes and changelog

### 2. App Icons and Assets

**Generate Icons**:
Use `@capacitor/assets` to generate all icon sizes:

```bash
cd frontend-web
npm install -D @capacitor/assets

# Place your 1024x1024 icon.png in the root
npx capacitor-assets generate --android
```

**Manual Icon Placement**:
```
android/app/src/main/res/
├── mipmap-mdpi/ic_launcher.png        (48x48)
├── mipmap-hdpi/ic_launcher.png        (72x72)
├── mipmap-xhdpi/ic_launcher.png       (96x96)
├── mipmap-xxhdpi/ic_launcher.png      (144x144)
├── mipmap-xxxhdpi/ic_launcher.png     (192x192)
└── mipmap-anydpi-v26/ic_launcher.xml  (Adaptive icon)
```

**Adaptive Icons** (Android 8+):
Create foreground and background layers:
- `ic_launcher_foreground.xml`
- `ic_launcher_background.xml`

### 3. Google Play Store Preparation

**Create a Developer Account**:
1. Go to [play.google.com/console](https://play.google.com/console)
2. Pay $25 one-time registration fee
3. Complete account verification

**Create App Listing**:
1. Click "Create app"
2. Fill in app details:
   - **Name**: Vela
   - **Default language**: English (US)
   - **App/Game**: App
   - **Free/Paid**: Free
3. Complete content rating questionnaire
4. Set target age group and data safety info
5. Upload screenshots (phone + tablet):
   - Minimum 2 screenshots
   - PNG or JPG, 16:9 or 9:16 aspect ratio
   - Minimum dimension: 320px
6. Write app description:
   - **Short description** (80 chars): "Study tracker for students - manage tasks, notes, and study sessions"
   - **Full description** (4000 chars): See FEATURES.md for content
7. Upload app icon (512x512 PNG)
8. Choose app category: "Productivity"
9. Add contact email and privacy policy URL

**Upload Release**:
1. Go to "Production" or "Internal Testing" track
2. Click "Create new release"
3. Upload `app-release.aab` (Android App Bundle)
4. Fill in release notes
5. Review and roll out release

**Release Tracks**:
- **Internal Testing**: Up to 100 testers (fast approval)
- **Closed Testing**: Controlled user group (fast approval)
- **Open Testing**: Public but labeled "Early Access"
- **Production**: Live on Play Store (review required, 1-7 days)

### 4. Signing and Version Management

**Version Numbering**:
- `versionCode`: Integer, auto-incremented (1, 2, 3, ...)
- `versionName`: User-facing version string ("1.0", "1.1", "2.0", ...)

**Update Versions**:
```gradle
// android/app/build.gradle
defaultConfig {
    versionCode 3        // Must be higher than previous release
    versionName "1.2.0"  // Semantic versioning (MAJOR.MINOR.PATCH)
}
```

**Keystore Security**:
- Store keystore file and passwords in a **secure vault** (e.g., 1Password, AWS Secrets Manager)
- **Never commit** keystore or `key.properties` to Git
- Add to `.gitignore`:
  ```
  *.keystore
  *.jks
  key.properties
  ```
- Keep backups - losing the keystore means you cannot update your app!

**CI/CD Integration** (optional):
- Store keystore as base64 in GitHub Secrets
- Automate release builds with GitHub Actions
- Example workflow:
  ```yaml
  - name: Decode Keystore
    run: echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > vela-release.keystore

  - name: Build Release APK
    run: |
      cd frontend-web/android
      ./gradlew assembleRelease
    env:
      KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
  ```

### 5. Post-Publishing

**Monitor Crashes**:
- Use Google Play Console's crash reports
- Enable Firebase Crashlytics for detailed stack traces (optional)

**Update App**:
1. Make code changes
2. Increment `versionCode` and `versionName`
3. Rebuild AAB: `./gradlew bundleRelease`
4. Upload to Play Console
5. Roll out update

**User Feedback**:
- Respond to reviews in Play Console
- Track ratings and uninstalls
- Collect user feedback for future features

---

## Troubleshooting

### Build Issues

#### 1. Gradle Build Fails

**Error**: "Could not find or load main class org.gradle.wrapper.GradleWrapperMain"

**Solution**:
```bash
cd frontend-web/android
./gradlew wrapper --gradle-version 8.13
```

---

**Error**: "JAVA_HOME is not set"

**Solution**:
```bash
# Set JAVA_HOME to JDK 21
export JAVA_HOME=/path/to/jdk-21
echo $JAVA_HOME
```

---

**Error**: "Unsupported Java version"

**Solution**: Ensure you're using JDK 21 (required by Gradle 8.13)
```bash
java -version  # Should show version 21.x
```

---

**Error**: "Could not resolve all files for configuration ':app:debugRuntimeClasspath'"

**Solution**: Clean Gradle cache and rebuild
```bash
cd frontend-web/android
./gradlew clean
./gradlew assembleDebug --refresh-dependencies
```

#### 2. Capacitor Sync Fails

**Error**: "Capacitor could not find the web assets directory"

**Solution**: Build the web app first
```bash
cd frontend-web
npm run build:mobile
npx cap sync android
```

---

**Error**: "Error running update: Analyzing dependencies"

**Solution**: Update Capacitor CLI
```bash
npm install @capacitor/cli@latest
npx cap sync android
```

#### 3. Build Succeeds but App Crashes

**Check Logcat** in Android Studio:
1. Open Logcat tab (View > Tool Windows > Logcat)
2. Filter by package: `com.vela.app`
3. Look for red error lines
4. Common causes:
   - Missing API URL in `.env.mobile`
   - Incorrect base path in build
   - Plugin initialization errors

**Common Fix**: Clear cache and rebuild
```bash
cd frontend-web
rm -rf dist android/app/src/main/assets/public
npm run build:mobile
npx cap sync android
```

### Runtime Issues

#### 1. API Calls Fail

**Symptom**: Network errors, "Failed to fetch"

**Checklist**:
- [ ] Backend is running and accessible
- [ ] `.env.mobile` has correct API URL
- [ ] Device is on same network (for local development)
- [ ] CORS is enabled on backend
- [ ] `allowMixedContent: true` in `capacitor.config.json` (for HTTP)

**Test API access**:
```bash
# From device, test if backend is reachable
adb shell
am start -a android.intent.action.VIEW -d http://192.168.1.8:3000/vela/api/health
```

#### 2. Plugins Not Working

**Symptom**: Camera, notifications, or filesystem features fail

**Checklist**:
- [ ] Permissions granted in device settings
- [ ] Plugin is installed: `npm ls @capacitor/camera`
- [ ] Plugin is synced: `npx cap sync android`
- [ ] `capacitor.config.json` has correct plugin settings
- [ ] Check plugin-specific logs in Logcat

**Reset Plugin Permissions**:
1. Go to device Settings > Apps > Vela
2. Permissions > Reset all permissions
3. Restart app and re-grant permissions

#### 3. Share Target Not Appearing

**Symptom**: "Share with Vela" not in share sheet

**Solutions**:
1. Verify intent filters in `AndroidManifest.xml` (lines 26-45)
2. Rebuild and reinstall app
3. Restart device (Android caches intent filters)
4. Check other apps can share text (e.g., share from Chrome)

**Test Intent Filter**:
```bash
adb shell am start -a android.intent.action.SEND \
  -t text/plain \
  -e android.intent.extra.TEXT "https://youtube.com/watch?v=test" \
  -n com.vela.app/.MainActivity
```

#### 4. Notifications Not Showing

**Symptom**: Scheduled notifications don't appear

**Checklist**:
- [ ] Notification permissions granted
- [ ] Battery optimization disabled for Vela
- [ ] Device is not in "Do Not Disturb" mode
- [ ] Notification channel is not muted
- [ ] App is not force-stopped

**Debug Notifications**:
```javascript
// Check pending notifications
import { LocalNotifications } from '@capacitor/local-notifications';
const pending = await LocalNotifications.getPending();
console.log('Pending notifications:', pending);
```

**Android 12+ Exact Alarms**:
Some devices require manual permission for exact alarms:
1. Settings > Apps > Vela > Advanced > Alarms & Reminders
2. Enable "Allow setting alarms and reminders"

### Device-Specific Issues

#### 1. Samsung Devices

**Issue**: Background notifications killed by battery optimization

**Solution**: Disable battery optimization
1. Settings > Apps > Vela > Battery > Optimize battery usage
2. Select "All apps" and find Vela
3. Toggle off

#### 2. Xiaomi/MIUI Devices

**Issue**: App permissions reset after reboot

**Solution**: Enable autostart
1. Settings > Apps > Manage apps > Vela
2. Enable "Autostart"
3. Battery saver > No restrictions

#### 3. OnePlus Devices

**Issue**: Notifications don't wake screen

**Solution**: Change battery optimization to "Don't optimize"

---

## Advanced Topics

### 1. Custom Native Code

If you need to add custom Java/Kotlin code:

**File**: `android/app/src/main/java/com/vela/app/MainActivity.java`

```java
package com.vela.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Custom native initialization code here
  }
}
```

### 2. Firebase Integration (Optional)

For push notifications and analytics:

1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Add Android app with package name `com.vela.app`
3. Download `google-services.json`
4. Place in `android/app/google-services.json`
5. Rebuild: `npx cap sync android`
6. Update `capacitor.js` to enable `initPushNotifications()`

### 3. Deep Linking

Open Vela from web links (e.g., `https://seiyul.in/vela/tasks/123`):

**Add Intent Filter** in `AndroidManifest.xml`:
```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https"
          android:host="seiyul.in"
          android:pathPrefix="/vela" />
</intent-filter>
```

**Handle Deep Links** in `App.jsx`:
```javascript
import { App as CapApp } from '@capacitor/app';

CapApp.addListener('appUrlOpen', (data) => {
  const url = data.url;
  // Parse URL and navigate in React
  console.log('Deep link opened:', url);
});
```

### 4. App Bundle Optimization

Reduce APK size:

**Enable Code Shrinking** in `app/build.gradle`:
```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

**Use WebP Images**: Convert PNG/JPG to WebP for smaller sizes
```bash
cwebp input.png -q 90 -o output.webp
```

**Analyze APK**: Use Android Studio's APK Analyzer
1. Build > Analyze APK
2. Select `app-release.apk`
3. Review size breakdown

---

## Resources

### Official Documentation
- **Capacitor**: [capacitorjs.com/docs](https://capacitorjs.com/docs)
- **Android Developer**: [developer.android.com](https://developer.android.com)
- **Gradle**: [gradle.org/guides](https://gradle.org/guides/)
- **Vite**: [vitejs.dev](https://vitejs.dev)

### Vela-Specific Docs
- **CLAUDE.md**: Development guide (this project)
- **FEATURES.md**: User-facing feature documentation
- **backend/README.md**: API reference

### Community Support
- **Capacitor Forum**: [forum.ionicframework.com](https://forum.ionicframework.com/)
- **Stack Overflow**: Tag `capacitor` or `android`

### Tools
- **APK Analyzer**: Inspect APK contents and size
- **Scrcpy**: Mirror Android screen to desktop ([github.com/Genymobile/scrcpy](https://github.com/Genymobile/scrcpy))
- **Android Asset Studio**: Generate icons ([developer.android.com/studio/write/image-asset-studio](https://developer.android.com/studio/write/image-asset-studio))

---

## Changelog

| Version | Date       | Changes                                      |
|---------|------------|----------------------------------------------|
| 1.2     | 2026-02-21 | Added comprehensive mobile build guide      |
| 1.1     | 2026-02-07 | Added task editing, mobile URL fix           |
| 1.0     | 2026-01-15 | Initial Capacitor mobile app release         |

---

**Last Updated**: 2026-02-21
**Maintained By**: Vela Development Team
**Questions?** Refer to CLAUDE.md or open an issue on GitHub.
