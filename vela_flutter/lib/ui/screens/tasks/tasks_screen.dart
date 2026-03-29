import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_animations.dart';
import '../../../core/theme/app_borders.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/utils/error_messages.dart';
import '../../../core/utils/haptics.dart';
import '../../../providers/auth_provider.dart';
import '../../../data/models/task.dart';
import '../../../providers/tasks_provider.dart';
import '../../../providers/subjects_provider.dart';
import 'add_task_modal.dart';
import '../../widgets/vela_skeleton.dart';
import 'task_detail_modal.dart';

class TasksScreen extends ConsumerStatefulWidget {
  const TasksScreen({super.key});

  @override
  ConsumerState<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends ConsumerState<TasksScreen>
    with SingleTickerProviderStateMixin {
  bool _showCompleted = false;
  // Phase 3: search and filter state
  final _searchController = TextEditingController();
  String _searchQuery = '';
  String? _filterType; // null = all types
  // Issue 10: swipe affordance — dismissed after first user swipe
  bool _hasSeenSwipeHint = false;

  // Issue 10: peek animation controller — plays once on first load to hint
  // at swipeability by translating the first card left then right then back.
  late AnimationController _peekCtrl;
  late Animation<double> _peekOffset;

  @override
  void initState() {
    super.initState();
    _loadTasks();

    // Issue 10: peek animation — 300 ms, fires once if hint not yet seen.
    _peekCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _peekOffset = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0, end: -12),
        weight: 1,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: -12, end: 12),
        weight: 2,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 12, end: 0),
        weight: 1,
      ),
    ]).animate(CurvedAnimation(parent: _peekCtrl, curve: Curves.easeInOut));

    // Issue 10: read persisted swipe hint state, then start peek if unseen.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final localStorage = ref.read(localStorageProvider);
      final seen = localStorage.getHasSeenSwipeHint();
      setState(() => _hasSeenSwipeHint = seen);

      // Only play the peek animation when the OS has not requested reduced
      // motion (Issue 09) and the user has never swiped before.
      if (!seen && !MediaQuery.of(context).disableAnimations) {
        // Small delay so the list has rendered before the card moves.
        Future.delayed(const Duration(milliseconds: 400), () {
          if (mounted) _peekCtrl.forward();
        });
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _peekCtrl.dispose();
    super.dispose();
  }

  void _loadTasks() {
    final subject = ref.read(subjectsProvider).currentSubject;
    // If no subject yet, skip — ref.listen in build() triggers the correct
    // subject-scoped load once loadSubjects() resolves.
    if (subject == null) return;
    // Phase 3: pass type filter to repository when set
    final filters = _filterType != null ? {'type': _filterType} : null;
    ref.read(tasksProvider.notifier).loadTasks(subject.id, filters: filters);
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
          // Issue 07: shimmer skeleton replaces the bare spinner
          ? ListView(
              padding: const EdgeInsets.only(top: AppSpacing.s4),
              children: List.generate(
                5,
                (_) => const VelaSkeletonTaskCard(),
              ),
            )
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
                        // Issue 06: specific actionable error message
                        Text(
                          ErrorMessages.taskLoadFailed,
                          style: AppTypography.headingLg(colors.textPrimary),
                          textAlign: TextAlign.center,
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
                                style: AppTypography.heading2xl(
                                    colors.textPrimary),
                              ),
                              const SizedBox(width: AppSpacing.s3),
                              Text(
                                '${active.length} active \u2022 ${completed.length} completed',
                                style:
                                    AppTypography.bodySm(colors.textTertiary),
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
                              hintStyle:
                                  AppTypography.bodyBase(colors.textTertiary),
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
                                borderSide:
                                    BorderSide(color: colors.surfaceBorder),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: AppBorders.lg,
                                borderSide:
                                    BorderSide(color: colors.surfaceBorder),
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
                                  style: AppTypography.headingLg(
                                      colors.textSecondary),
                                ),
                                const SizedBox(height: AppSpacing.s2),
                                Text(
                                  tasksState.tasks.isEmpty
                                      ? 'Add tasks, videos, or notes!'
                                      : 'Try a different search or filter',
                                  style:
                                      AppTypography.bodySm(colors.textTertiary),
                                ),
                              ],
                            ),
                          ),
                        ),
                      // Active tasks
                      SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) => _buildTaskCard(
                              active[index], colors, false,
                              isFirst: index == 0),
                          childCount: active.length,
                        ),
                      ),
                      // Completed section
                      if (completed.isNotEmpty) ...[
                        SliverToBoxAdapter(
                          child: GestureDetector(
                            onTap: () => setState(
                                () => _showCompleted = !_showCompleted),
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
                                    style: AppTypography.bodySmSemibold(
                                        colors.textTertiary),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        if (_showCompleted)
                          SliverList(
                            delegate: SliverChildBuilderDelegate(
                              (context, index) => _buildTaskCard(
                                  completed[index], colors, true),
                              childCount: completed.length,
                            ),
                          ),
                      ],
                      // Issue 11: fabClearance token + safe-area inset
                      SliverToBoxAdapter(
                        child: SizedBox(
                          height: AppSpacing.fabClearance +
                              MediaQuery.of(context).padding.bottom,
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildTaskCard(Task task, VelaColorScheme colors, bool isCompleted,
      {bool isFirst = false}) {
    // Issue 10: wrap first active card in peek translation animation.
    if (isFirst && !isCompleted && !_hasSeenSwipeHint) {
      return AnimatedBuilder(
        animation: _peekOffset,
        builder: (context, child) => Transform.translate(
          offset: Offset(_peekOffset.value, 0),
          child: child,
        ),
        child:
            _buildTaskCardContent(task, colors, isCompleted, isFirst: isFirst),
      );
    }
    return _buildTaskCardContent(task, colors, isCompleted, isFirst: isFirst);
  }

  Widget _buildTaskCardContent(
      Task task, VelaColorScheme colors, bool isCompleted,
      {bool isFirst = false}) {
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
                    onPressed: (_) async {
                      // Issue 08: success haptic when completing a task
                      await VelaHaptics.success();
                      // Issue 10: dismiss swipe affordance after first swipe
                      if (!_hasSeenSwipeHint) {
                        final ls = ref.read(localStorageProvider);
                        await ls.setHasSeenSwipeHint();
                        if (mounted) setState(() => _hasSeenSwipeHint = true);
                      }
                      ref.read(tasksProvider.notifier).toggleComplete(task);
                    },
                    backgroundColor: colors.stateSuccess,
                    foregroundColor: colors.textInverse,
                    icon: Icons.check,
                    label: 'Done',
                    // Phase 2: AppBorders token; Phase 2: min 44px touch target
                    borderRadius: AppBorders.lg,
                    padding:
                        const EdgeInsets.symmetric(vertical: AppSpacing.s3),
                  ),
                ],
              ),
        endActionPane: ActionPane(
          motion: const BehindMotion(),
          extentRatio: 0.25,
          children: [
            SlidableAction(
              onPressed: (_) async {
                // Issue 08: heavy haptic on destructive delete
                await VelaHaptics.heavy();
                // Issue 10: dismiss swipe affordance after first swipe
                if (!_hasSeenSwipeHint) {
                  final ls = ref.read(localStorageProvider);
                  await ls.setHasSeenSwipeHint();
                  if (mounted) setState(() => _hasSeenSwipeHint = true);
                }
                ref.read(tasksProvider.notifier).deleteTask(task.id);
              },
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
            child: Stack(
              children: [
                Container(
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
                              style:
                                  AppTypography.labelBase(typeColor).copyWith(
                                fontWeight: AppTypography.weightSemibold,
                              ),
                            ),
                          ),
                          // Phase 3: Priority badge
                          if (task.priority != null &&
                              task.priority!.isNotEmpty) ...[
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
                              style:
                                  AppTypography.labelBase(colors.textTertiary),
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
                        style:
                            AppTypography.bodyBaseSemibold(colors.textPrimary)
                                .copyWith(
                          decoration:
                              isCompleted ? TextDecoration.lineThrough : null,
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
                                    horizontal:
                                        AppSpacing.s1 + AppSpacing.s0_5, // 6px
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
                                    style: AppTypography.labelBase(
                                        colors.textTertiary),
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
                // Issue 10: swipe affordance — subtle edge gradients on the
                // first active card only, shown until the user first swipes.
                if (isFirst && !isCompleted && !_hasSeenSwipeHint)
                  _SwipeAffordance(colors: colors),
              ],
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
        // Issue 09: skip decorative animation when OS prefers reduced motion
        duration: AppAnimations.fastOrNone(context),
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
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(AppBorders.radiusXl)),
      ),
      builder: (context) => AddTaskModal(
        subjectId: subjectId,
        onCreated: () => _loadTasks(),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Issue 10 — Swipe affordance overlay
// Shown on the first active task card until the user performs their first swipe.
// Uses subtle left/right edge gradients plus chevron icons that pulse once.
// Respects reduced motion (Issue 09) — no animation when disabled.
// ---------------------------------------------------------------------------

class _SwipeAffordance extends StatefulWidget {
  final VelaColorScheme colors;
  const _SwipeAffordance({required this.colors});

  @override
  State<_SwipeAffordance> createState() => _SwipeAffordanceState();
}

class _SwipeAffordanceState extends State<_SwipeAffordance>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _pulse;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _pulse = Tween<double>(begin: 0.25, end: 0.65).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Issue 09: skip animation when OS prefers reduced motion
    final reduceMotion = MediaQuery.of(context).disableAnimations;
    final opacity = reduceMotion ? 0.35 : null;

    return Positioned.fill(
      child: IgnorePointer(
        child: Row(
          children: [
            // Left (complete) gradient + icon
            _buildEdge(
              colors: [
                widget.colors.stateSuccess.withValues(alpha: 0.18),
                Colors.transparent,
              ],
              icon: Icons.chevron_right,
              iconColor: widget.colors.stateSuccess,
              opacity: opacity,
              animate: !reduceMotion,
            ),
            const Spacer(),
            // Right (delete) gradient + icon
            _buildEdge(
              colors: [
                Colors.transparent,
                widget.colors.stateError.withValues(alpha: 0.18),
              ],
              icon: Icons.chevron_left,
              iconColor: widget.colors.stateError,
              opacity: opacity,
              animate: !reduceMotion,
              alignRight: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEdge({
    required List<Color> colors,
    required IconData icon,
    required Color iconColor,
    double? opacity,
    required bool animate,
    bool alignRight = false,
  }) {
    final content = Container(
      width: 36,
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: colors),
      ),
      alignment: alignRight ? Alignment.centerRight : Alignment.centerLeft,
      child: Icon(icon, size: 18, color: iconColor),
    );

    if (!animate || opacity != null) {
      return Opacity(opacity: opacity ?? 0.35, child: content);
    }

    return AnimatedBuilder(
      animation: _pulse,
      builder: (_, __) => Opacity(opacity: _pulse.value, child: content),
    );
  }
}
