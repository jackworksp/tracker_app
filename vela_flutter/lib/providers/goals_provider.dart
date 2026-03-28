import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/goals_repository.dart';
import 'auth_provider.dart';

final goalsRepositoryProvider = Provider<GoalsRepository>((ref) {
  return GoalsRepository(ref.watch(dioClientProvider));
});

class Goal {
  final int id;
  final int userId;
  final int? subjectId;
  final String title;
  final String? description;
  final String category;
  final String status;
  final String? targetDate;
  final int targetHours;
  final int progress;
  final List<dynamic> tasks;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Goal({
    required this.id,
    required this.userId,
    this.subjectId,
    required this.title,
    this.description,
    this.category = 'PERSONAL',
    this.status = 'PLANNING',
    this.targetDate,
    this.targetHours = 100,
    this.progress = 0,
    this.tasks = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory Goal.fromJson(Map<String, dynamic> json) {
    return Goal(
      id: json['id'] as int,
      userId: json['user_id'] as int,
      subjectId: json['subject_id'] as int?,
      title: json['title'] as String,
      description: json['description'] as String?,
      category: (json['category'] as String?) ?? 'PERSONAL',
      status: (json['status'] as String?) ?? 'PLANNING',
      targetDate: json['target_date'] as String?,
      targetHours: (json['target_hours'] as int?) ?? 100,
      progress: (json['progress'] as int?) ?? 0,
      tasks: (json['tasks'] as List<dynamic>?) ?? [],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'subject_id': subjectId,
      'title': title,
      'description': description,
      'category': category,
      'status': status,
      'target_date': targetDate,
      'target_hours': targetHours,
      'progress': progress,
      'tasks': tasks,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Goal && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'Goal(id: $id, title: $title, status: $status)';
}

class GoalsState {
  final List<Goal> goals;
  final bool isLoading;
  final String? error;
  final bool hasNextPage;
  final int currentPage;

  const GoalsState({
    this.goals = const [],
    this.isLoading = false,
    this.error,
    this.hasNextPage = false,
    this.currentPage = 1,
  });

  GoalsState copyWith({
    List<Goal>? goals,
    bool? isLoading,
    String? error,
    bool? hasNextPage,
    int? currentPage,
  }) {
    return GoalsState(
      goals: goals ?? this.goals,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      hasNextPage: hasNextPage ?? this.hasNextPage,
      currentPage: currentPage ?? this.currentPage,
    );
  }
}

class GoalsNotifier extends StateNotifier<GoalsState> {
  final GoalsRepository _repository;

  GoalsNotifier(this._repository) : super(const GoalsState());

  Future<void> loadGoals({int page = 1}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final data = await _repository.getAll();
      final goals = data.map((json) => Goal.fromJson(json)).toList();
      state = GoalsState(goals: goals, hasNextPage: false, currentPage: 1);
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
