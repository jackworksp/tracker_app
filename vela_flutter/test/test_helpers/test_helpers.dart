import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:vela_flutter/core/network/dio_client.dart';
import 'package:vela_flutter/core/storage/local_storage.dart';
import 'package:vela_flutter/core/storage/secure_storage.dart';

class MockDioClient extends Mock implements DioClient {}

class MockDio extends Mock implements Dio {}

Response<dynamic> buildResponse({
  required dynamic data,
  int statusCode = 200,
  String path = '/',
}) {
  return Response<dynamic>(
    data: data,
    statusCode: statusCode,
    requestOptions: RequestOptions(path: path),
  );
}

Map<String, dynamic> buildTaskJson({
  int id = 1,
  String title = 'Study Flutter testing',
  String type = 'TASK',
  bool completed = false,
  String status = 'TODO',
  int? subjectId,
  DateTime? reminderTime,
  DateTime? reminderSnoozedUntil,
  bool reminderDismissed = false,
}) {
  return {
    'id': id,
    'user_id': 42,
    'subject_id': subjectId,
    'title': title,
    'type': type,
    'completed': completed,
    'status': status,
    'tags': <dynamic>[],
    'subtasks': <dynamic>[],
    'resources': <dynamic>[],
    'reminder_time': reminderTime?.toIso8601String(),
    'alert_type': 'basic',
    'reminder_snoozed_until': reminderSnoozedUntil?.toIso8601String(),
    'reminder_dismissed': reminderDismissed,
  };
}

Map<String, dynamic> buildSubjectJson({
  int id = 1,
  String name = 'Mathematics',
}) {
  return {
    'id': id,
    'user_id': 42,
    'name': name,
    'color': '#123456',
    'created_at': '2024-01-01T00:00:00.000Z',
  };
}

Map<String, dynamic> buildSessionJson({
  int id = 1,
  int? subjectId = 1,
  String date = '2024-01-01',
  String type = 'STUDY',
  int timeSpent = 30,
  int revisionCount = 0,
  int attachmentCount = 0,
}) {
  return {
    'id': id,
    'subject_id': subjectId,
    'date': date,
    'activity': 'Read chapter 1',
    'time_spent': timeSpent,
    'revision_count': revisionCount,
    'attachment_count': attachmentCount,
    'type': type,
  };
}

Map<String, dynamic> buildUserJson({
  int id = 1,
  String userId = 'user-1',
  String? name = 'Ada',
  int? activeSubjectId = 1,
}) {
  return {
    'id': id,
    'user_id': userId,
    'name': name,
    'active_subject_id': activeSubjectId,
    'profile_photo_url': null,
    'mcp_api_key': null,
  };
}

Map<String, dynamic> buildRoutineJson({
  int id = 1,
  String title = 'Daily review',
  int streak = 0,
  bool isCompletedToday = false,
}) {
  return {
    'id': id,
    'user_id': 42,
    'title': title,
    'frequency': 'DAILY',
    'category': 'GENERAL',
    'color': 'blue',
    'streak': streak,
    'is_completed_today': isCompletedToday,
  };
}

class MemoryLocalStorage extends LocalStorage {
  int? lastSubjectId;
  bool hasSeenSwipeHint = false;

  @override
  int? getLastSubjectId() => lastSubjectId;

  @override
  Future<void> setLastSubjectId(int id) async {
    lastSubjectId = id;
  }

  @override
  bool getHasSeenSwipeHint() => hasSeenSwipeHint;

  @override
  Future<void> setHasSeenSwipeHint() async {
    hasSeenSwipeHint = true;
  }

  @override
  Future<void> clearUserData() async {
    lastSubjectId = null;
  }
}

class MemorySecureStorage extends SecureStorage {
  String? token;
  String? userJson;

  @override
  Future<void> saveToken(String token) async {
    this.token = token;
  }

  @override
  Future<String?> getToken() async => token;

  @override
  Future<void> deleteToken() async {
    token = null;
  }

  @override
  Future<void> saveUser(String userJson) async {
    this.userJson = userJson;
  }

  @override
  Future<String?> getUser() async => userJson;

  @override
  Future<void> deleteUser() async {
    userJson = null;
  }

  @override
  Future<void> clearAll() async {
    token = null;
    userJson = null;
  }
}

Future<void> pumpTestApp(
  WidgetTester tester,
  Widget child, {
  List<Override> overrides = const [],
  MediaQueryData? mediaQuery,
}) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: overrides,
      child: MaterialApp(
        home: MediaQuery(
          data: mediaQuery ?? const MediaQueryData(),
          child: child,
        ),
      ),
    ),
  );
}

Future<void> pumpWithMaterial(
  WidgetTester tester,
  Widget child, {
  MediaQueryData? mediaQuery,
}) async {
  await tester.pumpWidget(
    MaterialApp(
      home: MediaQuery(
        data: mediaQuery ?? const MediaQueryData(),
        child: Scaffold(body: child),
      ),
    ),
  );
}

Future<void> flushMicrotasks() => Future<void>.delayed(Duration.zero);
