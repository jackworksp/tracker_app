import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_borders.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/important_date.dart';
import '../../../providers/important_dates_provider.dart';

class ImportantDatesScreen extends ConsumerStatefulWidget {
  const ImportantDatesScreen({super.key});

  @override
  ConsumerState<ImportantDatesScreen> createState() =>
      _ImportantDatesScreenState();
}

class _ImportantDatesScreenState extends ConsumerState<ImportantDatesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(importantDatesProvider.notifier).loadDates();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final state = ref.watch(importantDatesProvider);

    return Scaffold(
      backgroundColor: colors.bgPrimary,
      floatingActionButton: FloatingActionButton(
        backgroundColor: colors.brandAccent,
        foregroundColor: colors.brandOnPrimary,
        onPressed: () => _showDateSheet(context, colors),
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        color: colors.brandAccent,
        onRefresh: () => ref.read(importantDatesProvider.notifier).loadDates(),
        child: CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.s4,
                AppSpacing.s4,
                AppSpacing.s4,
                AppSpacing.s2,
              ),
              sliver: SliverToBoxAdapter(
                child: _Header(colors: colors),
              ),
            ),
            if (state.isLoading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )
            else if (state.error != null)
              SliverFillRemaining(
                child: _MessageState(
                  colors: colors,
                  icon: Icons.error_outline,
                  title: 'Could not load dates',
                  subtitle: state.error!,
                ),
              )
            else if (state.dates.isEmpty)
              SliverFillRemaining(
                child: _MessageState(
                  colors: colors,
                  icon: Icons.event_available_outlined,
                  title: 'No important dates yet',
                  subtitle: 'Add exams, deadlines, birthdays, renewals, or milestones.',
                ),
              )
            else
              ..._buildDateGroups(colors, state.dates),
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

  List<Widget> _buildDateGroups(
    VelaColorScheme colors,
    List<ImportantDate> dates,
  ) {
    final grouped = <String, List<ImportantDate>>{};
    for (final date in dates) {
      final key = DateFormat('MMMM yyyy').format(date.displayDate);
      grouped.putIfAbsent(key, () => []).add(date);
    }

    return grouped.entries.map((entry) {
      return SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s4),
        sliver: SliverToBoxAdapter(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(
                  top: AppSpacing.s5,
                  bottom: AppSpacing.s2,
                ),
                child: Text(
                  entry.key,
                  style: AppTypography.labelBase(colors.textTertiary),
                ),
              ),
              ...entry.value.map(
                (date) => Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.s3),
                  child: _ImportantDateCard(
                    date: date,
                    colors: colors,
                    onTap: () => _showDateSheet(context, colors, existing: date),
                    onDelete: () => _deleteDate(date),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }).toList();
  }

  Future<void> _deleteDate(ImportantDate date) async {
    await ref.read(importantDatesProvider.notifier).deleteDate(date.id);
  }

  Future<void> _showDateSheet(
    BuildContext context,
    VelaColorScheme colors, {
    ImportantDate? existing,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: colors.surfaceDefault,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      builder: (sheetContext) {
        return _ImportantDateForm(
          colors: colors,
          existing: existing,
          onSubmit: (data) async {
            final notifier = ref.read(importantDatesProvider.notifier);
            if (existing == null) {
              await notifier.createDate(data);
            } else {
              await notifier.updateDate(existing.id, data);
            }
            if (sheetContext.mounted) Navigator.pop(sheetContext);
          },
        );
      },
    );
  }
}

class _Header extends StatelessWidget {
  final VelaColorScheme colors;

  const _Header({required this.colors});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: colors.stateWarningBg,
                borderRadius: AppBorders.lg,
              ),
              child: Icon(Icons.event_note_outlined, color: colors.brandAccent),
            ),
            const SizedBox(width: AppSpacing.s3),
            Expanded(
              child: Text(
                'Important Dates',
                style: AppTypography.heading2xl(colors.textPrimary),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.s2),
        Text(
          'Track exams, deadlines, birthdays, renewals, appointments, and milestones.',
          style: AppTypography.bodySm(colors.textSecondary),
        ),
      ],
    );
  }
}

class _ImportantDateCard extends StatelessWidget {
  final ImportantDate date;
  final VelaColorScheme colors;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _ImportantDateCard({
    required this.date,
    required this.colors,
    required this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final day = DateFormat('d').format(date.displayDate);
    final month = DateFormat('MMM').format(date.displayDate).toUpperCase();
    final subtitle = [
      _categoryLabel(date.category),
      if (date.time != null) _formatTime(date.time!),
      if (date.repeatsYearly) 'Yearly',
    ].join(' - ');

    return Material(
      color: colors.surfaceCard,
      borderRadius: AppBorders.lg,
      child: InkWell(
        onTap: onTap,
        borderRadius: AppBorders.lg,
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.s4),
          decoration: BoxDecoration(
            borderRadius: AppBorders.lg,
            border: Border.all(color: colors.surfaceBorder),
          ),
          child: Row(
            children: [
              Container(
                width: 54,
                height: 58,
                decoration: BoxDecoration(
                  color: colors.interactiveSelected,
                  borderRadius: AppBorders.md,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(day, style: AppTypography.headingLg(colors.textPrimary)),
                    Text(month, style: AppTypography.labelSm(colors.textTertiary)),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.s3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      date.title,
                      style: AppTypography.bodySmSemibold(colors.textPrimary),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: AppSpacing.s1),
                    Text(
                      subtitle,
                      style: AppTypography.bodyXs(colors.textSecondary),
                    ),
                    if (date.description?.isNotEmpty == true) ...[
                      const SizedBox(height: AppSpacing.s1),
                      Text(
                        date.description!,
                        style: AppTypography.bodyXs(colors.textTertiary),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              PopupMenuButton<String>(
                icon: Icon(Icons.more_vert, color: colors.textTertiary),
                color: colors.surfaceElevated,
                onSelected: (value) {
                  if (value == 'delete') onDelete();
                },
                itemBuilder: (context) => [
                  PopupMenuItem(
                    value: 'delete',
                    child: Text(
                      'Delete',
                      style: TextStyle(color: colors.stateError),
                    ),
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

class _ImportantDateForm extends StatefulWidget {
  final VelaColorScheme colors;
  final ImportantDate? existing;
  final Future<void> Function(Map<String, dynamic> data) onSubmit;

  const _ImportantDateForm({
    required this.colors,
    required this.existing,
    required this.onSubmit,
  });

  @override
  State<_ImportantDateForm> createState() => _ImportantDateFormState();
}

class _ImportantDateFormState extends State<_ImportantDateForm> {
  late final TextEditingController _titleController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _taskIdController;
  late final TextEditingController _goalIdController;
  late String _category;
  late DateTime _date;
  TimeOfDay? _time;
  late bool _repeatsYearly;
  late Set<int> _offsets;
  bool _saving = false;
  String? _error;

  static const _categories = [
    'exam',
    'deadline',
    'birthday',
    'renewal',
    'appointment',
    'milestone',
    'other',
  ];

  @override
  void initState() {
    super.initState();
    final existing = widget.existing;
    _titleController = TextEditingController(text: existing?.title ?? '');
    _descriptionController =
        TextEditingController(text: existing?.description ?? '');
    _taskIdController =
        TextEditingController(text: existing?.taskId?.toString() ?? '');
    _goalIdController =
        TextEditingController(text: existing?.goalId?.toString() ?? '');
    _category = existing?.category ?? 'other';
    _date = existing?.date ?? DateTime.now();
    _time = existing?.time != null ? _parseTimeOfDay(existing!.time!) : null;
    _repeatsYearly = existing?.repeatsYearly ?? false;
    _offsets = {...(existing?.reminderOffsetsDays ?? const [7, 1, 0])};
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _taskIdController.dispose();
    _goalIdController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = widget.colors;
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: AppSpacing.s4,
          right: AppSpacing.s4,
          top: AppSpacing.s4,
          bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.s4,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      widget.existing == null ? 'Add Date' : 'Edit Date',
                      style: AppTypography.headingXl(colors.textPrimary),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(Icons.close, color: colors.textSecondary),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.s4),
              _textField(
                controller: _titleController,
                label: 'Title',
                colors: colors,
              ),
              const SizedBox(height: AppSpacing.s3),
              _textField(
                controller: _descriptionController,
                label: 'Description',
                colors: colors,
                maxLines: 3,
              ),
              const SizedBox(height: AppSpacing.s3),
              DropdownButtonFormField<String>(
                value: _category,
                dropdownColor: colors.surfaceElevated,
                decoration: _inputDecoration('Category', colors),
                items: _categories
                    .map(
                      (category) => DropdownMenuItem(
                        value: category,
                        child: Text(_categoryLabel(category)),
                      ),
                    )
                    .toList(),
                onChanged: (value) {
                  if (value != null) setState(() => _category = value);
                },
              ),
              const SizedBox(height: AppSpacing.s3),
              Row(
                children: [
                  Expanded(
                    child: _PickerTile(
                      colors: colors,
                      icon: Icons.calendar_today_outlined,
                      label: DateFormat('MMM d, yyyy').format(_date),
                      onTap: _pickDate,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.s2),
                  Expanded(
                    child: _PickerTile(
                      colors: colors,
                      icon: Icons.schedule,
                      label: _time == null ? 'No time' : _time!.format(context),
                      onTap: _pickTime,
                      onLongPress: () => setState(() => _time = null),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.s3),
              SwitchListTile(
                value: _repeatsYearly,
                contentPadding: EdgeInsets.zero,
                activeColor: colors.brandAccent,
                title: Text(
                  'Repeat yearly',
                  style: AppTypography.bodySmMedium(colors.textPrimary),
                ),
                onChanged: (value) => setState(() => _repeatsYearly = value),
              ),
              const SizedBox(height: AppSpacing.s2),
              Text('Reminders', style: AppTypography.bodySmMedium(colors.textPrimary)),
              const SizedBox(height: AppSpacing.s2),
              Wrap(
                spacing: AppSpacing.s2,
                children: [
                  _offsetChip(7, '7 days before', colors),
                  _offsetChip(1, '1 day before', colors),
                  _offsetChip(0, 'Same day', colors),
                ],
              ),
              const SizedBox(height: AppSpacing.s4),
              Row(
                children: [
                  Expanded(
                    child: _textField(
                      controller: _taskIdController,
                      label: 'Task ID (optional)',
                      colors: colors,
                      keyboardType: TextInputType.number,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.s2),
                  Expanded(
                    child: _textField(
                      controller: _goalIdController,
                      label: 'Goal ID (optional)',
                      colors: colors,
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ],
              ),
              if (_error != null) ...[
                const SizedBox(height: AppSpacing.s3),
                Text(_error!, style: AppTypography.bodySm(colors.stateError)),
              ],
              const SizedBox(height: AppSpacing.s5),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: colors.brandAccent,
                    foregroundColor: colors.brandOnPrimary,
                    shape: RoundedRectangleBorder(borderRadius: AppBorders.md),
                  ),
                  onPressed: _saving ? null : _submit,
                  child: _saving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(widget.existing == null ? 'Create Date' : 'Save Date'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _textField({
    required TextEditingController controller,
    required String label,
    required VelaColorScheme colors,
    int maxLines = 1,
    TextInputType? keyboardType,
  }) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      style: AppTypography.bodySm(colors.textPrimary),
      decoration: _inputDecoration(label, colors),
    );
  }

  InputDecoration _inputDecoration(String label, VelaColorScheme colors) {
    return InputDecoration(
      labelText: label,
      labelStyle: TextStyle(color: colors.textTertiary),
      filled: true,
      fillColor: colors.surfaceCard,
      enabledBorder: OutlineInputBorder(
        borderRadius: AppBorders.md,
        borderSide: BorderSide(color: colors.surfaceBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: AppBorders.md,
        borderSide: BorderSide(color: colors.brandAccent),
      ),
    );
  }

  Widget _offsetChip(int value, String label, VelaColorScheme colors) {
    final selected = _offsets.contains(value);
    return FilterChip(
      selected: selected,
      label: Text(label),
      selectedColor: colors.interactiveSelected,
      checkmarkColor: colors.brandAccent,
      labelStyle: AppTypography.bodyXs(
        selected ? colors.brandAccent : colors.textSecondary,
      ),
      onSelected: (isSelected) {
        setState(() {
          if (isSelected) {
            _offsets.add(value);
          } else {
            _offsets.remove(value);
          }
        });
      },
    );
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _time ?? const TimeOfDay(hour: 9, minute: 0),
    );
    if (picked != null) setState(() => _time = picked);
  }

  Future<void> _submit() async {
    if (_titleController.text.trim().isEmpty) {
      setState(() => _error = 'Title is required.');
      return;
    }
    if (_offsets.isEmpty) {
      setState(() => _error = 'Choose at least one reminder.');
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      await widget.onSubmit({
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'category': _category,
        'date': _date.toIso8601String().split('T').first,
        'time': _time == null
            ? null
            : '${_time!.hour.toString().padLeft(2, '0')}:${_time!.minute.toString().padLeft(2, '0')}',
        'recurrence': _repeatsYearly ? 'yearly' : 'none',
        'reminder_offsets_days': (_offsets.toList()..sort((a, b) => b.compareTo(a))),
        'task_id': int.tryParse(_taskIdController.text.trim()),
        'goal_id': int.tryParse(_goalIdController.text.trim()),
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _saving = false;
          _error = e.toString();
        });
      }
    }
  }

  TimeOfDay _parseTimeOfDay(String time) {
    final parts = time.split(':').map(int.parse).toList();
    return TimeOfDay(hour: parts[0], minute: parts[1]);
  }
}

class _PickerTile extends StatelessWidget {
  final VelaColorScheme colors;
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;

  const _PickerTile({
    required this.colors,
    required this.icon,
    required this.label,
    required this.onTap,
    this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: colors.surfaceCard,
      borderRadius: AppBorders.md,
      child: InkWell(
        onTap: onTap,
        onLongPress: onLongPress,
        borderRadius: AppBorders.md,
        child: Container(
          constraints: const BoxConstraints(minHeight: AppSpacing.minTouchTarget),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.s3,
            vertical: AppSpacing.s2,
          ),
          decoration: BoxDecoration(
            borderRadius: AppBorders.md,
            border: Border.all(color: colors.surfaceBorder),
          ),
          child: Row(
            children: [
              Icon(icon, size: 18, color: colors.textTertiary),
              const SizedBox(width: AppSpacing.s2),
              Expanded(
                child: Text(
                  label,
                  style: AppTypography.bodySm(colors.textPrimary),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MessageState extends StatelessWidget {
  final VelaColorScheme colors;
  final IconData icon;
  final String title;
  final String subtitle;

  const _MessageState({
    required this.colors,
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.s6),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 42, color: colors.textTertiary),
          const SizedBox(height: AppSpacing.s3),
          Text(title, style: AppTypography.headingLg(colors.textPrimary)),
          const SizedBox(height: AppSpacing.s2),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: AppTypography.bodySm(colors.textSecondary),
          ),
        ],
      ),
    );
  }
}

String _categoryLabel(String category) {
  return switch (category) {
    'exam' => 'Exam',
    'deadline' => 'Deadline',
    'birthday' => 'Birthday',
    'renewal' => 'Renewal',
    'appointment' => 'Appointment',
    'milestone' => 'Milestone',
    _ => 'Other',
  };
}

String _formatTime(String time) {
  final parts = time.split(':').map(int.parse).toList();
  final date = DateTime(2000, 1, 1, parts[0], parts[1]);
  return DateFormat('h:mm a').format(date);
}
