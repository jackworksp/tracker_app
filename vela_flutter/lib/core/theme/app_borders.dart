import 'package:flutter/material.dart';

abstract class AppBorders {
  AppBorders._();

  // Border radii values
  static const double radiusNone = 0.0;
  static const double radiusSm = 3.0;
  static const double radiusMd = 6.0;
  static const double radiusLg = 8.0;
  static const double radiusXl = 12.0;
  static const double radiusFull = 9999.0;

  // BorderRadius constants
  static const BorderRadius none = BorderRadius.zero;

  static const BorderRadius sm = BorderRadius.all(Radius.circular(3.0));

  static const BorderRadius md = BorderRadius.all(Radius.circular(6.0));

  static const BorderRadius lg = BorderRadius.all(Radius.circular(8.0));

  static const BorderRadius xl = BorderRadius.all(Radius.circular(12.0));

  static const BorderRadius full = BorderRadius.all(Radius.circular(9999.0));
}
