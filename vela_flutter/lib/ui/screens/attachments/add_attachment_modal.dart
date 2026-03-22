import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/link_utils.dart';
import '../../../providers/attachments_provider.dart';

class AddAttachmentModal extends ConsumerStatefulWidget {
  const AddAttachmentModal({super.key});

  @override
  ConsumerState<AddAttachmentModal> createState() => _AddAttachmentModalState();
}

class _AddAttachmentModalState extends ConsumerState<AddAttachmentModal> {
  final _titleController = TextEditingController();
  final _urlController = TextEditingController();

  String? _detectedPlatform;
  bool _isSubmitting = false;
  String? _urlError;

  @override
  void initState() {
    super.initState();
    _urlController.addListener(_onUrlChanged);
  }

  @override
  void dispose() {
    _urlController.removeListener(_onUrlChanged);
    _titleController.dispose();
    _urlController.dispose();
    super.dispose();
  }

  void _onUrlChanged() {
    final url = _urlController.text.trim();
    if (url.isNotEmpty) {
      final platform = LinkUtils.detectPlatform(url);
      if (platform != _detectedPlatform) {
        setState(() => _detectedPlatform = platform);
      }
    } else if (_detectedPlatform != null) {
      setState(() => _detectedPlatform = null);
    }
    if (_urlError != null) {
      setState(() => _urlError = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.7,
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
              // Issue 04: title row with ≥ 44×44px close button (WCAG 2.5.5)
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Add Link',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: colors.textPrimary,
                      ),
                    ),
                  ),
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
              const SizedBox(height: 24),

              // URL input
              _buildLabel('URL', colors, isRequired: true),
              const SizedBox(height: 6),
              TextField(
                controller: _urlController,
                keyboardType: TextInputType.url,
                style: TextStyle(color: colors.textPrimary, fontSize: 16),
                decoration: _inputDecoration(
                  colors,
                  placeholder: 'https://example.com',
                  hasError: _urlError != null,
                ),
              ),
              if (_urlError != null) ...[
                const SizedBox(height: 4),
                Text(_urlError!, style: TextStyle(color: colors.stateError, fontSize: 12)),
              ],
              // Detected platform indicator
              if (_detectedPlatform != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.check_circle, size: 14, color: colors.stateSuccess),
                    const SizedBox(width: 6),
                    Text(
                      'Detected: ${_capitalize(_detectedPlatform!)}',
                      style: TextStyle(
                        fontSize: 13,
                        color: colors.stateSuccess,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 20),

              // Title input
              _buildLabel('Title', colors),
              const SizedBox(height: 6),
              TextField(
                controller: _titleController,
                style: TextStyle(color: colors.textPrimary, fontSize: 16),
                decoration: _inputDecoration(
                  colors,
                  placeholder: 'Give this link a name',
                ),
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
                      : const Text(
                          'Add Attachment',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
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

  String _capitalize(String s) {
    if (s.isEmpty) return s;
    return s[0].toUpperCase() + s.substring(1);
  }

  Future<void> _submit() async {
    final url = _urlController.text.trim();
    if (url.isEmpty) {
      setState(() => _urlError = 'URL is required');
      return;
    }

    // Basic URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setState(() => _urlError = 'Please enter a valid URL starting with http:// or https://');
      return;
    }

    setState(() => _isSubmitting = true);

    final title = _titleController.text.trim().isEmpty
        ? url
        : _titleController.text.trim();

    final data = <String, dynamic>{
      'title': title,
      'url': url,
      'type': _detectType(url),
      'platform': _detectedPlatform,
    };

    try {
      await ref.read(attachmentsProvider.notifier).createAttachment(data);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to add attachment')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  String _detectType(String url) {
    final lower = url.toLowerCase();
    if (lower.endsWith('.pdf')) return 'pdf';
    if (lower.endsWith('.png') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.gif') ||
        lower.endsWith('.webp')) {
      return 'image';
    }
    if (lower.contains('youtube.com') ||
        lower.contains('youtu.be') ||
        lower.endsWith('.mp4') ||
        lower.endsWith('.webm')) {
      return 'video';
    }
    return 'link';
  }
}
