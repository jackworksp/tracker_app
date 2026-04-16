import 'package:shared_preferences/shared_preferences.dart';

class LocalStorage {
  static const _lastSubjectIdKey = 'lastSubjectId';
  static const _themeModeKey = 'themeMode';
  static const _attachmentsViewModeKey = 'attachmentsViewMode';
  static const _askModelKey = 'askModel';
  // Issue 03: track whether the first-launch onboarding has been completed
  static const _hasSeenOnboardingKey = 'hasSeenOnboarding';
  // Issue 10: track whether the user has performed their first swipe
  static const _hasSeenSwipeHintKey = 'hasSeenSwipeHint';
  // Morning Brief notification settings
  static const _morningBriefEnabledKey = 'morningBriefEnabled';
  static const _morningBriefHourKey = 'morningBriefHour';
  static const _morningBriefMinuteKey = 'morningBriefMinute';

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

  // Files view mode
  String? getAttachmentsViewMode() =>
      _prefs?.getString(_attachmentsViewModeKey);

  Future<void> setAttachmentsViewMode(String mode) async {
    final prefs = await _getPrefs();
    await prefs.setString(_attachmentsViewModeKey, mode);
  }

  String? getAskModel() => _prefs?.getString(_askModelKey);

  Future<void> setAskModel(String model) async {
    final prefs = await _getPrefs();
    await prefs.setString(_askModelKey, model);
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

  // Morning Brief
  bool getMorningBriefEnabled() =>
      _prefs?.getBool(_morningBriefEnabledKey) ?? false;

  Future<void> setMorningBriefEnabled(bool value) async {
    final prefs = await _getPrefs();
    await prefs.setBool(_morningBriefEnabledKey, value);
  }

  /// Returns the scheduled hour (0–23), default 7.
  int getMorningBriefHour() => _prefs?.getInt(_morningBriefHourKey) ?? 7;

  /// Returns the scheduled minute (0–59), default 0.
  int getMorningBriefMinute() => _prefs?.getInt(_morningBriefMinuteKey) ?? 0;

  Future<void> setMorningBriefTime(int hour, int minute) async {
    final prefs = await _getPrefs();
    await prefs.setInt(_morningBriefHourKey, hour);
    await prefs.setInt(_morningBriefMinuteKey, minute);
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
