import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Typography — The Luminous Archive
/// Font: Inter — editorial authority, clarity and technical precision
/// Scale mirrors the web design-system spec.
abstract class AppTypography {
  AppTypography._();

  // Font sizes
  static const double fontSizeXs = 12.0;    // Label/metadata
  static const double fontSizeSm = 14.0;    // Body workhorse (0.875rem)
  static const double fontSizeBase = 16.0;  // Title (1rem)
  static const double fontSizeMd = 16.0;
  static const double fontSizeLg = 18.0;
  static const double fontSizeXl = 20.0;
  static const double fontSize2xl = 24.0;
  static const double fontSize3xl = 30.0;
  static const double fontSize4xl = 36.0;
  static const double fontSize5xl = 48.0;
  static const double fontSizeHeadline = 28.0; // 1.75rem — primary section headers
  static const double fontSizeDisplay = 56.0;  // 3.5rem — hero moments

  // Line heights
  static const double lineHeightTight = 1.2;
  static const double lineHeightNormal = 1.5;
  static const double lineHeightRelaxed = 1.6; // Generous for dark bg readability
  static const double lineHeightLoose = 2.0;

  // Font weights
  static const FontWeight weightNormal = FontWeight.w400;
  static const FontWeight weightMedium = FontWeight.w500;
  static const FontWeight weightSemibold = FontWeight.w600;
  static const FontWeight weightBold = FontWeight.w700;

  // Letter spacing
  static const double letterSpacingTight = -1.12; // -0.02em * 56px
  static const double letterSpacingNormal = 0.0;
  // Wide: 0.05em — used for label/caption "technical spec" look
  static const double letterSpacingWideXs = 0.6;  // 0.05em * 12px
  static const double letterSpacingWideSm = 0.7;  // 0.05em * 14px

  // --- Base Inter font helper ---
  // Wraps a TextStyle with Inter font family.
  static TextStyle _inter(TextStyle style) =>
      GoogleFonts.inter(textStyle: style);

  // --- Text Styles ---

  // Display — hero moments (3.5rem, tight tracking)
  static TextStyle display(Color color) => _inter(TextStyle(
        fontSize: fontSizeDisplay,
        fontWeight: weightBold,
        height: lineHeightTight,
        letterSpacing: -1.12, // -0.02em
        color: color,
      ));

  // Headings
  static TextStyle heading5xl(Color color) => _inter(TextStyle(
        fontSize: fontSize5xl,
        fontWeight: weightBold,
        height: lineHeightTight,
        letterSpacing: -0.96, // -0.02em * 48
        color: color,
      ));

  static TextStyle heading4xl(Color color) => _inter(TextStyle(
        fontSize: fontSize4xl,
        fontWeight: weightBold,
        height: lineHeightTight,
        letterSpacing: -0.72, // -0.02em * 36
        color: color,
      ));

  static TextStyle heading3xl(Color color) => _inter(TextStyle(
        fontSize: fontSize3xl,
        fontWeight: weightBold,
        height: lineHeightTight,
        color: color,
      ));

  // Headline — primary section header (1.75rem = 28px)
  static TextStyle headlineMd(Color color) => _inter(TextStyle(
        fontSize: fontSizeHeadline,
        fontWeight: weightBold,
        height: lineHeightTight,
        color: color,
      ));

  static TextStyle heading2xl(Color color) => _inter(TextStyle(
        fontSize: fontSize2xl,
        fontWeight: weightSemibold,
        height: lineHeightTight,
        color: color,
      ));

  static TextStyle headingXl(Color color) => _inter(TextStyle(
        fontSize: fontSizeXl,
        fontWeight: weightSemibold,
        height: lineHeightTight,
        color: color,
      ));

  static TextStyle headingLg(Color color) => _inter(TextStyle(
        fontSize: fontSizeLg,
        fontWeight: weightSemibold,
        height: lineHeightTight,
        color: color,
      ));

  // Body — workhorse: 14px / 1.6 line height for dark bg readability
  static TextStyle bodyLg(Color color) => _inter(TextStyle(
        fontSize: fontSizeLg,
        fontWeight: weightNormal,
        height: lineHeightRelaxed,
        color: color,
      ));

  static TextStyle bodyBase(Color color) => _inter(TextStyle(
        fontSize: fontSizeSm, // 14px — the workhorse
        fontWeight: weightNormal,
        height: lineHeightRelaxed,
        color: color,
      ));

  static TextStyle bodySm(Color color) => _inter(TextStyle(
        fontSize: fontSizeSm,
        fontWeight: weightNormal,
        height: lineHeightRelaxed,
        color: color,
      ));

  static TextStyle bodyXs(Color color) => _inter(TextStyle(
        fontSize: fontSizeXs,
        fontWeight: weightNormal,
        height: lineHeightNormal,
        color: color,
      ));

  // Body medium weight
  static TextStyle bodyLgMedium(Color color) => _inter(TextStyle(
        fontSize: fontSizeLg,
        fontWeight: weightMedium,
        height: lineHeightRelaxed,
        color: color,
      ));

  static TextStyle bodyBaseMedium(Color color) => _inter(TextStyle(
        fontSize: fontSizeSm,
        fontWeight: weightMedium,
        height: lineHeightRelaxed,
        color: color,
      ));

  static TextStyle bodySmMedium(Color color) => _inter(TextStyle(
        fontSize: fontSizeSm,
        fontWeight: weightMedium,
        height: lineHeightRelaxed,
        color: color,
      ));

  static TextStyle bodyXsMedium(Color color) => _inter(TextStyle(
        fontSize: fontSizeXs,
        fontWeight: weightMedium,
        height: lineHeightNormal,
        color: color,
      ));

  // Body semibold weight
  static TextStyle bodyBaseSemibold(Color color) => _inter(TextStyle(
        fontSize: fontSizeSm,
        fontWeight: weightSemibold,
        height: lineHeightRelaxed,
        color: color,
      ));

  static TextStyle bodySmSemibold(Color color) => _inter(TextStyle(
        fontSize: fontSizeSm,
        fontWeight: weightSemibold,
        height: lineHeightRelaxed,
        color: color,
      ));

  // Body bold weight
  static TextStyle bodyBaseBold(Color color) => _inter(TextStyle(
        fontSize: fontSizeSm,
        fontWeight: weightBold,
        height: lineHeightRelaxed,
        color: color,
      ));

  static TextStyle bodySmBold(Color color) => _inter(TextStyle(
        fontSize: fontSizeSm,
        fontWeight: weightBold,
        height: lineHeightRelaxed,
        color: color,
      ));

  // Labels — technical spec look (0.75rem, wide tracking)
  // Note: apply TextTransform via toUpperCase() on strings, Flutter has no CSS text-transform
  static TextStyle labelLg(Color color) => _inter(TextStyle(
        fontSize: fontSizeSm,
        fontWeight: weightSemibold,
        height: lineHeightTight,
        letterSpacing: letterSpacingWideSm, // 0.05em technical spec
        color: color,
      ));

  static TextStyle labelBase(Color color) => _inter(TextStyle(
        fontSize: fontSizeXs,
        fontWeight: weightSemibold,
        height: lineHeightTight,
        letterSpacing: letterSpacingWideXs,
        color: color,
      ));

  static TextStyle labelSm(Color color) => _inter(TextStyle(
        fontSize: 10.0,
        fontWeight: weightSemibold,
        height: lineHeightTight,
        letterSpacing: 0.5,
        color: color,
      ));

  // Navigation label — minimum 11px, w600 for WCAG AAA readability
  static const double fontSizeNavLabel = 11.0;

  static TextStyle navLabel(Color color, {bool active = false}) => _inter(
        TextStyle(
          fontSize: fontSizeNavLabel,
          fontWeight: weightSemibold,
          height: lineHeightTight,
          color: color,
          letterSpacing: 0.1,
        ),
      );

  // Caption — metadata (xs, wide tracking)
  static TextStyle caption(Color color) => _inter(TextStyle(
        fontSize: fontSizeXs,
        fontWeight: weightNormal,
        height: lineHeightRelaxed,
        letterSpacing: letterSpacingWideXs,
        color: color,
      ));

  // Title — always semibold to distinguish from body
  static TextStyle titleSm(Color color) => _inter(TextStyle(
        fontSize: fontSizeBase, // 1rem
        fontWeight: weightSemibold,
        height: lineHeightNormal,
        color: color,
      ));

  // Button
  static TextStyle buttonLg(Color color) => _inter(TextStyle(
        fontSize: fontSizeBase,
        fontWeight: weightSemibold,
        height: lineHeightTight,
        color: color,
      ));

  static TextStyle buttonBase(Color color) => _inter(TextStyle(
        fontSize: fontSizeSm,
        fontWeight: weightSemibold,
        height: lineHeightTight,
        color: color,
      ));

  static TextStyle buttonSm(Color color) => _inter(TextStyle(
        fontSize: fontSizeXs,
        fontWeight: weightSemibold,
        height: lineHeightTight,
        color: color,
      ));
}
