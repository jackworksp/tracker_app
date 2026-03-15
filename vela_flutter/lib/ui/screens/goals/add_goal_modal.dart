import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../providers/goals_provider.dart';

class AddGoalModal extends ConsumerStatefulWidget {
  final Goal? editGoal;

  const AddGoalModal({super.key, this.editGoal});

  @override
  ConsumerState<AddGoalModal> createState() => _AddGoalModalState();
}

class _AddGoalModalState extends ConsumerState<AddGoalModal> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _targetHoursController = TextEditingController();

  String _selectedCategory = 'PERSONAL';
  String _selectedStatus = 'PLANNING';
  DateTime? _targetDate;
  bool _isSubmitting = false;
  String? _titleError;

  static const _categories = [
    'PERSONAL',
    'CAREER',
    'EDUCATION',
    'HEALTH',
    'FINANCE',
    'OTHER',
  ];

  static const _statuses = [
    'PLANNING',
    'IN_PROGRESS',
    'ON_HOLD',
    'COMPLETED',
  ];

  bool get _isEditing => widget.editGoal != null;

  @override
  void initState() {
    super.initState();
    if (widget.editGoal != null) {
      final g = widget.editGoal!;
      _titleController.text = g.title;
      _descriptionController.text = g.description ?? '';
      _targetHoursController.text = g.targetHours.toString();
      _selectedCategory = g.category;
      _selectedStatus = g.status;
      if (g.targetDate != null && g.targetDate!.isNotEmpty) {
        try {
          _targetDate = DateTime.parse(g.targetDate!);
        } catch (_) {}
      }
    } else {
      _targetHoursController.text = '100';
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _targetHoursController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: BoxDecoration(
        color: colors.surfaceElevated,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Padding(
        padding: EdgeInsets.only(bottom: bottomInset),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
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
              const SizedBox(height: 20),
              // Title
              Text(
                _isEditing ? 'Edit Goal' : 'Add New Goal',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: colors.textPrimary,
                ),
              ),
              const SizedBox(height: 24),

              // Title input
              _buildLabel('Title', colors, isRequired: true),
              const SizedBox(height: 6),
              TextField(
                controller: _titleController,
                style: TextStyle(color: colors.textPrimary, fontSize: 16),
                decoration: _inputDecoration(
                  colors,
                  placeholder: 'Enter goal title',
                  hasError: _titleError != null,
                ),
                onChanged: (_) {
                  if (_titleError != null) setState(() => _titleError = null);
                },
              ),
              if (_titleError != null) ...[
                const SizedBox(height: 4),
                Text(_titleError!, style: TextStyle(color: colors.stateError, fontSize: 12)),
              ],
              const SizedBox(height: 20),

              // Description
              _buildLabel('Description', colors),
              const SizedBox(height: 6),
              TextField(
                controller: _descriptionController,
                minLines: 3,
                maxLines: 5,
                style: TextStyle(color: colors.textPrimary, fontSize: 16),
                decoration: _inputDecoration(colors, placeholder: 'Describe your goal...'),
              ),
              const SizedBox(height: 20),

              // Category
              _buildLabel('Category', colors),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _categories.map((cat) {
                  final isSelected = _selectedCategory == cat;
                  return _buildChip(
                    label: cat,
                    isSelected: isSelected,
                    colors: colors,
                    onTap: () => setState(() => _selectedCategory = cat),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),

              // Status
              _buildLabel('Status', colors),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _statuses.map((status) {
                  final isSelected = _selectedStatus == status;
                  return _buildChip(
                    label: status.replaceAll('_', ' '),
                    isSelected: isSelected,
                    colors: colors,
                    onTap: () => setState(() => _selectedStatus = status),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),

              // Target date
              _buildLabel('Target Date', colors),
              const SizedBox(height: 6),
              GestureDetector(
                onTap: _pickDate,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                  decoration: BoxDecoration(
                    color: colors.surfaceDefault,
                    border: Border.all(color: colors.surfaceBorder),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.calendar_today, size: 16, color: colors.textTertiary),
                      const SizedBox(width: 10),
                      Text(
                        _targetDate != null
                            ? '${_targetDate!.year}-${_targetDate!.month.toString().padLeft(2, '0')}-${_targetDate!.day.toString().padLeft(2, '0')}'
                            : 'Select a date',
                        style: TextStyle(
                          fontSize: 16,
                          color: _targetDate != null ? colors.textPrimary : colors.textTertiary,
                        ),
                      ),
                      const Spacer(),
                      if (_targetDate != null)
                        GestureDetector(
                          onTap: () => setState(() => _targetDate = null),
                          child: Icon(Icons.close, size: 18, color: colors.textTertiary),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Target hours
              _buildLabel('Target Hours', colors),
              const SizedBox(height: 6),
              TextField(
                controller: _targetHoursController,
                keyboardType: TextInputType.number,
                style: TextStyle(color: colors.textPrimary, fontSize: 16),
                decoration: _inputDecoration(colors, placeholder: '100'),
              ),
              const SizedBox(height: 32),

              // Submit button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: colors.brandAccent,
                    foregroundColor: colors.textInverse,
                    disabledBackgroundColor: colors.brandAccent.withOpacity(0.4),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isSubmitting
                      ? SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: colors.textInverse,
                          ),
                        )
                      : Text(
                          _isEditing ? 'Update Goal' : 'Create Goal',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text, VelaColorScheme colors, {bool isRequired = false}) {
    return Row(
      children: [
        Text(
          text,
          style: TextStyle(
            color: colors.textPrimary,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        if (isRequired)
          Text(' *', style: TextStyle(color: colors.stateError, fontSize: 14)),
      ],
    );
  }

  InputDecoration _inputDecoration(
    VelaColorScheme colors, {
    String? placeholder,
    bool hasError = false,
  }) {
    final borderColor = hasError ? colors.stateError : colors.surfaceBorder;
    return InputDecoration(
      hintText: placeholder,
      hintStyle: TextStyle(color: colors.textTertiary),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      filled: true,
      fillColor: colors.surfaceDefault,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: BorderSide(color: borderColor),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: BorderSide(color: borderColor),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: BorderSide(color: colors.brandAccent, width: 2),
      ),
    );
  }

  Widget _buildChip({
    required String label,
    required bool isSelected,
    required VelaColorScheme colors,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? colors.interactiveSelected : colors.surfaceCard,
          border: Border.all(
            color: isSelected ? colors.brandAccent : colors.surfaceBorder,
          ),
          borderRadius: BorderRadius.circular(9999),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: isSelected ? colors.brandAccent : colors.textSecondary,
          ),
        ),
      ),
    );
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _targetDate ?? DateTime.now().add(const Duration(days: 30)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
    );
    if (picked != null) {
      setState(() => _targetDate = picked);
    }
  }

  Future<void> _submit() async {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      setState(() => _titleError = 'Title is required');
      return;
    }

    setState(() => _isSubmitting = true);

    final data = <String, dynamic>{
      'title': title,
      'description': _descriptionController.text.trim().isEmpty
          ? null
          : _descriptionController.text.trim(),
      'category': _selectedCategory,
      'status': _selectedStatus,
      'target_date': _targetDate?.toIso8601String().split('T').first,
      'target_hours': int.tryParse(_targetHoursController.text.trim()) ?? 100,
    };

    try {
      if (_isEditing) {
        await ref.read(goalsProvider.notifier).updateGoal(widget.editGoal!.id, data);
      } else {
        await ref.read(goalsProvider.notifier).createGoal(data);
      }
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to ${_isEditing ? 'update' : 'create'} goal')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }
}
