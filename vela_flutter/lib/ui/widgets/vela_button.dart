import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_animations.dart';
// Issue 08: haptic feedback on button press
import '../../core/utils/haptics.dart';

enum VelaButtonVariant { defaultVariant, primary, outline, subtle, danger }

enum VelaButtonSize { sm, md, lg }

class VelaButton extends StatelessWidget {
  final Widget child;
  final VelaButtonVariant variant;
  final VelaButtonSize size;
  final bool fullWidth;
  final bool disabled;
  final bool loading;
  final Widget? leftIcon;
  final Widget? rightIcon;
  final VoidCallback? onPressed;

  const VelaButton({
    super.key,
    required this.child,
    this.variant = VelaButtonVariant.defaultVariant,
    this.size = VelaButtonSize.md,
    this.fullWidth = false,
    this.disabled = false,
    this.loading = false,
    this.leftIcon,
    this.rightIcon,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    final isDisabled = disabled || loading;

    // Issue 01: all interactive elements must be ≥ 44×44px (WCAG 2.5.5).
    final (double minHeight, EdgeInsets padding, double fontSize) =
        switch (size) {
      VelaButtonSize.sm => (
          44.0,
          const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          14.0
        ),
      VelaButtonSize.md => (
          44.0,
          const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          14.0
        ),
      VelaButtonSize.lg => (
          48.0,
          const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          16.0
        ),
    };

    // Primary uses gradient — set base Material to transparent
    final bool isPrimary = variant == VelaButtonVariant.primary;

    final Color bgColor = switch (variant) {
      VelaButtonVariant.defaultVariant => colors.surfaceContainerHigh,
      VelaButtonVariant.primary =>
        Colors.transparent, // gradient applied in decoration
      VelaButtonVariant.outline => Colors.transparent,
      VelaButtonVariant.subtle => Colors.transparent,
      VelaButtonVariant.danger => colors.stateError,
    };

    final Color textColor = switch (variant) {
      VelaButtonVariant.defaultVariant => colors.textPrimary,
      VelaButtonVariant.primary => colors.brandOnPrimary, // #472A00
      VelaButtonVariant.outline => colors.textPrimary,
      VelaButtonVariant.subtle => colors.textSecondary,
      VelaButtonVariant.danger => const Color(0xFFFFFFFF),
    };

    // Ghost border — for default/outline. Primary and danger have no border.
    final Border? border = switch (variant) {
      VelaButtonVariant.defaultVariant => Border.all(color: colors.ghostBorder),
      VelaButtonVariant.primary => null,
      VelaButtonVariant.outline => Border.all(color: colors.ghostBorder),
      VelaButtonVariant.subtle => null,
      VelaButtonVariant.danger => null,
    };

    return AnimatedOpacity(
      duration: AppAnimations.fast,
      opacity: isDisabled ? 0.4 : 1.0,
      child: SizedBox(
        width: fullWidth ? double.infinity : null,
        child: Material(
          color: bgColor,
          borderRadius: BorderRadius.circular(6),
          child: InkWell(
            // Issue 08: light haptic on every button press
            onTap: isDisabled
                ? null
                : () async {
                    await VelaHaptics.light();
                    onPressed?.call();
                  },
            borderRadius: BorderRadius.circular(6),
            splashColor: isPrimary
                ? Colors.white.withOpacity(0.15)
                : colors.interactiveActive,
            highlightColor: isPrimary
                ? Colors.white.withOpacity(0.08)
                : colors.interactiveHover,
            child: Ink(
              decoration: BoxDecoration(
                // Primary: signature gradient "lit from within"
                gradient: isPrimary ? AppColors.primaryGradient : null,
                border: border,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Container(
                constraints: BoxConstraints(minHeight: minHeight),
                padding: padding,
                child: Row(
                  mainAxisSize: fullWidth ? MainAxisSize.max : MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (loading) ...[
                      SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: textColor,
                        ),
                      ),
                      const SizedBox(width: 8),
                    ] else if (leftIcon != null) ...[
                      IconTheme(
                        data: IconThemeData(color: textColor, size: fontSize),
                        child: leftIcon!,
                      ),
                      const SizedBox(width: 8),
                    ],
                    DefaultTextStyle(
                      style: TextStyle(
                        color: textColor,
                        fontSize: fontSize,
                        fontWeight: FontWeight.w600,
                        height: 1.5,
                      ),
                      child: Opacity(
                        opacity: loading ? 0.6 : 1.0,
                        child: child,
                      ),
                    ),
                    if (!loading && rightIcon != null) ...[
                      const SizedBox(width: 8),
                      IconTheme(
                        data: IconThemeData(color: textColor, size: fontSize),
                        child: rightIcon!,
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
