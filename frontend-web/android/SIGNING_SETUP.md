# Android App Signing Setup

## Create a Keystore (One-Time Setup)

```bash
# In frontend-web/android directory
cd android
keytool -genkey -v -keystore vela-release.keystore -alias vela -keyalg RSA -keysize 2048 -validity 10000

# You'll be prompted for:
# - Keystore password (SAVE THIS!)
# - Key password (SAVE THIS!)
# - Your name, organization, etc.
```

**IMPORTANT**: Save the keystore file and passwords securely! If you lose them, you won't be able to update your app.

## Configure Gradle to Use the Keystore

1. Create `android/key.properties` (DO NOT commit to git):

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=vela
storeFile=vela-release.keystore
```

2. Update `android/app/build.gradle`:

Add before the `android {` block:
```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Update the `android {` block to include signing config:
```gradle
android {
    ...
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

3. Add to `.gitignore`:
```
android/key.properties
android/*.keystore
```

## Build Release APK

```bash
cd frontend-web
npm run build:mobile
npx cap sync android
cd android
./gradlew assembleRelease

# APK will be at: app/build/outputs/apk/release/app-release.apk
```

## Keep Keystore Safe!

- **Backup** the keystore file to a secure location
- **Never commit** it to git
- If you lose it, you can't update the app (users would need to uninstall)
