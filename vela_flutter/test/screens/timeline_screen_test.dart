import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vela_flutter/data/models/study_session.dart';
import 'package:vela_flutter/data/models/subject.dart';
import 'package:vela_flutter/data/repositories/progress_repository.dart';
import 'package:vela_flutter/data/repositories/subjects_repository.dart';
import 'package:vela_flutter/providers/progress_provider.dart';
import 'package:vela_flutter/providers/subjects_provider.dart';
import 'package:vela_flutter/ui/screens/sessions/timeline_screen.dart';

import '../test_helpers/test_helpers.dart';

class _StubProgressRepository extends ProgressRepository {
  _StubProgressRepository() : super(MockDioClient());
}

class _StubSubjectsRepository extends SubjectsRepository {
  _StubSubjectsRepository() : super(MockDioClient());
}

class TestProgressNotifier extends ProgressNotifier {
  TestProgressNotifier(ProgressState initial)
      : super(_StubProgressRepository()) {
    state = initial;
  }

  @override
  Future<void> loadProgress(int subjectId) async {}

  @override
  Future<void> refreshProgress() async {}
}

class TestSubjectsNotifier extends SubjectsNotifier {
  TestSubjectsNotifier(Subject subject)
      : super(_StubSubjectsRepository(), MemoryLocalStorage()) {
    state = SubjectsState(subjects: [subject], currentSubject: subject);
  }
}

void main() {
  testWidgets('_ActionButton renders with minimum height 44px', (tester) async {
    final subject = Subject.fromJson(buildSubjectJson());
    final session = StudySession.fromJson(buildSessionJson());

    await pumpTestApp(
      tester,
      const TimelineScreen(),
      overrides: [
        subjectsProvider.overrideWith((ref) => TestSubjectsNotifier(subject)),
        progressProvider.overrideWith(
          (ref) => TestProgressNotifier(ProgressState(sessions: [session])),
        ),
      ],
    );
    await tester.pumpAndSettle();

    final buttonBox = find.ancestor(
      of: find.text('Edit'),
      matching: find.byType(InkWell),
    );
    expect(tester.getSize(buttonBox.first).height, greaterThanOrEqualTo(44));
  });
}
