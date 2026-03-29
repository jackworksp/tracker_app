import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/constants/activity_types.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/study_session.dart';
import '../../../providers/progress_provider.dart';
import '../../widgets/vela_button.dart';
import '../../widgets/vela_input.dart';
import '../../widgets/vela_text_area.dart';

class AddSessionModal extends ConsumerStatefulWidget {
  final int subjectId;
  final StudySession? session;
  final VoidCallback? onSaved;

  const AddSessionModal({
    super.key,
    required this.subjectId,
    this.session,
    this.onSaved,
  });

  @override
  ConsumerState<AddSessionModal> createState() => _AddSessionModalState();
}

class _AddSessionModalState extends ConsumerState<AddSessionModal> {
  final _activityController = TextEditingController();
  final _urlController = TextEditingController();
  final _topicsController = TextEditingController();
  final _notesController = TextEditingController();

  ActivityType _selectedType = ActivityType.study;
  double _timeSpentMinutes = 30;
  DateTime _selectedDate = DateTime.now();
  bool _isSubmitting = false;

  bool get _isEditing => widget.session != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      final s = widget.session!;
      _activityController.text = s.activity ?? '';
      _urlController.text = s.url ?? '';
      _topicsController.text = s.topicsCovered ?? '';
      _notesController.text = s.notes ?? '';
      _selectedType = ActivityType.fromString(s.type);
      _timeSpentMinutes = s.timeSpent.toDouble();
      _selectedDate = DateTime.tryParse(s.date) ?? DateTime.now();
    }
  }

  @override
  void dispose() {
    _activityController.dispose();
    _urlController.dispose();
    _topicsController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      decoration: BoxDecoration(
        color: colors.surfaceDefault,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: colors.surfaceBorder,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _isEditing ? 'Edit Activity' : 'Log Activity',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: colors.textPrimary,
                  ),
                ),
                // Issue 04: close button with ≥ 44×44px touch target (WCAG 2.5.5)
                Semantics(
                  label: 'Close',
                  button: true,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(8),
                    onTap: () => Navigator.pop(context),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(
                        minWidth: 44,
                        minHeight: 44,
                      ),
                      child: Icon(Icons.close,
                          size: 20, color: colors.textSecondary),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),
          Divider(height: 1, color: colors.surfaceBorder),

          // Form body
          Flexible(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + bottomInset),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Activity input
                  VelaInput(
                    label: 'Activity / Title',
                    placeholder: 'What did you work on?',
                    controller: _activityController,
                    required: true,
                  ),
                  const SizedBox(height: 20),

                  // Activity type selector
                  Text(
                    'Type',
                    style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: ActivityType.values.map((type) {
                      final isSelected = _selectedType == type;
                      return GestureDetector(
                        onTap: () => setState(() => _selectedType = type),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? colors.interactiveSelected
                                : colors.surfaceCard,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isSelected
                                  ? colors.brandAccent
                                  : colors.surfaceBorder,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                type.icon,
                                size: 16,
                                color: isSelected
                                    ? colors.brandAccent
                                    : colors.textSecondary,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                type.label,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: isSelected
                                      ? colors.brandAccent
                                      : colors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 20),

                  // Time spent slider
                  Text(
                    'Time Spent',
                    style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: SliderTheme(
                          data: SliderTheme.of(context).copyWith(
                            activeTrackColor: colors.brandAccent,
                            inactiveTrackColor: colors.surfaceBorder,
                            thumbColor: colors.brandAccent,
                            overlayColor: colors.brandAccent.withOpacity(0.2),
                            trackHeight: 4,
                          ),
                          child: Slider(
                            value: _timeSpentMinutes,
                            min: 5,
                            max: 480,
                            divisions: 95,
                            onChanged: (v) =>
                                setState(() => _timeSpentMinutes = v),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: colors.surfaceCard,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: colors.surfaceBorder),
                        ),
                        child: Text(
                          _formatSliderMinutes(_timeSpentMinutes.round()),
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: colors.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Date picker
                  Text(
                    'Date',
                    style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: _pickDate,
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 12),
                      decoration: BoxDecoration(
                        color: colors.surfaceDefault,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: colors.surfaceBorder),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.calendar_today,
                              size: 16, color: colors.textTertiary),
                          const SizedBox(width: 10),
                          Text(
                            DateFormat('EEEE, MMM d, yyyy')
                                .format(_selectedDate),
                            style: TextStyle(
                              fontSize: 15,
                              color: colors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // URL input
                  VelaInput(
                    label: 'URL (optional)',
                    placeholder: 'https://...',
                    controller: _urlController,
                    keyboardType: TextInputType.url,
                    leftIcon: const Icon(Icons.link),
                  ),
                  const SizedBox(height: 20),

                  // Topics input
                  VelaInput(
                    label: 'Topics',
                    placeholder: 'e.g. React Hooks, State Management',
                    helperText: 'Separate topics with commas',
                    controller: _topicsController,
                    leftIcon: const Icon(Icons.label_outline),
                  ),
                  const SizedBox(height: 20),

                  // Notes textarea
                  VelaTextArea(
                    label: 'Notes',
                    placeholder: 'Any notes about this activity...',
                    controller: _notesController,
                    minLines: 3,
                    maxLines: 6,
                  ),
                  const SizedBox(height: 28),

                  // Submit button
                  VelaButton(
                    variant: VelaButtonVariant.primary,
                    fullWidth: true,
                    size: VelaButtonSize.lg,
                    loading: _isSubmitting,
                    onPressed: _isSubmitting ? null : _submit,
                    child:
                        Text(_isEditing ? 'Update Activity' : 'Log Activity'),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatSliderMinutes(int minutes) {
    final h = minutes ~/ 60;
    final m = minutes % 60;
    if (h == 0) return '${m}m';
    if (m == 0) return '${h}h';
    return '${h}h ${m}m';
  }

  Future<void> _pickDate() async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).colorScheme.copyWith(
                  primary: colors.brandAccent,
                  onPrimary: colors.textInverse,
                  surface: colors.surfaceDefault,
                  onSurface: colors.textPrimary,
                ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _submit() async {
    final activity = _activityController.text.trim();
    if (activity.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an activity title')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    final dayStr = DateFormat('EEEE').format(_selectedDate);

    final data = {
      'subject_id': widget.subjectId,
      'activity': activity,
      'type': _selectedType.value,
      'time_spent': _timeSpentMinutes.round(),
      'date': dateStr,
      'day': dayStr,
      'url': _urlController.text.trim().isEmpty
          ? null
          : _urlController.text.trim(),
      'topics_covered': _topicsController.text.trim().isEmpty
          ? null
          : _topicsController.text.trim(),
      'notes': _notesController.text.trim().isEmpty
          ? null
          : _notesController.text.trim(),
    };

    try {
      final repo = ref.read(progressRepositoryProvider);
      if (_isEditing) {
        await repo.updateSession(widget.session!.id, data);
      } else {
        await repo.createSession(data);
      }
      widget.onSaved?.call();
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save session: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }
}
