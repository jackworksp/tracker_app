import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../providers/attachments_provider.dart';
import '../../../providers/subjects_provider.dart';

class MoveSubjectSheet extends ConsumerWidget {
  final Attachment attachment;

  const MoveSubjectSheet({
    super.key,
    required this.attachment,
  });

  static Future<void> show(
    BuildContext context, {
    required Attachment attachment,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return showModalBottomSheet(
      context: context,
      backgroundColor: colors.surfaceElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => MoveSubjectSheet(attachment: attachment),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final subjectsState = ref.watch(subjectsProvider);

    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              margin: const EdgeInsets.only(top: 12, bottom: 10),
              decoration: BoxDecoration(
                color: colors.textDisabled,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Text(
              'Move to Subject',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: colors.textPrimary,
              ),
            ),
          ),
          ListTile(
            leading: Icon(Icons.clear_all_rounded, color: colors.textSecondary),
            title: Text(
              'No Subject',
              style: TextStyle(
                color: colors.textPrimary,
                fontWeight: attachment.subjectId == null
                    ? FontWeight.w600
                    : FontWeight.w400,
              ),
            ),
            trailing: attachment.subjectId == null
                ? Icon(Icons.check_circle, color: colors.brandAccent, size: 22)
                : null,
            onTap: () => _moveToSubject(context, ref, null),
          ),
          if (subjectsState.isLoading && subjectsState.subjects.isEmpty)
            Padding(
              padding: const EdgeInsets.all(20),
              child: Center(
                child: SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: colors.brandAccent,
                  ),
                ),
              ),
            )
          else if (subjectsState.subjects.isEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
              child: Text(
                'No subjects found.',
                style: TextStyle(color: colors.textTertiary),
              ),
            )
          else
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: subjectsState.subjects.length,
                itemBuilder: (context, index) {
                  final subject = subjectsState.subjects[index];
                  final isSelected = attachment.subjectId == subject.id;
                  final iconColor = _parseColor(subject.color);
                  return ListTile(
                    leading: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: iconColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        Icons.book_outlined,
                        size: 18,
                        color: iconColor,
                      ),
                    ),
                    title: Text(
                      subject.name,
                      style: TextStyle(
                        color: colors.textPrimary,
                        fontWeight:
                            isSelected ? FontWeight.w600 : FontWeight.w400,
                      ),
                    ),
                    trailing: isSelected
                        ? Icon(
                            Icons.check_circle,
                            color: colors.brandAccent,
                            size: 22,
                          )
                        : null,
                    onTap: () => _moveToSubject(context, ref, subject.id),
                  );
                },
              ),
            ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }

  Future<void> _moveToSubject(
    BuildContext context,
    WidgetRef ref,
    int? subjectId,
  ) async {
    try {
      await ref.read(attachmentsProvider.notifier).moveToSubject(
            attachment.id,
            subjectId,
          );
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Attachment moved successfully')),
      );
      Navigator.pop(context);
    } catch (_) {
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to move attachment')),
      );
    }
  }

  Color _parseColor(String hexColor) {
    try {
      final hex = hexColor.replaceFirst('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    } catch (_) {
      return const Color(0xFF3B82F6);
    }
  }
}
