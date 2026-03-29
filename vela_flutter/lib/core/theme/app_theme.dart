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
    final colorScheme = ColorScheme(
      brightness: brightness,
      primary: c.brandAccent, // Amber
      onPrimary: c.brandOnPrimary, // #472A00 dark brown — readable on amber
      secondary: c.brandSecondary,
      onSecondary: c.textInverse,
      error: c.stateError,
      onError: c.textInverse,
      surface: c.surfaceDefault,
      onSurface: c.textPrimary,
      // Level 3 surface for Material components (dialogs, sheets)
      surfaceContainerHighest: c.surfaceContainerHighest,
      outline: c.ghostBorder,
      outlineVariant: c.surfaceBorderDark,
    );

    final textTheme = TextTheme(
      displayLarge: AppTypography.display(c.textPrimary),
      displayMedium: AppTypography.heading5xl(c.textPrimary),
      displaySmall: AppTypography.heading4xl(c.textPrimary),
      headlineLarge: AppTypography.headlineMd(c.textPrimary),
      headlineMedium: AppTypography.heading2xl(c.textPrimary),
      headlineSmall: AppTypography.headingLg(c.textPrimary),
      titleLarge: AppTypography.headingLg(c.textPrimary),
      titleMedium: AppTypography.titleSm(c.textPrimary),
      titleSmall: AppTypography.bodyBaseMedium(c.textPrimary),
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
      scaffoldBackgroundColor: c.bgPrimary, // Pure #0F0F0F
      textTheme: textTheme,

      // AppBar — no elevation, matches surface level
      appBarTheme: AppBarTheme(
        backgroundColor: c.bgSecondary,
        foregroundColor: c.textPrimary,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: AppTypography.headingLg(c.textPrimary),
        iconTheme: IconThemeData(color: c.textPrimary),
      ),

      // Card — no border, tonal layering only
      cardTheme: CardThemeData(
        color: c.surfaceContainerLow,
        elevation: 0,
        // No BorderSide — depth via background color shift
        shape: RoundedRectangleBorder(
          borderRadius: AppBorders.lg,
        ),
        margin: EdgeInsets.zero,
      ),

      // Input Decoration — ghost border, amber focus
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surfaceContainerLow,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: AppBorders.md,
          borderSide: BorderSide(color: c.ghostBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppBorders.md,
          borderSide: BorderSide(color: c.ghostBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppBorders.md,
          borderSide: BorderSide(color: c.brandAccent, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: AppBorders.md,
          borderSide: BorderSide(color: c.stateError),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: AppBorders.md,
          borderSide: BorderSide(color: c.stateError, width: 1.5),
        ),
        hintStyle: AppTypography.bodyBase(c.textTertiary),
        labelStyle: AppTypography.bodySm(c.textSecondary),
        errorStyle: AppTypography.bodyXs(c.stateError),
      ),

      // Elevated Button — amber bg with dark brown text
      // Note: gradient must be applied via VelaButton widget (DecoratedBox);
      // Material ElevatedButton doesn't support gradient natively.
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: c.brandAccent,
          foregroundColor: c.brandOnPrimary,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: AppBorders.md,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          textStyle: AppTypography.buttonBase(c.brandOnPrimary),
        ),
      ),

      // Text Button — amber text
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: c.brandAccent,
          shape: RoundedRectangleBorder(
            borderRadius: AppBorders.md,
          ),
          textStyle: AppTypography.buttonBase(c.brandAccent),
        ),
      ),

      // Outlined Button — ghost border
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: c.textPrimary,
          side: BorderSide(color: c.ghostBorder),
          shape: RoundedRectangleBorder(
            borderRadius: AppBorders.md,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          textStyle: AppTypography.buttonBase(c.textPrimary),
        ),
      ),

      // Divider — ghost border, use sparingly
      dividerTheme: DividerThemeData(
        color: c.ghostBorder,
        thickness: 1,
        space: 0,
      ),

      // Bottom Navigation Bar — transparent (glassmorphism applied in app_shell.dart)
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: Colors.transparent,
        selectedItemColor: c.brandAccent,
        unselectedItemColor: c.textTertiary,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: AppTypography.labelBase(c.brandAccent),
        unselectedLabelStyle: AppTypography.labelBase(c.textTertiary),
      ),

      // Dialog — Level 3 surface
      dialogTheme: DialogThemeData(
        backgroundColor: c.surfaceContainerHighest,
        shape: RoundedRectangleBorder(
          borderRadius: AppBorders.xl,
        ),
        titleTextStyle: AppTypography.headingLg(c.textPrimary),
        contentTextStyle: AppTypography.bodyBase(c.textSecondary),
      ),

      // Tooltip
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: c.surfaceContainerHighest,
          borderRadius: AppBorders.md,
        ),
        textStyle: AppTypography.bodySm(c.textPrimary),
      ),

      // Snackbar
      snackBarTheme: SnackBarThemeData(
        backgroundColor: c.surfaceContainerHighest,
        contentTextStyle: AppTypography.bodySm(c.textPrimary),
        shape: RoundedRectangleBorder(
          borderRadius: AppBorders.md,
        ),
        behavior: SnackBarBehavior.floating,
      ),

      // Chip — ghost border
      chipTheme: ChipThemeData(
        backgroundColor: c.surfaceContainerLow,
        selectedColor: c.interactiveSelected,
        labelStyle: AppTypography.bodySm(c.textPrimary),
        side: BorderSide(color: c.ghostBorder),
        shape: RoundedRectangleBorder(
          borderRadius: AppBorders.md,
        ),
      ),

      // Switch — amber thumb
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return c.brandAccent;
          return c.textDisabled;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return c.interactiveSelected;
          }
          return c.ghostBorder;
        }),
      ),

      // Popup Menu — Level 3 surface
      popupMenuTheme: PopupMenuThemeData(
        color: c.surfaceContainerHighest,
        shape: RoundedRectangleBorder(
          borderRadius: AppBorders.lg,
        ),
        textStyle: AppTypography.bodySm(c.textPrimary),
      ),

      // Bottom Sheet — Level 2 surface
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: c.surfaceContainerHigh,
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
