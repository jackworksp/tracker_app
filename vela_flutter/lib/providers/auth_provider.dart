import 'dart:convert';
import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/auth/session_coordinator.dart';
import '../core/network/dio_client.dart';
import '../core/storage/secure_storage.dart';
import '../core/storage/local_storage.dart';
import '../core/utils/error_messages.dart';
import '../data/models/user.dart';
import '../data/repositories/auth_repository.dart';

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
  late final StreamSubscription<void> _unauthorizedSubscription;

  AuthNotifier(this._authRepository, this._secureStorage)
      : super(const AuthState()) {
    _unauthorizedSubscription =
        SessionCoordinator.instance.unauthorizedStream.listen((_) {
      handleUnauthorized();
    });
    checkAuth();
  }

  @override
  void dispose() {
    _unauthorizedSubscription.cancel();
    super.dispose();
  }

  Future<void> checkAuth() async {
    // Safety net: no matter what happens below, the splash screen exits
    // within 10 seconds. This catches any hang not covered by inner timeouts.
    Future.delayed(const Duration(seconds: 10), () {
      if (state.isCheckingAuth) {
        state = const AuthState(isCheckingAuth: false);
      }
    });

    state = state.copyWith(isCheckingAuth: true);

    // ── Phase 1: resolve immediately from cache (no network, no flash) ──
    final token = await _secureStorage
        .getToken()
        .timeout(const Duration(seconds: 3), onTimeout: () => null);
    if (token == null) {
      // No token at all — definitely logged out.
      state = const AuthState(isCheckingAuth: false);
      return;
    }

    // Try to hydrate the user from the locally-cached JSON blob.
    // If the cache is present and valid, mark auth resolved right away
    // so the router skips /landing and goes straight to /tasks.
    User? cachedUser;
    try {
      final userJson = await _secureStorage
          .getUser()
          .timeout(const Duration(seconds: 3), onTimeout: () => null);
      if (userJson != null && userJson.isNotEmpty) {
        cachedUser =
            User.fromJson(jsonDecode(userJson) as Map<String, dynamic>);
      }
    } catch (_) {
      // Corrupt cache — ignore, network will re-populate it below.
    }

    // Resolve the splash screen now regardless — Phase 2 runs in the background.
    // If cachedUser is null (token saved but user JSON missing), we show landing
    // and redirect to /tasks once Phase 2 confirms the token is valid.
    state = AuthState(user: cachedUser, isCheckingAuth: false);

    // ── Phase 2: background network validation ──
    // Confirm the token is still accepted by the server.
    // If the server rejects it, silently log out.
    try {
      final freshUser = await _authRepository.getCurrentUser();
      // Update user data in case profile info changed.
      state = AuthState(user: freshUser, isCheckingAuth: false);
      await _secureStorage.saveUser(freshUser.toJsonString());
    } catch (_) {
      if (cachedUser != null) {
        // Network error (no connectivity) — keep the cached session alive.
        // Don't force logout just because the server is unreachable.
        return;
      }
      // No cache AND network failed — token is unusable, log out.
      await _secureStorage.clearAll();
      state = const AuthState(isCheckingAuth: false);
    }
  }

  Future<void> handleUnauthorized() async {
    if (!state.isAuthenticated && !state.isCheckingAuth) return;
    await _secureStorage.clearAll();
    state = const AuthState(
      isCheckingAuth: false,
      error: ErrorMessages.sessionExpired,
    );
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
      state =
          AuthState(user: result.user, isLoading: false, isCheckingAuth: false);
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.message ?? ErrorMessages.serverError,
      );
      rethrow;
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
      state =
          AuthState(user: result.user, isLoading: false, isCheckingAuth: false);
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.message ?? ErrorMessages.serverError,
      );
      rethrow;
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
    state = const AuthState(isCheckingAuth: false);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authRepository = ref.watch(authRepositoryProvider);
  final secureStorage = ref.watch(secureStorageProvider);
  return AuthNotifier(authRepository, secureStorage);
});
