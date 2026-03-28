import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/utils/error_messages.dart';
import '../data/models/routine.dart';
import '../data/repositories/routines_repository.dart';
import 'auth_provider.dart';

final routinesRepositoryProvider = Provider<RoutinesRepository>((ref) {
  return RoutinesRepository(ref.watch(dioClientProvider));
});

class RoutinesState {
  final List<Routine> routines;
  final bool isLoading;
  final String? error;

  const RoutinesState({
    this.routines = const [],
    this.isLoading = false,
    this.error,
  });

  static const _unset = Object();

  RoutinesState copyWith({
    List<Routine>? routines,
    bool? isLoading,
    Object? error = _unset,
  }) {
    return RoutinesState(
      routines: routines ?? this.routines,
      isLoading: isLoading ?? this.isLoading,
      error: identical(error, _unset) ? this.error : error as String?,
    );
  }
}

class RoutinesNotifier extends StateNotifier<RoutinesState> {
  final RoutinesRepository _repository;

  RoutinesNotifier(this._repository) : super(const RoutinesState());

  Future<void> loadRoutines() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final data = await _repository.getAll();
      final routines = data.map((json) => Routine.fromJson(json)).toList();
      state = RoutinesState(routines: routines, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ErrorMessages.fromDioMessage(e.toString()),
      );
    }
  }

  Future<Routine> createRoutine(Map<String, dynamic> data) async {
    final json = await _repository.create(data);
    final routine = Routine.fromJson(json);
    state = state.copyWith(routines: [routine, ...state.routines], error: null);
    return routine;
  }

  Future<void> updateRoutine(int id, Map<String, dynamic> data) async {
    final json = await _repository.update(id, data);
    final updated = Routine.fromJson(json);
    state = state.copyWith(
      routines: state.routines.map((r) => r.id == id ? updated : r).toList(),
      error: null,
    );
  }

  Future<void> deleteRoutine(int id) async {
    await _repository.delete(id);
    state = state.copyWith(
      routines: state.routines.where((r) => r.id != id).toList(),
      error: null,
    );
  }

  Future<void> toggleCompletion(Routine routine) async {
    final shouldComplete = !routine.isCompletedToday;
    final previousState = state;
    final updatedRoutine = routine.copyWith(
      isCompletedToday: shouldComplete,
      streak: shouldComplete
          ? routine.isCompletedToday
              ? routine.streak
              : routine.streak + 1
          : (routine.streak > 0 ? routine.streak - 1 : 0),
    );

    state = state.copyWith(
      routines: state.routines
          .map((r) => r.id == routine.id ? updatedRoutine : r)
          .toList(),
      error: null,
    );

    try {
      if (shouldComplete) {
        await _repository.completeToday(routine.id);
      } else {
        await _repository.uncompleteToday(routine.id);
      }
    } catch (_) {
      state = previousState.copyWith(error: ErrorMessages.routineToggleFailed);
      rethrow;
    }
  }
}

final routinesProvider =
    StateNotifierProvider<RoutinesNotifier, RoutinesState>((ref) {
  return RoutinesNotifier(ref.watch(routinesRepositoryProvider));
});
