import 'package:shared_preferences/shared_preferences.dart';

class LocalStorage {
  static const _lastSubjectIdKey = 'lastSubjectId';
  static const _themeModeKey = 'themeMode';

  SharedPreferences? _prefs;

  Future<SharedPreferences> _getPrefs() async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!;
  }

  // Subject persistence
  int? getLastSubjectId() => _prefs?.getInt(_lastSubjectIdKey);

  Future<void> setLastSubjectId(int id) async {
    final prefs = await _getPrefs();
    await prefs.setInt(_lastSubjectIdKey, id);
  }

  // Theme
  String? getThemeMode() => _prefs?.getString(_themeModeKey);

  Future<void> setThemeMode(String mode) async {
    final prefs = await _getPrefs();
    await prefs.setString(_themeModeKey, mode);
  }

  /// Call once at app startup to eagerly initialize
  Future<void> init() async {
    await _getPrefs();
  }
}
