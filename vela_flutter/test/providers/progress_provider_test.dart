import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:vela_flutter/data/models/study_session.dart';
import 'package:vela_flutter/data/repositories/progress_repository.dart';
import 'package:vela_flutter/providers/progress_provider.dart';

import '../test_helpers/test_helpers.dart';

class MockProgressRepository extends Mock implements ProgressRepository {}

void main() {
  late MockProgressRepository repository;
  late ProgressNotifier notifier;

  setUp(() {
    repository = MockProgressRepository();
    notifier = ProgressNotifier(repository);
  });

  test('computed getters calculate totals and completed topics', () {
    final sessions = <StudySession>[
      StudySession.fromJson(buildSessionJson(
        id: 1,
        date: DateTime.now()
            .subtract(const Duration(days: 1))
            .toIso8601String()
            .substring(0, 10),
        timeSpent: 30,
      )),
      StudySession.fromJson(buildSessionJson(
        id: 2,
        date: DateTime.now().toIso8601String().substring(0, 10),
        timeSpent: 90,
      )),
    ];
    notifier.state = ProgressState(
      sessions: sessions,
      topics: const [
        {'completed': true},
        {'completed': false},
      ],
    );

    expect(notifier.state.totalMinutes, 120);
    expect(notifier.state.totalHours, 2);
    expect(notifier.state.totalSessions, 2);
    expect(notifier.state.completedTopics, 1);
    expect(notifier.state.streak, 2);
  });

  test('clearFilters resets source and date range', () {
    notifier.state = ProgressState(
      sessionSourceFilter: 'manual',
      sessionDateRange: DateTimeRange(
        start: DateTime(2024, 1, 1),
        end: DateTime(2024, 1, 7),
      ),
    );

    notifier.clearFilters();

    expect(notifier.state.sessionSourceFilter, isNull);
    expect(notifier.state.sessionDateRange, isNull);
  });

  test('loadProgress passes filters to repository', () async {
    notifier.setSourceFilter('manual');
    notifier.setDateRange(DateTimeRange(
      start: DateTime(2024, 1, 1),
      end: DateTime(2024, 1, 7),
    ));
    when(() => repository.getProgress(5, filters: any(named: 'filters')))
        .thenAnswer((_) async => {
              'sessions': [buildSessionJson()],
              'topics': const [],
            });

    await notifier.loadProgress(5);

    verify(() => repository.getProgress(5, filters: {
          'source': 'manual',
          'start_date': '2024-01-01T00:00:00.000',
          'end_date': '2024-01-07T00:00:00.000',
        })).called(1);
  });
}
