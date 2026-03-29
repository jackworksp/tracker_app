import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:vela_flutter/data/repositories/progress_repository.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  late MockDioClient mockDioClient;
  late MockDio mockDio;
  late ProgressRepository repository;

  setUp(() {
    mockDioClient = MockDioClient();
    mockDio = MockDio();
    when(() => mockDioClient.dio).thenReturn(mockDio);
    repository = ProgressRepository(mockDioClient);
  });

  test('getProgress returns top-level sessions/topics map and passes filters',
      () async {
    when(() =>
            mockDio.get(any(), queryParameters: any(named: 'queryParameters')))
        .thenAnswer((_) async => buildResponse(data: {
              'sessions': [buildSessionJson()],
              'topics': [
                {'id': 1, 'completed': true}
              ],
              'stats': {'minutes': 30},
              'pagination': {'page': 1}
            }));

    final data = await repository.getProgress(3, filters: {
      'source': 'manual',
      'start_date': '2024-01-01',
      'end_date': '2024-01-07',
    });

    verify(() => mockDio.get('/progress/3', queryParameters: {
          'source': 'manual',
          'start_date': '2024-01-01',
          'end_date': '2024-01-07',
        })).called(1);
    expect((data['sessions'] as List), hasLength(1));
    expect((data['topics'] as List), hasLength(1));
  });
}
