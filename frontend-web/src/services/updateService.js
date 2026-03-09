import { Preferences } from '@capacitor/preferences';

const VERSION_KEY = 'app_installed_version';

function getBaseUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || '/vela/api';
  return apiUrl.replace(/\/api$/, '');
}

/**
 * Checks if a newer version of the APK is available.
 * Returns update info object if update is available, null otherwise.
 */
export async function checkForUpdate() {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/version.json`, { cache: 'no-store' });
    if (!response.ok) return null;

    const { version, buildDate } = await response.json();
    const { value: storedVersion } = await Preferences.get({ key: VERSION_KEY });

    if (!storedVersion) {
      // First install — store version, no update prompt needed
      await Preferences.set({ key: VERSION_KEY, value: String(version) });
      return null;
    }

    if (parseInt(version) > parseInt(storedVersion)) {
      return {
        version: String(version),
        buildDate,
        apkUrl: `${baseUrl}/app-release.apk`,
      };
    }

    return null;
  } catch (err) {
    console.warn('Update check failed:', err.message);
    return null;
  }
}

/**
 * Persists the installed version so the update banner won't show again for this build.
 */
export async function markUpdateDismissed(version) {
  await Preferences.set({ key: VERSION_KEY, value: String(version) });
}

/**
 * Opens the APK download URL in the device's external browser.
 * Capacitor intercepts the '_system' target and launches the browser.
 */
export function openDownloadUrl(apkUrl) {
  window.open(apkUrl, '_system');
}
