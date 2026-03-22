import 'package:flutter/material.dart';

abstract class AppAnimations {
  AppAnimations._();

  // Durations
  static const Duration fast = Duration(milliseconds: 150);
  static const Duration base = Duration(milliseconds: 200);
  static const Duration slow = Duration(milliseconds: 300);
  // Duration.zero substitute used when OS prefers reduced motion (Issue 09).
  // Using Duration.zero ensures AnimatedContainer/AnimatedOpacity skip the
  // animation frame entirely rather than rendering a 1ms flash.
  static const Duration none = Duration.zero;

  // Curves
  static const Curve defaultCurve = Cubic(0.4, 0, 0.2, 1);

  // ---------------------------------------------------------------------------
  // Issue 09 — Reduced motion helpers
  // Call these instead of the raw constants so animations are automatically
  // skipped when the user has enabled "reduce motion" in OS settings.
  // ---------------------------------------------------------------------------

  /// Returns the appropriate duration: [duration] normally, [none] when the
  /// OS prefers reduced motion.
  static Duration duration(BuildContext context, Duration duration) {
    final reduce = MediaQuery.of(context).disableAnimations;
    return reduce ? none : duration;
  }

  /// Returns [fast] or [none] depending on reduced-motion preference.
  static Duration fastOrNone(BuildContext context) =>
      duration(context, fast);

  /// Returns [base] or [none] depending on reduced-motion preference.
  static Duration baseOrNone(BuildContext context) =>
      duration(context, base);

  /// Returns [slow] or [none] depending on reduced-motion preference.
  static Duration slowOrNone(BuildContext context) =>
      duration(context, slow);
}
