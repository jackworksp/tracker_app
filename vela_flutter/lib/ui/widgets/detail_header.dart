import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';

// ---------------------------------------------------------------------------
// Issue 04 — DetailHeader
// Provides a back button (≥ 44×44px) and optional title for any deep view.
// The back button calls Navigator.pop() if canPop, otherwise does nothing,
// which also handles Android hardware back gracefully when nested in a modal.
// ---------------------------------------------------------------------------

class DetailHeader extends StatelessWidget {
  final String? title;
  final List<Widget>? actions;

  const DetailHeader({super.key, this.title, this.actions});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s2,
        vertical: AppSpacing.s1,
      ),
      decoration: BoxDecoration(
        color: colors.surfaceDefault,
        border: Border(bottom: BorderSide(color: colors.surfaceBorder)),
      ),
      child: Row(
        children: [
          // Back button — ≥ 44×44px tap target (Issue 01 + Issue 04)
          Semantics(
            label: 'Go back',
            button: true,
            child: InkWell(
              borderRadius: BorderRadius.circular(8),
              onTap: () {
                if (Navigator.of(context).canPop()) {
                  Navigator.of(context).pop();
                }
              },
              child: ConstrainedBox(
                constraints: const BoxConstraints(
                  minWidth: 44,
                  minHeight: 44,
                ),
                child: Icon(
                  Icons.chevron_left,
                  size: 28,
                  color: colors.textPrimary,
                ),
              ),
            ),
          ),
          if (title != null) ...[
            const SizedBox(width: AppSpacing.s2),
            Expanded(
              child: Text(
                title!,
                style: AppTypography.headingLg(colors.textPrimary),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ] else
            const Spacer(),
          if (actions != null) ...actions!,
        ],
      ),
    );
  }
}
