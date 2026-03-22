import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/constants/activity_types.dart';
import '../../../core/theme/app_borders.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/link_utils.dart';
import '../../../data/models/note.dart';
import '../../../data/models/study_session.dart';
import '../../../providers/goals_provider.dart';
import '../../../providers/notes_provider.dart';
import '../../widgets/vela_badge.dart';
import '../../widgets/vela_button.dart';

class SessionDetailModal extends ConsumerStatefulWidget {
  final StudySession session;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onRevise;

  const SessionDetailModal({
    super.key,
    required this.session,
    required this.onEdit,
    required this.onDelete,
    required this.onRevise,
  });

  @override
  ConsumerState<SessionDetailModal> createState() => _SessionDetailModalState();
}

class _SessionDetailModalState extends ConsumerState<SessionDetailModal> {
  late int _attachmentCount;

  @override
  void initState() {
    super.initState();
    _attachmentCount = widget.session.attachmentCount;
  }

  Future<void> _showNotePicker(BuildContext context, VelaColorScheme colors) async {
    // Load notes via provider
    await ref.read(notesProvider.notifier).loadNotes();
    if (!context.mounted) return;

    final notes = ref.read(notesProvider).notes;
    if (notes.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No notes found. Create a note first.'),
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    final Note? selected = await showModalBottomSheet<Note>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _NotePickerSheet(notes: notes, colors: colors),
    );

    if (selected == null || !context.mounted) return;

    try {
      await ref
          .read(notesRepositoryProvider)
          .linkNoteToSession(widget.session.id, selected.id);
      setState(() => _attachmentCount++);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('"${selected.title}" linked to this session.'),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        final msg = e.toString().contains('409')
            ? 'That note is already linked to this session.'
            : 'Failed to link note. Please try again.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), duration: const Duration(seconds: 2)),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    final session = widget.session;
    final dateTime = DateTime.tryParse(session.date) ?? DateTime.now();
    final dayLabel = DateFormat('EEEE, MMMM d, yyyy').format(dateTime);
    final activityType = ActivityType.fromString(session.type);
    final durationLabel = _formatDuration(session.timeSpent);

    final hasUrl = session.url != null && session.url!.isNotEmpty;
    final isYoutube = hasUrl && LinkUtils.isYoutubeUrl(session.url!);
    final youtubeId = isYoutube ? LinkUtils.extractYoutubeId(session.url!) : null;

    final topics = session.topicsCovered != null && session.topicsCovered!.isNotEmpty
        ? session.topicsCovered!
            .split(',')
            .map((t) => t.trim())
            .where((t) => t.isNotEmpty)
            .toList()
        : <String>[];

    // Resolve the linked goal title from the goals provider (null-safe lookup).
    final String? goalTitle = session.goalId != null
        ? ref
            .watch(goalsProvider)
            .goals
            .cast<Goal?>()
            .firstWhere((g) => g?.id == session.goalId, orElse: () => null)
            ?.title
        : null;

    return Container(
      decoration: BoxDecoration(
        color: colors.surfaceDefault,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppBorders.radiusXl),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Padding(
            padding: const EdgeInsets.only(top: AppSpacing.s3),
            child: Center(
              child: Container(
                width: AppSpacing.s10,
                height: AppSpacing.s1,
                decoration: BoxDecoration(
                  color: colors.surfaceBorder,
                  borderRadius: AppBorders.full,
                ),
              ),
            ),
          ),

          // Row 1: Activity type badge (left) + close button (right)
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.s6,
              AppSpacing.s4,
              AppSpacing.s4,
              AppSpacing.s2,
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.s2,
                    vertical: AppSpacing.s0_5,
                  ),
                  decoration: BoxDecoration(
                    color: colors.interactiveSelected,
                    borderRadius: AppBorders.sm,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(activityType.icon, size: 12, color: colors.brandAccent),
                      const SizedBox(width: AppSpacing.s0_5),
                      Text(
                        activityType.label.toUpperCase(),
                        style: AppTypography.labelBase(colors.brandAccent).copyWith(
                          fontWeight: AppTypography.weightSemibold,
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                // Close button — min 44px touch target (Issue 01)
                SizedBox(
                  width: AppSpacing.minTouchTarget,
                  height: AppSpacing.minTouchTarget,
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => Navigator.pop(context),
                      borderRadius: AppBorders.full,
                      child: Center(
                        child: Icon(
                          Icons.close,
                          size: AppSpacing.s5,
                          color: colors.textSecondary,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Row 2: Title (full width, large)
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.s6,
              AppSpacing.s1,
              AppSpacing.s6,
              AppSpacing.s4,
            ),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                session.activity ?? activityType.label,
                style: AppTypography.headingXl(colors.textPrimary),
              ),
            ),
          ),

          // Row 3: Meta pill badges — date | duration | revisions
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.s6,
              0,
              AppSpacing.s6,
              AppSpacing.s4,
            ),
            child: Wrap(
              spacing: AppSpacing.s2,
              runSpacing: AppSpacing.s2,
              children: [
                VelaBadge(
                  variant: VelaBadgeVariant.defaultVariant,
                  size: VelaBadgeSize.sm,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.calendar_today_outlined,
                          size: 11, color: colors.textSecondary),
                      const SizedBox(width: AppSpacing.s1),
                      Text(dayLabel),
                    ],
                  ),
                ),
                VelaBadge(
                  variant: VelaBadgeVariant.info,
                  size: VelaBadgeSize.sm,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.timer_outlined, size: 11, color: colors.stateInfo),
                      const SizedBox(width: AppSpacing.s1),
                      Text(durationLabel),
                    ],
                  ),
                ),
                VelaBadge(
                  variant: VelaBadgeVariant.purple,
                  size: VelaBadgeSize.sm,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.refresh, size: 11),
                      const SizedBox(width: AppSpacing.s1),
                      Text('${session.revisionCount} revision${session.revisionCount == 1 ? '' : 's'}'),
                    ],
                  ),
                ),
                // Goal badge — only rendered when this session is linked to a goal
                if (goalTitle != null)
                  VelaBadge(
                    variant: VelaBadgeVariant.success,
                    size: VelaBadgeSize.sm,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.flag_outlined, size: 11, color: colors.stateSuccess),
                        const SizedBox(width: AppSpacing.s1),
                        ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 140),
                          child: Text(
                            goalTitle,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),

          // Scrollable body
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.s6,
                0,
                AppSpacing.s6,
                AppSpacing.s4,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Topics
                  if (topics.isNotEmpty) ...[
                    _SectionLabel(label: 'Topics covered', colors: colors),
                    const SizedBox(height: AppSpacing.s2),
                    Wrap(
                      spacing: AppSpacing.s1,
                      runSpacing: AppSpacing.s1,
                      children: topics.map((topic) {
                        return VelaBadge(
                          variant: VelaBadgeVariant.defaultVariant,
                          size: VelaBadgeSize.sm,
                          child: Text(topic),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: AppSpacing.s5),
                  ],

                  // Attachments section — count label + Link Note button
                  _SectionLabel(
                    label: 'Attachments ($_attachmentCount)',
                    colors: colors,
                  ),
                  const SizedBox(height: AppSpacing.s2),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => _showNotePicker(context, colors),
                      icon: Icon(Icons.add, size: 16, color: colors.textSecondary),
                      label: Text(
                        'Link Note',
                        style: AppTypography.bodyBase(colors.textSecondary),
                      ),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: AppSpacing.s3),
                        side: BorderSide(color: colors.surfaceBorder),
                        shape: const RoundedRectangleBorder(
                          borderRadius: AppBorders.md,
                        ),
                      ),
                    ),
                  ),

                  // YouTube thumbnail
                  if (isYoutube && youtubeId != null) ...[
                    const SizedBox(height: AppSpacing.s5),
                    _SectionLabel(label: 'Video', colors: colors),
                    const SizedBox(height: AppSpacing.s2),
                    GestureDetector(
                      onTap: () => LinkUtils.openUrl(session.url!),
                      child: ClipRRect(
                        borderRadius: AppBorders.md,
                        child: Image.network(
                          LinkUtils.getYoutubeThumbnail(youtubeId),
                          width: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                        ),
                      ),
                    ),
                  ],

                  // URL link (non-YouTube)
                  if (hasUrl && !isYoutube) ...[
                    const SizedBox(height: AppSpacing.s5),
                    _SectionLabel(label: 'Link', colors: colors),
                    const SizedBox(height: AppSpacing.s2),
                    SizedBox(
                      height: AppSpacing.minTouchTarget,
                      width: double.infinity,
                      child: VelaButton(
                        variant: VelaButtonVariant.outline,
                        size: VelaButtonSize.md,
                        fullWidth: true,
                        leftIcon: const Icon(Icons.open_in_new),
                        onPressed: () => LinkUtils.openUrl(session.url!),
                        child: Text(
                          session.url!,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                  ],

                  // Notes
                  if (session.notes != null && session.notes!.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.s5),
                    _SectionLabel(label: 'Notes', colors: colors),
                    const SizedBox(height: AppSpacing.s2),
                    Text(
                      session.notes!,
                      style: AppTypography.bodyBase(colors.textPrimary),
                    ),
                  ],

                  const SizedBox(height: AppSpacing.s4),
                ],
              ),
            ),
          ),

          // Footer: Add Revision + Edit Session buttons
          Container(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.s6,
              AppSpacing.s4,
              AppSpacing.s6,
              AppSpacing.s2,
            ),
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: colors.surfaceBorder)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: VelaButton(
                    variant: VelaButtonVariant.primary,
                    size: VelaButtonSize.md,
                    fullWidth: true,
                    leftIcon: const Icon(Icons.refresh),
                    onPressed: () { Navigator.pop(context); widget.onRevise(); },
                    child: const Text('Add Revision'),
                  ),
                ),
                const SizedBox(width: AppSpacing.s3),
                Expanded(
                  child: VelaButton(
                    variant: VelaButtonVariant.outline,
                    size: VelaButtonSize.md,
                    fullWidth: true,
                    leftIcon: const Icon(Icons.edit_outlined),
                    onPressed: () { Navigator.pop(context); widget.onEdit(); },
                    child: const Text('Edit Session'),
                  ),
                ),
              ],
            ),
          ),

          // Delete Session — red text link below buttons
          Padding(
            padding: EdgeInsets.fromLTRB(
              AppSpacing.s6,
              AppSpacing.s1,
              AppSpacing.s6,
              AppSpacing.s4 + MediaQuery.of(context).padding.bottom,
            ),
            child: SizedBox(
              width: double.infinity,
              height: AppSpacing.minTouchTarget,
              child: TextButton.icon(
                onPressed: () => _confirmDelete(colors),
                icon: Icon(Icons.delete_outline, size: 16, color: colors.stateError),
                label: Text(
                  'Delete Session',
                  style: AppTypography.bodyBase(colors.stateError),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDuration(int minutes) {
    if (minutes < 60) return '$minutes min';
    final h = minutes ~/ 60;
    final m = minutes % 60;
    return m == 0 ? '${h}h' : '${h}h ${m}m';
  }

  Future<void> _confirmDelete(VelaColorScheme colors) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: colors.surfaceDefault,
        title: Text(
          'Delete Session',
          style: AppTypography.headingLg(colors.textPrimary),
        ),
        content: Text(
          'Are you sure you want to delete this session?',
          style: AppTypography.bodyBase(colors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: Text('Cancel', style: AppTypography.labelLg(colors.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text('Delete', style: AppTypography.labelLg(colors.stateError)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      if (!mounted) return;
      Navigator.pop(context); // dismiss the modal using its own context
      widget.onDelete();
    }
  }
}

// ---------------------------------------------------------------------------
// Note picker bottom sheet
// ---------------------------------------------------------------------------

class _NotePickerSheet extends StatelessWidget {
  final List<Note> notes;
  final VelaColorScheme colors;

  const _NotePickerSheet({required this.notes, required this.colors});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: colors.surfaceDefault,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppBorders.radiusXl),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: AppSpacing.s3),
            child: Center(
              child: Container(
                width: AppSpacing.s10,
                height: AppSpacing.s1,
                decoration: BoxDecoration(
                  color: colors.surfaceBorder,
                  borderRadius: AppBorders.full,
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.s6, AppSpacing.s4, AppSpacing.s4, AppSpacing.s2,
            ),
            child: Row(
              children: [
                Text(
                  'Link a Note',
                  style: AppTypography.headingLg(colors.textPrimary),
                ),
                const Spacer(),
                SizedBox(
                  width: AppSpacing.minTouchTarget,
                  height: AppSpacing.minTouchTarget,
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => Navigator.pop(context),
                      borderRadius: AppBorders.full,
                      child: Center(
                        child: Icon(
                          Icons.close,
                          size: AppSpacing.s5,
                          color: colors.textSecondary,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Flexible(
            child: ListView.separated(
              shrinkWrap: true,
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.s4, 0, AppSpacing.s4, AppSpacing.s4,
              ),
              itemCount: notes.length,
              separatorBuilder: (_, __) => Divider(
                color: colors.surfaceBorder,
                height: 1,
              ),
              itemBuilder: (_, i) {
                final note = notes[i];
                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.s2,
                    vertical: AppSpacing.s1,
                  ),
                  leading: Icon(Icons.note_outlined, color: colors.textSecondary),
                  title: Text(
                    note.title,
                    style: AppTypography.bodyBase(colors.textPrimary),
                  ),
                  subtitle: note.content != null && note.content!.isNotEmpty
                      ? Text(
                          note.content!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.bodyBase(colors.textSecondary),
                        )
                      : null,
                  onTap: () => Navigator.pop(context, note),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  final VelaColorScheme colors;

  const _SectionLabel({required this.label, required this.colors});

  @override
  Widget build(BuildContext context) {
    return Text(
      label.toUpperCase(),
      style: AppTypography.labelBase(colors.textTertiary).copyWith(
        letterSpacing: 0.5,
        fontWeight: AppTypography.weightSemibold,
      ),
    );
  }
}
