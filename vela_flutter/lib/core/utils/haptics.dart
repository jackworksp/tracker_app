import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

// ---------------------------------------------------------------------------
// Issue 08 — Haptic feedback utility
// Wraps Flutter's HapticFeedback service with try/catch so it gracefully
// degrades on web, desktop, and devices where haptics are unavailable.
//
// Haptic map:
//   light   → button press, toggle, navigation tap
//   medium  → swipe action triggered, form submitted
//   heavy   → delete action confirmed
//   success → task completed
// ---------------------------------------------------------------------------

abstract class VelaHaptics {
  VelaHaptics._();

  /// Returns true only on mobile native platforms.
  static bool get _isSupported =>
      !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.android ||
          defaultTargetPlatform == TargetPlatform.iOS);

  /// Light tap — button press, nav item tap, toggle.
  static Future<void> light() async {
    if (!_isSupported) return;
    try {
      await HapticFeedback.lightImpact();
    } catch (_) {}
  }

  /// Alias for [light] — used on button taps (Issue 08).
  static Future<void> lightTap() => light();

  /// Medium impact — swipe threshold crossed, card interaction.
  static Future<void> medium() async {
    if (!_isSupported) return;
    try {
      await HapticFeedback.mediumImpact();
    } catch (_) {}
  }

  /// Alias for [medium] — used on swipe confirm and task delete (Issue 08).
  static Future<void> mediumImpact() => medium();

  /// Heavy impact — destructive action confirmed (delete).
  static Future<void> heavy() async {
    if (!_isSupported) return;
    try {
      await HapticFeedback.heavyImpact();
    } catch (_) {}
  }

  /// Alias for [heavy] — reserved for future destructive confirmations (Issue 08).
  static Future<void> heavyImpact() => heavy();

  /// Success notification pattern — task completed, form saved.
  static Future<void> success() async {
    if (!_isSupported) return;
    try {
      // Flutter's HapticFeedback doesn't expose NotificationType directly;
      // vibrate() gives a short success-style buzz on both iOS and Android.
      await HapticFeedback.vibrate();
    } catch (_) {}
  }

  /// Error state — form validation failure, action failed (Issue 08).
  static Future<void> error() async {
    if (!_isSupported) return;
    try {
      // Heavy pulse to signal an error condition.
      await HapticFeedback.heavyImpact();
    } catch (_) {}
  }

  /// Selection changed — nav item switch, filter chip.
  static Future<void> selection() async {
    if (!_isSupported) return;
    try {
      await HapticFeedback.selectionClick();
    } catch (_) {}
  }
}
