// Tests that TasksRepository correctly parses API response shapes.
//
// Why this matters: the most common Flutter bug class in this project has been
// clients assuming the wrong API shape (flat array vs envelope). These tests
// lock down the parsing contract so a shape change fails here first.
//
// API shape rules (matches backend/tests/tasks.test.js):
//   GET /api/tasks          → { "data": [...], "pagination": {} }  ← envelope
//   GET /api/tasks/:id/subtasks → [...]                            ← flat array (exception)

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:vela_flutter/core/network/dio_client.dart';
import 'package:vela_flutter/data/repositories/tasks_repository.dart';

class MockDioClient extends Mock implements DioClient {}
class MockDio extends Mock implements Dio {}

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

  // Minimal task JSON matching backend response + Task.fromJson requirements
  final taskJson = {
    'id': 1,
    'user_id': 42,
    'title': 'Study Flutter testing',
    'type': 'TASK',
    'completed': false,
    'status': 'TODO',
    'tags': <dynamic>[],
    'subtasks': <dynamic>[],
    'resources': <dynamic>[],
  };

  group('getAll() — parses envelope { data: [...], pagination: {} }', () {
    test('returns list of Tasks from envelope response', () async {
      when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters')))
          .thenAnswer((_) async => Response(
                data: {
                  'data': [taskJson],
                  'pagination': {'page': 1, 'limit': 50, 'total': 1, 'totalPages': 1},
                },
                statusCode: 200,
                requestOptions: RequestOptions(path: ''),
              ));

      final tasks = await repository.getAll();

      expect(tasks, isA<List>());
      expect(tasks.length, 1);
      expect(tasks.first.id, 1);
      expect(tasks.first.title, 'Study Flutter testing');
    });

    test('returns empty list when data array is empty', () async {
      when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters')))
          .thenAnswer((_) async => Response(
                data: {
                  'data': <dynamic>[],
                  'pagination': {'page': 1, 'limit': 50, 'total': 0, 'totalPages': 0},
                },
                statusCode: 200,
                requestOptions: RequestOptions(path: ''),
              ));

      final tasks = await repository.getAll();

      expect(tasks, isEmpty);
    });
  });

  // Critical: subtasks returns a FLAT array — NOT an envelope.
  // getSubtasks() correctly uses `response.data as List` (not response.data['data']).
  // This test locks down that exception so it doesn't get "fixed" to envelope by mistake.
  group('getSubtasks() — parses FLAT array (no envelope)', () {
    test('returns list of Tasks from flat array response', () async {
      when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters')))
          .thenAnswer((_) async => Response(
                data: [taskJson], // flat array — no envelope
                statusCode: 200,
                requestOptions: RequestOptions(path: ''),
              ));

      final subtasks = await repository.getSubtasks(1);

      expect(subtasks, isA<List>());
      expect(subtasks.length, 1);
      expect(subtasks.first.id, 1);
    });

    test('returns empty list when subtasks array is empty', () async {
      when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters')))
          .thenAnswer((_) async => Response(
                data: <dynamic>[], // flat empty array
                statusCode: 200,
                requestOptions: RequestOptions(path: ''),
              ));

      final subtasks = await repository.getSubtasks(1);

      expect(subtasks, isEmpty);
    });
  });

  group('create() — returns single Task object (no envelope)', () {
    test('parses created task from response', () async {
      when(() => mockDio.post(any(), data: any(named: 'data')))
          .thenAnswer((_) async => Response(
                data: taskJson,
                statusCode: 201,
                requestOptions: RequestOptions(path: ''),
              ));

      final task = await repository.create({'title': 'Study Flutter testing'});

      expect(task.id, 1);
      expect(task.title, 'Study Flutter testing');
      expect(task.status, 'TODO');
    });
  });
}
