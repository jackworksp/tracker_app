import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../providers/tasks_provider.dart';
import '../../widgets/vela_button.dart';
import '../../widgets/vela_input.dart';

class AddTaskModal extends ConsumerStatefulWidget {
  final int? subjectId;
  final VoidCallback onCreated;

  const AddTaskModal({super.key, this.subjectId, required this.onCreated});

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

  static const _types = ['TASK', 'WATCH', 'READ', 'NOTE'];

  @override
  void dispose() {
    _titleController.dispose();
    _urlController.dispose();
    _contentController.dispose();
    _tagsController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (_titleController.text.trim().isEmpty) return;
    setState(() => _isLoading = true);
    try {
      final tags = _tagsController.text.trim().isEmpty
          ? <String>[]
          : _tagsController.text
              .split(',')
              .map((t) => t.trim())
              .where((t) => t.isNotEmpty)
              .toList();

      await ref.read(tasksProvider.notifier).createTask({
        'title': _titleController.text.trim(),
        'type': _selectedType,
        'url': _urlController.text.trim().isEmpty
            ? null
            : _urlController.text.trim(),
        'content': _contentController.text.trim().isEmpty
            ? null
            : _contentController.text.trim(),
        'tags': tags,
        if (widget.subjectId != null) 'subject_id': widget.subjectId,
      });
      widget.onCreated();
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
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
            const SizedBox(height: 16),
            Text(
              'Add Task',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: colors.textPrimary,
              ),
            ),
            const SizedBox(height: 20),
            // Type selector
            Text(
              'Type',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: colors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: _types.map((type) {
                final isSelected = type == _selectedType;
                final color = switch (type) {
                  'WATCH' => const Color(0xFFEF4444),
                  'READ' => const Color(0xFF3B82F6),
                  'NOTE' => const Color(0xFFA855F7),
                  _ => colors.brandAccent,
                };
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedType = type),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? color.withValues(alpha: 0.15)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: isSelected ? color : colors.surfaceBorder,
                        ),
                      ),
                      child: Text(
                        type,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: isSelected ? color : colors.textSecondary,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            VelaInput(
              label: 'Title',
              placeholder: 'Enter task title',
              controller: _titleController,
              required: true,
            ),
            const SizedBox(height: 16),
            VelaInput(
              label: 'URL',
              placeholder: 'https://...',
              controller: _urlController,
              keyboardType: TextInputType.url,
            ),
            const SizedBox(height: 16),
            VelaInput(
              label: 'Content',
              placeholder: 'Optional description...',
              controller: _contentController,
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            VelaInput(
              label: 'Tags',
              placeholder: 'tag1, tag2, tag3',
              controller: _tagsController,
            ),
            const SizedBox(height: 24),
            VelaButton(
              variant: VelaButtonVariant.primary,
              size: VelaButtonSize.lg,
              fullWidth: true,
              loading: _isLoading,
              onPressed: _handleSubmit,
              child: const Text('Create Task'),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
