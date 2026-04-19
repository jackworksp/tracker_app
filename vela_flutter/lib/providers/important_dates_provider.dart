import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/utils/error_messages.dart';
import '../data/models/important_date.dart';
import '../data/repositories/important_dates_repository.dart';
import '../services/notification_service.dart';
import 'auth_provider.dart';

final importantDatesRepositoryProvider =
    Provider<ImportantDatesRepository>((ref) {
  return ImportantDatesRepository(ref.watch(dioClientProvider));
});

class ImportantDatesState {
  final List<ImportantDate> dates;
  final bool isLoading;
  final String? error;

  const ImportantDatesState({
    this.dates = const [],
    this.isLoading = false,
    this.error,
  });

  static const _unset = Object();

  ImportantDatesState copyWith({
    List<ImportantDate>? dates,
    bool? isLoading,
    Object? error = _unset,
  }) {
    return ImportantDatesState(
      dates: dates ?? this.dates,
      isLoading: isLoading ?? this.isLoading,
      error: identical(error, _unset) ? this.error : error as String?,
    );
  }
}

class ImportantDatesNotifier extends StateNotifier<ImportantDatesState> {
  final ImportantDatesRepository _repository;

  ImportantDatesNotifier(this._repository) : super(const ImportantDatesState());

  Future<void> loadDates() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final dates = await _repository.getAll();
      state = ImportantDatesState(dates: dates);
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.message ?? ErrorMessages.serverError,
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        error: ErrorMessages.serverError,
      );
    }
  }

  Future<List<ImportantDate>> getAllForScheduling() {
    return _repository.getAll();
  }

  Future<ImportantDate> createDate(Map<String, dynamic> data) async {
    final created = await _repository.create(data);
    await NotificationService().scheduleImportantDate(created);
    state = state.copyWith(dates: _sorted([created, ...state.dates]));
    return created;
  }

  Future<ImportantDate> updateDate(int id, Map<String, dynamic> data) async {
    final updated = await _repository.update(id, data);
    await NotificationService().cancelImportantDate(id);
    await NotificationService().scheduleImportantDate(updated);
    state = state.copyWith(
      dates: _sorted(
        state.dates.map((item) => item.id == id ? updated : item).toList(),
      ),
    );
    return updated;
  }

  Future<void> deleteDate(int id) async {
    await _repository.delete(id);
    await NotificationService().cancelImportantDate(id);
    state = state.copyWith(
      dates: state.dates.where((item) => item.id != id).toList(),
    );
  }

  List<ImportantDate> _sorted(List<ImportantDate> dates) {
    final copy = [...dates];
    copy.sort((a, b) => a.displayDate.compareTo(b.displayDate));
    return copy;
  }
}

final importantDatesProvider =
    StateNotifierProvider<ImportantDatesNotifier, ImportantDatesState>((ref) {
  return ImportantDatesNotifier(ref.watch(importantDatesRepositoryProvider));
});
