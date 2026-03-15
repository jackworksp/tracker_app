import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class VelaTooltip extends StatelessWidget {
  final Widget child;
  final String message;
  final bool preferBelow;
  final double maxWidth;

  const VelaTooltip({
    super.key,
    required this.child,
    required this.message,
    this.preferBelow = true,
    this.maxWidth = 240,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return Tooltip(
      message: message,
      preferBelow: preferBelow,
      waitDuration: const Duration(milliseconds: 500),
      decoration: BoxDecoration(
        color: colors.surfaceElevated,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: colors.surfaceBorder),
        boxShadow: [
          BoxShadow(
            offset: const Offset(0, 3),
            blurRadius: 6,
            color: Colors.black.withOpacity(0.15),
          ),
        ],
      ),
      textStyle: TextStyle(
        color: colors.textPrimary,
        fontSize: 12,
      ),
      child: child,
    );
  }
}
