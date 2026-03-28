import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/error_messages.dart';
import '../../../data/models/routine.dart';
import '../../../providers/routines_provider.dart';
import '../../widgets/vela_card.dart';
import '../../widgets/vela_skeleton.dart';
import 'add_routine_modal.dart';

class RoutinesScreen extends ConsumerStatefulWidget {
  const RoutinesScreen({super.key});

  @override
  ConsumerState<RoutinesScreen> createState() => _RoutinesScreenState();
}

class _RoutinesScreenState extends ConsumerState<RoutinesScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(routinesProvider.notifier).loadRoutines());
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final state = ref.watch(routinesProvider);
    final todayLabel = DateFormat('EEEE, MMM d').format(DateTime.now());

    return Scaffold(
      backgroundColor: colors.bgPrimary,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.s5,
                AppSpacing.s5,
                AppSpacing.s5,
                AppSpacing.s2,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Routines',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                      color: colors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    todayLabel,
                    style: TextStyle(
                      fontSize: 14,
                      color: colors.textTertiary,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(child: _buildContent(state, colors)),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddRoutineModal(context),
        backgroundColor: colors.brandAccent,
        child: Icon(Icons.add, color: colors.textInverse),
      ),
    );
  }

  Widget _buildContent(RoutinesState state, VelaColorScheme colors) {
    if (state.isLoading) {
      return ListView.builder(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.s4,
          vertical: AppSpacing.s2,
        ),
        itemCount: 4,
        itemBuilder: (_, __) => const VelaSkeletonRoutineCard(),
      );
    }

    if (state.error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.s8),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: colors.stateError),
              const SizedBox(height: AppSpacing.s3),
              Text(
                ErrorMessages.routineLoadFailed,
                style: TextStyle(fontSize: 16, color: colors.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.s4),
              TextButton(
                onPressed: () =>
                    ref.read(routinesProvider.notifier).loadRoutines(),
                child:
                    Text('Retry', style: TextStyle(color: colors.brandAccent)),
              ),
            ],
          ),
        ),
      );
    }

    if (state.routines.isEmpty) {
      return _buildEmptyState(colors);
    }

    return RefreshIndicator(
      color: colors.brandAccent,
      onRefresh: () => ref.read(routinesProvider.notifier).loadRoutines(),
      child: ListView.builder(
        padding: EdgeInsets.fromLTRB(
          AppSpacing.s4,
          AppSpacing.s2,
          AppSpacing.s4,
          AppSpacing.fabClearance + MediaQuery.of(context).padding.bottom,
        ),
        itemCount: state.routines.length,
        itemBuilder: (context, index) {
          final routine = state.routines[index];
          return _RoutineCard(
            routine: routine,
            colors: colors,
            onToggle: () => _toggleRoutine(routine),
            onDismissed: () => _deleteRoutine(routine),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState(VelaColorScheme colors) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.s6),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.repeat_rounded, size: 64, color: colors.textTertiary),
            const SizedBox(height: AppSpacing.s4),
            Text(
              'No routines yet',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: colors.textPrimary,
              ),
            ),
            const SizedBox(height: AppSpacing.s2),
            Text(
              'Create a daily habit to start building consistency.',
              style: TextStyle(fontSize: 14, color: colors.textTertiary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.s6),
            ElevatedButton.icon(
              onPressed: () => _showAddRoutineModal(context),
              icon: const Icon(Icons.add),
              label: const Text('Add Your First Routine'),
              style: ElevatedButton.styleFrom(
                backgroundColor: colors.brandAccent,
                foregroundColor: colors.textInverse,
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.s6,
                  vertical: AppSpacing.s3 + AppSpacing.s0_5,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddRoutineModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const AddRoutineModal(),
    );
  }

  Future<void> _deleteRoutine(Routine routine) async {
    try {
      await ref.read(routinesProvider.notifier).deleteRoutine(routine.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('"${routine.title}" deleted')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text(ErrorMessages.routineDeleteFailed)),
        );
        ref.read(routinesProvider.notifier).loadRoutines();
      }
    }
  }

  Future<void> _toggleRoutine(Routine routine) async {
    try {
      await ref.read(routinesProvider.notifier).toggleCompletion(routine);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text(ErrorMessages.routineToggleFailed)),
        );
      }
    }
  }
}

class _RoutineCard extends StatelessWidget {
  final Routine routine;
  final VelaColorScheme colors;
  final VoidCallback onToggle;
  final VoidCallback onDismissed;

  const _RoutineCard({
    required this.routine,
    required this.colors,
    required this.onToggle,
    required this.onDismissed,
  });

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: ValueKey(routine.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: AppSpacing.s6),
        margin: const EdgeInsets.only(bottom: AppSpacing.s3),
        decoration: BoxDecoration(
          color: colors.stateError,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(Icons.delete_outline, color: colors.textInverse),
      ),
      confirmDismiss: (_) async {
        return await showDialog<bool>(
              context: context,
              builder: (ctx) => AlertDialog(
                backgroundColor: colors.surfaceElevated,
                title: Text('Delete Routine',
                    style: TextStyle(color: colors.textPrimary)),
                content: Text(
                  'Are you sure you want to delete "${routine.title}"?',
                  style: TextStyle(color: colors.textSecondary),
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(ctx, false),
                    child: Text('Cancel',
                        style: TextStyle(color: colors.textSecondary)),
                  ),
                  TextButton(
                    onPressed: () => Navigator.pop(ctx, true),
                    child: Text('Delete',
                        style: TextStyle(color: colors.stateError)),
                  ),
                ],
              ),
            ) ??
            false;
      },
      onDismissed: (_) => onDismissed(),
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.s3),
        child: VelaCard(
          interactive: true,
          padding: VelaCardPadding.none,
          child: Row(
            children: [
              Container(
                width: 6,
                height: 108,
                decoration: BoxDecoration(
                  color: _categoryColor(routine.category, colors),
                  borderRadius:
                      const BorderRadius.horizontal(left: Radius.circular(8)),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.s4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        routine.title,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: colors.textPrimary,
                        ),
                      ),
                      if (routine.description != null &&
                          routine.description!.isNotEmpty) ...[
                        const SizedBox(height: AppSpacing.s1),
                        Text(
                          routine.description!,
                          style: TextStyle(
                            fontSize: 13,
                            color: colors.textSecondary,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      const SizedBox(height: AppSpacing.s3),
                      Wrap(
                        spacing: AppSpacing.s2,
                        runSpacing: AppSpacing.s2,
                        children: [
                          _Badge(
                            label: _formatCategory(routine.category),
                            background: _categoryColor(routine.category, colors)
                                .withValues(alpha: 0.14),
                            foreground:
                                _categoryColor(routine.category, colors),
                          ),
                          _Badge(
                            label: routine.frequency == 'WEEKLY'
                                ? 'Weekly'
                                : 'Daily',
                            background: colors.surfaceElevated,
                            foreground: colors.textSecondary,
                          ),
                          _Badge(
                            label: '🔥 ${routine.streak}',
                            background:
                                colors.brandAccent.withValues(alpha: 0.12),
                            foreground: colors.brandAccent,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(right: AppSpacing.s4),
                child: InkWell(
                  onTap: onToggle,
                  borderRadius: BorderRadius.circular(24),
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: routine.isCompletedToday
                          ? colors.brandAccent
                          : Colors.transparent,
                      border: Border.all(
                        color: routine.isCompletedToday
                            ? colors.brandAccent
                            : colors.surfaceBorder,
                        width: 2,
                      ),
                    ),
                    child: Icon(
                      Icons.check,
                      size: 22,
                      color: routine.isCompletedToday
                          ? colors.textInverse
                          : Colors.transparent,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static Color _categoryColor(String category, VelaColorScheme colors) {
    switch (category) {
      case 'HEALTH':
        return const Color(0xFF2E9E5B);
      case 'LEARNING':
        return const Color(0xFF2F7CF6);
      case 'PRODUCTIVITY':
        return const Color(0xFFF59E0B);
      case 'MINDFULNESS':
        return const Color(0xFF14B8A6);
      case 'GENERAL':
      default:
        return colors.brandAccent;
    }
  }

  static String _formatCategory(String category) {
    final words = category.split('_');
    return words
        .map((word) => word[0] + word.substring(1).toLowerCase())
        .join(' ');
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color background;
  final Color foreground;

  const _Badge({
    required this.label,
    required this.background,
    required this.foreground,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: foreground,
        ),
      ),
    );
  }
}
