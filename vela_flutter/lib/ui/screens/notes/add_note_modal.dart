import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/note.dart';
import '../../../providers/notes_provider.dart';
import '../../widgets/vela_button.dart';
import '../../widgets/vela_input.dart';
import '../../widgets/vela_text_area.dart';

class AddNoteModal extends ConsumerStatefulWidget {
  final Note? note;
  final VoidCallback? onSaved;

  const AddNoteModal({
    super.key,
    this.note,
    this.onSaved,
  });

  @override
  ConsumerState<AddNoteModal> createState() => _AddNoteModalState();
}

class _AddNoteModalState extends ConsumerState<AddNoteModal> {
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  final _tagsController = TextEditingController();

  bool _isPinned = false;
  bool _isSubmitting = false;

  bool get _isEditing => widget.note != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      final n = widget.note!;
      _titleController.text = n.title;
      _contentController.text = n.content ?? '';
      _tagsController.text = n.tags.join(', ');
      _isPinned = n.isPinned;
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    _tagsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.92,
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
                  _isEditing ? 'Edit Note' : 'New Note',
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
                      child: Icon(Icons.close, size: 20, color: colors.textSecondary),
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
                  // Title input
                  VelaInput(
                    label: 'Title',
                    placeholder: 'Note title',
                    controller: _titleController,
                    required: true,
                  ),
                  const SizedBox(height: 20),

                  // Content textarea
                  Text(
                    'Content',
                    style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 6),
                  ConstrainedBox(
                    constraints: const BoxConstraints(minHeight: 200),
                    child: TextField(
                      controller: _contentController,
                      minLines: 8,
                      maxLines: 20,
                      style: TextStyle(
                        color: colors.textPrimary,
                        fontSize: 15,
                        height: 1.6,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Write your note here...',
                        hintStyle: TextStyle(color: colors.textTertiary),
                        contentPadding: const EdgeInsets.all(14),
                        filled: true,
                        fillColor: colors.surfaceDefault,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(6),
                          borderSide: BorderSide(color: colors.surfaceBorder),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(6),
                          borderSide: BorderSide(color: colors.surfaceBorder),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(6),
                          borderSide: BorderSide(color: colors.brandAccent, width: 2),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Tags input
                  VelaInput(
                    label: 'Tags',
                    placeholder: 'e.g. important, review, chapter-1',
                    helperText: 'Separate tags with commas',
                    controller: _tagsController,
                    leftIcon: const Icon(Icons.label_outline),
                  ),
                  const SizedBox(height: 20),

                  // Pin toggle
                  GestureDetector(
                    onTap: () => setState(() => _isPinned = !_isPinned),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: _isPinned
                            ? colors.interactiveSelected
                            : colors.surfaceCard,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: _isPinned
                              ? colors.brandAccent
                              : colors.surfaceBorder,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _isPinned ? Icons.push_pin : Icons.push_pin_outlined,
                            size: 20,
                            color: _isPinned
                                ? colors.brandAccent
                                : colors.textSecondary,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Pin Note',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w500,
                                    color: colors.textPrimary,
                                  ),
                                ),
                                Text(
                                  'Pinned notes appear at the top',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: colors.textTertiary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Switch(
                            value: _isPinned,
                            onChanged: (v) => setState(() => _isPinned = v),
                            activeColor: colors.brandAccent,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),

                  // Submit button
                  VelaButton(
                    variant: VelaButtonVariant.primary,
                    fullWidth: true,
                    size: VelaButtonSize.lg,
                    loading: _isSubmitting,
                    onPressed: _isSubmitting ? null : _submit,
                    child: Text(_isEditing ? 'Update Note' : 'Create Note'),
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

  Future<void> _submit() async {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a title')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final tags = _tagsController.text
        .split(',')
        .map((t) => t.trim())
        .where((t) => t.isNotEmpty)
        .toList();

    final data = {
      'title': title,
      'content': _contentController.text.trim().isEmpty
          ? null
          : _contentController.text.trim(),
      'tags': tags,
      'is_pinned': _isPinned,
    };

    try {
      final notifier = ref.read(notesProvider.notifier);
      if (_isEditing) {
        await notifier.updateNote(widget.note!.id, data);
      } else {
        await notifier.createNote(data);
      }
      widget.onSaved?.call();
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save note: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }
}
