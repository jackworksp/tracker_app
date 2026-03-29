import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:vela_flutter/data/models/user.dart';
import 'package:vela_flutter/data/repositories/auth_repository.dart';
import 'package:vela_flutter/providers/auth_provider.dart';

import '../test_helpers/test_helpers.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late MockAuthRepository repository;
  late MemorySecureStorage secureStorage;
  late AuthNotifier notifier;
  late User user;

  setUp(() async {
    repository = MockAuthRepository();
    secureStorage = MemorySecureStorage();
    when(() => repository.getCurrentUser()).thenThrow(Exception('offline'));
    notifier = AuthNotifier(repository, secureStorage);
    user = User.fromJson(buildUserJson());
    await Future<void>.delayed(Duration.zero);
  });

  test('login saves token and user and authenticates state', () async {
    when(() => repository.login(email: 'ada@example.com', password: 'secret'))
        .thenAnswer((_) async => (token: 'abc123', user: user));

    await notifier.login(email: 'ada@example.com', password: 'secret');

    expect(notifier.state.isAuthenticated, isTrue);
    expect(notifier.state.user, user);
    expect(secureStorage.token, 'abc123');
    expect(jsonDecode(secureStorage.userJson!)['id'], 1);
  });

  test('logout clears secure storage and auth state', () async {
    secureStorage.token = 'abc123';
    secureStorage.userJson = user.toJsonString();
    notifier.updateUser(user);

    await notifier.logout();

    expect(secureStorage.token, isNull);
    expect(notifier.state.isAuthenticated, isFalse);
    expect(notifier.state.user, isNull);
  });

  test('checkAuth uses cached user immediately when token exists', () async {
    secureStorage.token = 'abc123';
    secureStorage.userJson = user.toJsonString();
    when(() => repository.getCurrentUser()).thenThrow(Exception('offline'));

    await notifier.checkAuth();

    expect(notifier.state.isAuthenticated, isTrue);
    expect(notifier.state.user?.id, 1);
  });
}
