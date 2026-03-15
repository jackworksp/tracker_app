import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class VelaDivider extends StatelessWidget {
  final bool vertical;
  final double spacing;
  final String? label;
  final double thickness;

  const VelaDivider({
    super.key,
    this.vertical = false,
    this.spacing = 16,
    this.label,
    this.thickness = 1,
  });

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;

    if (vertical) {
      return Container(
        width: thickness,
        margin: EdgeInsets.symmetric(horizontal: spacing),
        color: colors.surfaceBorder,
      );
    }

    if (label != null) {
      return Padding(
        padding: EdgeInsets.symmetric(vertical: spacing),
        child: Row(
          children: [
            Expanded(child: Container(height: thickness, color: colors.surfaceBorder)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(label!, style: TextStyle(color: colors.textTertiary, fontSize: 12)),
            ),
            Expanded(child: Container(height: thickness, color: colors.surfaceBorder)),
          ],
        ),
      );
    }

    return Padding(
      padding: EdgeInsets.symmetric(vertical: spacing),
      child: Container(height: thickness, color: colors.surfaceBorder),
    );
  }
}
