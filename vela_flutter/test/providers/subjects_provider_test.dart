import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:vela_flutter/data/models/subject.dart';
import 'package:vela_flutter/data/repositories/subjects_repository.dart';
import 'package:vela_flutter/providers/subjects_provider.dart';

import '../test_helpers/test_helpers.dart';

class MockSubjectsRepository extends Mock implements SubjectsRepository {}

class TestSubjectsNotifier extends SubjectsNotifier {
  TestSubjectsNotifier(super.repository, super.localStorage);

  void seed(SubjectsState value) {
    state = value;
  }
}

void main() {
  late MockSubjectsRepository repository;
  late MemoryLocalStorage localStorage;
  late TestSubjectsNotifier notifier;
  late Subject math;
  late Subject physics;

  setUp(() {
    repository = MockSubjectsRepository();
    localStorage = MemoryLocalStorage();
    notifier = TestSubjectsNotifier(repository, localStorage);
    math = Subject.fromJson(buildSubjectJson(id: 1, name: 'Math'));
    physics = Subject.fromJson(buildSubjectJson(id: 2, name: 'Physics'));
  });

  test('loadSubjects restores currentSubject from local storage', () async {
    localStorage.lastSubjectId = 2;
    when(() => repository.getAll()).thenAnswer((_) async => [math, physics]);

    await notifier.loadSubjects();

    expect(notifier.state.subjects, [math, physics]);
    expect(notifier.state.currentSubject, physics);
  });

  test('setCurrentSubject updates state and persists id', () {
    notifier.setCurrentSubject(math);

    expect(notifier.state.currentSubject, math);
    expect(localStorage.lastSubjectId, 1);
  });

  test('deleteSubject rebuilds fresh state when deleting current subject',
      () async {
    notifier.seed(SubjectsState(
      subjects: [math, physics],
      currentSubject: math,
      isLoading: true,
      error: 'stale error',
    ));
    when(() => repository.delete(1)).thenAnswer((_) async {});

    await notifier.deleteSubject(1);

    expect(notifier.state.subjects, [physics]);
    expect(notifier.state.currentSubject, physics);
    expect(notifier.state.isLoading, isFalse);
    expect(notifier.state.error, isNull);
  });
}
