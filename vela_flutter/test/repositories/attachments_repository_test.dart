import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:vela_flutter/data/repositories/attachments_repository.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  late MockDioClient mockDioClient;
  late MockDio mockDio;
  late AttachmentsRepository repository;

  setUp(() {
    mockDioClient = MockDioClient();
    mockDio = MockDio();
    when(() => mockDioClient.dio).thenReturn(mockDio);
    repository = AttachmentsRepository(mockDioClient);
  });

  test('getAll parses envelope and passes page/limit/type filters', () async {
    when(() =>
            mockDio.get(any(), queryParameters: any(named: 'queryParameters')))
        .thenAnswer((_) async => buildResponse(data: {
              'data': [
                {'id': 'attachment-1', 'title': 'Docs'}
              ],
              'pagination': {
                'page': 2,
                'limit': 10,
                'total': 1,
                'totalPages': 1
              }
            }));

    final data = await repository.getAll(
      page: 2,
      limit: 10,
      filters: {'type': 'url'},
    );

    verify(() => mockDio.get('/attachments', queryParameters: {
          'page': 2,
          'limit': 10,
          'type': 'url',
        })).called(1);
    expect((data['data'] as List), hasLength(1));
  });

  test('moveToSubject passes nullable subjectId in body', () async {
    when(() => mockDio.put(any(), data: any(named: 'data')))
        .thenAnswer((_) async => buildResponse(data: {'id': 'attachment-1'}));

    await repository.moveToSubject('attachment-1', null);

    verify(() => mockDio.put(
          '/attachments/attachment-1/subject',
          data: {'subject_id': null},
        )).called(1);
  });
}
