import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vela_flutter/core/storage/local_storage.dart';
import 'package:vela_flutter/data/models/subject.dart';
import 'package:vela_flutter/data/models/task.dart';
import 'package:vela_flutter/data/repositories/subjects_repository.dart';
import 'package:vela_flutter/data/repositories/tasks_repository.dart';
import 'package:vela_flutter/providers/auth_provider.dart';
import 'package:vela_flutter/providers/subjects_provider.dart';
import 'package:vela_flutter/providers/tasks_provider.dart';
import 'package:vela_flutter/ui/screens/tasks/tasks_screen.dart';

import '../test_helpers/test_helpers.dart';

class _StubSubjectsRepository extends SubjectsRepository {
  _StubSubjectsRepository() : super(MockDioClient());
}

class _StubTasksRepository extends TasksRepository {
  _StubTasksRepository() : super(MockDioClient());
}

class TestSubjectsNotifier extends SubjectsNotifier {
  TestSubjectsNotifier(Subject subject, LocalStorage storage)
      : super(_StubSubjectsRepository(), storage) {
    state = SubjectsState(subjects: [subject], currentSubject: subject);
  }
}

class TestTasksNotifier extends TasksNotifier {
  TestTasksNotifier(this._allTasks, {this.ignoreLoad = false})
      : super(_StubTasksRepository()) {
    state = TasksState(tasks: _allTasks);
  }

  final List<Task> _allTasks;
  final bool ignoreLoad;
  int loadCount = 0;
  bool _ignoredInitialLoad = false;

  @override
  Future<void> loadTasks(int? subjectId,
      {Map<String, dynamic>? filters}) async {
    if (ignoreLoad || !_ignoredInitialLoad) {
      _ignoredInitialLoad = true;
      return;
    }
    loadCount++;
    final type = filters?['type'] as String?;
    final filtered = type == null
        ? _allTasks
        : _allTasks.where((task) => task.type == type).toList();
    state = TasksState(tasks: filtered);
  }
}

void main() {
  late Subject subject;
  late List<Task> tasks;
  late MemoryLocalStorage localStorage;

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    subject = Subject.fromJson(buildSubjectJson(id: 1, name: 'Math'));
    tasks = [
      Task.fromJson(
          buildTaskJson(id: 1, title: 'Watch calculus lecture', type: 'WATCH')),
      Task.fromJson(
          buildTaskJson(id: 2, title: 'Read algebra notes', type: 'READ')),
      Task.fromJson(buildTaskJson(
          id: 3, title: 'Done task', completed: true, status: 'DONE')),
    ];
    localStorage = MemoryLocalStorage();
    localStorage.hasSeenSwipeHint = true;
  });

  testWidgets('shows skeleton cards while loading', (tester) async {
    final notifier = TestTasksNotifier(tasks, ignoreLoad: true)
      ..state = const TasksState(isLoading: true);
    await pumpTestApp(
      tester,
      const TasksScreen(),
      overrides: [
        subjectsProvider
            .overrideWith((ref) => TestSubjectsNotifier(subject, localStorage)),
        tasksProvider.overrideWith((ref) => notifier),
        localStorageProvider.overrideWithValue(localStorage),
      ],
    );

    expect(find.bySemanticsLabel('Loading task...'), findsWidgets);
  });

  testWidgets('search filters task list and clearing search restores it',
      (tester) async {
    final notifier = TestTasksNotifier(tasks);
    await pumpTestApp(
      tester,
      const TasksScreen(),
      overrides: [
        subjectsProvider
            .overrideWith((ref) => TestSubjectsNotifier(subject, localStorage)),
        tasksProvider.overrideWith((ref) => notifier),
        localStorageProvider.overrideWithValue(localStorage),
      ],
    );
    await tester.pump();
    await tester.pump();

    expect(find.text('Watch calculus lecture'), findsOneWidget);
    expect(find.text('Read algebra notes'), findsOneWidget);

    await tester.enterText(find.byType(TextField).first, 'algebra');
    await tester.pump();

    expect(find.text('Watch calculus lecture'), findsNothing);
    expect(find.text('Read algebra notes'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.clear));
    await tester.pump();

    expect(find.text('Watch calculus lecture'), findsOneWidget);
  });

  testWidgets('type filter shows matching tasks only', (tester) async {
    final notifier = TestTasksNotifier(tasks);
    await pumpTestApp(
      tester,
      const TasksScreen(),
      overrides: [
        subjectsProvider
            .overrideWith((ref) => TestSubjectsNotifier(subject, localStorage)),
        tasksProvider.overrideWith((ref) => notifier),
        localStorageProvider.overrideWithValue(localStorage),
      ],
    );
    await tester.pump();
    await tester.pump();

    await tester.tap(find.text('WATCH').first);
    await tester.pump();

    expect(find.text('Watch calculus lecture'), findsOneWidget);
    expect(find.text('Read algebra notes'), findsNothing);
  });

  testWidgets('completed section toggles visible completed tasks',
      (tester) async {
    final notifier = TestTasksNotifier(tasks);
    await pumpTestApp(
      tester,
      const TasksScreen(),
      overrides: [
        subjectsProvider
            .overrideWith((ref) => TestSubjectsNotifier(subject, localStorage)),
        tasksProvider.overrideWith((ref) => notifier),
        localStorageProvider.overrideWithValue(localStorage),
      ],
    );
    await tester.pump();
    await tester.pump();

    expect(find.text('Done task'), findsNothing);

    await tester.tap(find.textContaining('Completed'));
    await tester.pump();

    expect(find.text('Done task'), findsOneWidget);
    await tester.pump();
  });
}
