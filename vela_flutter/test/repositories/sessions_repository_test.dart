import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:vela_flutter/data/repositories/sessions_repository.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  late MockDioClient mockDioClient;
  late MockDio mockDio;
  late SessionsRepository repository;

  setUp(() {
    mockDioClient = MockDioClient();
    mockDio = MockDio();
    when(() => mockDioClient.dio).thenReturn(mockDio);
    repository = SessionsRepository(mockDioClient);
  });

  test('create returns StudySession parsed from response', () async {
    when(() => mockDio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => buildResponse(data: buildSessionJson(attachmentCount: 2)));

    final session = await repository.create({'activity': 'Read chapter 1'});

    expect(session.id, 1);
    expect(session.attachmentCount, 2);
    expect(session.timeSpent, 30);
  });

  test('update calls PUT /api/sessions/{id}', () async {
    when(() => mockDio.put(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => buildResponse(data: buildSessionJson(timeSpent: 45)));

    final session = await repository.update(4, {'time_spent': 45});

    verify(() => mockDio.put('/progress/sessions/4', data: {'time_spent': 45}))
        .called(1);
    expect(session.timeSpent, 45);
  });

  test('incrementRevision returns updated session', () async {
    when(() => mockDio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => buildResponse(data: buildSessionJson(revisionCount: 3)));

    final session = await repository.incrementRevision(4);

    verify(() => mockDio.post('/progress/sessions/4/revise',
        data: any(named: 'data'))).called(1);
    expect(session.revisionCount, 3);
  });
}
