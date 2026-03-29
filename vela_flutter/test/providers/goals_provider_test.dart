import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:vela_flutter/data/repositories/goals_repository.dart';
import 'package:vela_flutter/providers/goals_provider.dart';

class MockGoalsRepository extends Mock implements GoalsRepository {}

void main() {
  late MockGoalsRepository repository;
  late GoalsNotifier notifier;

  setUp(() {
    repository = MockGoalsRepository();
    notifier = GoalsNotifier(repository);
  });

  test('loadGoals parses raw map list into Goal objects', () async {
    when(() => repository.getAll()).thenAnswer((_) async => [
          {
            'id': 1,
            'user_id': 42,
            'title': 'Learn Flutter',
            'category': 'EDUCATION',
            'status': 'IN_PROGRESS',
          }
        ]);

    await notifier.loadGoals();

    expect(notifier.state.goals, hasLength(1));
    expect(notifier.state.goals.single.category, 'EDUCATION');
    expect(notifier.state.isLoading, isFalse);
  });

  test('createGoal prepends to state.goals', () async {
    when(() => repository.create(any())).thenAnswer((_) async => {
          'id': 1,
          'user_id': 42,
          'title': 'Learn Flutter',
        });

    await notifier.createGoal({'title': 'Learn Flutter'});

    expect(notifier.state.goals.single.title, 'Learn Flutter');
  });
}
