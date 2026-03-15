import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

enum VelaCardPadding { none, sm, md, lg, xl }
enum VelaCardShadow { none, xs, sm, md, lg }

class VelaCard extends StatelessWidget {
  final Widget child;
  final VelaCardPadding padding;
  final VelaCardShadow shadow;
  final bool border;
  final bool hoverable;
  final bool interactive;
  final VoidCallback? onTap;

  const VelaCard({
    super.key,
    required this.child,
    this.padding = VelaCardPadding.md,
    this.shadow = VelaCardShadow.sm,
    this.border = true,
    this.hoverable = false,
    this.interactive = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    final edgeInsets = switch (padding) {
      VelaCardPadding.none => EdgeInsets.zero,
      VelaCardPadding.sm => const EdgeInsets.all(8),
      VelaCardPadding.md => const EdgeInsets.all(16),
      VelaCardPadding.lg => const EdgeInsets.all(24),
      VelaCardPadding.xl => const EdgeInsets.all(32),
    };

    final boxShadow = switch (shadow) {
      VelaCardShadow.none => <BoxShadow>[],
      VelaCardShadow.xs => [BoxShadow(offset: const Offset(0, 1), blurRadius: 2, color: Colors.black.withOpacity(0.05))],
      VelaCardShadow.sm => [BoxShadow(offset: const Offset(0, 3), blurRadius: 6, color: Colors.black.withOpacity(0.1))],
      VelaCardShadow.md => [BoxShadow(offset: const Offset(0, 5), blurRadius: 10, color: Colors.black.withOpacity(0.1))],
      VelaCardShadow.lg => [BoxShadow(offset: const Offset(0, 10), blurRadius: 20, color: Colors.black.withOpacity(0.1))],
    };

    Widget card = Container(
      padding: edgeInsets,
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(8),
        border: border ? Border.all(color: colors.surfaceBorder) : null,
        boxShadow: boxShadow,
      ),
      child: child,
    );

    if (interactive || onTap != null) {
      card = Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: card,
        ),
      );
    }

    return card;
  }
}
