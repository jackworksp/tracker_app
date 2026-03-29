import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:vela_flutter/data/repositories/subjects_repository.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  late MockDioClient mockDioClient;
  late MockDio mockDio;
  late SubjectsRepository repository;

  setUp(() {
    mockDioClient = MockDioClient();
    mockDio = MockDio();
    when(() => mockDioClient.dio).thenReturn(mockDio);
    repository = SubjectsRepository(mockDioClient);
  });

  group('getAll()', () {
    test('parses envelope data array', () async {
      when(() => mockDio.get(any(),
              queryParameters: any(named: 'queryParameters')))
          .thenAnswer((_) async => buildResponse(data: {
                'data': [buildSubjectJson()],
              }));

      final subjects = await repository.getAll();

      expect(subjects, hasLength(1));
      expect(subjects.first.name, 'Mathematics');
    });
  });

  test('create sends fields and returns Subject', () async {
    when(() => mockDio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => buildResponse(data: buildSubjectJson(name: 'Physics')));

    final subject = await repository.create({'name': 'Physics'});

    verify(() => mockDio.post('/subjects', data: {'name': 'Physics'}))
        .called(1);
    expect(subject.name, 'Physics');
  });

  test('delete calls DELETE /api/subjects/{id}', () async {
    when(() => mockDio.delete(any(), data: any(named: 'data')))
        .thenAnswer((_) async => buildResponse(data: null, statusCode: 204));

    await repository.delete(9);

    verify(() => mockDio.delete('/subjects/9', data: any(named: 'data')))
        .called(1);
  });
}
