import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
// ignore: depend_on_referenced_packages
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:share_handler/share_handler.dart';
import 'app.dart';
import 'core/storage/local_storage.dart';
import 'providers/auth_provider.dart';
import 'services/android_share_bridge.dart';
import 'services/notification_service.dart';
import 'ui/navigation/app_router.dart';

// Issue 05 — initialShareRoute is set before the app starts if the launch was
// triggered by a share intent.  GoRouter reads this initial location so the
// user lands directly on ShareReceiveScreen.
String _initialLocation = '/landing';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize timezone database (required by flutter_local_notifications)
  tz.initializeTimeZones();

  // Initialize local storage before app starts
  final localStorage = LocalStorage();
  await localStorage.init();

  // Initialize notification service (requests permissions on first run).
  // Fire-and-forget — don't block runApp() waiting for the permission dialog.
  NotificationService().initialize();

  // ── Determine initial route before the app renders anything ──
  // Read the token directly from secure storage (same key used by SecureStorage
  // class) so we can skip /landing entirely for returning logged-in users.
  // This eliminates the landing-screen flash on cold start.
  try {
    const secureStore = FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
    );
    // Issue: Android Keystore can occasionally hang or throw GeneralSecurityException
    // during a cold start, which crashes main() and sticks the app on the splash screen.
    // We wrap this in a 1-second timeout and try/catch to ensure runApp() always fires.
    final existingToken = await secureStore.read(key: 'auth_token').timeout(
          const Duration(seconds: 1),
        );
    if (existingToken != null) {
      _initialLocation = '/tasks';
    }
  } catch (e) {
    debugPrint(
        'Fallback: SecureStorage read failed or timed out during main init: $e');
    // We fall back safely to /landing. The authProvider will attempt recovery later.
  }

  // Issue 05: check whether we were launched via a share intent.
  // Share intent always wins — overrides even the token-based route.
  try {
    final sharedMedia =
        await ShareHandlerPlatform.instance.getInitialSharedMedia();
    if (sharedMedia != null &&
        (sharedMedia.content?.isNotEmpty == true ||
            sharedMedia.attachments?.isNotEmpty == true)) {
      _initialLocation = '/share-receive';
    } else {
      final fallbackPayload =
          await AndroidShareBridge.getInitialSharedPayload();
      if (fallbackPayload?.hasPayload == true) {
        _initialLocation = '/share-receive';
      }
    }
  } catch (_) {
    try {
      final fallbackPayload =
          await AndroidShareBridge.getInitialSharedPayload();
      if (fallbackPayload?.hasPayload == true) {
        _initialLocation = '/share-receive';
      }
    } catch (_) {
      // Silently ignore — share handling may not be configured on all platforms.
    }
  }

  runApp(
    ProviderScope(
      overrides: [
        localStorageProvider.overrideWithValue(localStorage),
        // Issue 05: override the initial route when launched via share intent.
        initialLocationProvider.overrideWithValue(_initialLocation),
      ],
      child: const VelaApp(),
    ),
  );
}
