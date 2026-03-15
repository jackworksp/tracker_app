import 'package:flutter/material.dart';

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
    xs: [
      BoxShadow(
        color: Color(0x1A0F0F0F),
        blurRadius: 2,
        offset: Offset(0, 1),
      ),
    ],
    sm: [
      BoxShadow(
        color: Color(0x260F0F0F),
        blurRadius: 3,
        offset: Offset(0, 1),
      ),
      BoxShadow(
        color: Color(0x1A0F0F0F),
        blurRadius: 2,
        offset: Offset(0, 1),
      ),
    ],
    md: [
      BoxShadow(
        color: Color(0x260F0F0F),
        blurRadius: 6,
        offset: Offset(0, 4),
        spreadRadius: -1,
      ),
      BoxShadow(
        color: Color(0x1A0F0F0F),
        blurRadius: 4,
        offset: Offset(0, 2),
        spreadRadius: -1,
      ),
    ],
    lg: [
      BoxShadow(
        color: Color(0x260F0F0F),
        blurRadius: 15,
        offset: Offset(0, 10),
        spreadRadius: -3,
      ),
      BoxShadow(
        color: Color(0x1A0F0F0F),
        blurRadius: 6,
        offset: Offset(0, 4),
        spreadRadius: -2,
      ),
    ],
    xl: [
      BoxShadow(
        color: Color(0x330F0F0F),
        blurRadius: 25,
        offset: Offset(0, 20),
        spreadRadius: -5,
      ),
      BoxShadow(
        color: Color(0x1A0F0F0F),
        blurRadius: 10,
        offset: Offset(0, 10),
        spreadRadius: -5,
      ),
    ],
    focus: [
      BoxShadow(
        color: Color(0x4D06D6A0), // rgba(6,214,160,0.3)
        blurRadius: 0,
        spreadRadius: 3,
      ),
    ],
  );

  static const VelaShadowSet light = VelaShadowSet(
    xs: [
      BoxShadow(
        color: Color(0x14000000),
        blurRadius: 2,
        offset: Offset(0, 1),
      ),
    ],
    sm: [
      BoxShadow(
        color: Color(0x14000000), // rgba(0,0,0,0.08)
        blurRadius: 3,
        offset: Offset(0, 1),
      ),
      BoxShadow(
        color: Color(0x0A000000),
        blurRadius: 2,
        offset: Offset(0, 1),
      ),
    ],
    md: [
      BoxShadow(
        color: Color(0x14000000),
        blurRadius: 6,
        offset: Offset(0, 4),
        spreadRadius: -1,
      ),
      BoxShadow(
        color: Color(0x0A000000),
        blurRadius: 4,
        offset: Offset(0, 2),
        spreadRadius: -1,
      ),
    ],
    lg: [
      BoxShadow(
        color: Color(0x14000000),
        blurRadius: 15,
        offset: Offset(0, 10),
        spreadRadius: -3,
      ),
      BoxShadow(
        color: Color(0x0A000000),
        blurRadius: 6,
        offset: Offset(0, 4),
        spreadRadius: -2,
      ),
    ],
    xl: [
      BoxShadow(
        color: Color(0x1A000000),
        blurRadius: 25,
        offset: Offset(0, 20),
        spreadRadius: -5,
      ),
      BoxShadow(
        color: Color(0x0A000000),
        blurRadius: 10,
        offset: Offset(0, 10),
        spreadRadius: -5,
      ),
    ],
    focus: [
      BoxShadow(
        color: Color(0x400095F6), // rgba(0,149,246,0.25)
        blurRadius: 0,
        spreadRadius: 3,
      ),
    ],
  );
}
