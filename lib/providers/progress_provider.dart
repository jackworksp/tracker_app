import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/study_session.dart';
import '../data/repositories/progress_repository.dart';
import 'auth_provider.dart';

final progressRepositoryProvider = Provider<ProgressRepository>((ref) {
  return ProgressRepository(ref.watch(dioClientProvider));
});

class ProgressState {
  final List<StudySession> sessions;
  final List<Map<String, dynamic>> topics;
  final Map<String, dynamic> stats;
  final bool isLoading;
  final String? error;
  final String? sessionSourceFilter;
  final DateTimeRange? sessionDateRange;

  const ProgressState({
    this.sessions = const [],
    this.topics = const [],
    this.stats = const {},
    this.isLoading = false,
    this.error,
    this.sessionSourceFilter,
    this.sessionDateRange,
  });

  ProgressState copyWith({
    List<StudySession>? sessions,
    List<Map<String, dynamic>>? topics,
    Map<String, dynamic>? stats,
    bool? isLoading,
    String? error,
    String? sessionSourceFilter,
    DateTimeRange? sessionDateRange,
    bool clearSourceFilter = false,
    bool clearDateRange = false,
  }) {
    return ProgressState(
      sessions: sessions ?? this.sessions,
      topics: topics ?? this.topics,
      stats: stats ?? this.stats,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      sessionSourceFilter: clearSourceFilter ? null : (sessionSourceFilter ?? this.sessionSourceFilter),
      sessionDateRange: clearDateRange ? null : (sessionDateRange ?? this.sessionDateRange),
    );
  }

  // Computed properties
  int get totalMinutes => sessions.fold(0, (sum, s) => sum + s.timeSpent);
  double get totalHours => totalMinutes / 60.0;
  int get totalSessions => sessions.length;

  int get completedTopics => topics.where((t) => t['completed'] == true).length;
  int get totalTopics => topics.length;

  int get studyDays {
    final uniqueDates = sessions.map((s) => s.date).toSet();
    return uniqueDates.length;
  }

  int get streak {
    if (sessions.isEmpty) return 0;

    final uniqueDates = sessions.map((s) => s.date).toSet().toList()..sort();
    if (uniqueDates.isEmpty) return 0;

    int currentStreak = 1;
    final today = DateTime.now();
    final todayStr = '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';

    // Check if there's activity today or yesterday
    final lastDate = uniqueDates.last;
    final lastDateTime = DateTime.parse(lastDate);
    final diff = today.difference(lastDateTime).inDays;
    if (diff > 1) return 0;

    for (int i = uniqueDates.length - 1; i > 0; i--) {
      final current = DateTime.parse(uniqueDates[i]);
      final previous = DateTime.parse(uniqueDates[i - 1]);
      if (current.difference(previous).inDays == 1) {
        currentStreak++;
      } else {
        break;
      }
    }

    return currentStreak;
  }
}

class DateTimeRange {
  final DateTime start;
  final DateTime end;

  const DateTimeRange({required this.start, required this.end});
}

class ProgressNotifier extends StateNotifier<ProgressState> {
  final ProgressRepository _repository;
  int? _currentSubjectId;

  ProgressNotifier(this._repository) : super(const ProgressState());

  Future<void> loadProgress(int subjectId) async {
    _currentSubjectId = subjectId;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final filters = _buildFilters();
      final results = await Future.wait([
        _repository.getSessions(subjectId, filters: filters),
        _repository.getTopics(subjectId),
        _repository.getStats(subjectId),
      ]);

      state = ProgressState(
        sessions: results[0] as List<StudySession>,
        topics: results[1] as List<Map<String, dynamic>>,
        stats: results[2] as Map<String, dynamic>,
        sessionSourceFilter: state.sessionSourceFilter,
        sessionDateRange: state.sessionDateRange,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> refreshProgress() async {
    if (_currentSubjectId != null) {
      await loadProgress(_currentSubjectId!);
    }
  }

  Future<void> deleteSession(int id) async {
    await _repository.deleteSession(id);
    final updatedSessions = state.sessions.where((s) => s.id != id).toList();
    state = ProgressState(
      sessions: updatedSessions,
      topics: state.topics,
      stats: {}, // Clear stale stats; computed properties derive from sessions
      sessionSourceFilter: state.sessionSourceFilter,
      sessionDateRange: state.sessionDateRange,
    );
  }

  void setSourceFilter(String? source) {
    state = state.copyWith(
      sessionSourceFilter: source,
      clearSourceFilter: source == null,
    );
  }

  void setDateRange(DateTimeRange? range) {
    state = state.copyWith(
      sessionDateRange: range,
      clearDateRange: range == null,
    );
  }

  void clearFilters() {
    state = state.copyWith(
      clearSourceFilter: true,
      clearDateRange: true,
    );
  }

  Map<String, dynamic>? _buildFilters() {
    final filters = <String, dynamic>{};
    if (state.sessionSourceFilter != null) {
      filters['source'] = state.sessionSourceFilter;
    }
    if (state.sessionDateRange != null) {
      filters['start_date'] = state.sessionDateRange!.start.toIso8601String();
      filters['end_date'] = state.sessionDateRange!.end.toIso8601String();
    }
    return filters.isEmpty ? null : filters;
  }
}

final progressProvider = StateNotifierProvider<ProgressNotifier, ProgressState>((ref) {
  return ProgressNotifier(ref.watch(progressRepositoryProvider));
});
