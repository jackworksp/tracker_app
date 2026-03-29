// Tests that GoalsRepository correctly parses the flat array API response.
//
// Goals endpoint returns a FLAT ARRAY — no envelope.
// Unlike most list endpoints, GET /api/goals returns [...] directly.
// GoalsRepository correctly uses `response.data as List`.
// This test locks down that contract.

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:vela_flutter/data/repositories/goals_repository.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  late MockDioClient mockDioClient;
  late MockDio mockDio;
  late GoalsRepository repository;

  setUp(() {
    mockDioClient = MockDioClient();
    mockDio = MockDio();
    when(() => mockDioClient.dio).thenReturn(mockDio);
    repository = GoalsRepository(mockDioClient);
  });

  final goalJson = {
    'id': 1,
    'user_id': 42,
    'title': 'Learn Flutter Testing',
    'category': 'EDUCATION',
    'status': 'IN_PROGRESS',
    'total_minutes': 120,
  };

  group('getAll() — parses FLAT array (no envelope)', () {
    test('returns list of goals from flat array response', () async {
      when(() => mockDio.get(any(),
              queryParameters: any(named: 'queryParameters')))
          .thenAnswer((_) async => buildResponse(data: [goalJson]));

      final goals = await repository.getAll();

      expect(goals, isA<List<Map<String, dynamic>>>());
      expect(goals.length, 1);
      expect(goals.first['id'], 1);
      expect(goals.first['title'], 'Learn Flutter Testing');
      expect(goals.first['category'], 'EDUCATION');
    });

    test('returns empty list when goals array is empty', () async {
      when(() => mockDio.get(any(),
              queryParameters: any(named: 'queryParameters')))
          .thenAnswer((_) async => buildResponse(data: <dynamic>[]));

      final goals = await repository.getAll();

      expect(goals, isEmpty);
    });
  });

  group('create() — returns single goal map', () {
    test('parses created goal from response', () async {
      when(() => mockDio.post(any(), data: any(named: 'data'))).thenAnswer(
          (_) async => buildResponse(data: goalJson, statusCode: 201));

      final goal = await repository.create({
        'title': 'Learn Flutter Testing',
        'category': 'EDUCATION',
      });

      expect(goal['id'], 1);
      expect(goal['title'], 'Learn Flutter Testing');
    });
  });
}
