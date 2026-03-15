import 'package:flutter_riverpod/flutter_riverpod.dart';
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

  TasksState copyWith({
    List<Task>? tasks,
    bool? isLoading,
    String? error,
  }) {
    return TasksState(
      tasks: tasks ?? this.tasks,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  List<Task> get activeTasks => tasks.where((t) => !t.completed).toList();
  List<Task> get completedTasks => tasks.where((t) => t.completed).toList();
}

class TasksNotifier extends StateNotifier<TasksState> {
  final TasksRepository _repository;
  int _loadGeneration = 0;

  TasksNotifier(this._repository) : super(const TasksState());

  Future<void> loadTasks(int? subjectId, {Map<String, dynamic>? filters}) async {
    final generation = ++_loadGeneration;
    state = state.copyWith(isLoading: true, error: null);
    try {
      List<Task> tasks;
      if (subjectId != null) {
        tasks = await _repository.getBySubject(subjectId, filters: filters);
      } else {
        tasks = await _repository.getAll(filters: filters);
      }
      // Drop stale response if subject changed during load
      if (generation != _loadGeneration) return;
      state = TasksState(tasks: tasks);
    } catch (e) {
      if (generation != _loadGeneration) return;
      state = state.copyWith(isLoading: false, error: e.toString());
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
}

final tasksProvider = StateNotifierProvider<TasksNotifier, TasksState>((ref) {
  return TasksNotifier(ref.watch(tasksRepositoryProvider));
});
