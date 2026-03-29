import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:vela_flutter/data/models/routine.dart';
import 'package:vela_flutter/data/repositories/routines_repository.dart';
import 'package:vela_flutter/providers/routines_provider.dart';
import 'package:vela_flutter/ui/screens/routines/routines_screen.dart';

import '../test_helpers/test_helpers.dart';

class MockRoutinesRepository extends Mock implements RoutinesRepository {}

class TestRoutinesNotifier extends RoutinesNotifier {
  TestRoutinesNotifier(super.repository);

  @override
  Future<void> loadRoutines() async {}
}

void main() {
  late MockRoutinesRepository repository;
  late Routine routine;

  setUp(() {
    repository = MockRoutinesRepository();
    routine = Routine.fromJson(buildRoutineJson(id: 1, title: 'Daily review'));
  });

  testWidgets('shows error state when routines fail to load', (tester) async {
    final notifier = TestRoutinesNotifier(repository)
      ..state = const RoutinesState(error: 'boom');

    await pumpTestApp(
      tester,
      const RoutinesScreen(),
      overrides: [routinesProvider.overrideWith((ref) => notifier)],
    );
    await tester.pump();

    expect(find.text("Couldn't load routines. Pull down to retry."),
        findsOneWidget);
  });

  testWidgets('optimistic toggle checks immediately and reverts on error',
      (tester) async {
    final completer = Completer<void>();
    when(() => repository.completeToday(1)).thenAnswer((_) => completer.future);
    final notifier = TestRoutinesNotifier(repository)
      ..state = RoutinesState(routines: [routine]);

    await pumpTestApp(
      tester,
      const RoutinesScreen(),
      overrides: [routinesProvider.overrideWith((ref) => notifier)],
    );
    await tester.pump();

    await tester.tap(find.byIcon(Icons.check));
    await tester.pump();

    expect(notifier.state.routines.single.isCompletedToday, isTrue);

    completer.completeError(Exception('boom'));
    await tester.pump();

    expect(notifier.state.routines.single.isCompletedToday, isFalse);
  });
}
