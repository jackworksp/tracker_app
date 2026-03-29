import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:vela_flutter/data/repositories/routines_repository.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  late MockDioClient mockDioClient;
  late MockDio mockDio;
  late RoutinesRepository repository;

  setUp(() {
    mockDioClient = MockDioClient();
    mockDio = MockDio();
    when(() => mockDioClient.dio).thenReturn(mockDio);
    repository = RoutinesRepository(mockDioClient);
  });

  test('getAll parses flat array', () async {
    when(() =>
            mockDio.get(any(), queryParameters: any(named: 'queryParameters')))
        .thenAnswer((_) async => buildResponse(data: [buildRoutineJson()]));

    final routines = await repository.getAll();

    expect(routines, hasLength(1));
    expect(routines.first['title'], 'Daily review');
  });

  test('completeToday and uncompleteToday call correct endpoints', () async {
    when(() => mockDio.post(any(), data: any(named: 'data')))
        .thenAnswer((_) async => buildResponse(data: const {}));
    when(() => mockDio.delete(any(), data: any(named: 'data')))
        .thenAnswer((_) async => buildResponse(data: const {}));

    await repository.completeToday(5);
    await repository.uncompleteToday(5);

    verify(() => mockDio.post('/routines/5/complete', data: any(named: 'data')))
        .called(1);
    verify(() =>
            mockDio.delete('/routines/5/complete', data: any(named: 'data')))
        .called(1);
  });
}
