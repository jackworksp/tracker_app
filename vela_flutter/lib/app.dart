import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'providers/tasks_provider.dart';
import 'providers/theme_provider.dart';
import 'services/notification_service.dart';
import 'ui/navigation/app_router.dart';

class VelaApp extends ConsumerStatefulWidget {
  const VelaApp({super.key});

  @override
  ConsumerState<VelaApp> createState() => _VelaAppState();
}

class _VelaAppState extends ConsumerState<VelaApp>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // Phase 5 — Background polling on app resume
  // ---------------------------------------------------------------------------

  /// When the app returns from background (or from another activity), fetch
  /// all pending reminders from the server and reschedule their local
  /// notifications.  This ensures notifications survive app restarts and
  /// OS-level notification cleanup.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _rescheduleReminders();
    }
  }

  Future<void> _rescheduleReminders() async {
    try {
      final pendingTasks =
          await ref.read(tasksProvider.notifier).getPendingReminders();
      for (final task in pendingTasks) {
        await NotificationService().scheduleReminder(task);
      }
    } catch (_) {
      // Silently swallow errors — this is a background best-effort operation.
    }
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeModeProvider);
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Vela',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
