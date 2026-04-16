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
  Future<void> schedule(LocalStorage localStorage, TimeOfDay time) async {
    await localStorage.setMorningBriefEnabled(true);
    await localStorage.setMorningBriefTime(time.hour, time.minute);
    await NotificationService().scheduleDailyMorningBrief(
      hour: time.hour,
      minute: time.minute,
    );
  }

  /// Cancels the morning brief notification and persists the disabled state.
  Future<void> cancel(LocalStorage localStorage) async {
    await localStorage.setMorningBriefEnabled(false);
    await NotificationService().cancelMorningBrief();
  }

  /// Re-schedules the morning brief from stored preferences.
  ///
  /// Safe to call on every app resume — no-op if the feature is disabled.
  /// This ensures the daily alarm survives device reboots.
  Future<void> scheduleFromPrefs(LocalStorage localStorage) async {
    if (!localStorage.getMorningBriefEnabled()) return;
    final hour = localStorage.getMorningBriefHour();
    final minute = localStorage.getMorningBriefMinute();
    await NotificationService().scheduleDailyMorningBrief(
      hour: hour,
      minute: minute,
    );
  }
}
