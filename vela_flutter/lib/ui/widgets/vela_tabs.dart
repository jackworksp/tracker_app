import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class VelaTabItem {
  final String key;
  final String label;

  const VelaTabItem({required this.key, required this.label});
}

class VelaTabs extends StatelessWidget {
  final String activeKey;
  final ValueChanged<String> onChanged;
  final List<VelaTabItem> items;
  final bool large;

  const VelaTabs({
    super.key,
    required this.activeKey,
    required this.onChanged,
    required this.items,
    this.large = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final fontSize = large ? 16.0 : 14.0;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: items.map((item) {
          final isActive = item.key == activeKey;
          return GestureDetector(
            onTap: () => onChanged(item.key),
            child: Container(
              padding: EdgeInsets.symmetric(
                horizontal: large ? 16 : 12,
                vertical: large ? 12 : 8,
              ),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: isActive ? colors.brandAccent : Colors.transparent,
                    width: 2,
                  ),
                ),
              ),
              child: Text(
                item.label,
                style: TextStyle(
                  color: isActive ? colors.textPrimary : colors.textSecondary,
                  fontSize: fontSize,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
