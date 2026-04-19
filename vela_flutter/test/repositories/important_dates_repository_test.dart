import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:vela_flutter/data/repositories/important_dates_repository.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  late MockDioClient mockDioClient;
  late MockDio mockDio;
  late ImportantDatesRepository repository;

  setUp(() {
    mockDioClient = MockDioClient();
    mockDio = MockDio();
    when(() => mockDioClient.dio).thenReturn(mockDio);
    repository = ImportantDatesRepository(mockDioClient);
  });

  final dateJson = {
    'id': 1,
    'user_id': 42,
    'title': 'Exam',
    'category': 'exam',
    'date': '2026-05-20',
    'time': '10:30:00',
    'recurrence': 'none',
    'reminder_offsets_days': [7, 1, 0],
  };

  test('getAll parses flat array response', () async {
    when(() => mockDio.get(any()))
        .thenAnswer((_) async => buildResponse(data: [dateJson]));

    final dates = await repository.getAll();

    expect(dates.length, 1);
    expect(dates.first.title, 'Exam');
    expect(dates.first.reminderOffsetsDays, [7, 1, 0]);
  });

  test('create returns created important date', () async {
    when(() => mockDio.post(any(), data: any(named: 'data')))
        .thenAnswer((_) async => buildResponse(data: dateJson, statusCode: 201));

    final date = await repository.create({'title': 'Exam'});

    expect(date.id, 1);
    expect(date.category, 'exam');
  });

  test('update calls item endpoint', () async {
    when(() => mockDio.put(any(), data: any(named: 'data')))
        .thenAnswer((_) async => buildResponse(data: dateJson));

    final date = await repository.update(1, {'title': 'Exam'});

    verify(() => mockDio.put('/important-dates/1', data: {'title': 'Exam'}))
        .called(1);
    expect(date.id, 1);
  });

  test('delete calls item endpoint', () async {
    when(() => mockDio.delete(any()))
        .thenAnswer((_) async => buildResponse(data: {'success': true}));

    await repository.delete(1);

    verify(() => mockDio.delete('/important-dates/1')).called(1);
  });
}
