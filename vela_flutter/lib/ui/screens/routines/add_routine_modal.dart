import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/error_messages.dart';
import '../../../providers/routines_provider.dart';

class AddRoutineModal extends ConsumerStatefulWidget {
  const AddRoutineModal({super.key});

  @override
  ConsumerState<AddRoutineModal> createState() => _AddRoutineModalState();
}

class _AddRoutineModalState extends ConsumerState<AddRoutineModal> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();

  String _selectedFrequency = 'DAILY';
  String _selectedCategory = 'GENERAL';
  bool _isSubmitting = false;
  String? _titleError;

  static const _frequencies = ['DAILY', 'WEEKLY'];
  static const _categories = [
    'GENERAL',
    'HEALTH',
    'LEARNING',
    'PRODUCTIVITY',
    'MINDFULNESS',
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
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
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Add Routine',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: colors.textPrimary,
                      ),
                    ),
                  ),
                  InkWell(
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
                ],
              ),
              const SizedBox(height: 24),
              _buildLabel('Title', colors, isRequired: true),
              const SizedBox(height: 6),
              TextField(
                controller: _titleController,
                style: TextStyle(color: colors.textPrimary, fontSize: 16),
                decoration: _inputDecoration(
                  colors,
                  placeholder: 'Enter routine title',
                  hasError: _titleError != null,
                ),
                onChanged: (_) {
                  if (_titleError != null) setState(() => _titleError = null);
                },
              ),
              if (_titleError != null) ...[
                const SizedBox(height: 4),
                Text(_titleError!,
                    style: TextStyle(color: colors.stateError, fontSize: 12)),
              ],
              const SizedBox(height: 20),
              _buildLabel('Description', colors),
              const SizedBox(height: 6),
              TextField(
                controller: _descriptionController,
                minLines: 3,
                maxLines: 5,
                style: TextStyle(color: colors.textPrimary, fontSize: 16),
                decoration: _inputDecoration(colors,
                    placeholder: 'Describe your routine...'),
              ),
              const SizedBox(height: 20),
              _buildLabel('Frequency', colors),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _frequencies.map((frequency) {
                  final isSelected = _selectedFrequency == frequency;
                  return _buildChip(
                    label: frequency == 'DAILY' ? 'Daily' : 'Weekly',
                    isSelected: isSelected,
                    colors: colors,
                    onTap: () => setState(() => _selectedFrequency = frequency),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),
              _buildLabel('Category', colors),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _categories.map((category) {
                  final isSelected = _selectedCategory == category;
                  return _buildChip(
                    label: _formatCategory(category),
                    isSelected: isSelected,
                    colors: colors,
                    onTap: () => setState(() => _selectedCategory = category),
                  );
                }).toList(),
              ),
              const SizedBox(height: 32),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed:
                          _isSubmitting ? null : () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: colors.textSecondary,
                        side: BorderSide(color: colors.surfaceBorder),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _saveRoutine,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: colors.brandAccent,
                        foregroundColor: colors.textInverse,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: _isSubmitting
                          ? SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor:
                                    AlwaysStoppedAnimation(colors.textInverse),
                              ),
                            )
                          : const Text('Save'),
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

  Widget _buildLabel(String text, VelaColorScheme colors,
      {bool isRequired = false}) {
    return RichText(
      text: TextSpan(
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: colors.textPrimary,
        ),
        children: [
          TextSpan(text: text),
          if (isRequired)
            TextSpan(
              text: ' *',
              style: TextStyle(color: colors.stateError),
            ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(
    VelaColorScheme colors, {
    required String placeholder,
    bool hasError = false,
  }) {
    return InputDecoration(
      hintText: placeholder,
      hintStyle: TextStyle(color: colors.textTertiary),
      filled: true,
      fillColor: colors.surfaceDefault,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: BorderSide(color: colors.surfaceBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: BorderSide(
          color: hasError ? colors.stateError : colors.surfaceBorder,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: BorderSide(
          color: hasError ? colors.stateError : colors.brandAccent,
          width: 1.5,
        ),
      ),
    );
  }

  Widget _buildChip({
    required String label,
    required bool isSelected,
    required VelaColorScheme colors,
    required VoidCallback onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? colors.brandAccent.withValues(alpha: 0.12)
              : colors.surfaceDefault,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? colors.brandAccent : colors.surfaceBorder,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? colors.brandAccent : colors.textSecondary,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
          ),
        ),
      ),
    );
  }

  String _formatCategory(String category) {
    final words = category.split('_');
    return words
        .map((word) => word[0] + word.substring(1).toLowerCase())
        .join(' ');
  }

  Future<void> _saveRoutine() async {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      setState(() => _titleError = ErrorMessages.routineTitleRequired);
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await ref.read(routinesProvider.notifier).createRoutine({
        'title': title,
        'description': _descriptionController.text.trim(),
        'frequency': _selectedFrequency,
        'category': _selectedCategory,
      });
      if (mounted) Navigator.pop(context);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text(ErrorMessages.routineSaveFailed)),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }
}
