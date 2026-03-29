import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

enum VelaBadgeVariant {
  defaultVariant,
  info,
  success,
  warning,
  error,
  brand,
  purple
}

enum VelaBadgeSize { sm, md, lg }

class VelaBadge extends StatelessWidget {
  final Widget child;
  final VelaBadgeVariant variant;
  final VelaBadgeSize size;
  final bool removable;
  final VoidCallback? onRemove;
  final VoidCallback? onTap;
  final bool active;

  const VelaBadge({
    super.key,
    required this.child,
    this.variant = VelaBadgeVariant.defaultVariant,
    this.size = VelaBadgeSize.sm,
    this.removable = false,
    this.onRemove,
    this.onTap,
    this.active = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    final (Color bg, Color text) = switch (variant) {
      VelaBadgeVariant.defaultVariant => (
          colors.interactiveHover,
          colors.textSecondary
        ),
      VelaBadgeVariant.info => (colors.stateInfoBg, colors.stateInfo),
      VelaBadgeVariant.success => (
          const Color(0xFFd1f4dd),
          colors.stateSuccess
        ),
      VelaBadgeVariant.warning => (colors.stateWarningBg, colors.stateWarning),
      VelaBadgeVariant.error => (const Color(0xFFfde8e8), colors.stateError),
      VelaBadgeVariant.brand => (
          colors.interactiveSelected,
          colors.brandAccent
        ),
      VelaBadgeVariant.purple => (
          const Color(0x26A855F7),
          const Color(0xFFA855F7)
        ),
    };

    final (double height, double fontSize, EdgeInsets padding) = switch (size) {
      VelaBadgeSize.sm => (
          20.0,
          11.0,
          const EdgeInsets.symmetric(horizontal: 6, vertical: 2)
        ),
      VelaBadgeSize.md => (
          24.0,
          12.0,
          const EdgeInsets.symmetric(horizontal: 8, vertical: 4)
        ),
      VelaBadgeSize.lg => (
          28.0,
          13.0,
          const EdgeInsets.symmetric(horizontal: 10, vertical: 5)
        ),
    };

    Widget badge = Container(
      constraints: BoxConstraints(minHeight: height),
      padding: padding,
      decoration: BoxDecoration(
        color: active ? bg.withOpacity(0.3) : bg,
        borderRadius: BorderRadius.circular(9999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          DefaultTextStyle(
            style: TextStyle(
                color: text, fontSize: fontSize, fontWeight: FontWeight.w500),
            child: child,
          ),
          if (removable) ...[
            const SizedBox(width: 4),
            GestureDetector(
              onTap: onRemove,
              child: Icon(Icons.close, size: fontSize, color: text),
            ),
          ],
        ],
      ),
    );

    if (onTap != null) {
      badge = GestureDetector(onTap: onTap, child: badge);
    }

    return badge;
  }
}
