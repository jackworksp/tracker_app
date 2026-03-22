import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/error_messages.dart';
import '../../../providers/goals_provider.dart';
import '../../widgets/vela_skeleton.dart';
import 'add_goal_modal.dart';

class GoalsScreen extends ConsumerStatefulWidget {
  const GoalsScreen({super.key});

  @override
  ConsumerState<GoalsScreen> createState() => _GoalsScreenState();
}

class _GoalsScreenState extends ConsumerState<GoalsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(goalsProvider.notifier).loadGoals());
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final state = ref.watch(goalsProvider);

    return Scaffold(
      backgroundColor: colors.bgPrimary,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.s5, AppSpacing.s5, AppSpacing.s5, AppSpacing.s3),
              child: Text(
                'My Goals',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: colors.textPrimary,
                ),
              ),
            ),
            // Content
            Expanded(
              child: _buildContent(state, colors),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddGoalModal(context),
        backgroundColor: colors.brandAccent,
        child: Icon(Icons.add, color: colors.textInverse),
      ),
    );
  }

  Widget _buildContent(GoalsState state, VelaColorScheme colors) {
    // Issue 07: shimmer skeleton replaces bare CircularProgressIndicator
    if (state.isLoading) {
      return ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s4, vertical: AppSpacing.s2),
        itemCount: 4,
        itemBuilder: (_, __) => const VelaSkeletonGoalCard(),
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
              // Issue 06: specific actionable error message
              Text(
                ErrorMessages.goalLoadFailed,
                style: TextStyle(fontSize: 16, color: colors.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.s4),
              TextButton(
                onPressed: () => ref.read(goalsProvider.notifier).loadGoals(),
                child: Text('Retry', style: TextStyle(color: colors.brandAccent)),
              ),
            ],
          ),
        ),
      );
    }

    if (state.goals.isEmpty) {
      return _buildEmptyState(colors);
    }

    return RefreshIndicator(
      color: colors.brandAccent,
      onRefresh: () => ref.read(goalsProvider.notifier).loadGoals(),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s4, vertical: AppSpacing.s2),
        itemCount: state.goals.length,
        itemBuilder: (context, index) {
          final goal = state.goals[index];
          return _GoalCard(
            goal: goal,
            colors: colors,
            onTap: () => _showGoalDetail(context, goal, colors),
            onDismissed: () => _deleteGoal(goal),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState(VelaColorScheme colors) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.track_changes, size: 64, color: colors.textTertiary),
          const SizedBox(height: AppSpacing.s4),
          Text(
            'No goals yet',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: colors.textPrimary,
            ),
          ),
          const SizedBox(height: AppSpacing.s2),
          Text(
            'Start tracking your goals',
            style: TextStyle(fontSize: 14, color: colors.textTertiary),
          ),
          const SizedBox(height: AppSpacing.s6),
          ElevatedButton.icon(
            onPressed: () => _showAddGoalModal(context),
            icon: const Icon(Icons.add),
            label: const Text('Add Your First Goal'),
            style: ElevatedButton.styleFrom(
              backgroundColor: colors.brandAccent,
              foregroundColor: colors.textInverse,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s6, vertical: AppSpacing.s3 + AppSpacing.s0_5),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showAddGoalModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const AddGoalModal(),
    );
  }

  void _showGoalDetail(BuildContext context, Goal goal, VelaColorScheme colors) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _GoalDetailSheet(goal: goal, colors: colors),
    );
  }

  Future<void> _deleteGoal(Goal goal) async {
    try {
      await ref.read(goalsProvider.notifier).deleteGoal(goal.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('\"${goal.title}\" deleted')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ErrorMessages.goalDeleteFailed)),
        );
        ref.read(goalsProvider.notifier).loadGoals();
      }
    }
  }
}

// ─── Goal Card ───────────────────────────────────────────────────────────────

class _GoalCard extends StatelessWidget {
  final Goal goal;
  final VelaColorScheme colors;
  final VoidCallback onTap;
  final VoidCallback onDismissed;

  const _GoalCard({
    required this.goal,
    required this.colors,
    required this.onTap,
    required this.onDismissed,
  });

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: ValueKey(goal.id),
      direction: DismissDirection.startToEnd,
      background: Container(
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.only(left: AppSpacing.s6),
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
            title: Text('Delete Goal', style: TextStyle(color: colors.textPrimary)),
            content: Text(
              'Are you sure you want to delete \"${goal.title}\"?',
              style: TextStyle(color: colors.textSecondary),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: Text('Cancel', style: TextStyle(color: colors.textSecondary)),
              ),
              TextButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: Text('Delete', style: TextStyle(color: colors.stateError)),
              ),
            ],
          ),
        );
      },
      onDismissed: (_) => onDismissed(),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.only(bottom: AppSpacing.s3),
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
              Text(
                goal.title,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: colors.textPrimary,
                ),
              ),
              // Description
              if (goal.description != null && goal.description!.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.s1 + AppSpacing.s0_5),
                Text(
                  goal.description!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 14, color: colors.textSecondary),
                ),
              ],
              const SizedBox(height: AppSpacing.s3),
              // Badges row
              Wrap(
                spacing: AppSpacing.s2,
                runSpacing: AppSpacing.s2,
                children: [
                  _CategoryBadge(
                    category: goal.category,
                    colors: colors,
                  ),
                  _StatusBadge(
                    status: goal.status,
                    colors: colors,
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.s2 + AppSpacing.s0_5),
              // Bottom row: target date + hours
              Row(
                children: [
                  if (goal.targetDate != null && goal.targetDate!.isNotEmpty) ...[
                    Icon(Icons.calendar_today, size: 14, color: colors.textTertiary),
                    const SizedBox(width: AppSpacing.s1),
                    Text(
                      _formatDate(goal.targetDate!),
                      style: TextStyle(fontSize: 12, color: colors.textTertiary),
                    ),
                    const SizedBox(width: AppSpacing.s4),
                  ],
                  Icon(Icons.timer_outlined, size: 14, color: colors.textTertiary),
                  const SizedBox(width: AppSpacing.s1),
                  Text(
                    '${goal.targetHours}h target',
                    style: TextStyle(fontSize: 12, color: colors.textTertiary),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

}

String _formatDate(String dateStr) {
  try {
    final date = DateTime.parse(dateStr);
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  } catch (_) {
    return dateStr;
  }
}

// ─── Category Badge ──────────────────────────────────────────────────────────

class _CategoryBadge extends StatelessWidget {
  final String category;
  final VelaColorScheme colors;

  const _CategoryBadge({required this.category, required this.colors});

  @override
  Widget build(BuildContext context) {
    final (Color bg, Color text) = switch (category.toUpperCase()) {
      'PERSONAL' => (const Color(0x260095F6), const Color(0xFF0095F6)),
      'CAREER' => (const Color(0x26F59E0B), const Color(0xFFF59E0B)),
      'EDUCATION' => (const Color(0x26A855F7), const Color(0xFFA855F7)),
      'HEALTH' => (const Color(0x2606D6A0), const Color(0xFF06D6A0)),
      'FINANCE' => (const Color(0x26EF4444), const Color(0xFFEF4444)),
      _ => (colors.interactiveHover, colors.textSecondary),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s2, vertical: AppSpacing.s1),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(9999),
      ),
      child: Text(
        category,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: text),
      ),
    );
  }
}

// ─── Status Badge ────────────────────────────────────────────────────────────

class _StatusBadge extends StatelessWidget {
  final String status;
  final VelaColorScheme colors;

  const _StatusBadge({required this.status, required this.colors});

  @override
  Widget build(BuildContext context) {
    final (Color bg, Color text) = switch (status.toUpperCase()) {
      'PLANNING' => (colors.stateInfoBg, colors.stateInfo),
      'IN_PROGRESS' => (colors.stateWarningBg, colors.stateWarning),
      'ON_HOLD' => (colors.interactiveHover, colors.textSecondary),
      'COMPLETED' => (colors.stateSuccessBg, colors.stateSuccess),
      _ => (colors.interactiveHover, colors.textSecondary),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s2, vertical: AppSpacing.s1),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(9999),
      ),
      child: Text(
        _formatStatus(status),
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: text),
      ),
    );
  }

  String _formatStatus(String status) {
    return status.replaceAll('_', ' ');
  }
}

// ─── Goal Detail Bottom Sheet ────────────────────────────────────────────────

class _GoalDetailSheet extends ConsumerWidget {
  final Goal goal;
  final VelaColorScheme colors;

  const _GoalDetailSheet({required this.goal, required this.colors});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      decoration: BoxDecoration(
        color: colors.surfaceElevated,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.s6),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: colors.surfaceBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.s5),
            // Title
            Text(
              goal.title,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: colors.textPrimary,
              ),
            ),
            const SizedBox(height: AppSpacing.s3),
            // Badges
            Wrap(
              spacing: AppSpacing.s2,
              runSpacing: AppSpacing.s2,
              children: [
                _CategoryBadge(category: goal.category, colors: colors),
                _StatusBadge(status: goal.status, colors: colors),
              ],
            ),
            // Description
            if (goal.description != null && goal.description!.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.s4),
              Text(
                goal.description!,
                style: TextStyle(fontSize: 15, color: colors.textSecondary, height: 1.5),
              ),
            ],
            const SizedBox(height: AppSpacing.s5),
            // Details
            _detailRow(Icons.timer_outlined, 'Target Hours', '${goal.targetHours}h'),
            if (goal.targetDate != null && goal.targetDate!.isNotEmpty)
              _detailRow(Icons.calendar_today, 'Target Date', _formatDate(goal.targetDate!)),
            if (goal.progress > 0)
              _detailRow(Icons.trending_up, 'Progress', '${goal.progress}%'),
            const SizedBox(height: AppSpacing.s6 + AppSpacing.s1),
            // Action buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => AddGoalModal(editGoal: goal),
                      );
                    },
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('Edit'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: colors.brandAccent,
                      side: BorderSide(color: colors.surfaceBorder),
                      padding: const EdgeInsets.symmetric(vertical: AppSpacing.s3),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.s3),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          backgroundColor: colors.surfaceElevated,
                          title: Text('Delete Goal',
                              style: TextStyle(color: colors.textPrimary)),
                          content: Text(
                            'Are you sure you want to delete \"${goal.title}\"?',
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
                      );
                      if (confirm == true && context.mounted) {
                        Navigator.pop(context);
                        ref.read(goalsProvider.notifier).deleteGoal(goal.id);
                      }
                    },
                    icon: const Icon(Icons.delete_outline),
                    label: const Text('Delete'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: colors.stateError,
                      side: BorderSide(color: colors.stateError.withOpacity(0.3)),
                      padding: const EdgeInsets.symmetric(vertical: AppSpacing.s3),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.s4),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.s3),
      child: Row(
        children: [
          Icon(icon, size: 18, color: colors.textTertiary),
          const SizedBox(width: AppSpacing.s2 + AppSpacing.s0_5),
          Text(
            label,
            style: TextStyle(fontSize: 14, color: colors.textTertiary),
          ),
          const Spacer(),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: colors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
