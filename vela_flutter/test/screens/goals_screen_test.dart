import 'package:flutter_test/flutter_test.dart';
import 'package:vela_flutter/data/repositories/goals_repository.dart';
import 'package:vela_flutter/providers/goals_provider.dart';
import 'package:vela_flutter/ui/screens/goals/goals_screen.dart';

import '../test_helpers/test_helpers.dart';

class _StubGoalsRepository extends GoalsRepository {
  _StubGoalsRepository() : super(MockDioClient());
}

class TestGoalsNotifier extends GoalsNotifier {
  TestGoalsNotifier(GoalsState initial) : super(_StubGoalsRepository()) {
    state = initial;
  }

  int loadCalls = 0;

  @override
  Future<void> loadGoals({int page = 1}) async {
    loadCalls++;
  }
}

void main() {
  testWidgets('shows goal skeleton while loading', (tester) async {
    await pumpTestApp(
      tester,
      const GoalsScreen(),
      overrides: [
        goalsProvider.overrideWith(
            (ref) => TestGoalsNotifier(const GoalsState(isLoading: true))),
      ],
    );

    await tester.pump();
    expect(find.bySemanticsLabel('Loading goal...'), findsWidgets);
  });

  testWidgets('shows empty state when goals list is empty', (tester) async {
    await pumpTestApp(
      tester,
      const GoalsScreen(),
      overrides: [
        goalsProvider
            .overrideWith((ref) => TestGoalsNotifier(const GoalsState())),
      ],
    );
    await tester.pump();

    expect(find.text('No goals yet'), findsOneWidget);
  });

  testWidgets('shows error state and retry triggers loadGoals', (tester) async {
    final notifier = TestGoalsNotifier(const GoalsState(error: 'boom'));
    await pumpTestApp(
      tester,
      const GoalsScreen(),
      overrides: [goalsProvider.overrideWith((ref) => notifier)],
    );
    await tester.pump();

    await tester.tap(find.text('Retry'));
    await tester.pump();

    expect(
        find.text("Couldn't load goals. Pull down to retry."), findsOneWidget);
    expect(notifier.loadCalls, 2);
  });
}
