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
    // sm and md are raised to 44px minHeight; visual padding adjusted accordingly.
    final (double minHeight, EdgeInsets padding, double fontSize) = switch (size) {
      VelaButtonSize.sm => (44.0, const EdgeInsets.symmetric(horizontal: 12, vertical: 6), 14.0),
      VelaButtonSize.md => (44.0, const EdgeInsets.symmetric(horizontal: 16, vertical: 10), 16.0),
      VelaButtonSize.lg => (48.0, const EdgeInsets.symmetric(horizontal: 24, vertical: 12), 18.0),
    };

    // Variant colors
    final (Color bgColor, Color textColor, Color borderColor) = switch (variant) {
      VelaButtonVariant.defaultVariant => (Colors.transparent, colors.textPrimary, colors.surfaceBorder),
      VelaButtonVariant.primary => (colors.brandPrimary, colors.textInverse, colors.brandPrimary),
      VelaButtonVariant.outline => (Colors.transparent, colors.textPrimary, colors.surfaceBorder),
      VelaButtonVariant.subtle => (Colors.transparent, colors.textSecondary, Colors.transparent),
      VelaButtonVariant.danger => (colors.stateError, colors.textInverse, colors.stateError),
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
            child: Container(
              constraints: BoxConstraints(minHeight: minHeight),
              padding: padding,
              decoration: BoxDecoration(
                border: Border.all(color: borderColor),
                borderRadius: BorderRadius.circular(6),
              ),
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
                      fontWeight: FontWeight.w500,
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
    );
  }
}
