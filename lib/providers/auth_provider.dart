import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/dio_client.dart';
import '../core/storage/secure_storage.dart';
import '../core/storage/local_storage.dart';
import '../data/models/user.dart';
import '../data/repositories/auth_repository.dart';
import 'tasks_provider.dart';
import 'progress_provider.dart';
import 'goals_provider.dart';
import 'subjects_provider.dart';
import 'notes_provider.dart';
import 'attachments_provider.dart';

// Singleton instances
final secureStorageProvider = Provider<SecureStorage>((ref) {
  return SecureStorage();
});

final localStorageProvider = Provider<LocalStorage>((ref) {
  // Overridden in main.dart with pre-initialized instance
  return LocalStorage();
});

final dioClientProvider = Provider<DioClient>((ref) {
  final secureStorage = ref.watch(secureStorageProvider);
  return DioClient(secureStorage);
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return AuthRepository(dioClient);
});

// Auth state
class AuthState {
  final User? user;
  final bool isLoading;
  final bool isCheckingAuth;
  final String? error;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.isCheckingAuth = true,
    this.error,
  });

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    User? user,
    bool? isLoading,
    bool? isCheckingAuth,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      isCheckingAuth: isCheckingAuth ?? this.isCheckingAuth,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _authRepository;
  final SecureStorage _secureStorage;
  final Ref _ref;

  AuthNotifier(this._authRepository, this._secureStorage, this._ref)
      : super(const AuthState()) {
    checkAuth();
  }

  Future<void> checkAuth() async {
    state = state.copyWith(isCheckingAuth: true);
    try {
      final token = await _secureStorage.getToken();
      if (token == null) {
        state = const AuthState(isCheckingAuth: false);
        return;
      }
      final user = await _authRepository.getCurrentUser();
      state = AuthState(user: user, isCheckingAuth: false);
    } catch (e) {
      await _secureStorage.clearAll();
      state = const AuthState(isCheckingAuth: false);
    }
  }

  Future<void> login({required String email, required String password}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _authRepository.login(
        email: email,
        password: password,
      );
      await _secureStorage.saveToken(result.token);
      await _secureStorage.saveUser(result.user.toJsonString());
      state = AuthState(user: result.user, isLoading: false, isCheckingAuth: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceAll('Exception: ', ''),
      );
      rethrow;
    }
  }

  Future<void> signup({
    required String name,
    required String email,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _authRepository.signup(
        name: name,
        email: email,
        password: password,
      );
      await _secureStorage.saveToken(result.token);
      await _secureStorage.saveUser(result.user.toJsonString());
      state = AuthState(user: result.user, isLoading: false, isCheckingAuth: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceAll('Exception: ', ''),
      );
      rethrow;
    }
  }

  void updateUser(User user) {
    state = state.copyWith(user: user);
    _secureStorage.saveUser(user.toJsonString());
  }

  Future<void> logout() async {
    await _secureStorage.clearAll();
    // Invalidate all data providers to clear previous user's data
    _ref.invalidate(tasksProvider);
    _ref.invalidate(progressProvider);
    _ref.invalidate(goalsProvider);
    _ref.invalidate(subjectsProvider);
    _ref.invalidate(notesProvider);
    _ref.invalidate(attachmentsProvider);
    state = const AuthState(isCheckingAuth: false);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authRepository = ref.watch(authRepositoryProvider);
  final secureStorage = ref.watch(secureStorageProvider);
  return AuthNotifier(authRepository, secureStorage, ref);
});
