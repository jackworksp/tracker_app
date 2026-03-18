import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_borders.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/date_utils.dart';
import '../../../data/models/task.dart';
import '../../../providers/tasks_provider.dart';
import '../../../services/notification_service.dart';
import '../../widgets/vela_button.dart';
import '../../widgets/vela_input.dart';

class AddTaskModal extends ConsumerStatefulWidget {
  final int? subjectId;
  final VoidCallback onCreated;
  /// When provided, the modal runs in edit mode — fields are pre-filled and
  /// submission calls update instead of create.
  final Task? existingTask;

  const AddTaskModal({
    super.key,
    this.subjectId,
    required this.onCreated,
    this.existingTask,
  });

  @override
  ConsumerState<AddTaskModal> createState() => _AddTaskModalState();
}

class _AddTaskModalState extends ConsumerState<AddTaskModal> {
  final _titleController = TextEditingController();
  final _urlController = TextEditingController();
  final _contentController = TextEditingController();
  final _tagsController = TextEditingController();
  String _selectedType = 'TASK';
  bool _isLoading = false;
  String? _errorMessage;

  // ---------------------------------------------------------------------------
  // Reminder state
  // ---------------------------------------------------------------------------
  bool _reminderEnabled = false;
  DateTime? _reminderDateTime;
  String _alertType = 'basic'; // 'basic' | 'silent'

  static const _types = ['TASK', 'WATCH', 'READ', 'NOTE'];
  static const _alertTypes = ['basic', 'silent'];

  @override
  void initState() {
    super.initState();
    // Pre-fill fields when editing an existing task.
    final t = widget.existingTask;
    if (t != null) {
      _titleController.text = t.title;
      _urlController.text = t.url ?? '';
      _contentController.text = t.content ?? '';
      _tagsController.text = t.tags.join(', ');
      _selectedType = t.type;

      // Pre-fill reminder if one exists
      if (t.reminderTime != null) {
        _reminderEnabled = true;
        _reminderDateTime = t.reminderTime;
        _alertType = t.alertType ?? 'basic';
      }
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _urlController.dispose();
    _contentController.dispose();
    _tagsController.dispose();
    super.dispose();
  }

  /// Returns null if valid, or an error message string if invalid.
  String? _validateUrl(String url) {
    if (url.isEmpty) return null;
    final uri = Uri.tryParse(url);
    if (uri == null || !uri.hasScheme || (!uri.scheme.startsWith('http') && uri.scheme != 'https')) {
      return 'URL must start with http:// or https://';
    }
    if (!uri.hasAuthority || uri.host.isEmpty) {
      return 'URL must include a valid host';
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Reminder date/time picker
  // ---------------------------------------------------------------------------
  Future<void> _pickReminderDateTime() async {
    final now = DateTime.now();
    final initialDate = _reminderDateTime ?? now.add(const Duration(hours: 1));

    final pickedDate = await showDatePicker(
      context: context,
      initialDate: initialDate.isAfter(now) ? initialDate : now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365 * 5)),
    );
    if (pickedDate == null || !mounted) return;

    final pickedTime = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initialDate),
    );
    if (pickedTime == null || !mounted) return;

    setState(() {
      _reminderDateTime = DateTime(
        pickedDate.year,
        pickedDate.month,
        pickedDate.day,
        pickedTime.hour,
        pickedTime.minute,
      );
    });
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  Future<void> _handleSubmit() async {
    if (_titleController.text.trim().isEmpty) return;

    final urlRaw = _urlController.text.trim();
    final urlError = _validateUrl(urlRaw);
    if (urlError != null) {
      setState(() => _errorMessage = urlError);
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      // Fix 5: Tags — split on comma, strip all surrounding whitespace,
      // collapse any internal runs of whitespace, drop empties.
      final tags = _tagsController.text.trim().isEmpty
          ? <String>[]
          : _tagsController.text
              .split(',')
              .map((t) => t.trim().replaceAll(RegExp(r'\s+'), ' '))
              .where((t) => t.isNotEmpty)
              .toList();

      final data = {
        'title': _titleController.text.trim(),
        'type': _selectedType,
        'url': urlRaw.isEmpty ? null : urlRaw,
        'content': _contentController.text.trim().isEmpty
            ? null
            : _contentController.text.trim(),
        'tags': tags,
        if (widget.subjectId != null) 'subject_id': widget.subjectId,
      };

      final notifier = ref.read(tasksProvider.notifier);
      final isEditing = widget.existingTask != null;

      Task resultTask;
      if (isEditing) {
        await notifier.updateTask(widget.existingTask!.id, data);
        // Grab the updated task from state
        resultTask = ref
            .read(tasksProvider)
            .tasks
            .firstWhere((t) => t.id == widget.existingTask!.id);
      } else {
        resultTask = await notifier.createTask(data);
      }

      // Handle reminder
      if (_reminderEnabled && _reminderDateTime != null) {
        // Set reminder via API then reschedule the local notification.
        resultTask = await notifier.setReminder(
          resultTask.id,
          _reminderDateTime!,
          _alertType,
        );
        await NotificationService().scheduleReminder(resultTask);
      } else if (!_reminderEnabled && isEditing && widget.existingTask!.reminderTime != null) {
        // Switch turned OFF while editing — remove the existing reminder.
        await notifier.removeReminder(resultTask.id);
        await NotificationService().cancelReminder(resultTask.id);
      }

      widget.onCreated();
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = widget.existingTask != null
            ? 'Failed to update task. Please try again.'
            : 'Failed to create task. Please try again.';
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return Padding(
      padding: EdgeInsets.only(
        left: AppSpacing.s6,
        right: AppSpacing.s6,
        top: AppSpacing.s6,
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.s6,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
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
            Text(
              widget.existingTask != null ? 'Edit Task' : 'Add Task',
              style: AppTypography.headingXl(colors.textPrimary),
            ),
            const SizedBox(height: AppSpacing.s5),
            // Type selector
            Text(
              'Type',
              style: AppTypography.bodySmMedium(colors.textPrimary),
            ),
            const SizedBox(height: AppSpacing.s2),
            Row(
              children: _types.map((type) {
                final isSelected = type == _selectedType;
                final color = switch (type) {
                  'WATCH' => colors.taskTypeWatch,
                  'READ' => colors.taskTypeRead,
                  'NOTE' => colors.taskTypeNote,
                  _ => colors.brandAccent,
                };
                return Padding(
                  padding: const EdgeInsets.only(right: AppSpacing.s2),
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedType = type),
                    child: Container(
                      constraints: const BoxConstraints(minHeight: 44),
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.s3,
                        vertical: AppSpacing.s1 + AppSpacing.s0_5, // 6px
                      ),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? color.withValues(alpha: 0.15)
                            : Colors.transparent,
                        borderRadius: AppBorders.md,
                        border: Border.all(
                          color: isSelected ? color : colors.surfaceBorder,
                        ),
                      ),
                      child: Text(
                        type,
                        style: AppTypography.bodySmMedium(
                          isSelected ? color : colors.textSecondary,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: AppSpacing.s4),
            VelaInput(
              label: 'Title',
              placeholder: 'Enter task title',
              controller: _titleController,
              required: true,
            ),
            const SizedBox(height: AppSpacing.s4),
            VelaInput(
              label: 'URL',
              placeholder: 'https://...',
              controller: _urlController,
              keyboardType: TextInputType.url,
            ),
            const SizedBox(height: AppSpacing.s4),
            VelaInput(
              label: 'Content',
              placeholder: 'Optional description...',
              controller: _contentController,
              maxLines: 3,
            ),
            const SizedBox(height: AppSpacing.s4),
            VelaInput(
              label: 'Tags',
              placeholder: 'tag1, tag2, tag3',
              controller: _tagsController,
            ),
            const SizedBox(height: AppSpacing.s4),

            // ------------------------------------------------------------------
            // Reminder section
            // ------------------------------------------------------------------
            _ReminderSection(
              colors: colors,
              reminderEnabled: _reminderEnabled,
              reminderDateTime: _reminderDateTime,
              alertType: _alertType,
              alertTypes: _alertTypes,
              onToggle: (value) => setState(() {
                _reminderEnabled = value;
                if (!value) _reminderDateTime = null;
              }),
              onPickDateTime: _pickReminderDateTime,
              onAlertTypeChanged: (value) =>
                  setState(() => _alertType = value),
            ),

            const SizedBox(height: AppSpacing.s6),
            // Error feedback banner
            if (_errorMessage != null) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.s4,
                  vertical: AppSpacing.s3,
                ),
                decoration: BoxDecoration(
                  color: colors.stateErrorBg,
                  borderRadius: AppBorders.md,
                  border: Border.all(color: colors.stateError.withValues(alpha: 0.4)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, size: 16, color: colors.stateError),
                    const SizedBox(width: AppSpacing.s2),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: AppTypography.bodySm(colors.stateError),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.s4),
            ],
            VelaButton(
              variant: VelaButtonVariant.primary,
              size: VelaButtonSize.lg,
              fullWidth: true,
              loading: _isLoading,
              onPressed: _handleSubmit,
              child: Text(
                widget.existingTask != null ? 'Save Changes' : 'Create Task',
              ),
            ),
            const SizedBox(height: AppSpacing.s2),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// _ReminderSection — extracted private widget for clarity
// ---------------------------------------------------------------------------

class _ReminderSection extends StatelessWidget {
  final VelaColorScheme colors;
  final bool reminderEnabled;
  final DateTime? reminderDateTime;
  final String alertType;
  final List<String> alertTypes;
  final ValueChanged<bool> onToggle;
  final VoidCallback onPickDateTime;
  final ValueChanged<String> onAlertTypeChanged;

  const _ReminderSection({
    required this.colors,
    required this.reminderEnabled,
    required this.reminderDateTime,
    required this.alertType,
    required this.alertTypes,
    required this.onToggle,
    required this.onPickDateTime,
    required this.onAlertTypeChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Toggle row
        Row(
          children: [
            Icon(
              Icons.notifications_outlined,
              size: AppSpacing.s5,
              color: reminderEnabled ? colors.stateWarning : colors.textTertiary,
            ),
            const SizedBox(width: AppSpacing.s2),
            Text(
              'Set Reminder',
              style: AppTypography.bodySmMedium(
                reminderEnabled ? colors.textPrimary : colors.textSecondary,
              ),
            ),
            const Spacer(),
            Switch(
              value: reminderEnabled,
              onChanged: onToggle,
              activeColor: colors.brandAccent,
            ),
          ],
        ),

        // Date/time picker row — visible only when toggle is ON
        if (reminderEnabled) ...[
          const SizedBox(height: AppSpacing.s3),
          GestureDetector(
            onTap: onPickDateTime,
            child: Container(
              width: double.infinity,
              // Ensure 44px minimum touch target height
              constraints: const BoxConstraints(minHeight: 44),
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.s4,
                vertical: AppSpacing.s3,
              ),
              decoration: BoxDecoration(
                border: Border.all(color: colors.surfaceBorder),
                borderRadius: AppBorders.md,
                color: colors.surfaceCard,
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.calendar_today_outlined,
                    size: AppSpacing.s4,
                    color: colors.textTertiary,
                  ),
                  const SizedBox(width: AppSpacing.s2),
                  Text(
                    reminderDateTime != null
                        ? VelaDateUtils.formatDateTime(reminderDateTime!)
                        : 'Tap to choose date & time',
                    style: AppTypography.bodySm(
                      reminderDateTime != null
                          ? colors.textPrimary
                          : colors.textTertiary,
                    ),
                  ),
                  const Spacer(),
                  Icon(
                    Icons.chevron_right,
                    size: AppSpacing.s5,
                    color: colors.textTertiary,
                  ),
                ],
              ),
            ),
          ),

          // Alert type chip row
          const SizedBox(height: AppSpacing.s3),
          Row(
            children: alertTypes.map((type) {
              final isSelected = alertType == type;
              final label = type[0].toUpperCase() + type.substring(1);
              return Padding(
                padding: const EdgeInsets.only(right: AppSpacing.s2),
                child: GestureDetector(
                  onTap: () => onAlertTypeChanged(type),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    constraints: const BoxConstraints(minHeight: 44, minWidth: 72),
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.s4,
                      vertical: AppSpacing.s2,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? colors.brandAccent.withValues(alpha: 0.15)
                          : colors.surfaceCard,
                      borderRadius: AppBorders.full,
                      border: Border.all(
                        color: isSelected
                            ? colors.brandAccent
                            : colors.surfaceBorder,
                      ),
                    ),
                    child: Center(
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
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ],
    );
  }
}
