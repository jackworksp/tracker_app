import 'package:flutter/material.dart';

class VelaColorScheme {
  final Color bgPrimary;
  final Color bgSecondary;
  final Color bgTertiary;
  final Color bgHover;

  final Color surfaceDefault;
  final Color surfaceElevated;
  final Color surfaceOverlay;
  final Color surfaceCard;
  final Color surfaceCardHover;
  final Color surfaceBorder;
  final Color surfaceBorderDark;

  final Color textPrimary;
  final Color textSecondary;
  final Color textTertiary;
  final Color textDisabled;
  final Color textInverse;
  final Color textLink;
  final Color textLinkHover;

  final Color stateInfo;
  final Color stateSuccess;
  final Color stateWarning;
  final Color stateError;
  final Color stateInfoBg;
  final Color stateSuccessBg;
  final Color stateWarningBg;
  final Color stateErrorBg;

  final Color brandPrimary;
  final Color brandPrimaryHover;
  final Color brandPrimaryActive;
  final Color brandSecondary;
  final Color brandAccent;

  final Color interactiveHover;
  final Color interactiveActive;
  final Color interactiveSelected;
  final Color interactiveSelectedHover;
  final Color interactiveFocus;

  // Task type indicator colors
  final Color taskTypeWatch;
  final Color taskTypeRead;
  final Color taskTypeNote;

  // Task priority colors
  final Color priorityHigh;
  final Color priorityMedium;
  final Color priorityLow;

  const VelaColorScheme({
    required this.bgPrimary,
    required this.bgSecondary,
    required this.bgTertiary,
    required this.bgHover,
    required this.surfaceDefault,
    required this.surfaceElevated,
    required this.surfaceOverlay,
    required this.surfaceCard,
    required this.surfaceCardHover,
    required this.surfaceBorder,
    required this.surfaceBorderDark,
    required this.textPrimary,
    required this.textSecondary,
    required this.textTertiary,
    required this.textDisabled,
    required this.textInverse,
    required this.textLink,
    required this.textLinkHover,
    required this.stateInfo,
    required this.stateSuccess,
    required this.stateWarning,
    required this.stateError,
    required this.stateInfoBg,
    required this.stateSuccessBg,
    required this.stateWarningBg,
    required this.stateErrorBg,
    required this.brandPrimary,
    required this.brandPrimaryHover,
    required this.brandPrimaryActive,
    required this.brandSecondary,
    required this.brandAccent,
    required this.interactiveHover,
    required this.interactiveActive,
    required this.interactiveSelected,
    required this.interactiveSelectedHover,
    required this.interactiveFocus,
    required this.taskTypeWatch,
    required this.taskTypeRead,
    required this.taskTypeNote,
    required this.priorityHigh,
    required this.priorityMedium,
    required this.priorityLow,
  });
}

class AppColors {
  AppColors._();

  static const VelaColorScheme dark = VelaColorScheme(
    // Backgrounds
    bgPrimary: Color(0xFF0A0E27),
    bgSecondary: Color(0xFF0F1420),
    bgTertiary: Color(0xFF1A1F2E),
    bgHover: Color(0x0DFFFFFF), // rgba(255,255,255,0.05)

    // Surfaces
    surfaceDefault: Color(0xFF0F1420),
    surfaceElevated: Color(0xFF1A1F2E),
    surfaceOverlay: Color(0xCC0F0F0F), // rgba(15,15,15,0.8)
    surfaceCard: Color(0x0DFFFFFF), // rgba(255,255,255,0.05)
    surfaceCardHover: Color(0x14FFFFFF), // rgba(255,255,255,0.08)
    surfaceBorder: Color(0x1AFFFFFF), // rgba(255,255,255,0.1)
    surfaceBorderDark: Color(0x0DFFFFFF), // rgba(255,255,255,0.05)

    // Text
    textPrimary: Color(0xFFF8F9FA),
    textSecondary: Color(0xFFADB5BD),
    textTertiary: Color(0xFF868E96),
    textDisabled: Color(0xFF495057),
    textInverse: Color(0xFF0A0E27),
    textLink: Color(0xFF06D6A0),
    textLinkHover: Color(0xFF04A980),

    // States
    stateInfo: Color(0xFF06D6A0),
    stateSuccess: Color(0xFF0F7B6C),
    stateWarning: Color(0xFFF59E0B),
    stateError: Color(0xFFEB5757),
    stateInfoBg: Color(0x1A06D6A0), // rgba(6,214,160,0.1)
    stateSuccessBg: Color(0xFFD1F4DD),
    stateWarningBg: Color(0xFFFFF3CD),
    stateErrorBg: Color(0xFFFDE8E8),

    // Brand
    brandPrimary: Color(0xFF37352F),
    brandPrimaryHover: Color(0xFF2F2E29),
    brandPrimaryActive: Color(0xFF1F1E1B),
    brandSecondary: Color(0xFF787774),
    brandAccent: Color(0xFF06D6A0),

    // Interactive
    interactiveHover: Color(0x14FFFFFF), // rgba(255,255,255,0.08)
    interactiveActive: Color(0x1FFFFFFF), // rgba(255,255,255,0.12)
    interactiveSelected: Color(0x2606D6A0), // rgba(6,214,160,0.15)
    interactiveSelectedHover: Color(0x3306D6A0), // rgba(6,214,160,0.2)
    interactiveFocus: Color(0xFF06D6A0),

    // Task type colors
    taskTypeWatch: Color(0xFFEF4444),
    taskTypeRead: Color(0xFF3B82F6),
    taskTypeNote: Color(0xFFA855F7),

    // Priority colors
    priorityHigh: Color(0xFFEF4444),
    priorityMedium: Color(0xFFF59E0B),
    priorityLow: Color(0xFF06D6A0),
  );

  static const VelaColorScheme light = VelaColorScheme(
    // Backgrounds
    bgPrimary: Color(0xFFECEEF2),
    bgSecondary: Color(0xFFFFFFFF),
    bgTertiary: Color(0xFFE2E5EB),
    bgHover: Color(0x0A000000), // rgba(0,0,0,0.04)

    // Surfaces
    surfaceDefault: Color(0xFFFFFFFF),
    surfaceElevated: Color(0xFFFFFFFF),
    surfaceOverlay: Color(0xE6FFFFFF), // rgba(255,255,255,0.9)
    surfaceCard: Color(0xFFFFFFFF),
    surfaceCardHover: Color(0xFFF8F8F8),
    surfaceBorder: Color(0xFFDBDBDB),
    surfaceBorderDark: Color(0xFFEFEFEF),

    // Text
    textPrimary: Color(0xFF262626),
    textSecondary: Color(0xFF737373),
    textTertiary: Color(0xFF8E8E8E),
    textDisabled: Color(0xFFC7C7C7),
    textInverse: Color(0xFFFFFFFF),
    textLink: Color(0xFF0095F6),
    textLinkHover: Color(0xFF0074CC),

    // States
    stateInfo: Color(0xFF0095F6),
    stateSuccess: Color(0xFF0F7B6C),
    stateWarning: Color(0xFFF59E0B),
    stateError: Color(0xFFEB5757),
    stateInfoBg: Color(0x1A0095F6),
    stateSuccessBg: Color(0xFFD1F4DD),
    stateWarningBg: Color(0xFFFFF3CD),
    stateErrorBg: Color(0xFFFDE8E8),

    // Brand
    brandPrimary: Color(0xFF262626),
    brandPrimaryHover: Color(0xFF363636),
    brandPrimaryActive: Color(0xFF1A1A1A),
    brandSecondary: Color(0xFF737373),
    brandAccent: Color(0xFF0095F6),

    // Interactive
    interactiveHover: Color(0x0A000000), // rgba(0,0,0,0.04)
    interactiveActive: Color(0x14000000), // rgba(0,0,0,0.08)
    interactiveSelected: Color(0x1A0095F6), // rgba(0,149,246,0.1)
    interactiveSelectedHover: Color(0x260095F6), // rgba(0,149,246,0.15)
    interactiveFocus: Color(0xFF0095F6),

    // Task type colors
    taskTypeWatch: Color(0xFFEF4444),
    taskTypeRead: Color(0xFF3B82F6),
    taskTypeNote: Color(0xFFA855F7),

    // Priority colors
    priorityHigh: Color(0xFFEF4444),
    priorityMedium: Color(0xFFF59E0B),
    priorityLow: Color(0xFF0F7B6C),
  );
}
