import 'package:flutter/material.dart';

// ---------------------------------------------------------------------------
// Issue 09 — Motion preferences helper
// Reads MediaQuery.disableAnimations which reflects:
//   Android: Settings > Accessibility > Remove animations
//   iOS:     Settings > Accessibility > Motion > Reduce Motion
//
// Usage:
//   final reduce = MotionPreferences.of(context);
//   if (!reduce) { /* run animation */ }
// ---------------------------------------------------------------------------

abstract class MotionPreferences {
  MotionPreferences._();

  /// Returns true when the user has requested reduced motion at the OS level.
  static bool of(BuildContext context) {
    return MediaQuery.of(context).disableAnimations;
  }

  /// Safe version — returns false if MediaQuery is not available (e.g. in tests).
  static bool maybeOf(BuildContext context) {
    return MediaQuery.maybeOf(context)?.disableAnimations ?? false;
  }
}
