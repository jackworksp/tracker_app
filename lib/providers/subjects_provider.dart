import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/storage/local_storage.dart';
import '../data/models/subject.dart';
import '../data/repositories/subjects_repository.dart';
import 'auth_provider.dart';

final subjectsRepositoryProvider = Provider<SubjectsRepository>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return SubjectsRepository(dioClient);
});

class SubjectsState {
  final List<Subject> subjects;
  final Subject? currentSubject;
  final bool isLoading;
  final String? error;

  const SubjectsState({
    this.subjects = const [],
    this.currentSubject,
    this.isLoading = false,
    this.error,
  });

  SubjectsState copyWith({
    List<Subject>? subjects,
    Subject? currentSubject,
    bool? isLoading,
    String? error,
  }) {
    return SubjectsState(
      subjects: subjects ?? this.subjects,
      currentSubject: currentSubject ?? this.currentSubject,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class SubjectsNotifier extends StateNotifier<SubjectsState> {
  final SubjectsRepository _repository;
  final LocalStorage _localStorage;

  SubjectsNotifier(this._repository, this._localStorage)
      : super(const SubjectsState());

  Future<void> loadSubjects() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final subjects = await _repository.getAll();

      Subject? current;
      final lastId = _localStorage.getLastSubjectId();
      if (lastId != null) {
        current = subjects.where((s) => s.id == lastId).firstOrNull;
      }
      current ??= subjects.firstOrNull;

      state = SubjectsState(
        subjects: subjects,
        currentSubject: current,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void setCurrentSubject(Subject subject) {
    state = state.copyWith(currentSubject: subject);
    _localStorage.setLastSubjectId(subject.id);
  }

  Future<Subject> createSubject(Map<String, dynamic> data) async {
    final subject = await _repository.create(data);
    state = state.copyWith(
      subjects: [...state.subjects, subject],
    );
    return subject;
  }

  Future<void> deleteSubject(int id) async {
    await _repository.delete(id);
    final updated = state.subjects.where((s) => s.id != id).toList();
    Subject? current = state.currentSubject;
    if (current?.id == id) {
      current = updated.firstOrNull;
    }
    state = SubjectsState(
      subjects: updated,
      currentSubject: current,
    );
  }

  Future<void> updateSubject(int id, Map<String, dynamic> data) async {
    final updated = await _repository.update(id, data);
    final subjects = state.subjects.map((s) => s.id == id ? updated : s).toList();
    state = state.copyWith(
      subjects: subjects,
      currentSubject: state.currentSubject?.id == id ? updated : state.currentSubject,
    );
  }
}

final subjectsProvider = StateNotifierProvider<SubjectsNotifier, SubjectsState>((ref) {
  final repository = ref.watch(subjectsRepositoryProvider);
  final localStorage = ref.watch(localStorageProvider);
  return SubjectsNotifier(repository, localStorage);
});
