import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:intl/intl.dart';

import '../../../core/constants/activity_types.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/error_messages.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/utils/link_utils.dart';
import '../../../data/models/study_session.dart';
import '../../../providers/goals_provider.dart';
import '../../../providers/progress_provider.dart';
import '../../../providers/subjects_provider.dart';
import '../../widgets/vela_badge.dart';
import '../../widgets/vela_button.dart';
import '../../widgets/vela_card.dart';
import '../../widgets/vela_skeleton.dart';
import 'add_session_modal.dart';
import 'session_detail_modal.dart';

class TimelineScreen extends ConsumerStatefulWidget {
  const TimelineScreen({super.key});

  @override
  ConsumerState<TimelineScreen> createState() => _TimelineScreenState();
}

class _TimelineScreenState extends ConsumerState<TimelineScreen> {
  @override
  void initState() {
    super.initState();
    // Defer provider mutation to after the current build cycle to avoid
    // "Tried to modify a provider while the widget tree was building" error.
    Future.microtask(_loadIfSubjectAvailable);
  }

  void _loadIfSubjectAvailable() {
    final subject = ref.read(subjectsProvider).currentSubject;
    if (subject != null) {
      ref.read(progressProvider.notifier).loadProgress(subject.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final subjectsState = ref.watch(subjectsProvider);
    final progressState = ref.watch(progressProvider);

    // Reload when subject changes
    ref.listen<SubjectsState>(subjectsProvider, (prev, next) {
      if (next.currentSubject != null &&
          next.currentSubject?.id != prev?.currentSubject?.id) {
        ref.read(progressProvider.notifier).loadProgress(next.currentSubject!.id);
      }
    });

    final sessions = List<StudySession>.from(progressState.sessions)
      ..sort((a, b) => b.date.compareTo(a.date));

    return Scaffold(
      backgroundColor: colors.bgPrimary,
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddSessionModal(context),
        backgroundColor: colors.stateSuccess,
        child: Icon(Icons.add, color: colors.textInverse),
      ),
      body: RefreshIndicator(
        color: colors.brandAccent,
        onRefresh: () async {
          await ref.read(progressProvider.notifier).refreshProgress();
        },
        child: CustomScrollView(
          slivers: [
            // Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Sessions',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                        color: colors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Total ${VelaDateUtils.formatMinutesToHours(progressState.totalMinutes)} '
                      '• ${progressState.totalSessions} sessions',
                      style: TextStyle(
                        fontSize: 14,
                        color: colors.textSecondary,
                      ),
                    ),
                    if (progressState.streak > 0) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          VelaBadge(
                            variant: VelaBadgeVariant.brand,
                            size: VelaBadgeSize.md,
                            child: Text('🔥 ${progressState.streak}-day streak'),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // Issue 07: skeleton loader replaces the bare spinner
            if (progressState.isLoading)
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (_, __) => const VelaSkeletonSessionCard(),
                    childCount: 4,
                  ),
                ),
              )
            // Error state
            else if (progressState.error != null)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(Icons.error_outline, size: 48, color: colors.stateError),
                        const SizedBox(height: 12),
                        // Issue 06: specific actionable error message
                        Text(
                          ErrorMessages.sessionLoadFailed,
                          style: TextStyle(color: colors.textSecondary, fontSize: 16),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        VelaButton(
                          variant: VelaButtonVariant.outline,
                          onPressed: () => ref.read(progressProvider.notifier).refreshProgress(),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            // Empty state
            else if (sessions.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.timeline, size: 64, color: colors.textTertiary),
                      const SizedBox(height: 16),
                      Text(
                        'No study sessions yet',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: colors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Track your learning by adding sessions.',
                        style: TextStyle(fontSize: 14, color: colors.textTertiary),
                      ),
                      const SizedBox(height: 24),
                      VelaButton(
                        variant: VelaButtonVariant.primary,
                        leftIcon: const Icon(Icons.add),
                        onPressed: () => _showAddSessionModal(context),
                        child: const Text('Add First Session'),
                      ),
                    ],
                  ),
                ),
              )
            // Session list
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final session = sessions[index];
                      // Resolve linked goal title at build time so _SessionCard
                      // stays a plain StatelessWidget (no ref needed inside it).
                      final String? goalTitle = session.goalId != null
                          ? ref
                              .watch(goalsProvider)
                              .goals
                              .cast<Goal?>()
                              .firstWhere(
                                (g) => g?.id == session.goalId,
                                orElse: () => null,
                              )
                              ?.title
                          : null;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _SessionCard(
                          session: session,
                          colors: colors,
                          goalTitle: goalTitle,
                          onTap: () => _showSessionDetail(context, session),
                          onEdit: () => _showAddSessionModal(context, session: session),
                          onDelete: () => _deleteSession(session),
                        ),
                      );
                    },
                    childCount: sessions.length,
                  ),
                ),
              ),

            // Issue 11: fabClearance token + safe-area inset
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

  void _showSessionDetail(BuildContext context, StudySession session) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => SessionDetailModal(
        session: session,
        onEdit: () => _showAddSessionModal(context, session: session),
        onDelete: () => _deleteSession(session),
        onRevise: () => ref.read(progressProvider.notifier).reviseSession(session.id),
      ),
    );
  }

  void _showAddSessionModal(BuildContext context, {StudySession? session}) {
    final subjectId = ref.read(subjectsProvider).currentSubject?.id;
    if (subjectId == null) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AddSessionModal(
        subjectId: subjectId,
        session: session,
        onSaved: () {
          ref.read(progressProvider.notifier).refreshProgress();
        },
      ),
    );
  }

  Future<void> _deleteSession(StudySession session) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        final colors = isDark ? AppColors.dark : AppColors.light;
        return AlertDialog(
          backgroundColor: colors.surfaceDefault,
          title: Text('Delete Session', style: TextStyle(color: colors.textPrimary)),
          content: Text(
            'Are you sure you want to delete this session?',
            style: TextStyle(color: colors.textSecondary),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text('Cancel', style: TextStyle(color: colors.textSecondary)),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: Text('Delete', style: TextStyle(color: colors.stateError)),
            ),
          ],
        );
      },
    );

    if (confirmed == true && mounted) {
      try {
        await ref.read(progressRepositoryProvider).deleteSession(session.id);
        ref.read(progressProvider.notifier).refreshProgress();
      } catch (e) {
        if (mounted) {
          // Issue 06: use centralized error message constant
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(ErrorMessages.sessionDeleteFailed)),
          );
        }
      }
    }
  }
}

class _SessionCard extends StatelessWidget {
  final StudySession session;
  final VelaColorScheme colors;
  final String? goalTitle;
  final VoidCallback onTap;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _SessionCard({
    required this.session,
    required this.colors,
    this.goalTitle,
    required this.onTap,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final dateTime = DateTime.tryParse(session.date) ?? DateTime.now();
    final dayNumber = DateFormat('d').format(dateTime);
    final monthAbbrev = DateFormat('MMM').format(dateTime).toUpperCase();

    final topics = session.topicsCovered != null && session.topicsCovered!.isNotEmpty
        ? session.topicsCovered!.split(',').map((t) => t.trim()).where((t) => t.isNotEmpty).toList()
        : <String>[];

    final activityType = ActivityType.fromString(session.type);
    final hasUrl = session.url != null && session.url!.isNotEmpty;
    final isYoutube = hasUrl && LinkUtils.isYoutubeUrl(session.url!);
    final youtubeId = isYoutube ? LinkUtils.extractYoutubeId(session.url!) : null;

    return Slidable(
      endActionPane: ActionPane(
        motion: const BehindMotion(),
        extentRatio: 0.25,
        children: [
          SlidableAction(
            onPressed: (_) => onDelete(),
            backgroundColor: colors.stateError,
            foregroundColor: Colors.white,
            icon: Icons.delete,
            label: 'Delete',
            borderRadius: const BorderRadius.horizontal(right: Radius.circular(8)),
          ),
        ],
      ),
      child: GestureDetector(
        onTap: onTap,
        child: VelaCard(
        padding: VelaCardPadding.none,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Date box
              Container(
                width: 52,
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                decoration: BoxDecoration(
                  color: colors.interactiveSelected,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    Text(
                      dayNumber,
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: colors.brandAccent,
                        height: 1.1,
                      ),
                    ),
                    Text(
                      monthAbbrev,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: colors.brandAccent,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),

              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title row with duration badge
                    Row(
                      children: [
                        Expanded(
                          child: hasUrl
                              ? GestureDetector(
                                  onTap: () => LinkUtils.openUrl(session.url!),
                                  child: Text(
                                    session.activity ?? activityType.label,
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600,
                                      color: colors.textLink,
                                      decoration: TextDecoration.underline,
                                      decorationColor: colors.textLink,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                )
                              : Text(
                                  session.activity ?? activityType.label,
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                    color: colors.textPrimary,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                        ),
                        const SizedBox(width: 8),
                        VelaBadge(
                          variant: VelaBadgeVariant.info,
                          size: VelaBadgeSize.sm,
                          child: Text(
                            VelaDateUtils.formatMinutesToHours(session.timeSpent),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 6),

                    // Activity type row
                    Row(
                      children: [
                        Icon(activityType.icon, size: 14, color: colors.textTertiary),
                        const SizedBox(width: 4),
                        Text(
                          activityType.label,
                          style: TextStyle(fontSize: 12, color: colors.textTertiary),
                        ),
                        if (session.revisionCount > 0) ...[
                          const SizedBox(width: 12),
                          VelaBadge(
                            variant: VelaBadgeVariant.purple,
                            size: VelaBadgeSize.sm,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.refresh, size: 10),
                                const SizedBox(width: 3),
                                Text('${session.revisionCount}'),
                              ],
                            ),
                          ),
                        ],
                        // Goal badge — shown when session is linked to a goal
                        if (goalTitle != null) ...[
                          const SizedBox(width: 8),
                          VelaBadge(
                            variant: VelaBadgeVariant.success,
                            size: VelaBadgeSize.sm,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.flag_outlined, size: 10, color: colors.stateSuccess),
                                const SizedBox(width: 3),
                                ConstrainedBox(
                                  constraints: const BoxConstraints(maxWidth: 100),
                                  child: Text(
                                    goalTitle!,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),

                    // YouTube thumbnail
                    if (isYoutube && youtubeId != null) ...[
                      const SizedBox(height: 10),
                      GestureDetector(
                        onTap: () => LinkUtils.openUrl(session.url!),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: Image.network(
                            LinkUtils.getYoutubeThumbnail(youtubeId),
                            height: 100,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                          ),
                        ),
                      ),
                    ],

                    // Topics
                    if (topics.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: topics.map((topic) {
                          return VelaBadge(
                            variant: VelaBadgeVariant.defaultVariant,
                            size: VelaBadgeSize.sm,
                            child: Text(topic),
                          );
                        }).toList(),
                      ),
                    ],

                    // Notes preview
                    if (session.notes != null && session.notes!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        session.notes!,
                        style: TextStyle(
                          fontSize: 13,
                          color: colors.textTertiary,
                          height: 1.4,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],

                    // Action row
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        _ActionButton(
                          icon: Icons.edit_outlined,
                          label: 'Edit',
                          color: colors.textTertiary,
                          onTap: onEdit,
                        ),
                        const SizedBox(width: 16),
                        _ActionButton(
                          icon: Icons.delete_outline,
                          label: 'Delete',
                          color: colors.stateError,
                          onTap: onDelete,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}
