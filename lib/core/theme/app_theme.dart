import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_typography.dart';
import 'app_borders.dart';

class AppTheme {
  AppTheme._();

  static ThemeData light() {
    const c = AppColors.light;
    return _buildTheme(c, Brightness.light);
  }

  static ThemeData dark() {
    const c = AppColors.dark;
    return _buildTheme(c, Brightness.dark);
  }

  static ThemeData _buildTheme(VelaColorScheme c, Brightness brightness) {
    final bool isDark = brightness == Brightness.dark;

    final colorScheme = ColorScheme(
      brightness: brightness,
      primary: c.brandAccent,
      onPrimary: isDark ? c.textInverse : c.textInverse,
      secondary: c.brandSecondary,
      onSecondary: c.textInverse,
      error: c.stateError,
      onError: c.textInverse,
      surface: c.surfaceDefault,
      onSurface: c.textPrimary,
      surfaceContainerHighest: c.surfaceElevated,
      outline: c.surfaceBorder,
      outlineVariant: c.surfaceBorderDark,
    );

    final textTheme = TextTheme(
      displayLarge: AppTypography.heading5xl(c.textPrimary),
      displayMedium: AppTypography.heading4xl(c.textPrimary),
      displaySmall: AppTypography.heading3xl(c.textPrimary),
      headlineLarge: AppTypography.heading2xl(c.textPrimary),
      headlineMedium: AppTypography.headingXl(c.textPrimary),
      headlineSmall: AppTypography.headingLg(c.textPrimary),
      titleLarge: AppTypography.headingLg(c.textPrimary),
      titleMedium: AppTypography.bodyBaseMedium(c.textPrimary),
      titleSmall: AppTypography.bodySmMedium(c.textPrimary),
      bodyLarge: AppTypography.bodyLg(c.textPrimary),
      bodyMedium: AppTypography.bodyBase(c.textPrimary),
      bodySmall: AppTypography.bodySm(c.textSecondary),
      labelLarge: AppTypography.labelLg(c.textPrimary),
      labelMedium: AppTypography.labelBase(c.textSecondary),
      labelSmall: AppTypography.labelSm(c.textTertiary),
    );

    return ThemeData(
      brightness: brightness,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: c.bgPrimary,
      textTheme: textTheme,

      // AppBar
      appBarTheme: AppBarTheme(
        backgroundColor: c.bgSecondary,
        foregroundColor: c.textPrimary,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: AppTypography.headingLg(c.textPrimary),
        iconTheme: IconThemeData(color: c.textPrimary),
      ),

      // Card
      cardTheme: CardThemeData(
        color: c.surfaceCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: AppBorders.lg,
          side: BorderSide(color: c.surfaceBorder, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),

      // Input Decoration
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surfaceDefault,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: AppBorders.md,
          borderSide: BorderSide(color: c.surfaceBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppBorders.md,
          borderSide: BorderSide(color: c.surfaceBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppBorders.md,
          borderSide: BorderSide(color: c.interactiveFocus, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: AppBorders.md,
          borderSide: BorderSide(color: c.stateError),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: AppBorders.md,
          borderSide: BorderSide(color: c.stateError, width: 2),
        ),
        hintStyle: AppTypography.bodyBase(c.textTertiary),
        labelStyle: AppTypography.bodySm(c.textSecondary),
        errorStyle: AppTypography.bodyXs(c.stateError),
      ),

      // Elevated Button
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: c.brandPrimary,
          foregroundColor: c.textInverse,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: AppBorders.md,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          textStyle: AppTypography.buttonBase(c.textInverse),
        ),
      ),

      // Text Button
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: c.brandAccent,
          shape: RoundedRectangleBorder(
            borderRadius: AppBorders.md,
          ),
          textStyle: AppTypography.buttonBase(c.brandAccent),
        ),
      ),

      // Outlined Button
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: c.textPrimary,
          side: BorderSide(color: c.surfaceBorder),
          shape: RoundedRectangleBorder(
            borderRadius: AppBorders.md,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          textStyle: AppTypography.buttonBase(c.textPrimary),
        ),
      ),

      // Divider
      dividerTheme: DividerThemeData(
        color: c.surfaceBorder,
        thickness: 1,
        space: 0,
      ),

      // Bottom Navigation Bar
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: c.bgSecondary,
        selectedItemColor: c.brandAccent,
        unselectedItemColor: c.textTertiary,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: AppTypography.labelBase(c.brandAccent),
        unselectedLabelStyle: AppTypography.labelBase(c.textTertiary),
      ),

      // Dialog
      dialogTheme: DialogThemeData(
        backgroundColor: c.surfaceElevated,
        shape: RoundedRectangleBorder(
          borderRadius: AppBorders.xl,
        ),
        titleTextStyle: AppTypography.headingLg(c.textPrimary),
        contentTextStyle: AppTypography.bodyBase(c.textSecondary),
      ),

      // Tooltip
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: c.surfaceOverlay,
          borderRadius: AppBorders.md,
        ),
        textStyle: AppTypography.bodySm(c.textPrimary),
      ),

      // Snackbar
      snackBarTheme: SnackBarThemeData(
        backgroundColor: c.surfaceElevated,
        contentTextStyle: AppTypography.bodySm(c.textPrimary),
        shape: RoundedRectangleBorder(
          borderRadius: AppBorders.md,
        ),
        behavior: SnackBarBehavior.floating,
      ),

      // Chip
      chipTheme: ChipThemeData(
        backgroundColor: c.surfaceCard,
        selectedColor: c.interactiveSelected,
        labelStyle: AppTypography.bodySm(c.textPrimary),
        side: BorderSide(color: c.surfaceBorder),
        shape: RoundedRectangleBorder(
          borderRadius: AppBorders.md,
        ),
      ),

      // Switch
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return c.brandAccent;
          return c.textDisabled;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return c.interactiveSelected;
          }
          return c.surfaceBorderDark;
        }),
      ),

      // Popup Menu
      popupMenuTheme: PopupMenuThemeData(
        color: c.surfaceElevated,
        shape: RoundedRectangleBorder(
          borderRadius: AppBorders.lg,
          side: BorderSide(color: c.surfaceBorder),
        ),
        textStyle: AppTypography.bodySm(c.textPrimary),
      ),

      // Bottom Sheet
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: c.surfaceElevated,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
        ),
      ),

      // ListTile
      listTileTheme: ListTileThemeData(
        tileColor: Colors.transparent,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16),
        titleTextStyle: AppTypography.bodyBase(c.textPrimary),
        subtitleTextStyle: AppTypography.bodySm(c.textSecondary),
        iconColor: c.textSecondary,
      ),
    );
  }
}
