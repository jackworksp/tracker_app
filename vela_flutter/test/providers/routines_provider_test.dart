import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:vela_flutter/data/models/routine.dart';
import 'package:vela_flutter/data/repositories/routines_repository.dart';
import 'package:vela_flutter/providers/routines_provider.dart';

import '../test_helpers/test_helpers.dart';

class MockRoutinesRepository extends Mock implements RoutinesRepository {}

void main() {
  late MockRoutinesRepository repository;
  late RoutinesNotifier notifier;
  late Routine routine;

  setUp(() {
    repository = MockRoutinesRepository();
    notifier = RoutinesNotifier(repository);
    routine = Routine.fromJson(buildRoutineJson(id: 1, streak: 2));
    notifier.state = RoutinesState(routines: [routine]);
  });

  test('toggleCompletion updates state optimistically before API resolves',
      () async {
    final completer = Completer<void>();
    when(() => repository.completeToday(1)).thenAnswer((_) => completer.future);

    final future = notifier.toggleCompletion(routine);

    expect(notifier.state.routines.single.isCompletedToday, isTrue);
    expect(notifier.state.routines.single.streak, 3);

    completer.complete();
    await future;
  });

  test('toggleCompletion reverts state on error', () async {
    when(() => repository.completeToday(1)).thenThrow(Exception('boom'));

    await expectLater(notifier.toggleCompletion(routine), throwsException);

    expect(notifier.state.routines.single.isCompletedToday, isFalse);
    expect(notifier.state.error, isNotNull);
  });
}
