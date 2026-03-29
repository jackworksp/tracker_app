// Tests that TasksRepository correctly parses API response shapes.
//
// Why this matters: the most common Flutter bug class in this project has been
// clients assuming the wrong API shape (flat array vs envelope). These tests
// lock down the parsing contract so a shape change fails here first.
//
// API shape rules (matches backend/tests/tasks.test.js):
//   GET /api/tasks          → { "data": [...], "pagination": {} }  ← envelope
//   GET /api/tasks/:id/subtasks → [...]                            ← flat array (exception)

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:vela_flutter/data/repositories/tasks_repository.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  late MockDioClient mockDioClient;
  late MockDio mockDio;
  late TasksRepository repository;

  setUp(() {
    mockDioClient = MockDioClient();
    mockDio = MockDio();
    when(() => mockDioClient.dio).thenReturn(mockDio);
    repository = TasksRepository(mockDioClient);
  });

  final taskJson = buildTaskJson();

  group('getAll() — parses envelope { data: [...], pagination: {} }', () {
    test('returns list of Tasks from envelope response', () async {
      when(() => mockDio.get(any(),
              queryParameters: any(named: 'queryParameters')))
          .thenAnswer((_) async => buildResponse(data: {
                'data': [taskJson],
                'pagination': {
                  'page': 1,
                  'limit': 50,
                  'total': 1,
                  'totalPages': 1
                },
              }));

      final tasks = await repository.getAll();

      expect(tasks, isA<List>());
      expect(tasks.length, 1);
      expect(tasks.first.id, 1);
      expect(tasks.first.title, 'Study Flutter testing');
    });

    test('returns empty list when data array is empty', () async {
      when(() => mockDio.get(any(),
              queryParameters: any(named: 'queryParameters')))
          .thenAnswer((_) async => buildResponse(data: {
                'data': <dynamic>[],
                'pagination': {
                  'page': 1,
                  'limit': 50,
                  'total': 0,
                  'totalPages': 0
                },
              }));

      final tasks = await repository.getAll();

      expect(tasks, isEmpty);
    });
  });

  // Critical: subtasks returns a FLAT array — NOT an envelope.
  // getSubtasks() correctly uses `response.data as List` (not response.data['data']).
  // This test locks down that exception so it doesn't get "fixed" to envelope by mistake.
  group('getSubtasks() — parses FLAT array (no envelope)', () {
    test('returns list of Tasks from flat array response', () async {
      when(() => mockDio.get(any(),
              queryParameters: any(named: 'queryParameters')))
          .thenAnswer((_) async => buildResponse(data: [taskJson]));

      final subtasks = await repository.getSubtasks(1);

      expect(subtasks, isA<List>());
      expect(subtasks.length, 1);
      expect(subtasks.first.id, 1);
    });

    test('returns empty list when subtasks array is empty', () async {
      when(() => mockDio.get(any(),
              queryParameters: any(named: 'queryParameters')))
          .thenAnswer((_) async => buildResponse(data: <dynamic>[]));

      final subtasks = await repository.getSubtasks(1);

      expect(subtasks, isEmpty);
    });
  });

  group('create() — returns single Task object (no envelope)', () {
    test('parses created task from response', () async {
      when(() => mockDio.post(any(), data: any(named: 'data'))).thenAnswer(
          (_) async => buildResponse(data: taskJson, statusCode: 201));

      final task = await repository.create({'title': 'Study Flutter testing'});

      expect(task.id, 1);
      expect(task.title, 'Study Flutter testing');
      expect(task.status, 'TODO');
    });
  });

  group('reminder methods', () {
    test('setReminder calls reminder endpoint and returns updated task',
        () async {
      final reminderTime = DateTime.utc(2024, 1, 1, 9, 0);
      when(() => mockDio.put(any(), data: any(named: 'data')))
          .thenAnswer((_) async => buildResponse(
                data: buildTaskJson(id: 1, reminderTime: reminderTime),
              ));

      final task = await repository.setReminder(1, {
        'reminder_time': reminderTime.toIso8601String(),
        'alert_type': 'basic',
      });

      verify(() => mockDio.put('/tasks/1/reminder', data: {
            'reminder_time': reminderTime.toIso8601String(),
            'alert_type': 'basic',
          })).called(1);
      expect(task.reminderTime, reminderTime);
    });

    test('getPendingReminders parses envelope response', () async {
      when(() => mockDio.get(any(),
              queryParameters: any(named: 'queryParameters')))
          .thenAnswer((_) async => buildResponse(data: {
                'data': [
                  buildTaskJson(reminderTime: DateTime.utc(2024, 1, 1, 9))
                ],
                'pagination': {
                  'page': 1,
                  'limit': 50,
                  'total': 1,
                  'totalPages': 1
                },
              }));

      final tasks = await repository.getPendingReminders();

      verify(() => mockDio.get(
            '/tasks/reminders/pending',
            queryParameters: any(named: 'queryParameters'),
          )).called(1);
      expect(tasks, hasLength(1));
      expect(tasks.first.reminderTime, isNotNull);
    });
  });
}
