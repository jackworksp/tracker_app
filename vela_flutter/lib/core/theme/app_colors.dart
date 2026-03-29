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
  // Tonal layering system (Level 1→3)
  final Color surfaceContainerLow; // Level 1 — sections/sidebar
  final Color surfaceContainerHigh; // Level 2 — active cards
  final Color surfaceContainerHighest; // Level 3 — modals/popovers
  final Color surfaceBorder;
  final Color surfaceBorderDark;
  // Ghost border — rgba(83,68,52,0.15) — felt, not seen
  final Color ghostBorder;

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

  final Color brandPrimary; // gradient start (#FFC174)
  final Color brandPrimaryHover; // accent (#F59E0B)
  final Color brandPrimaryActive; // deep amber (#D97706)
  final Color brandSecondary;
  final Color brandAccent; // amber #F59E0B
  final Color brandAccentLight; // gradient start #FFC174
  final Color brandOnPrimary; // text on amber buttons #472A00

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
    required this.surfaceContainerLow,
    required this.surfaceContainerHigh,
    required this.surfaceContainerHighest,
    required this.surfaceBorder,
    required this.surfaceBorderDark,
    required this.ghostBorder,
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
    required this.brandAccentLight,
    required this.brandOnPrimary,
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

  // Gradient helper — use in widget decoration
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFFC174), Color(0xFFF59E0B)],
  );

  static const VelaColorScheme dark = VelaColorScheme(
    // Backgrounds — pure black, no blue tint
    bgPrimary: Color(0xFF0F0F0F),
    bgSecondary: Color(0xFF141414),
    bgTertiary: Color(0xFF201F1F),
    bgHover: Color(0x14F59E0B), // rgba(245,158,11,0.08)

    // Surfaces — tonal layering
    surfaceDefault: Color(0xFF141414),
    surfaceElevated: Color(0xFF201F1F),
    surfaceOverlay: Color(0xCC141414), // rgba(20,20,20,0.8)
    surfaceCard: Color(0xFF1C1C1C),
    surfaceCardHover: Color(0xFF201F1F),
    surfaceContainerLow: Color(0xFF141414), // Level 1
    surfaceContainerHigh: Color(0xFF1C1C1C), // Level 2
    surfaceContainerHighest: Color(0xFF353534), // Level 3 — floating
    surfaceBorder: Color(0x26534434), // rgba(83,68,52,0.15)
    surfaceBorderDark: Color(0x14534434), // rgba(83,68,52,0.08)
    ghostBorder: Color(0x26534434), // rgba(83,68,52,0.15) — felt, not seen

    // Text
    textPrimary: Color(0xFFF8F9FA),
    textSecondary: Color(0xFFA1A1AA),
    textTertiary: Color(0xFF71717A),
    textDisabled: Color(0xFF3F3F46),
    textInverse: Color(0xFF0F0F0F),
    textLink: Color(0xFFF59E0B),
    textLinkHover: Color(0xFFD97706),

    // States — keep success/error unchanged, amber aligns with warning/info
    stateInfo: Color(0xFFF59E0B),
    stateSuccess: Color(0xFF0F7B6C),
    stateWarning: Color(0xFFF59E0B),
    stateError: Color(0xFFEB5757),
    stateInfoBg: Color(0x1AF59E0B), // rgba(245,158,11,0.1)
    stateSuccessBg: Color(0xFFD1F4DD),
    stateWarningBg: Color(0x1AF59E0B), // rgba(245,158,11,0.1)
    stateErrorBg: Color(0xFFFDE8E8),

    // Brand — amber
    brandPrimary: Color(0xFFFFC174), // gradient start
    brandPrimaryHover: Color(0xFFF59E0B),
    brandPrimaryActive: Color(0xFFD97706),
    brandSecondary: Color(0xFFA1A1AA),
    brandAccent: Color(0xFFF59E0B), // amber-500
    brandAccentLight: Color(0xFFFFC174), // gradient start
    brandOnPrimary: Color(0xFF472A00), // dark brown — text on amber

    // Interactive
    interactiveHover: Color(0x14F59E0B), // rgba(245,158,11,0.08)
    interactiveActive: Color(0x1FF59E0B), // rgba(245,158,11,0.12)
    interactiveSelected: Color(0x26F59E0B), // rgba(245,158,11,0.15)
    interactiveSelectedHover: Color(0x33F59E0B), // rgba(245,158,11,0.2)
    interactiveFocus: Color(0xFFF59E0B),

    // Task type colors — unchanged per spec
    taskTypeWatch: Color(0xFFEF4444),
    taskTypeRead: Color(0xFF3B82F6),
    taskTypeNote: Color(0xFFA855F7),

    // Priority colors — unchanged per spec
    priorityHigh: Color(0xFFEF4444),
    priorityMedium: Color(0xFFF59E0B),
    priorityLow: Color(0xFF06D6A0),
  );

  static const VelaColorScheme light = VelaColorScheme(
    // Backgrounds — warm stone, clearly distinct from white cards
    bgPrimary: Color(0xFFEDEBE7), // warm stone page background
    bgSecondary: Color(0xFFE7E5E1), // AppBar / nav area (slightly darker)
    bgTertiary: Color(0xFFE1DFD9),
    bgHover: Color(0x0FF59E0B), // rgba(245,158,11,0.06)

    // Surfaces — white cards float on warm stone bg
    surfaceDefault: Color(0xFFFFFFFF),
    surfaceElevated: Color(0xFFFAFAF9),
    surfaceOverlay: Color(0xE6FFFFFF), // rgba(255,255,255,0.9)
    surfaceCard: Color(0xFFFFFFFF), // pure white — pops on stone bg
    surfaceCardHover: Color(0xFFFAFAF9),
    surfaceContainerLow: Color(0xFFFFFFFF), // white cards
    surfaceContainerHigh:
        Color(0xFFF5F3EF), // slightly warm for nested sections
    surfaceContainerHighest: Color(0xFFEDE9E3), // modals / popovers
    surfaceBorder: Color(0x1F534434), // rgba(83,68,52,0.12)
    surfaceBorderDark: Color(0x14534434),
    ghostBorder: Color(0x1F534434),

    // Text
    textPrimary: Color(0xFF1C1917),
    textSecondary: Color(0xFF78716C),
    textTertiary: Color(0xFFA8A29E),
    textDisabled: Color(0xFFD6D3D1),
    textInverse: Color(0xFFFFFFFF),
    textLink: Color(0xFFD97706),
    textLinkHover: Color(0xFFB45309),

    // States
    stateInfo: Color(0xFFD97706),
    stateSuccess: Color(0xFF0F7B6C),
    stateWarning: Color(0xFFD97706),
    stateError: Color(0xFFEB5757),
    stateInfoBg: Color(0x1AD97706),
    stateSuccessBg: Color(0xFFD1F4DD),
    stateWarningBg: Color(0x1AD97706),
    stateErrorBg: Color(0xFFFDE8E8),

    // Brand
    brandPrimary: Color(0xFFD97706),
    brandPrimaryHover: Color(0xFFB45309),
    brandPrimaryActive: Color(0xFF92400E),
    brandSecondary: Color(0xFF78716C),
    brandAccent: Color(0xFFD97706),
    brandAccentLight: Color(0xFFFBBF24),
    brandOnPrimary: Color(0xFFFFFFFF),

    // Interactive
    interactiveHover: Color(0x0FD97706),
    interactiveActive: Color(0x1AD97706),
    interactiveSelected: Color(0x1FD97706),
    interactiveSelectedHover: Color(0x2DD97706),
    interactiveFocus: Color(0xFFD97706),

    // Task type colors — unchanged
    taskTypeWatch: Color(0xFFEF4444),
    taskTypeRead: Color(0xFF3B82F6),
    taskTypeNote: Color(0xFFA855F7),

    // Priority colors — unchanged
    priorityHigh: Color(0xFFEF4444),
    priorityMedium: Color(0xFFF59E0B),
    priorityLow: Color(0xFF0F7B6C),
  );
}
