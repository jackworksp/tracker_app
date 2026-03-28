import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_lucide/flutter_lucide.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/date_utils.dart';
import '../../../data/models/note.dart';
import '../../widgets/vela_badge.dart';
import '../../widgets/vela_button.dart';

class NotePreviewModal extends StatelessWidget {
  final Note note;
  final VoidCallback onEdit;

  const NotePreviewModal({
    super.key,
    required this.note,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    
    final dateStr = note.updatedAt != null
        ? VelaDateUtils.timeAgo(note.updatedAt!)
        : note.createdAt != null
            ? VelaDateUtils.timeAgo(note.createdAt!)
            : '';

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: BoxDecoration(
        color: colors.bgPrimary,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Top bar
          Padding(
            padding: const EdgeInsets.only(
              left: AppSpacing.s4,
              right: AppSpacing.s4,
              top: AppSpacing.s4,
              bottom: AppSpacing.s2,
            ),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(LucideIcons.arrow_left, size: 20),
                  color: colors.textPrimary,
                  onPressed: () => Navigator.pop(context),
                  tooltip: 'Back',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  splashRadius: 20,
                ),
                const SizedBox(width: AppSpacing.s2),
                Text(
                  'Notes',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: colors.textPrimary,
                  ),
                ),
                const Spacer(),
                VelaButton(
                  variant: VelaButtonVariant.outline,
                  leftIcon: const Icon(Icons.edit_outlined, size: 14),
                  onPressed: onEdit,
                  child: const Text('Edit'),
                ),
              ],
            ),
          ),
          
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(AppSpacing.s5, AppSpacing.s2, AppSpacing.s5, AppSpacing.s8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Meta info row
                  if (note.isPinned) ...[
                    Row(
                      children: [
                        Icon(LucideIcons.pin, size: 14, color: colors.brandAccent),
                        const SizedBox(width: AppSpacing.s1),
                        Text('Pinned', style: TextStyle(fontSize: 12, color: colors.textSecondary)),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.s3),
                  ],
                  
                  // Title
                  Text(
                    note.title.isEmpty ? 'Untitled' : note.title,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: colors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.s3),
                  
                  // Tags
                  if (note.tags.isNotEmpty) ...[
                    Wrap(
                      spacing: AppSpacing.s2,
                      runSpacing: AppSpacing.s2,
                      children: note.tags.map((tag) {
                        return VelaBadge(
                          variant: VelaBadgeVariant.brand,
                          active: true,
                          child: Text('#$tag'),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: AppSpacing.s4),
                  ] else ...[
                    const SizedBox(height: AppSpacing.s1),
                  ],
                  
                  // Content
                  if (note.content != null && note.content!.trim().isNotEmpty)
                    MarkdownBody(
                      data: note.content!,
                      styleSheet: MarkdownStyleSheet.fromTheme(Theme.of(context)).copyWith(
                        p: TextStyle(fontSize: 16, color: colors.textPrimary, height: 1.5),
                        h1: TextStyle(fontSize: 24, color: colors.textPrimary, fontWeight: FontWeight.bold),
                        h2: TextStyle(fontSize: 20, color: colors.textPrimary, fontWeight: FontWeight.bold),
                        h3: TextStyle(fontSize: 18, color: colors.textPrimary, fontWeight: FontWeight.bold),
                        code: TextStyle(
                           backgroundColor: colors.surfaceCard, 
                           color: colors.brandAccent, 
                           fontFamily: 'monospace'
                        ),
                        codeblockDecoration: BoxDecoration(
                          color: colors.surfaceCard,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        blockquoteDecoration: BoxDecoration(
                          border: Border(left: BorderSide(color: colors.surfaceBorder, width: 4)),
                        ),
                      ),
                      selectable: true,
                    )
                  else
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: AppSpacing.s4),
                      child: Text(
                        'This note is empty.',
                        style: TextStyle(fontSize: 15, color: colors.textTertiary, fontStyle: FontStyle.italic),
                      ),
                    ),
                    
                  // Updated Date
                  if (dateStr.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.s8),
                    Divider(color: colors.surfaceBorder),
                    const SizedBox(height: AppSpacing.s3),
                    Text(
                      'Last updated $dateStr',
                      style: TextStyle(fontSize: 12, color: colors.textTertiary),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
