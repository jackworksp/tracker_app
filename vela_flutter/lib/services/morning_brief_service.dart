import 'package:flutter/material.dart';
import '../core/storage/local_storage.dart';
import 'notification_service.dart';

/// Manages the daily Morning Brief notification lifecycle.
///
/// Call [scheduleFromPrefs] on app start and resume to ensure the
/// daily notification survives reboots and OS notification cleanup.
/// Call [schedule] when the user enables or changes the time.
/// Call [cancel] when the user disables the feature.
class MorningBriefService {
  static final MorningBriefService _instance = MorningBriefService._internal();
  factory MorningBriefService() => _instance;
  MorningBriefService._internal();

  /// Schedules the morning brief at the given [time] and persists the setting.
  ///
  /// Ensures [NotificationService] is initialized before scheduling.
  Future<void> schedule(LocalStorage localStorage, TimeOfDay time) async {
    await localStorage.setMorningBriefEnabled(true);
    await localStorage.setMorningBriefTime(time.hour, time.minute);
    await _ensureInitialized();
    await NotificationService().scheduleDailyMorningBrief(
      hour: time.hour,
      minute: time.minute,
    );
  }

  /// Cancels the morning brief notification and persists the disabled state.
  Future<void> cancel(LocalStorage localStorage) async {
    await localStorage.setMorningBriefEnabled(false);
    if (!NotificationService().isInitialized) return;
    await NotificationService().cancelMorningBrief();
  }

  /// Re-schedules the morning brief from stored preferences.
  ///
  /// Safe to call on every app resume — no-op if the feature is disabled.
  /// This ensures the daily alarm survives device reboots.
  Future<void> scheduleFromPrefs(LocalStorage localStorage) async {
    if (!localStorage.getMorningBriefEnabled()) return;
    await _ensureInitialized();
    final hour = localStorage.getMorningBriefHour();
    final minute = localStorage.getMorningBriefMinute();
    await NotificationService().scheduleDailyMorningBrief(
      hour: hour,
      minute: minute,
    );
  }

  /// Waits up to 3 seconds for [NotificationService] to finish initializing.
  /// If it's still not ready, initializes it explicitly.
  Future<void> _ensureInitialized() async {
    if (NotificationService().isInitialized) return;
    // initialize() is fire-and-forget in main() — wait briefly for it
    for (var i = 0; i < 30; i++) {
      await Future<void>.delayed(const Duration(milliseconds: 100));
      if (NotificationService().isInitialized) return;
    }
    // Still not ready — initialize explicitly
    await NotificationService().initialize();
  }
}
