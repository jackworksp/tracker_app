import 'package:flutter/material.dart';

abstract class AppAnimations {
  AppAnimations._();

  // Durations
  static const Duration fast = Duration(milliseconds: 150);
  static const Duration base = Duration(milliseconds: 200);
  static const Duration slow = Duration(milliseconds: 300);

  // Curves
  static const Curve defaultCurve = Cubic(0.4, 0, 0.2, 1);
}
