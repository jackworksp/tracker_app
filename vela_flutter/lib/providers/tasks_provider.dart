import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../core/utils/error_messages.dart';
import '../data/models/task.dart';
import '../data/repositories/tasks_repository.dart';
import 'auth_provider.dart';

final tasksRepositoryProvider = Provider<TasksRepository>((ref) {
  return TasksRepository(ref.watch(dioClientProvider));
});

class TasksState {
  final List<Task> tasks;
  final bool isLoading;
  final String? error;

  const TasksState({
    this.tasks = const [],
    this.isLoading = false,
    this.error,
  });

  // Sentinel to distinguish "pass null explicitly" from "not provided".
  static const _unset = Object();

  TasksState copyWith({
    List<Task>? tasks,
    bool? isLoading,
    Object? error = _unset,
  }) {
    return TasksState(
      tasks: tasks ?? this.tasks,
      isLoading: isLoading ?? this.isLoading,
      error: identical(error, _unset) ? this.error : error as String?,
    );
  }

  List<Task> get activeTasks => tasks.where((t) => !t.completed).toList();
  List<Task> get completedTasks => tasks.where((t) => t.completed).toList();
}

class TasksNotifier extends StateNotifier<TasksState> {
  final TasksRepository _repository;

  TasksNotifier(this._repository) : super(const TasksState());

  Future<void> loadTasks(int? subjectId,
      {Map<String, dynamic>? filters}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      List<Task> tasks;
      if (subjectId != null) {
        tasks = await _repository.getBySubject(subjectId, filters: filters);
      } else {
        tasks = await _repository.getAll(filters: filters);
      }
      state = TasksState(tasks: tasks, isLoading: false);
    } on DioException catch (e) {
      final message = e.message ?? ErrorMessages.taskLoadFailed;
      state = state.copyWith(
        isLoading: false,
        error: message == ErrorMessages.sessionExpired ? null : message,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ErrorMessages.taskLoadFailed,
      );
    }
  }

  Future<Task> createTask(Map<String, dynamic> data) async {
    final task = await _repository.create(data);
    state = state.copyWith(tasks: [task, ...state.tasks]);
    return task;
  }

  Future<void> updateTask(int id, Map<String, dynamic> data) async {
    final updated = await _repository.update(id, data);
    state = state.copyWith(
      tasks: state.tasks.map((t) => t.id == id ? updated : t).toList(),
    );
  }

  Future<void> deleteTask(int id) async {
    await _repository.delete(id);
    state = state.copyWith(
      tasks: state.tasks.where((t) => t.id != id).toList(),
    );
  }

  Future<void> toggleComplete(Task task) async {
    final updated = await _repository.update(task.id, {
      'completed': !task.completed,
      'status': task.completed ? 'TODO' : 'DONE',
    });
    state = state.copyWith(
      tasks: state.tasks.map((t) => t.id == task.id ? updated : t).toList(),
    );
  }

  /// Sets a reminder on a task and updates it in state immediately.
  Future<Task> setReminder(
    int taskId,
    DateTime reminderTime,
    String alertType,
  ) async {
    final updated = await _repository.setReminder(taskId, {
      'reminder_time': reminderTime.toIso8601String(),
      'alert_type': alertType,
    });
    state = state.copyWith(
      tasks: state.tasks.map((t) => t.id == taskId ? updated : t).toList(),
    );
    return updated;
  }

  /// Snoozes a reminder by [minutes] and updates the task in state.
  Future<Task> snoozeReminder(int taskId, int minutes) async {
    final updated = await _repository.snoozeReminder(taskId, minutes);
    state = state.copyWith(
      tasks: state.tasks.map((t) => t.id == taskId ? updated : t).toList(),
    );
    return updated;
  }

  /// Marks a reminder as dismissed and updates the task in state.
  Future<Task> dismissReminder(int taskId) async {
    final updated = await _repository.dismissReminder(taskId);
    state = state.copyWith(
      tasks: state.tasks.map((t) => t.id == taskId ? updated : t).toList(),
    );
    return updated;
  }

  /// Removes a reminder entirely and updates the task in state.
  Future<void> removeReminder(int taskId) async {
    await _repository.removeReminder(taskId);
    state = state.copyWith(
      tasks: state.tasks.map((t) {
        if (t.id != taskId) return t;
        return t.copyWith(
          reminderTime: null,
          alertType: 'basic',
          reminderDismissed: false,
          reminderSnoozedUntil: null,
        );
      }).toList(),
    );
  }

  /// Returns all tasks that have a pending (non-dismissed) reminder.
  Future<List<Task>> getPendingReminders() async {
    return _repository.getPendingReminders();
  }
}

final tasksProvider = StateNotifierProvider<TasksNotifier, TasksState>((ref) {
  return TasksNotifier(ref.watch(tasksRepositoryProvider));
});
