import 'package:shared_preferences/shared_preferences.dart';

class LocalStorage {
  static const _lastSubjectIdKey = 'lastSubjectId';
  static const _themeModeKey = 'themeMode';
  // Issue 03: track whether the first-launch onboarding has been completed
  static const _hasSeenOnboardingKey = 'hasSeenOnboarding';
  // Issue 10: track whether the user has performed their first swipe
  static const _hasSeenSwipeHintKey = 'hasSeenSwipeHint';

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

  // Onboarding state — Issue 03
  bool getHasSeenOnboarding() =>
      _prefs?.getBool(_hasSeenOnboardingKey) ?? false;

  Future<void> setHasSeenOnboarding() async {
    final prefs = await _getPrefs();
    await prefs.setBool(_hasSeenOnboardingKey, true);
  }

  // Swipe hint state — Issue 10
  bool getHasSeenSwipeHint() => _prefs?.getBool(_hasSeenSwipeHintKey) ?? false;

  Future<void> setHasSeenSwipeHint() async {
    final prefs = await _getPrefs();
    await prefs.setBool(_hasSeenSwipeHintKey, true);
  }

  /// Clears user-scoped preferences on logout. Device-level prefs (theme, onboarding) are kept.
  Future<void> clearUserData() async {
    final prefs = await _getPrefs();
    await prefs.remove(_lastSubjectIdKey);
  }

  /// Call once at app startup to eagerly initialize
  Future<void> init() async {
    await _getPrefs();
  }
}
