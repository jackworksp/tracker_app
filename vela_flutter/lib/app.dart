import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/tasks_provider.dart';
import 'providers/theme_provider.dart';
import 'services/notification_service.dart';
import 'ui/navigation/app_router.dart';
import 'ui/screens/shared/onboarding_tooltips.dart';

class VelaApp extends ConsumerStatefulWidget {
  const VelaApp({super.key});

  @override
  ConsumerState<VelaApp> createState() => _VelaAppState();
}

// ---------------------------------------------------------------------------
// Issue 03 — Onboarding overlay wrapper
// Shows OnboardingTooltips over the full app on first authenticated launch.
// ---------------------------------------------------------------------------

class _OnboardingOverlay extends ConsumerStatefulWidget {
  final Widget child;
  final bool reduceMotion;

  const _OnboardingOverlay({required this.child, required this.reduceMotion});

  @override
  ConsumerState<_OnboardingOverlay> createState() =>
      _OnboardingOverlayState();
}

class _OnboardingOverlayState extends ConsumerState<_OnboardingOverlay> {
  // Local dismissed flag so the overlay removes itself without needing a
  // Provider rebuild after localStorage.setHasSeenOnboarding() is called.
  bool _dismissed = false;

  void _handleDismissed() {
    if (mounted) setState(() => _dismissed = true);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final localStorage = ref.watch(localStorageProvider);
    // Show only once: user is authenticated AND has not seen onboarding yet.
    final shouldShow = authState.isAuthenticated &&
        !localStorage.getHasSeenOnboarding() &&
        !_dismissed;

    if (!shouldShow) return widget.child;

    return Stack(
      children: [
        widget.child,
        // Issue 09: skip animated overlay when OS prefers reduced motion
        if (!widget.reduceMotion)
          OnboardingTooltips(onCompleted: _handleDismissed),
      ],
    );
  }
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
    // Issue 09: respect OS-level reduced-motion preference throughout the app
    final reduceMotion = MediaQuery.maybeOf(context)?.disableAnimations ?? false;

    return MaterialApp.router(
      title: 'Vela',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode,
      routerConfig: router,
      builder: (context, child) {
        return _OnboardingOverlay(
          reduceMotion: reduceMotion,
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
