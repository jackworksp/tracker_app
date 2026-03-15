import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/goal.dart';
import '../data/repositories/goals_repository.dart';
import 'auth_provider.dart';

final goalsRepositoryProvider = Provider<GoalsRepository>((ref) {
  return GoalsRepository(ref.watch(dioClientProvider));
});

class GoalsState {
  final List<Goal> goals;
  final bool isLoading;
  final String? error;

  const GoalsState({
    this.goals = const [],
    this.isLoading = false,
    this.error,
  });

  GoalsState copyWith({
    List<Goal>? goals,
    bool? isLoading,
    String? error,
  }) {
    return GoalsState(
      goals: goals ?? this.goals,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class GoalsNotifier extends StateNotifier<GoalsState> {
  final GoalsRepository _repository;

  GoalsNotifier(this._repository) : super(const GoalsState());

  Future<void> loadGoals() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final data = await _repository.getAll();
      final goals = data.map((json) => Goal.fromJson(json)).toList();
      state = GoalsState(goals: goals);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<Goal> createGoal(Map<String, dynamic> data) async {
    final json = await _repository.create(data);
    final goal = Goal.fromJson(json);
    state = state.copyWith(goals: [goal, ...state.goals]);
    return goal;
  }

  Future<void> updateGoal(int id, Map<String, dynamic> data) async {
    final json = await _repository.update(id, data);
    final updated = Goal.fromJson(json);
    state = state.copyWith(
      goals: state.goals.map((g) => g.id == id ? updated : g).toList(),
    );
  }

  Future<void> deleteGoal(int id) async {
    await _repository.delete(id);
    state = state.copyWith(
      goals: state.goals.where((g) => g.id != id).toList(),
    );
  }
}

final goalsProvider = StateNotifierProvider<GoalsNotifier, GoalsState>((ref) {
  return GoalsNotifier(ref.watch(goalsRepositoryProvider));
});
