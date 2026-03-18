import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// ignore: depend_on_referenced_packages
import 'package:timezone/data/latest_all.dart' as tz;
import 'app.dart';
import 'core/storage/local_storage.dart';
import 'providers/auth_provider.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize timezone database (required by flutter_local_notifications)
  tz.initializeTimeZones();

  // Initialize local storage before app starts
  final localStorage = LocalStorage();
  await localStorage.init();

  // Initialize notification service (requests permissions on first run)
  await NotificationService().initialize();

  runApp(
    ProviderScope(
      overrides: [
        localStorageProvider.overrideWithValue(localStorage),
      ],
      child: const VelaApp(),
    ),
  );
}
