import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_utils.dart';
import '../../../data/models/task.dart';
import '../../../providers/tasks_provider.dart';
import '../../../providers/subjects_provider.dart';
import 'add_task_modal.dart';

class TasksScreen extends ConsumerStatefulWidget {
  const TasksScreen({super.key});

  @override
  ConsumerState<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends ConsumerState<TasksScreen> {
  bool _showCompleted = false;

  @override
  void initState() {
    super.initState();
    _loadTasks();
  }

  void _loadTasks({int? subjectId}) {
    final id = subjectId ?? ref.read(subjectsProvider).currentSubject?.id;
    ref.read(tasksProvider.notifier).loadTasks(id);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final tasksState = ref.watch(tasksProvider);
    ref.watch(subjectsProvider);

    // Reload when subject changes
    ref.listen(
      subjectsProvider.select((s) => s.currentSubject?.id),
      (prev, next) {
        if (next != null && prev != next) {
          _loadTasks(subjectId: next);
        }
      },
    );

    final active = tasksState.activeTasks;
    final completed = tasksState.completedTasks;

    return Scaffold(
      backgroundColor: colors.bgPrimary,
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddTask(context, colors),
        backgroundColor: colors.brandAccent,
        child: Icon(Icons.add, color: colors.textInverse),
      ),
      body: tasksState.isLoading && tasksState.tasks.isEmpty
          ? Center(child: CircularProgressIndicator(color: colors.brandAccent))
          : tasksState.error != null && tasksState.tasks.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 48, color: colors.stateError),
                      const SizedBox(height: 12),
                      Text(
                        'Failed to load tasks',
                        style: TextStyle(color: colors.textSecondary, fontSize: 16),
                      ),
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: () => _loadTasks(),
                        child: Text('Retry', style: TextStyle(color: colors.brandAccent)),
                      ),
                    ],
                  ),
                )
          : RefreshIndicator(
              onRefresh: () async => _loadTasks(),
              color: colors.brandAccent,
              child: CustomScrollView(
                slivers: [
                  // Error banner (when cached data exists but refresh failed)
                  if (tasksState.error != null && tasksState.tasks.isNotEmpty)
                    SliverToBoxAdapter(
                      child: Container(
                        margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: colors.stateError.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.error_outline, size: 16, color: colors.stateError),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Failed to refresh. Pull down to retry.',
                                style: TextStyle(fontSize: 13, color: colors.stateError),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  // Header
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                      child: Row(
                        children: [
                          Text(
                            'Tasks',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              color: colors.textPrimary,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            '${active.length} active \u2022 ${completed.length} completed',
                            style: TextStyle(
                              fontSize: 14,
                              color: colors.textTertiary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Empty state
                  if (tasksState.tasks.isEmpty)
                    SliverFillRemaining(
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.assignment_outlined,
                              size: 48,
                              color: colors.textTertiary,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No items yet',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: colors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Add tasks, videos, or notes!',
                              style: TextStyle(
                                fontSize: 14,
                                color: colors.textTertiary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  // Active tasks
                  SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) =>
                          _buildTaskCard(active[index], colors, false),
                      childCount: active.length,
                    ),
                  ),
                  // Completed section
                  if (completed.isNotEmpty) ...[
                    SliverToBoxAdapter(
                      child: GestureDetector(
                        onTap: () =>
                            setState(() => _showCompleted = !_showCompleted),
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                          child: Row(
                            children: [
                              Icon(
                                _showCompleted
                                    ? Icons.keyboard_arrow_down
                                    : Icons.keyboard_arrow_right,
                                color: colors.textTertiary,
                                size: 20,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'Completed (${completed.length})',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: colors.textTertiary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    if (_showCompleted)
                      SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) =>
                              _buildTaskCard(completed[index], colors, true),
                          childCount: completed.length,
                        ),
                      ),
                  ],
                  const SliverToBoxAdapter(child: SizedBox(height: 80)),
                ],
              ),
            ),
    );
  }

  Widget _buildTaskCard(Task task, VelaColorScheme colors, bool isCompleted) {
    final typeColor = switch (task.type) {
      'WATCH' => const Color(0xFFEF4444),
      'READ' => const Color(0xFF3B82F6),
      'NOTE' => const Color(0xFFA855F7),
      _ => colors.brandAccent,
    };

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Slidable(
        key: ValueKey(task.id),
        startActionPane: isCompleted
            ? null
            : ActionPane(
                motion: const BehindMotion(),
                extentRatio: 0.25,
                children: [
                  SlidableAction(
                    onPressed: (_) async {
                      HapticFeedback.mediumImpact();
                      try {
                        await ref.read(tasksProvider.notifier).toggleComplete(task);
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('"${task.title}" ${task.completed ? "reopened" : "completed"}')),
                          );
                        }
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Failed to update task: $e')),
                          );
                        }
                      }
                    },
                    backgroundColor: colors.stateSuccess,
                    foregroundColor: Colors.white,
                    icon: Icons.check,
                    label: 'Done',
                    borderRadius: BorderRadius.circular(8),
                  ),
                ],
              ),
        endActionPane: ActionPane(
          motion: const BehindMotion(),
          extentRatio: 0.25,
          children: [
            SlidableAction(
              onPressed: (_) async {
                HapticFeedback.mediumImpact();
                final confirmed = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    backgroundColor: colors.surfaceCard,
                    title: Text('Delete Task', style: TextStyle(color: colors.textPrimary)),
                    content: Text(
                      'Are you sure you want to delete "${task.title}"?',
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
                if (confirmed == true) {
                  await ref.read(tasksProvider.notifier).deleteTask(task.id);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('"${task.title}" deleted')),
                    );
                  }
                }
              },
              backgroundColor: colors.stateError,
              foregroundColor: Colors.white,
              icon: Icons.delete_outline,
              label: 'Delete',
              borderRadius: BorderRadius.circular(8),
            ),
          ],
        ),
        child: Opacity(
          opacity: isCompleted ? 0.5 : 1.0,
          child: Container(
            padding: const EdgeInsets.all(16),
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
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: typeColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        task.type,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: typeColor,
                        ),
                      ),
                    ),
                    const Spacer(),
                    if (isCompleted)
                      Icon(
                        Icons.check_circle,
                        size: 18,
                        color: colors.stateSuccess,
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  task.title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: colors.textPrimary,
                    decoration:
                        isCompleted ? TextDecoration.lineThrough : null,
                  ),
                ),
                if (task.content != null && task.content!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    task.content!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 14,
                      color: colors.textSecondary,
                    ),
                  ),
                ],
                if (task.tags.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    children: task.tags
                        .map<Widget>(
                          (tag) => Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: colors.interactiveHover,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              '#$tag',
                              style: TextStyle(
                                fontSize: 11,
                                color: colors.textTertiary,
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ],
                const SizedBox(height: 8),
                Text(
                  task.createdAt != null
                      ? VelaDateUtils.timeAgo(task.createdAt!)
                      : '',
                  style: TextStyle(fontSize: 12, color: colors.textTertiary),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showAddTask(BuildContext context, VelaColorScheme colors) {
    final subjectId = ref.read(subjectsProvider).currentSubject?.id;
    final messenger = ScaffoldMessenger.of(context);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: colors.surfaceDefault,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      builder: (context) => AddTaskModal(
        subjectId: subjectId,
        onCreated: () {
          _loadTasks();
          messenger.showSnackBar(
            const SnackBar(content: Text('Task created')),
          );
        },
      ),
    );
  }
}
