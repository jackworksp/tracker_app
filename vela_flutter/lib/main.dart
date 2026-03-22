import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// ignore: depend_on_referenced_packages
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:share_handler/share_handler.dart';
import 'app.dart';
import 'core/storage/local_storage.dart';
import 'providers/auth_provider.dart';
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

  // Initialize notification service (requests permissions on first run)
  await NotificationService().initialize();

  // Issue 05: check whether we were launched via a share intent.
  // If so, navigate directly to the share receive screen instead of landing.
  try {
    final sharedMedia =
        await ShareHandlerPlatform.instance.getInitialSharedMedia();
    if (sharedMedia != null &&
        (sharedMedia.content?.isNotEmpty == true ||
            sharedMedia.attachments?.isNotEmpty == true)) {
      _initialLocation = '/share-receive';
    }
  } catch (_) {
    // Silently ignore — share_handler may not be configured on all platforms.
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
