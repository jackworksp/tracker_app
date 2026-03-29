import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:vela_flutter/data/repositories/auth_repository.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  late MockDioClient mockDioClient;
  late MockDio mockDio;

  setUp(() {
    mockDioClient = MockDioClient();
    mockDio = MockDio();
    when(() => mockDioClient.dio).thenReturn(mockDio);
  });

  DioException dioException(int statusCode) {
    return DioException(
      requestOptions: RequestOptions(path: '/auth'),
      response: Response(
        requestOptions: RequestOptions(path: '/auth'),
        statusCode: statusCode,
      ),
    );
  }

  test('login returns token and user tuple on success', () async {
    final authDio = MockDio();
    when(() => authDio.post(any(), data: any(named: 'data')))
        .thenAnswer((_) async => buildResponse(data: {
              'token': 'abc123',
              'user': buildUserJson(),
            }));
    final repository = AuthRepository(mockDioClient, authDio: authDio);

    final result = await repository.login(
      email: 'ada@example.com',
      password: 'secret',
    );

    expect(result.token, 'abc123');
    expect(result.user.userId, 'user-1');
  });

  test('signup throws DioException on 409', () async {
    final authDio = MockDio();
    when(() => authDio.post(any(), data: any(named: 'data')))
        .thenThrow(dioException(409));
    final repository = AuthRepository(mockDioClient, authDio: authDio);

    expect(
      () => repository.signup(
        name: 'Ada',
        email: 'ada@example.com',
        password: 'secret',
      ),
      throwsA(isA<DioException>()),
    );
  });

  test('getCurrentUser returns User parsed from response', () async {
    when(() =>
            mockDio.get(any(), queryParameters: any(named: 'queryParameters')))
        .thenAnswer((_) async => buildResponse(data: buildUserJson()));
    final repository = AuthRepository(mockDioClient);

    final user = await repository.getCurrentUser();

    expect(user.id, 1);
    expect(user.name, 'Ada');
  });

  test('getCurrentUser throws on 401', () async {
    when(() =>
            mockDio.get(any(), queryParameters: any(named: 'queryParameters')))
        .thenThrow(dioException(401));
    final repository = AuthRepository(mockDioClient);

    expect(repository.getCurrentUser(), throwsA(isA<DioException>()));
  });
}
