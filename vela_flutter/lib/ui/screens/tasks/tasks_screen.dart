import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_borders.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/date_utils.dart';
import '../../../data/models/task.dart';
import '../../../providers/tasks_provider.dart';
import '../../../providers/subjects_provider.dart';
import 'add_task_modal.dart';
import 'task_detail_modal.dart';

class TasksScreen extends ConsumerStatefulWidget {
  const TasksScreen({super.key});

  @override
  ConsumerState<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends ConsumerState<TasksScreen> {
  bool _showCompleted = false;
  // Phase 3: search and filter state
  final _searchController = TextEditingController();
  String _searchQuery = '';
  String? _filterType; // null = all types

  @override
  void initState() {
    super.initState();
    _loadTasks();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _loadTasks() {
    final subject = ref.read(subjectsProvider).currentSubject;
    // Phase 3: pass type filter to repository when set
    final filters = _filterType != null ? {'type': _filterType} : null;
    ref.read(tasksProvider.notifier).loadTasks(subject?.id, filters: filters);
  }

  /// Phase 3: Client-side text search on top of server-side type filter.
  List<Task> _applySearch(List<Task> tasks) {
    if (_searchQuery.isEmpty) return tasks;
    final q = _searchQuery.toLowerCase();
    return tasks.where((t) {
      return t.title.toLowerCase().contains(q) ||
          (t.content?.toLowerCase().contains(q) ?? false) ||
          t.tags.any((tag) => tag.toLowerCase().contains(q));
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final tasksState = ref.watch(tasksProvider);
    ref.watch(subjectsProvider);

    // Reload when subject changes (preserving current filter)
    ref.listen(
      subjectsProvider.select((s) => s.currentSubject?.id),
      (prev, next) {
        if (next != null && prev != next) {
          final filters = _filterType != null ? {'type': _filterType} : null;
          ref.read(tasksProvider.notifier).loadTasks(next, filters: filters);
        }
      },
    );

    // Phase 3: apply text search filter on top of server-side type filter
    final active = _applySearch(tasksState.activeTasks);
    final completed = _applySearch(tasksState.completedTasks);

    return Scaffold(
      backgroundColor: colors.bgPrimary,
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddTask(context, colors),
        backgroundColor: colors.brandAccent,
        child: Icon(Icons.add, color: colors.textInverse),
      ),
      body: tasksState.isLoading
          ? Center(child: CircularProgressIndicator(color: colors.brandAccent))
          : tasksState.error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.s6),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: AppSpacing.s12,
                          color: colors.stateError,
                        ),
                        const SizedBox(height: AppSpacing.s4),
                        Text(
                          'Failed to load tasks',
                          style: AppTypography.headingLg(colors.textPrimary),
                        ),
                        const SizedBox(height: AppSpacing.s2),
                        Text(
                          tasksState.error!,
                          textAlign: TextAlign.center,
                          style: AppTypography.bodySm(colors.textSecondary),
                        ),
                        const SizedBox(height: AppSpacing.s6),
                        TextButton.icon(
                          onPressed: _loadTasks,
                          icon: const Icon(Icons.refresh),
                          label: const Text('Try again'),
                          style: TextButton.styleFrom(
                            foregroundColor: colors.brandAccent,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () async => _loadTasks(),
                  color: colors.brandAccent,
                  child: CustomScrollView(
                slivers: [
                  // Header
                  SliverToBoxAdapter(
                    child: Padding(
                      // Phase 2: AppSpacing tokens
                      padding: const EdgeInsets.fromLTRB(
                        AppSpacing.s4,
                        AppSpacing.s4,
                        AppSpacing.s4,
                        AppSpacing.s2,
                      ),
                      child: Row(
                        children: [
                          // Phase 2: AppTypography
                          Text(
                            'Tasks',
                            style: AppTypography.heading2xl(colors.textPrimary),
                          ),
                          const SizedBox(width: AppSpacing.s3),
                          Text(
                            '${active.length} active \u2022 ${completed.length} completed',
                            style: AppTypography.bodySm(colors.textTertiary),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Phase 3: Search bar
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.s4,
                        vertical: AppSpacing.s2,
                      ),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (value) =>
                            setState(() => _searchQuery = value),
                        style: AppTypography.bodyBase(colors.textPrimary),
                        decoration: InputDecoration(
                          hintText: 'Search tasks…',
                          hintStyle: AppTypography.bodyBase(colors.textTertiary),
                          prefixIcon: Icon(
                            Icons.search,
                            size: AppSpacing.s5,
                            color: colors.textTertiary,
                          ),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: Icon(
                                    Icons.clear,
                                    size: AppSpacing.s5,
                                    color: colors.textTertiary,
                                  ),
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() => _searchQuery = '');
                                  },
                                )
                              : null,
                          filled: true,
                          fillColor: colors.surfaceCard,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.s4,
                            vertical: AppSpacing.s2,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: AppBorders.lg,
                            borderSide: BorderSide(color: colors.surfaceBorder),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: AppBorders.lg,
                            borderSide: BorderSide(color: colors.surfaceBorder),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: AppBorders.lg,
                            borderSide: BorderSide(
                              color: colors.interactiveFocus,
                              width: 2,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  // Phase 3: Type filter chips
                  SliverToBoxAdapter(
                    child: SizedBox(
                      height: AppSpacing.s12,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.s4,
                          vertical: AppSpacing.s1,
                        ),
                        children: [
                          _buildFilterChip('All', null, colors),
                          const SizedBox(width: AppSpacing.s2),
                          _buildFilterChip('TASK', 'TASK', colors),
                          const SizedBox(width: AppSpacing.s2),
                          _buildFilterChip('WATCH', 'WATCH', colors),
                          const SizedBox(width: AppSpacing.s2),
                          _buildFilterChip('READ', 'READ', colors),
                          const SizedBox(width: AppSpacing.s2),
                          _buildFilterChip('NOTE', 'NOTE', colors),
                        ],
                      ),
                    ),
                  ),
                  // Empty state
                  if (active.isEmpty && completed.isEmpty)
                    SliverFillRemaining(
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              tasksState.tasks.isEmpty
                                  ? Icons.assignment_outlined
                                  : Icons.search_off,
                              // Phase 2: AppSpacing token
                              size: AppSpacing.s12,
                              color: colors.textTertiary,
                            ),
                            const SizedBox(height: AppSpacing.s4),
                            Text(
                              tasksState.tasks.isEmpty
                                  ? 'No items yet'
                                  : 'No matching tasks',
                              // Phase 2: AppTypography
                              style: AppTypography.headingLg(colors.textSecondary),
                            ),
                            const SizedBox(height: AppSpacing.s2),
                            Text(
                              tasksState.tasks.isEmpty
                                  ? 'Add tasks, videos, or notes!'
                                  : 'Try a different search or filter',
                              style: AppTypography.bodySm(colors.textTertiary),
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
                          // Phase 2: AppSpacing tokens
                          padding: const EdgeInsets.fromLTRB(
                            AppSpacing.s4,
                            AppSpacing.s4,
                            AppSpacing.s4,
                            AppSpacing.s2,
                          ),
                          child: Row(
                            children: [
                              Icon(
                                _showCompleted
                                    ? Icons.keyboard_arrow_down
                                    : Icons.keyboard_arrow_right,
                                color: colors.textTertiary,
                                size: AppSpacing.s5,
                              ),
                              const SizedBox(width: AppSpacing.s1),
                              Text(
                                'Completed (${completed.length})',
                                // Phase 2: AppTypography
                                style: AppTypography.bodySmSemibold(colors.textTertiary),
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
                  // Phase 2: safe area bottom + FAB clearance
                  SliverToBoxAdapter(
                    child: SizedBox(
                      height: AppSpacing.s20 +
                          MediaQuery.of(context).padding.bottom,
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildTaskCard(Task task, VelaColorScheme colors, bool isCompleted) {
    // Phase 2: use AppColors tokens instead of hardcoded hex
    final typeColor = switch (task.type) {
      'WATCH' => colors.taskTypeWatch,
      'READ' => colors.taskTypeRead,
      'NOTE' => colors.taskTypeNote,
      _ => colors.brandAccent,
    };

    return Padding(
      // Phase 2: AppSpacing tokens
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s4,
        vertical: AppSpacing.s1,
      ),
      child: Slidable(
        key: ValueKey(task.id),
        startActionPane: isCompleted
            ? null
            : ActionPane(
                motion: const BehindMotion(),
                extentRatio: 0.25,
                children: [
                  SlidableAction(
                    onPressed: (_) =>
                        ref.read(tasksProvider.notifier).toggleComplete(task),
                    backgroundColor: colors.stateSuccess,
                    foregroundColor: colors.textInverse,
                    icon: Icons.check,
                    label: 'Done',
                    // Phase 2: AppBorders token; Phase 2: min 44px touch target
                    borderRadius: AppBorders.lg,
                    padding: const EdgeInsets.symmetric(vertical: AppSpacing.s3),
                  ),
                ],
              ),
        endActionPane: ActionPane(
          motion: const BehindMotion(),
          extentRatio: 0.25,
          children: [
            SlidableAction(
              onPressed: (_) =>
                  ref.read(tasksProvider.notifier).deleteTask(task.id),
              backgroundColor: colors.stateError,
              foregroundColor: colors.textInverse,
              icon: Icons.delete_outline,
              label: 'Delete',
              // Phase 2: AppBorders token; Phase 2: min 44px touch target
              borderRadius: AppBorders.lg,
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.s3),
            ),
          ],
        ),
        child: Opacity(
          opacity: isCompleted ? 0.5 : 1.0,
          child: GestureDetector(
            onTap: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => TaskDetailModal(
                  task: task,
                  onTaskUpdated: _loadTasks,
                ),
              );
            },
            child: Container(
            // Phase 2: AppSpacing token
            padding: const EdgeInsets.all(AppSpacing.s4),
            decoration: BoxDecoration(
              color: colors.surfaceCard,
              // Phase 2: AppBorders token
              borderRadius: AppBorders.lg,
              border: Border.all(color: colors.surfaceBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    // Type badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        // Phase 2: AppSpacing tokens
                        horizontal: AppSpacing.s2,
                        vertical: AppSpacing.s0_5,
                      ),
                      decoration: BoxDecoration(
                        color: typeColor.withValues(alpha: 0.15),
                        // Phase 2: AppBorders token
                        borderRadius: AppBorders.sm,
                      ),
                      child: Text(
                        task.type,
                        // Phase 2: AppTypography
                        style: AppTypography.labelBase(typeColor).copyWith(
                          fontWeight: AppTypography.weightSemibold,
                        ),
                      ),
                    ),
                    // Phase 3: Priority badge
                    if (task.priority != null && task.priority!.isNotEmpty) ...[
                      const SizedBox(width: AppSpacing.s1),
                      _buildPriorityBadge(task.priority!, colors),
                    ],
                    const Spacer(),
                    // Phase 3: Subtasks count indicator
                    if (task.subtasks.isNotEmpty) ...[
                      Icon(
                        Icons.account_tree_outlined,
                        size: AppSpacing.s4,
                        color: colors.textTertiary,
                      ),
                      const SizedBox(width: AppSpacing.s0_5),
                      Text(
                        '${task.subtasks.length}',
                        style: AppTypography.labelBase(colors.textTertiary),
                      ),
                      const SizedBox(width: AppSpacing.s2),
                    ],
                    if (isCompleted)
                      Icon(
                        Icons.check_circle,
                        size: AppSpacing.s4 + AppSpacing.s0_5, // 18px
                        color: colors.stateSuccess,
                      ),
                  ],
                ),
                const SizedBox(height: AppSpacing.s2),
                Text(
                  task.title,
                  // Phase 2: AppTypography
                  style: AppTypography.bodyBaseSemibold(colors.textPrimary).copyWith(
                    decoration: isCompleted ? TextDecoration.lineThrough : null,
                  ),
                ),
                if (task.content != null && task.content!.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.s1),
                  Text(
                    task.content!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    // Phase 2: AppTypography
                    style: AppTypography.bodySm(colors.textSecondary),
                  ),
                ],
                if (task.tags.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.s2),
                  Wrap(
                    // Phase 2: AppSpacing tokens
                    spacing: AppSpacing.s1,
                    runSpacing: AppSpacing.s1,
                    children: task.tags
                        .map<Widget>(
                          (tag) => Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.s1 + AppSpacing.s0_5, // 6px
                              vertical: AppSpacing.s0_5,
                            ),
                            decoration: BoxDecoration(
                              color: colors.interactiveHover,
                              // Phase 2: AppBorders token
                              borderRadius: AppBorders.sm,
                            ),
                            child: Text(
                              '#$tag',
                              // Phase 2: AppTypography
                              style: AppTypography.labelBase(colors.textTertiary),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ],
                const SizedBox(height: AppSpacing.s2),
                Text(
                  task.createdAt != null
                      ? VelaDateUtils.timeAgo(task.createdAt!)
                      : '',
                  // Phase 2: AppTypography
                  style: AppTypography.caption(colors.textTertiary),
                ),
              ],
            ),
          ),
          ), // GestureDetector
        ),
      ),
    );
  }

  /// Phase 3: Filter chip for the type filter row.
  Widget _buildFilterChip(String label, String? type, VelaColorScheme colors) {
    final isSelected = _filterType == type;
    return GestureDetector(
      onTap: () {
        setState(() => _filterType = type);
        _loadTasks();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.s3,
          vertical: AppSpacing.s1,
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? colors.brandAccent.withValues(alpha: 0.15)
              : colors.surfaceCard,
          borderRadius: AppBorders.full,
          border: Border.all(
            color: isSelected ? colors.brandAccent : colors.surfaceBorder,
          ),
        ),
        child: Text(
          label,
          style: AppTypography.labelLg(
            isSelected ? colors.brandAccent : colors.textSecondary,
          ).copyWith(
            fontWeight: isSelected
                ? AppTypography.weightSemibold
                : AppTypography.weightNormal,
          ),
        ),
      ),
    );
  }

  /// Phase 3: Priority badge widget.
  Widget _buildPriorityBadge(String priority, VelaColorScheme colors) {
    final Color color = switch (priority.toUpperCase()) {
      'HIGH' => colors.priorityHigh,
      'MEDIUM' => colors.priorityMedium,
      'LOW' => colors.priorityLow,
      _ => colors.textTertiary,
    };
    final IconData icon = switch (priority.toUpperCase()) {
      'HIGH' => Icons.keyboard_double_arrow_up,
      'MEDIUM' => Icons.drag_handle,
      'LOW' => Icons.keyboard_double_arrow_down,
      _ => Icons.remove,
    };
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s1 + AppSpacing.s0_5, // 6px
        vertical: AppSpacing.s0_5,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: AppBorders.sm,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: AppSpacing.s3, color: color),
          const SizedBox(width: AppSpacing.s0_5),
          Text(
            priority[0].toUpperCase() + priority.substring(1).toLowerCase(),
            style: AppTypography.labelBase(color).copyWith(
              fontWeight: AppTypography.weightSemibold,
            ),
          ),
        ],
      ),
    );
  }

  void _showAddTask(BuildContext context, VelaColorScheme colors) {
    final subjectId = ref.read(subjectsProvider).currentSubject?.id;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: colors.surfaceDefault,
      // Phase 2: AppBorders token
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppBorders.radiusXl)),
      ),
      builder: (context) => AddTaskModal(
        subjectId: subjectId,
        onCreated: () => _loadTasks(),
      ),
    );
  }
}
