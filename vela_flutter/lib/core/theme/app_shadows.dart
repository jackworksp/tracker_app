import 'package:flutter/material.dart';

/// Shadow definitions — The Luminous Archive
/// Philosophy: No tight dark shadows. Use large soft ambient glows.
/// Depth is primarily achieved through tonal layering (surface color shifts).
/// Shadows are reserved for floating elements that need true lift.
class VelaShadowSet {
  final List<BoxShadow> xs;
  final List<BoxShadow> sm;
  final List<BoxShadow> md;
  final List<BoxShadow> lg;
  final List<BoxShadow> xl;
  final List<BoxShadow> focus;

  const VelaShadowSet({
    required this.xs,
    required this.sm,
    required this.md,
    required this.lg,
    required this.xl,
    required this.focus,
  });
}

class AppShadows {
  AppShadows._();

  static const VelaShadowSet dark = VelaShadowSet(
    // Ambient glow — large blur, negative spread, low opacity
    xs: [
      BoxShadow(
        color: Color(0x66000000), // rgba(0,0,0,0.4)
        blurRadius: 20,
        spreadRadius: -10,
      ),
    ],
    sm: [
      BoxShadow(
        color: Color(0x66000000),
        blurRadius: 40,
        spreadRadius: -10,
      ),
    ],
    md: [
      BoxShadow(
        color: Color(0x66000000),
        blurRadius: 50,
        spreadRadius: -10,
      ),
    ],
    lg: [
      BoxShadow(
        color: Color(0x66000000),
        blurRadius: 60,
        spreadRadius: -10,
      ),
    ],
    // xl — floating modals/sheets: standard glow + faint amber warmth
    xl: [
      BoxShadow(
        color: Color(0x80000000), // rgba(0,0,0,0.5)
        blurRadius: 80,
        spreadRadius: -10,
      ),
      BoxShadow(
        color: Color(0x0AF59E0B), // rgba(245,158,11,0.04)
        blurRadius: 40,
        spreadRadius: -10,
      ),
    ],
    // Focus ring — amber glow
    focus: [
      BoxShadow(
        color: Color(0x4DF59E0B), // rgba(245,158,11,0.3)
        blurRadius: 0,
        spreadRadius: 3,
      ),
    ],
  );

  static const VelaShadowSet light = VelaShadowSet(
    // Softer in light mode — standard Material-style soft shadows
    xs: [
      BoxShadow(
        color: Color(0x14000000),
        blurRadius: 4,
        offset: Offset(0, 1),
        spreadRadius: 0,
      ),
    ],
    sm: [
      BoxShadow(
        color: Color(0x14000000),
        blurRadius: 8,
        offset: Offset(0, 2),
        spreadRadius: 0,
      ),
    ],
    md: [
      BoxShadow(
        color: Color(0x14000000),
        blurRadius: 16,
        offset: Offset(0, 4),
        spreadRadius: -2,
      ),
    ],
    lg: [
      BoxShadow(
        color: Color(0x14000000),
        blurRadius: 24,
        offset: Offset(0, 8),
        spreadRadius: -4,
      ),
    ],
    xl: [
      BoxShadow(
        color: Color(0x1A000000),
        blurRadius: 40,
        offset: Offset(0, 16),
        spreadRadius: -8,
      ),
    ],
    focus: [
      BoxShadow(
        color: Color(0x40D97706), // rgba(217,119,6,0.25)
        blurRadius: 0,
        spreadRadius: 3,
      ),
    ],
  );
}
