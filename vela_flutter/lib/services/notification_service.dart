import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
// ignore: depend_on_referenced_packages
import 'package:timezone/timezone.dart' as tz;
import '../data/models/important_date.dart';
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

  // Notification IDs
  static const int _morningBriefNotificationId = 9000;

  // Payload constants
  static const String morningBriefPayload = 'morning_brief';
  static const String importantDatePayloadPrefix = 'important_date:';

  // Navigation callback — set by the app shell after router is ready
  void Function(String route)? onNotificationTap;

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

    await _plugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationResponse,
    );

    // Android 13+ explicit notification permission request
    final androidImpl = _plugin.resolvePlatformSpecificImplementation<
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

  /// Schedules all future local notifications for an important date.
  ///
  /// Notification IDs are deterministic and separated from task IDs:
  /// 100000000 + importantDateId * 10 + offsetIndex.
  Future<void> scheduleImportantDate(ImportantDate date) async {
    _assertInitialized();
    await cancelImportantDate(date.id);

    final offsets = [...date.reminderOffsetsDays]..sort((a, b) => b.compareTo(a));
    final occurrence = _importantDateOccurrence(date);

    for (var index = 0; index < offsets.length && index < 10; index++) {
      final offset = offsets[index];
      final fireAt = _importantDateFireTime(occurrence, date.time, offset);
      if (fireAt.isBefore(DateTime.now())) continue;

      final androidDetails = AndroidNotificationDetails(
        'vela_important_dates',
        'Important Dates',
        channelDescription: 'Vela important date reminders',
        importance: Importance.high,
        priority: Priority.high,
        enableVibration: true,
        playSound: true,
        icon: '@mipmap/ic_launcher',
      );

      const darwinDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      );

      final details = NotificationDetails(
        android: androidDetails,
        iOS: darwinDetails,
        macOS: darwinDetails,
      );

      await _plugin.zonedSchedule(
        _importantDateNotificationId(date.id, index),
        date.title,
        _importantDateBody(offset),
        _toTZDateTime(fireAt),
        details,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
        payload: '$importantDatePayloadPrefix${date.id}',
      );
    }
  }

  /// Cancels all local notifications for an important date.
  Future<void> cancelImportantDate(int importantDateId) async {
    _assertInitialized();
    for (var index = 0; index < 10; index++) {
      await _plugin.cancel(_importantDateNotificationId(importantDateId, index));
    }
  }

  /// Schedules a daily repeating notification at [hour]:[minute] every day.
  ///
  /// Uses notification ID [_morningBriefNotificationId] (9000) so re-scheduling
  /// always replaces the previous morning brief notification.
  Future<void> scheduleDailyMorningBrief({
    required int hour,
    required int minute,
  }) async {
    _assertInitialized();

    // Cancel any existing morning brief before re-scheduling
    await _plugin.cancel(_morningBriefNotificationId);

    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
      'vela_morning_brief',
      'Morning Brief',
      channelDescription: 'Daily morning study brief from Vela',
      importance: Importance.high,
      priority: Priority.high,
      enableVibration: true,
      playSound: true,
      icon: '@mipmap/ic_launcher',
    );

    const DarwinNotificationDetails darwinDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS: darwinDetails,
      macOS: darwinDetails,
    );

    final now = tz.TZDateTime.now(tz.local);
    var scheduledDate = tz.TZDateTime(
      tz.local,
      now.year,
      now.month,
      now.day,
      hour,
      minute,
    );
    // If the time has already passed today, schedule for tomorrow
    if (scheduledDate.isBefore(now)) {
      scheduledDate = scheduledDate.add(const Duration(days: 1));
    }

    await _plugin.zonedSchedule(
      _morningBriefNotificationId,
      '📚 Morning Brief',
      "Your study brief is ready — tap to view today's plan",
      scheduledDate,
      details,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.time,
      payload: morningBriefPayload,
    );

    if (kDebugMode) {
      debugPrint(
        '[NotificationService] Morning brief scheduled daily at $hour:${minute.toString().padLeft(2, '0')}',
      );
    }
  }

  /// Cancels the daily morning brief notification.
  Future<void> cancelMorningBrief() async {
    _assertInitialized();
    await _plugin.cancel(_morningBriefNotificationId);
    if (kDebugMode) {
      debugPrint('[NotificationService] Morning brief cancelled');
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

  void _onNotificationResponse(NotificationResponse response) {
    if (response.payload == morningBriefPayload) {
      onNotificationTap?.call('/morning-brief');
    } else if (response.payload?.startsWith(importantDatePayloadPrefix) == true) {
      onNotificationTap?.call('/important-dates');
    }
  }

  int _importantDateNotificationId(int importantDateId, int offsetIndex) {
    return 100000000 + importantDateId * 10 + offsetIndex;
  }

  DateTime _importantDateOccurrence(ImportantDate date) {
    final base = date.displayDate;
    return DateTime(base.year, base.month, base.day);
  }

  DateTime _importantDateFireTime(
    DateTime occurrence,
    String? eventTime,
    int offsetDays,
  ) {
    final reminderDay = occurrence.subtract(Duration(days: offsetDays));
    final timeParts = offsetDays == 0 && eventTime != null
        ? eventTime.split(':').map(int.parse).toList()
        : const [9, 0, 0];
    return DateTime(
      reminderDay.year,
      reminderDay.month,
      reminderDay.day,
      timeParts[0],
      timeParts.length > 1 ? timeParts[1] : 0,
      timeParts.length > 2 ? timeParts[2] : 0,
    );
  }

  String _importantDateBody(int offsetDays) {
    if (offsetDays == 0) return 'Happening today';
    if (offsetDays == 1) return 'Happening tomorrow';
    return 'Happening in $offsetDays days';
  }

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

  /// Returns true if the service is ready. Callers that depend on the plugin
  /// being initialized should guard with this check rather than asserting,
  /// since initialize() is called fire-and-forget in main().
  bool get isInitialized => _initialized;

  void _assertInitialized() {
    if (!_initialized) {
      throw StateError(
        'NotificationService.initialize() must be called before use.',
      );
    }
  }
}
