import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_borders.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/utils/link_utils.dart';
import '../../../data/models/task.dart';
import '../../../providers/tasks_provider.dart';
import '../../../providers/subjects_provider.dart';
import '../../../services/notification_service.dart';
import '../../widgets/vela_button.dart';
import 'add_task_modal.dart';

class TaskDetailModal extends ConsumerStatefulWidget {
  final Task task;
  final VoidCallback onTaskUpdated;

  const TaskDetailModal({
    super.key,
    required this.task,
    required this.onTaskUpdated,
  });

  @override
  ConsumerState<TaskDetailModal> createState() => _TaskDetailModalState();
}

class _TaskDetailModalState extends ConsumerState<TaskDetailModal> {
  bool _isDeleting = false;
  bool _isSnoozing = false;
  bool _isDismissing = false;
  bool _isRemoving = false;

  // Local copy of task that reflects reminder state changes within this modal.
  late Task _task;

  @override
  void initState() {
    super.initState();
    _task = widget.task;
  }

  // ---------------------------------------------------------------------------
  // Reminder actions
  // ---------------------------------------------------------------------------

  Future<void> _handleSnooze(int minutes) async {
    setState(() => _isSnoozing = true);
    try {
      final updated = await ref
          .read(tasksProvider.notifier)
          .snoozeReminder(_task.id, minutes);
      await NotificationService().scheduleReminder(updated);
      if (mounted) {
        setState(() {
          _task = updated;
          _isSnoozing = false;
        });
        widget.onTaskUpdated();
      }
    } catch (_) {
      if (mounted) setState(() => _isSnoozing = false);
    }
  }

  Future<void> _handleDismiss() async {
    setState(() => _isDismissing = true);
    try {
      final updated = await ref
          .read(tasksProvider.notifier)
          .dismissReminder(_task.id);
      await NotificationService().cancelReminder(_task.id);
      if (mounted) {
        setState(() {
          _task = updated;
          _isDismissing = false;
        });
        widget.onTaskUpdated();
      }
    } catch (_) {
      if (mounted) setState(() => _isDismissing = false);
    }
  }

  Future<void> _handleRemoveReminder() async {
    setState(() => _isRemoving = true);
    try {
      await ref.read(tasksProvider.notifier).removeReminder(_task.id);
      await NotificationService().cancelReminder(_task.id);
      if (mounted) {
        setState(() {
          _task = _task.copyWith(
            reminderTime: null,
            alertType: 'basic',
            reminderDismissed: false,
            reminderSnoozedUntil: null,
          );
          _isRemoving = false;
        });
        widget.onTaskUpdated();
      }
    } catch (_) {
      if (mounted) setState(() => _isRemoving = false);
    }
  }

  void _showSnoozeSheet(BuildContext context, VelaColorScheme colors) {
    const options = [
      (label: '15 minutes', minutes: 15),
      (label: '30 minutes', minutes: 30),
      (label: '1 hour', minutes: 60),
      (label: '2 hours', minutes: 120),
    ];

    showModalBottomSheet<void>(
      context: context,
      backgroundColor: colors.surfaceDefault,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppBorders.radiusXl),
        ),
      ),
      builder: (sheetCtx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.s4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle
              Center(
                child: Container(
                  width: AppSpacing.s10,
                  height: AppSpacing.s1,
                  decoration: BoxDecoration(
                    color: colors.surfaceBorder,
                    borderRadius: AppBorders.full,
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.s4),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s6),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Snooze reminder',
                    style: AppTypography.headingLg(colors.textPrimary),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.s2),
              ...options.map((opt) => InkWell(
                    onTap: () {
                      Navigator.pop(sheetCtx);
                      _handleSnooze(opt.minutes);
                    },
                    child: Container(
                      width: double.infinity,
                      constraints: const BoxConstraints(minHeight: 44),
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.s6,
                        vertical: AppSpacing.s3,
                      ),
                      child: Text(
                        opt.label,
                        style: AppTypography.bodyBase(colors.textPrimary),
                      ),
                    ),
                  )),
              const SizedBox(height: AppSpacing.s2),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleDelete() async {
    setState(() => _isDeleting = true);
    try {
      await ref.read(tasksProvider.notifier).deleteTask(widget.task.id);
      widget.onTaskUpdated();
      if (mounted) Navigator.pop(context);
    } catch (_) {
      if (mounted) setState(() => _isDeleting = false);
    }
  }

  void _handleEdit(BuildContext context, VelaColorScheme colors) {
    Navigator.pop(context);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: colors.surfaceDefault,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppBorders.radiusXl),
        ),
      ),
      builder: (ctx) => AddTaskModal(
        subjectId: widget.task.subjectId,
        onCreated: widget.onTaskUpdated,
        existingTask: widget.task,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final task = _task;

    final typeColor = switch (task.type) {
      'WATCH' => colors.taskTypeWatch,
      'READ' => colors.taskTypeRead,
      'NOTE' => colors.taskTypeNote,
      _ => colors.brandAccent,
    };

    // Look up subject name from provider
    final subjectsState = ref.watch(subjectsProvider);
    final subject = task.subjectId != null
        ? subjectsState.subjects.where((s) => s.id == task.subjectId).firstOrNull
        : null;

    return Container(
      decoration: BoxDecoration(
        color: colors.surfaceDefault,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppBorders.radiusXl),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Padding(
            padding: const EdgeInsets.only(top: AppSpacing.s3),
            child: Center(
              child: Container(
                width: AppSpacing.s10,
                height: AppSpacing.s1,
                decoration: BoxDecoration(
                  color: colors.surfaceBorder,
                  borderRadius: AppBorders.full,
                ),
              ),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.s6,
              AppSpacing.s4,
              AppSpacing.s4,
              AppSpacing.s4,
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Type badge
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.s2,
                    vertical: AppSpacing.s0_5,
                  ),
                  decoration: BoxDecoration(
                    color: typeColor.withValues(alpha: 0.15),
                    borderRadius: AppBorders.sm,
                  ),
                  child: Text(
                    task.type,
                    style: AppTypography.labelBase(typeColor).copyWith(
                      fontWeight: AppTypography.weightSemibold,
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.s2),
                Expanded(
                  child: Text(
                    task.title,
                    style: AppTypography.headingXl(colors.textPrimary),
                  ),
                ),
                // Close button — min 44px touch target
                SizedBox(
                  width: 44,
                  height: 44,
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => Navigator.pop(context),
                      borderRadius: AppBorders.full,
                      child: Center(
                        child: Icon(
                          Icons.close,
                          size: AppSpacing.s5,
                          color: colors.textSecondary,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Divider(height: 1, color: colors.surfaceBorder),
          // Scrollable content
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.s6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Content
                  if (task.content != null && task.content!.isNotEmpty) ...[
                    _SectionLabel(label: 'Description', colors: colors),
                    const SizedBox(height: AppSpacing.s2),
                    Text(
                      task.content!,
                      style: AppTypography.bodyBase(colors.textPrimary),
                    ),
                    const SizedBox(height: AppSpacing.s5),
                  ],

                  // URL
                  if (task.url != null && task.url!.isNotEmpty) ...[
                    _SectionLabel(label: 'Link', colors: colors),
                    const SizedBox(height: AppSpacing.s2),
                    SizedBox(
                      height: 44,
                      child: VelaButton(
                        variant: VelaButtonVariant.outline,
                        size: VelaButtonSize.md,
                        leftIcon: const Icon(Icons.open_in_new),
                        onPressed: () => LinkUtils.openUrl(task.url!),
                        child: Text(
                          task.url!,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.s5),
                  ],

                  // Priority + Tags row
                  if ((task.priority != null && task.priority!.isNotEmpty) ||
                      task.tags.isNotEmpty) ...[
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (task.priority != null && task.priority!.isNotEmpty) ...[
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _SectionLabel(label: 'Priority', colors: colors),
                                const SizedBox(height: AppSpacing.s2),
                                _PriorityBadge(
                                  priority: task.priority!,
                                  colors: colors,
                                ),
                              ],
                            ),
                          ),
                        ],
                        if (task.tags.isNotEmpty) ...[
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _SectionLabel(label: 'Tags', colors: colors),
                                const SizedBox(height: AppSpacing.s2),
                                Wrap(
                                  spacing: AppSpacing.s1,
                                  runSpacing: AppSpacing.s1,
                                  children: task.tags
                                      .map(
                                        (tag) => Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: AppSpacing.s2,
                                            vertical: AppSpacing.s0_5,
                                          ),
                                          decoration: BoxDecoration(
                                            color: colors.interactiveHover,
                                            borderRadius: AppBorders.sm,
                                          ),
                                          child: Text(
                                            '#$tag',
                                            style: AppTypography.labelBase(
                                              colors.textTertiary,
                                            ),
                                          ),
                                        ),
                                      )
                                      .toList(),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: AppSpacing.s5),
                  ],

                  // Subtasks
                  if (task.subtasks.isNotEmpty) ...[
                    _SectionLabel(
                      label: 'Subtasks (${task.subtasks.length})',
                      colors: colors,
                    ),
                    const SizedBox(height: AppSpacing.s2),
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: colors.surfaceBorder),
                        borderRadius: AppBorders.md,
                      ),
                      child: Column(
                        children: task.subtasks.asMap().entries.map((entry) {
                          final index = entry.key;
                          final subtask = entry.value;
                          final isLast = index == task.subtasks.length - 1;

                          final bool isDone = subtask is Map
                              ? (subtask['completed'] as bool? ?? false)
                              : false;
                          final String subtaskTitle = subtask is Map
                              ? (subtask['title'] as String? ?? subtask.toString())
                              : subtask.toString();

                          return Container(
                            decoration: BoxDecoration(
                              border: isLast
                                  ? null
                                  : Border(
                                      bottom: BorderSide(
                                        color: colors.surfaceBorder,
                                      ),
                                    ),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: AppSpacing.s3,
                                vertical: AppSpacing.s2,
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    isDone
                                        ? Icons.check_circle
                                        : Icons.radio_button_unchecked,
                                    size: AppSpacing.s5,
                                    color: isDone
                                        ? colors.stateSuccess
                                        : colors.textTertiary,
                                  ),
                                  const SizedBox(width: AppSpacing.s3),
                                  Expanded(
                                    child: Text(
                                      subtaskTitle,
                                      style: AppTypography.bodySm(
                                        isDone
                                            ? colors.textTertiary
                                            : colors.textPrimary,
                                      ).copyWith(
                                        decoration: isDone
                                            ? TextDecoration.lineThrough
                                            : null,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.s5),
                  ],

                  // Reminder — interactive section
                  if (task.reminderTime != null) ...[
                    _SectionLabel(label: 'Reminder', colors: colors),
                    const SizedBox(height: AppSpacing.s2),
                    // Time display row
                    Row(
                      children: [
                        Icon(
                          Icons.alarm,
                          size: AppSpacing.s4,
                          color: task.reminderDismissed
                              ? colors.textTertiary
                              : colors.stateWarning,
                        ),
                        const SizedBox(width: AppSpacing.s2),
                        Expanded(
                          child: Text(
                            VelaDateUtils.formatDateTime(task.reminderTime!),
                            style: AppTypography.bodySm(colors.textSecondary),
                          ),
                        ),
                        if (task.reminderDismissed)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.s2,
                              vertical: AppSpacing.s0_5,
                            ),
                            decoration: BoxDecoration(
                              color: colors.interactiveHover,
                              borderRadius: AppBorders.sm,
                            ),
                            child: Text(
                              'Dismissed',
                              style: AppTypography.labelBase(colors.textTertiary),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.s3),
                    // Action row: Snooze | Dismiss | Remove
                    Row(
                      children: [
                        // Snooze button — disabled if already dismissed
                        Expanded(
                          child: SizedBox(
                            height: 44,
                            child: OutlinedButton.icon(
                              onPressed: task.reminderDismissed || _isSnoozing
                                  ? null
                                  : () => _showSnoozeSheet(context, colors),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: colors.stateWarning,
                                side: BorderSide(color: colors.surfaceBorder),
                                shape: RoundedRectangleBorder(
                                  borderRadius: AppBorders.md,
                                ),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: AppSpacing.s3,
                                ),
                              ),
                              icon: _isSnoozing
                                  ? SizedBox(
                                      width: AppSpacing.s4,
                                      height: AppSpacing.s4,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: colors.stateWarning,
                                      ),
                                    )
                                  : Icon(
                                      Icons.snooze,
                                      size: AppSpacing.s4,
                                    ),
                              label: Text(
                                'Snooze',
                                style: AppTypography.labelLg(
                                  task.reminderDismissed
                                      ? colors.textDisabled
                                      : colors.stateWarning,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.s2),
                        // Dismiss button — disabled if already dismissed
                        Expanded(
                          child: SizedBox(
                            height: 44,
                            child: OutlinedButton.icon(
                              onPressed: task.reminderDismissed || _isDismissing
                                  ? null
                                  : _handleDismiss,
                              style: OutlinedButton.styleFrom(
                                foregroundColor: colors.textSecondary,
                                side: BorderSide(color: colors.surfaceBorder),
                                shape: RoundedRectangleBorder(
                                  borderRadius: AppBorders.md,
                                ),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: AppSpacing.s3,
                                ),
                              ),
                              icon: _isDismissing
                                  ? SizedBox(
                                      width: AppSpacing.s4,
                                      height: AppSpacing.s4,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: colors.textSecondary,
                                      ),
                                    )
                                  : Icon(
                                      Icons.notifications_off_outlined,
                                      size: AppSpacing.s4,
                                    ),
                              label: Text(
                                'Dismiss',
                                style: AppTypography.labelLg(
                                  task.reminderDismissed
                                      ? colors.textDisabled
                                      : colors.textSecondary,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.s2),
                        // Remove button (trash icon)
                        SizedBox(
                          width: 44,
                          height: 44,
                          child: Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: _isRemoving ? null : _handleRemoveReminder,
                              borderRadius: AppBorders.md,
                              child: Container(
                                decoration: BoxDecoration(
                                  border: Border.all(color: colors.surfaceBorder),
                                  borderRadius: AppBorders.md,
                                ),
                                child: Center(
                                  child: _isRemoving
                                      ? SizedBox(
                                          width: AppSpacing.s4,
                                          height: AppSpacing.s4,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: colors.stateError,
                                          ),
                                        )
                                      : Icon(
                                          Icons.delete_outline,
                                          size: AppSpacing.s4,
                                          color: colors.stateError,
                                        ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.s5),
                  ],

                  // Metadata
                  _SectionLabel(label: 'Details', colors: colors),
                  const SizedBox(height: AppSpacing.s2),
                  _MetaRow(
                    icon: Icons.calendar_today_outlined,
                    label: 'Created',
                    value: task.createdAt != null
                        ? VelaDateUtils.formatDate(task.createdAt!)
                        : '—',
                    colors: colors,
                  ),
                  if (subject != null) ...[
                    const SizedBox(height: AppSpacing.s2),
                    _MetaRow(
                      icon: Icons.book_outlined,
                      label: 'Subject',
                      value: subject.name,
                      colors: colors,
                    ),
                  ],
                  if (task.status.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.s2),
                    _MetaRow(
                      icon: Icons.info_outline,
                      label: 'Status',
                      value: task.status,
                      colors: colors,
                    ),
                  ],
                  const SizedBox(height: AppSpacing.s6),
                ],
              ),
            ),
          ),
          // Action footer
          Container(
            padding: EdgeInsets.fromLTRB(
              AppSpacing.s6,
              AppSpacing.s4,
              AppSpacing.s6,
              AppSpacing.s4 + MediaQuery.of(context).padding.bottom,
            ),
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: colors.surfaceBorder)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: VelaButton(
                    variant: VelaButtonVariant.outline,
                    size: VelaButtonSize.lg,
                    fullWidth: true,
                    leftIcon: const Icon(Icons.edit_outlined),
                    onPressed: () => _handleEdit(context, colors),
                    child: const Text('Edit'),
                  ),
                ),
                const SizedBox(width: AppSpacing.s3),
                Expanded(
                  child: VelaButton(
                    variant: VelaButtonVariant.danger,
                    size: VelaButtonSize.lg,
                    fullWidth: true,
                    loading: _isDeleting,
                    leftIcon: const Icon(Icons.delete_outline),
                    onPressed: _isDeleting ? null : _handleDelete,
                    child: const Text('Delete'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Private helper widgets
// ---------------------------------------------------------------------------

class _SectionLabel extends StatelessWidget {
  final String label;
  final VelaColorScheme colors;

  const _SectionLabel({required this.label, required this.colors});

  @override
  Widget build(BuildContext context) {
    return Text(
      label.toUpperCase(),
      style: AppTypography.labelBase(colors.textTertiary).copyWith(
        letterSpacing: 0.5,
        fontWeight: AppTypography.weightSemibold,
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final VelaColorScheme colors;

  const _MetaRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: AppSpacing.s4, color: colors.textTertiary),
        const SizedBox(width: AppSpacing.s2),
        Text(
          '$label:',
          style: AppTypography.bodySm(colors.textTertiary),
        ),
        const SizedBox(width: AppSpacing.s1),
        Expanded(
          child: Text(
            value,
            style: AppTypography.bodySm(colors.textSecondary),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

class _PriorityBadge extends StatelessWidget {
  final String priority;
  final VelaColorScheme colors;

  const _PriorityBadge({required this.priority, required this.colors});

  @override
  Widget build(BuildContext context) {
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
        horizontal: AppSpacing.s2,
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
}
