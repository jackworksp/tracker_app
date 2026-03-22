import 'package:flutter/material.dart';

abstract class AppTypography {
  AppTypography._();

  // Font sizes
  static const double fontSizeXs = 12.0;
  static const double fontSizeSm = 14.0;
  static const double fontSizeBase = 16.0;
  static const double fontSizeMd = 16.0;
  static const double fontSizeLg = 18.0;
  static const double fontSizeXl = 20.0;
  static const double fontSize2xl = 24.0;
  static const double fontSize3xl = 30.0;
  static const double fontSize4xl = 36.0;
  static const double fontSize5xl = 48.0;

  // Line heights
  static const double lineHeightTight = 1.2;
  static const double lineHeightNormal = 1.5;
  static const double lineHeightRelaxed = 1.6;
  static const double lineHeightLoose = 2.0;

  // Font weights
  static const FontWeight weightNormal = FontWeight.w400;
  static const FontWeight weightMedium = FontWeight.w500;
  static const FontWeight weightSemibold = FontWeight.w600;
  static const FontWeight weightBold = FontWeight.w700;

  // --- Text Styles ---

  // Headings
  static TextStyle heading5xl(Color color) => TextStyle(
        fontSize: fontSize5xl,
        fontWeight: weightBold,
        height: lineHeightTight,
        color: color,
      );

  static TextStyle heading4xl(Color color) => TextStyle(
        fontSize: fontSize4xl,
        fontWeight: weightBold,
        height: lineHeightTight,
        color: color,
      );

  static TextStyle heading3xl(Color color) => TextStyle(
        fontSize: fontSize3xl,
        fontWeight: weightBold,
        height: lineHeightTight,
        color: color,
      );

  static TextStyle heading2xl(Color color) => TextStyle(
        fontSize: fontSize2xl,
        fontWeight: weightSemibold,
        height: lineHeightTight,
        color: color,
      );

  static TextStyle headingXl(Color color) => TextStyle(
        fontSize: fontSizeXl,
        fontWeight: weightSemibold,
        height: lineHeightTight,
        color: color,
      );

  static TextStyle headingLg(Color color) => TextStyle(
        fontSize: fontSizeLg,
        fontWeight: weightSemibold,
        height: lineHeightTight,
        color: color,
      );

  // Body
  static TextStyle bodyLg(Color color) => TextStyle(
        fontSize: fontSizeLg,
        fontWeight: weightNormal,
        height: lineHeightNormal,
        color: color,
      );

  static TextStyle bodyBase(Color color) => TextStyle(
        fontSize: fontSizeBase,
        fontWeight: weightNormal,
        height: lineHeightNormal,
        color: color,
      );

  static TextStyle bodySm(Color color) => TextStyle(
        fontSize: fontSizeSm,
        fontWeight: weightNormal,
        height: lineHeightNormal,
        color: color,
      );

  static TextStyle bodyXs(Color color) => TextStyle(
        fontSize: fontSizeXs,
        fontWeight: weightNormal,
        height: lineHeightNormal,
        color: color,
      );

  // Body medium weight
  static TextStyle bodyLgMedium(Color color) => TextStyle(
        fontSize: fontSizeLg,
        fontWeight: weightMedium,
        height: lineHeightNormal,
        color: color,
      );

  static TextStyle bodyBaseMedium(Color color) => TextStyle(
        fontSize: fontSizeBase,
        fontWeight: weightMedium,
        height: lineHeightNormal,
        color: color,
      );

  static TextStyle bodySmMedium(Color color) => TextStyle(
        fontSize: fontSizeSm,
        fontWeight: weightMedium,
        height: lineHeightNormal,
        color: color,
      );

  static TextStyle bodyXsMedium(Color color) => TextStyle(
        fontSize: fontSizeXs,
        fontWeight: weightMedium,
        height: lineHeightNormal,
        color: color,
      );

  // Body semibold weight
  static TextStyle bodyBaseSemibold(Color color) => TextStyle(
        fontSize: fontSizeBase,
        fontWeight: weightSemibold,
        height: lineHeightNormal,
        color: color,
      );

  static TextStyle bodySmSemibold(Color color) => TextStyle(
        fontSize: fontSizeSm,
        fontWeight: weightSemibold,
        height: lineHeightNormal,
        color: color,
      );

  // Body bold weight
  static TextStyle bodyBaseBold(Color color) => TextStyle(
        fontSize: fontSizeBase,
        fontWeight: weightBold,
        height: lineHeightNormal,
        color: color,
      );

  static TextStyle bodySmBold(Color color) => TextStyle(
        fontSize: fontSizeSm,
        fontWeight: weightBold,
        height: lineHeightNormal,
        color: color,
      );

  // Labels
  static TextStyle labelLg(Color color) => TextStyle(
        fontSize: fontSizeSm,
        fontWeight: weightMedium,
        height: lineHeightTight,
        color: color,
      );

  static TextStyle labelBase(Color color) => TextStyle(
        fontSize: fontSizeXs,
        fontWeight: weightMedium,
        height: lineHeightTight,
        color: color,
      );

  static TextStyle labelSm(Color color) => TextStyle(
        fontSize: 10.0,
        fontWeight: weightMedium,
        height: lineHeightTight,
        color: color,
      );

  // Navigation label — Issue 02: minimum 11px, weight 600 (semibold) always
  // for legibility on small mobile screens (WCAG AAA readability).
  static const double fontSizeNavLabel = 11.0;

  static TextStyle navLabel(Color color, {bool active = false}) => TextStyle(
        fontSize: fontSizeNavLabel,
        fontWeight: weightSemibold, // w600 regardless of active state
        height: lineHeightTight,
        color: color,
        letterSpacing: 0.1,
      );

  // Caption
  static TextStyle caption(Color color) => TextStyle(
        fontSize: fontSizeXs,
        fontWeight: weightNormal,
        height: lineHeightRelaxed,
        color: color,
      );

  // Button
  static TextStyle buttonLg(Color color) => TextStyle(
        fontSize: fontSizeBase,
        fontWeight: weightSemibold,
        height: lineHeightTight,
        color: color,
      );

  static TextStyle buttonBase(Color color) => TextStyle(
        fontSize: fontSizeSm,
        fontWeight: weightSemibold,
        height: lineHeightTight,
        color: color,
      );

  static TextStyle buttonSm(Color color) => TextStyle(
        fontSize: fontSizeXs,
        fontWeight: weightSemibold,
        height: lineHeightTight,
        color: color,
      );
}
