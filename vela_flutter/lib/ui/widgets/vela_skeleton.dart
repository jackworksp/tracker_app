import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';

// ---------------------------------------------------------------------------
// Issue 07 — VelaSkeleton
// Shimmer skeleton components matching the shape of real content cards.
// When the OS prefers reduced motion (Issue 09), the shimmer animation is
// replaced with a flat static placeholder colour.
// ---------------------------------------------------------------------------

/// Single shimmer rectangle — the building block for all skeletons.
class VelaSkeletonBox extends StatefulWidget {
  final double? width;
  final double height;
  final BorderRadius borderRadius;

  const VelaSkeletonBox({
    super.key,
    this.width,
    this.height = 16,
    this.borderRadius = const BorderRadius.all(Radius.circular(4)),
  });

  @override
  State<VelaSkeletonBox> createState() => _VelaSkeletonBoxState();
}

class _VelaSkeletonBoxState extends State<VelaSkeletonBox>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: false);
    _anim = _ctrl;
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Issue 09: respect OS reduced-motion preference
    final reduceMotion = MediaQuery.of(context).disableAnimations;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    if (reduceMotion) {
      // Static placeholder — no animation
      return Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          color: colors.bgTertiary,
          borderRadius: widget.borderRadius,
        ),
      );
    }

    return AnimatedBuilder(
      animation: _anim,
      builder: (context, _) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: widget.borderRadius,
            gradient: LinearGradient(
              begin: Alignment(-1.0 + _anim.value * 3, 0),
              end: Alignment(1.0 + _anim.value * 3, 0),
              colors: [
                colors.bgTertiary,
                colors.bgSecondary,
                colors.bgTertiary,
              ],
              stops: const [0.0, 0.5, 1.0],
            ),
          ),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Task skeleton card — matches _buildTaskCard shape
// ---------------------------------------------------------------------------

class VelaSkeletonTaskCard extends StatelessWidget {
  const VelaSkeletonTaskCard({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return Semantics(
      label: 'Loading task...',
      child: Container(
        margin: const EdgeInsets.symmetric(
          horizontal: AppSpacing.s4,
          vertical: AppSpacing.s1,
        ),
        padding: const EdgeInsets.all(AppSpacing.s4),
        decoration: BoxDecoration(
          color: colors.surfaceCard,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: colors.surfaceBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Type badge placeholder
                VelaSkeletonBox(
                  width: 56,
                  height: 20,
                  borderRadius: BorderRadius.circular(4),
                ),
                const SizedBox(width: AppSpacing.s2),
                VelaSkeletonBox(
                  width: 48,
                  height: 20,
                  borderRadius: BorderRadius.circular(4),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.s2),
            // Title placeholder
            const VelaSkeletonBox(height: 18),
            const SizedBox(height: AppSpacing.s1),
            // Content line 1
            const VelaSkeletonBox(height: 13),
            const SizedBox(height: AppSpacing.s1),
            // Content line 2 — shorter
            const VelaSkeletonBox(width: 200, height: 13),
            const SizedBox(height: AppSpacing.s2),
            // Date placeholder
            const VelaSkeletonBox(width: 80, height: 12),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Session skeleton card — matches _SessionCard shape
// ---------------------------------------------------------------------------

class VelaSkeletonSessionCard extends StatelessWidget {
  const VelaSkeletonSessionCard({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return Semantics(
      label: 'Loading session...',
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(AppSpacing.s4),
        decoration: BoxDecoration(
          color: colors.surfaceCard,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: colors.surfaceBorder),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date box placeholder
            VelaSkeletonBox(
              width: 52,
              height: 56,
              borderRadius: BorderRadius.circular(8),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title + badge row
                  Row(
                    children: const [
                      Expanded(child: VelaSkeletonBox(height: 16)),
                      SizedBox(width: 8),
                      VelaSkeletonBox(width: 48, height: 20),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const VelaSkeletonBox(width: 120, height: 12),
                  const SizedBox(height: 8),
                  const VelaSkeletonBox(height: 13),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class VelaSkeletonRoutineCard extends StatelessWidget {
  const VelaSkeletonRoutineCard({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return Semantics(
      label: 'Loading routine...',
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.s3),
        decoration: BoxDecoration(
          color: colors.surfaceCard,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: colors.surfaceBorder),
        ),
        child: Row(
          children: [
            Container(
              width: 6,
              height: 108,
              decoration: BoxDecoration(
                color: colors.bgTertiary,
                borderRadius:
                    const BorderRadius.horizontal(left: Radius.circular(8)),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.s4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    VelaSkeletonBox(height: 18),
                    SizedBox(height: AppSpacing.s2),
                    VelaSkeletonBox(width: 180, height: 13),
                    SizedBox(height: AppSpacing.s3),
                    Row(
                      children: [
                        VelaSkeletonBox(width: 72, height: 24),
                        SizedBox(width: AppSpacing.s2),
                        VelaSkeletonBox(width: 56, height: 24),
                        SizedBox(width: AppSpacing.s2),
                        VelaSkeletonBox(width: 52, height: 24),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(right: AppSpacing.s4),
              child: VelaSkeletonBox(
                width: 44,
                height: 44,
                borderRadius: BorderRadius.all(Radius.circular(22)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Attachment skeleton card — matches _AttachmentCard shape
// ---------------------------------------------------------------------------

class VelaSkeletonAttachmentCard extends StatelessWidget {
  const VelaSkeletonAttachmentCard({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return Semantics(
      label: 'Loading attachment...',
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: colors.surfaceCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: colors.surfaceBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail placeholder
            VelaSkeletonBox(
              height: 120,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(12),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.s4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      VelaSkeletonBox(width: 64, height: 20),
                      SizedBox(width: 8),
                      VelaSkeletonBox(width: 48, height: 20),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const VelaSkeletonBox(height: 18),
                  const SizedBox(height: 6),
                  const VelaSkeletonBox(width: 160, height: 13),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Note skeleton card — matches _NoteCard shape
// ---------------------------------------------------------------------------

class VelaSkeletonNoteCard extends StatelessWidget {
  const VelaSkeletonNoteCard({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return Semantics(
      label: 'Loading note...',
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(AppSpacing.s4),
        decoration: BoxDecoration(
          color: colors.surfaceCard,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: colors.surfaceBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title
            const VelaSkeletonBox(height: 18),
            const SizedBox(height: 8),
            // Content lines
            const VelaSkeletonBox(height: 13),
            const SizedBox(height: 4),
            const VelaSkeletonBox(height: 13),
            const SizedBox(height: 4),
            const VelaSkeletonBox(width: 180, height: 13),
            const SizedBox(height: 10),
            // Tag row
            Row(
              children: const [
                VelaSkeletonBox(width: 52, height: 20),
                SizedBox(width: 6),
                VelaSkeletonBox(width: 64, height: 20),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Goal skeleton card — matches _GoalCard shape
// ---------------------------------------------------------------------------

class VelaSkeletonGoalCard extends StatelessWidget {
  const VelaSkeletonGoalCard({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return Semantics(
      label: 'Loading goal...',
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(AppSpacing.s4),
        decoration: BoxDecoration(
          color: colors.surfaceCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: colors.surfaceBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title
            const VelaSkeletonBox(height: 20),
            const SizedBox(height: 8),
            // Description lines
            const VelaSkeletonBox(height: 13),
            const SizedBox(height: 4),
            const VelaSkeletonBox(width: 200, height: 13),
            const SizedBox(height: 14),
            // Badge row
            Row(
              children: const [
                VelaSkeletonBox(width: 72, height: 22),
                SizedBox(width: 8),
                VelaSkeletonBox(width: 80, height: 22),
              ],
            ),
            const SizedBox(height: 12),
            // Date + hours row
            Row(
              children: const [
                VelaSkeletonBox(width: 90, height: 12),
                SizedBox(width: 16),
                VelaSkeletonBox(width: 70, height: 12),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// VelaSkeleton — factory helpers for common skeleton shapes
// ---------------------------------------------------------------------------

/// Convenience factory that surfaces the most common skeleton shapes
/// without requiring callers to import the individual card classes.
class VelaSkeleton extends StatelessWidget {
  final Widget _child;

  const VelaSkeleton._({required Widget child}) : _child = child;

  /// A full card-height skeleton matching the general card layout.
  static Widget card() => const VelaSkeletonTaskCard();

  /// A compact single-line list-item skeleton (icon + two text lines).
  static Widget listItem() => const _VelaSkeletonListItem();

  /// A single horizontal text line of a given [width].
  /// [width] defaults to filling the available width.
  static Widget text({double? width}) =>
      VelaSkeletonBox(width: width, height: 16);

  @override
  Widget build(BuildContext context) => _child;
}

/// Compact list-item skeleton used by VelaSkeleton.listItem().
class _VelaSkeletonListItem extends StatelessWidget {
  const _VelaSkeletonListItem();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return Semantics(
      label: 'Loading item...',
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.s4,
          vertical: AppSpacing.s3,
        ),
        decoration: BoxDecoration(
          color: colors.surfaceCard,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: colors.surfaceBorder),
        ),
        child: Row(
          children: [
            VelaSkeletonBox(
              width: 36,
              height: 36,
              borderRadius: BorderRadius.circular(8),
            ),
            const SizedBox(width: AppSpacing.s3),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  VelaSkeletonBox(height: 15),
                  SizedBox(height: 6),
                  VelaSkeletonBox(width: 140, height: 12),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Convenience list — renders N skeleton cards of a given type
// ---------------------------------------------------------------------------

class VelaSkeletonList extends StatelessWidget {
  final int count;
  final Widget Function() builder;

  const VelaSkeletonList({
    super.key,
    this.count = 3,
    required this.builder,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(count, (_) => builder()),
    );
  }
}
