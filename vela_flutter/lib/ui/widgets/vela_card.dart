import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_shadows.dart';

enum VelaCardPadding { none, sm, md, lg, xl }
enum VelaCardShadow { none, xs, sm, md, lg }

/// Card component — The Luminous Archive
/// No borders by default — depth through tonal layering.
/// Use [border] = true only as ghost border fallback for accessibility.
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
    this.shadow = VelaCardShadow.none, // Default: no shadow (tonal layering is primary)
    this.border = false,               // Default: no border per no-line rule
    this.hoverable = false,
    this.interactive = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final shadows = isDark ? AppShadows.dark : AppShadows.light;

    final edgeInsets = switch (padding) {
      VelaCardPadding.none => EdgeInsets.zero,
      VelaCardPadding.sm   => const EdgeInsets.all(8),
      VelaCardPadding.md   => const EdgeInsets.all(16),
      VelaCardPadding.lg   => const EdgeInsets.all(24),
      VelaCardPadding.xl   => const EdgeInsets.all(32),
    };

    // Ambient glow shadows — large blur, negative spread
    List<BoxShadow> boxShadow = switch (shadow) {
      VelaCardShadow.none => <BoxShadow>[],
      VelaCardShadow.xs   => shadows.xs,
      VelaCardShadow.sm   => shadows.sm,
      VelaCardShadow.md   => shadows.md,
      VelaCardShadow.lg   => shadows.lg,
    };

    // In light mode, always add a soft elevation shadow so white cards
    // float on the warm stone background — even when shadow == none.
    if (!isDark && shadow == VelaCardShadow.none) {
      boxShadow = const [
        BoxShadow(
          color: Color(0x14000000), // rgba(0,0,0,0.08)
          blurRadius: 8,
          offset: Offset(0, 2),
        ),
        BoxShadow(
          color: Color(0x0A000000), // rgba(0,0,0,0.04)
          blurRadius: 2,
          offset: Offset(0, 1),
        ),
      ];
    }

    Widget card = Container(
      padding: edgeInsets,
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(8),
        // Ghost border in light mode for extra definition
        border: (!isDark || border) ? Border.all(color: colors.ghostBorder) : null,
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
          splashColor: colors.interactiveActive,
          highlightColor: colors.interactiveHover,
          child: Container(
            padding: edgeInsets,
            decoration: BoxDecoration(
              color: colors.surfaceContainerLow,
              borderRadius: BorderRadius.circular(8),
              border: border ? Border.all(color: colors.ghostBorder) : null,
              boxShadow: boxShadow,
            ),
            child: child,
          ),
        ),
      );
    }

    return card;
  }
}
