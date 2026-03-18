import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
// ignore: depend_on_referenced_packages
import 'package:timezone/timezone.dart' as tz;
import '../data/models/task.dart';

/// Singleton service that wraps [FlutterLocalNotificationsPlugin].
///
/// Usage:
///   await NotificationService().initialize();   // once, in main()
///   NotificationService().scheduleReminder(task);
///   NotificationService().cancelReminder(taskId);
///   NotificationService().cancelAll();
class NotificationService {
  // ---------------------------------------------------------------------------
  // Singleton boilerplate
  // ---------------------------------------------------------------------------
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------
  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /// Initialises the plugin and requests permissions.
  ///
  /// Must be called (and awaited) before [scheduleReminder] is used.
  /// Safe to call multiple times — subsequent calls are no-ops.
  Future<void> initialize() async {
    if (_initialized) return;

    // Android initialisation settings
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS / macOS initialisation settings — request permission at init time
    const DarwinInitializationSettings darwinSettings =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: darwinSettings,
      macOS: darwinSettings,
    );

    await _plugin.initialize(initSettings);

    // Android 13+ explicit notification permission request
    final androidImpl = _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();
    if (androidImpl != null) {
      final granted = await androidImpl.requestNotificationsPermission();
      if (kDebugMode) {
        debugPrint(
          '[NotificationService] Android notification permission: $granted',
        );
      }
    }

    _initialized = true;
    if (kDebugMode) {
      debugPrint('[NotificationService] Initialized');
    }
  }

  /// Schedules a local notification at [task.reminderTime].
  ///
  /// Uses [task.id] as the notification id so that re-scheduling the same
  /// task always replaces the previous notification for that task.
  ///
  /// No-op if [task.reminderTime] is null, already in the past, or the task
  /// reminder has been dismissed.
  Future<void> scheduleReminder(Task task) async {
    _assertInitialized();

    final reminderTime = task.reminderTime;
    if (reminderTime == null) return;
    if (task.reminderDismissed) return;

    // Determine effective fire time — snoozed-until takes priority.
    final fireAt = task.reminderSnoozedUntil ?? reminderTime;
    if (fireAt.isBefore(DateTime.now())) return;

    final bool isSilent = task.alertType == 'silent';

    final AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
      'vela_reminders',
      'Task Reminders',
      channelDescription: 'Vela task reminder notifications',
      importance: isSilent ? Importance.low : Importance.high,
      priority: isSilent ? Priority.low : Priority.high,
      enableVibration: !isSilent,
      playSound: !isSilent,
      icon: '@mipmap/ic_launcher',
    );

    const DarwinNotificationDetails darwinDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS: darwinDetails,
      macOS: darwinDetails,
    );

    final String body = task.content?.isNotEmpty == true
        ? task.content!
        : 'You have a task reminder';

    await _plugin.zonedSchedule(
      task.id, // notification id == task id
      task.title,
      body,
      _toTZDateTime(fireAt),
      details,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      // ignore: deprecated_member_use — payload not needed; kept for API compat
    );

    if (kDebugMode) {
      debugPrint(
        '[NotificationService] Scheduled reminder for task ${task.id} at $fireAt',
      );
    }
  }

  /// Cancels the scheduled notification for [taskId].
  Future<void> cancelReminder(int taskId) async {
    _assertInitialized();
    await _plugin.cancel(taskId);
    if (kDebugMode) {
      debugPrint(
        '[NotificationService] Cancelled reminder for task $taskId',
      );
    }
  }

  /// Cancels ALL scheduled notifications managed by this service.
  Future<void> cancelAll() async {
    _assertInitialized();
    await _plugin.cancelAll();
    if (kDebugMode) {
      debugPrint('[NotificationService] Cancelled all reminders');
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /// Converts a plain [DateTime] to a [tz.TZDateTime] anchored in the device
  /// local timezone.  flutter_local_notifications v17 requires [tz.TZDateTime]
  /// for [zonedSchedule].
  tz.TZDateTime _toTZDateTime(DateTime dateTime) {
    return tz.TZDateTime(
      tz.local,
      dateTime.year,
      dateTime.month,
      dateTime.day,
      dateTime.hour,
      dateTime.minute,
      dateTime.second,
    );
  }

  void _assertInitialized() {
    assert(
      _initialized,
      'NotificationService.initialize() must be called before use.',
    );
  }
}
