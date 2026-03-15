import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/storage/local_storage.dart';
import 'auth_provider.dart';

final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  final localStorage = ref.watch(localStorageProvider);
  return ThemeModeNotifier(localStorage);
});

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  final LocalStorage _localStorage;

  ThemeModeNotifier(this._localStorage) : super(ThemeMode.dark) {
    _loadFromStorage();
  }

  void _loadFromStorage() {
    final stored = _localStorage.getThemeMode();
    if (stored == 'light') {
      state = ThemeMode.light;
    } else if (stored == 'dark') {
      state = ThemeMode.dark;
    }
  }

  void setThemeMode(ThemeMode mode) {
    state = mode;
    _localStorage.setThemeMode(mode == ThemeMode.dark ? 'dark' : 'light');
  }

  void toggleTheme() {
    final newMode = state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    setThemeMode(newMode);
  }
}
