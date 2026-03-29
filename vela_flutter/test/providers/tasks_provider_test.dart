import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:vela_flutter/data/models/task.dart';
import 'package:vela_flutter/data/repositories/tasks_repository.dart';
import 'package:vela_flutter/providers/tasks_provider.dart';

import '../test_helpers/test_helpers.dart';

class MockTasksRepository extends Mock implements TasksRepository {}

void main() {
  late MockTasksRepository repository;
  late TasksNotifier notifier;
  late Task openTask;
  late Task doneTask;

  setUp(() {
    repository = MockTasksRepository();
    notifier = TasksNotifier(repository);
    openTask = Task.fromJson(buildTaskJson(id: 1));
    doneTask =
        Task.fromJson(buildTaskJson(id: 2, completed: true, status: 'DONE'));
  });

  test('loadTasks toggles loading and populates state on success', () async {
    final completer = Completer<List<Task>>();
    when(() => repository.getAll(filters: any(named: 'filters')))
        .thenAnswer((_) => completer.future);

    final future = notifier.loadTasks(null);
    expect(notifier.state.isLoading, isTrue);

    completer.complete([openTask]);
    await future;

    expect(notifier.state.isLoading, isFalse);
    expect(notifier.state.tasks, [openTask]);
    expect(notifier.state.error, isNull);
  });

  test('computed getters split active and completed tasks', () {
    notifier.state = TasksState(tasks: [openTask, doneTask]);

    expect(notifier.state.activeTasks, [openTask]);
    expect(notifier.state.completedTasks, [doneTask]);
  });

  test('createTask prepends new task', () async {
    when(() => repository.create(any())).thenAnswer((_) async => openTask);

    final created = await notifier.createTask({'title': 'Study'});

    expect(created, openTask);
    expect(notifier.state.tasks.first, openTask);
  });

  test('toggleComplete updates task completed and status', () async {
    notifier.state = TasksState(tasks: [openTask]);
    final updated = openTask.copyWith(completed: true, status: 'DONE');
    when(() => repository.update(1, any())).thenAnswer((_) async => updated);

    await notifier.toggleComplete(openTask);

    expect(notifier.state.tasks.single.completed, isTrue);
    expect(notifier.state.tasks.single.status, 'DONE');
  });

  test('removeReminder clears reminder fields in state', () async {
    final reminded = Task.fromJson(buildTaskJson(
      id: 1,
      reminderTime: DateTime.utc(2024, 1, 1, 9),
      reminderDismissed: true,
      reminderSnoozedUntil: DateTime.utc(2024, 1, 1, 9, 10),
    ));
    notifier.state = TasksState(tasks: [reminded]);
    when(() => repository.removeReminder(1)).thenAnswer((_) async {});

    await notifier.removeReminder(1);

    final task = notifier.state.tasks.single;
    expect(task.reminderTime, isNull);
    expect(task.reminderDismissed, isFalse);
    expect(task.reminderSnoozedUntil, isNull);
  });
}
