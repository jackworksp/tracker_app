import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../data/models/task.dart';
import '../../../data/models/study_session.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/tasks_provider.dart';
import '../../../providers/goals_provider.dart' show goalsRepositoryProvider, Goal;
import '../../../providers/progress_provider.dart';
import '../../../providers/subjects_provider.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

class _BriefData {
  final List<Task> todayTasks;
  final List<Task> overdueTasks;
  final List<Goal> activeGoals;
  final double weeklyHours;

  const _BriefData({
    required this.todayTasks,
    required this.overdueTasks,
    required this.activeGoals,
    required this.weeklyHours,
  });
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class MorningBriefScreen extends ConsumerStatefulWidget {
  const MorningBriefScreen({super.key});

  @override
  ConsumerState<MorningBriefScreen> createState() => _MorningBriefScreenState();
}

class _MorningBriefScreenState extends ConsumerState<MorningBriefScreen> {
  _BriefData? _data;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // Fetch tasks
      final tasksRepo = ref.read(tasksRepositoryProvider);
      final allTasks = await tasksRepo.getAll();

      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);

      // Overdue = reminder fired in the past, not dismissed, not completed
      final overdueTasks = allTasks.where((t) {
        if (t.completed || t.status == 'DONE') return false;
        final reminder = t.reminderTime;
        if (reminder == null) return false;
        return reminder.isBefore(today) && !t.reminderDismissed;
      }).toList();

      // Today's focus = not completed, HIGH/MEDIUM priority OR reminder today
      final todayTasks = allTasks.where((t) {
        if (t.completed || t.status == 'DONE') return false;
        // Already in overdue list — skip
        if (overdueTasks.any((o) => o.id == t.id)) return false;
        final reminder = t.reminderTime;
        final reminderIsToday = reminder != null &&
            DateTime(reminder.year, reminder.month, reminder.day) == today;
        final isHighPriority =
            t.priority == 'HIGH' || t.priority == 'MEDIUM';
        return reminderIsToday || isHighPriority;
      }).toList();

      // Fetch goals
      final goalsRepo = ref.read(goalsRepositoryProvider);
      final rawGoals = await goalsRepo.getAll();
      final activeGoals = rawGoals
          .map((g) => Goal.fromJson(g))
          .where((g) => g.status == 'IN_PROGRESS' || g.status == 'PLANNING')
          .toList();

      // Fetch weekly hours for current subject (best effort)
      double weeklyHours = 0;
      final subjectId =
          ref.read(subjectsProvider).currentSubject?.id;
      if (subjectId != null) {
        try {
          final progressRepo = ref.read(progressRepositoryProvider);
          final weekAgo = now.subtract(const Duration(days: 7));
          final data = await progressRepo.getProgress(
            subjectId,
            filters: {
              'start_date': weekAgo.toIso8601String().substring(0, 10),
            },
          );
          final sessions = (data['sessions'] as List)
              .map((s) => StudySession.fromJson(s))
              .toList();
          weeklyHours = sessions.fold<int>(
                0,
                (sum, s) => sum + s.timeSpent,
              ) /
              60.0;
        } catch (_) {
          // Non-critical — weekly hours stays 0
        }
      }

      if (mounted) {
        setState(() {
          _data = _BriefData(
            todayTasks: todayTasks.take(5).toList(),
            overdueTasks: overdueTasks.take(5).toList(),
            activeGoals: activeGoals.take(3).toList(),
            weeklyHours: weeklyHours,
          );
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Could not load your brief. Check your connection.';
          _loading = false;
        });
      }
    }
  }

  // Detect which "case" the user is in and return a motivational message
  String _detectMessage(_BriefData data) {
    final overdueCount = data.overdueTasks.length;
    final todayCount = data.todayTasks.length;
    final hours = data.weeklyHours;

    if (overdueCount > 3) {
      return 'Pick ONE overdue task. Just one. Today.';
    }
    if (overdueCount == 0 && hours > 5) {
      return "You're in flow. Don't break the chain.";
    }
    if (todayCount > 6) {
      return "You can't do everything. Pick ONE task today.";
    }
    if (overdueCount == 0 && todayCount == 0) {
      return 'Clean slate. Set your intention for today.';
    }
    return 'One focused session today moves everything forward.';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final now = DateTime.now();
    final greeting = _greeting(now.hour);

    final userName = ref.watch(authProvider).user?.name?.split(' ').first ?? '';

    return Scaffold(
      backgroundColor: colors.bgPrimary,
      appBar: AppBar(
        backgroundColor: colors.bgPrimary,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.close, color: colors.textPrimary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Morning Brief',
          style: TextStyle(
            color: colors.textPrimary,
            fontWeight: FontWeight.w600,
            fontSize: 17,
          ),
        ),
      ),
      body: _loading
          ? Center(
              child: CircularProgressIndicator(color: colors.brandAccent),
            )
          : _error != null
              ? _buildError(colors)
              : _buildContent(colors, greeting, userName),
    );
  }

  Widget _buildError(VelaColorScheme colors) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.s6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.wifi_off_rounded, size: 48, color: colors.textTertiary),
            const SizedBox(height: AppSpacing.s3),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: TextStyle(color: colors.textSecondary, fontSize: 15),
            ),
            const SizedBox(height: AppSpacing.s4),
            TextButton(
              onPressed: _load,
              child: Text('Retry', style: TextStyle(color: colors.brandAccent)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(
      VelaColorScheme colors, String greeting, String userName) {
    final data = _data!;
    final message = _detectMessage(data);

    return RefreshIndicator(
      color: colors.brandAccent,
      onRefresh: _load,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.s4, vertical: AppSpacing.s2),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Greeting header
            _buildGreetingHeader(colors, greeting, userName),
            const SizedBox(height: AppSpacing.s5),

            // Today's Focus
            _buildSection(
              colors,
              icon: '🎯',
              title: "Today's Focus",
              badge: data.todayTasks.isEmpty
                  ? null
                  : '${data.todayTasks.length}',
              child: data.todayTasks.isEmpty
                  ? _buildEmptyHint(colors, 'No high-priority tasks for today')
                  : Column(
                      children: data.todayTasks
                          .map((t) => _buildTaskRow(colors, t))
                          .toList(),
                    ),
            ),
            const SizedBox(height: AppSpacing.s4),

            // Overdue
            _buildSection(
              colors,
              icon: '⚠️',
              title: 'Overdue',
              badge: data.overdueTasks.isEmpty ? null : '${data.overdueTasks.length}',
              badgeColor: data.overdueTasks.isNotEmpty
                  ? colors.stateError
                  : null,
              child: data.overdueTasks.isEmpty
                  ? _buildEmptyHint(colors, 'Nothing overdue — clean slate!',
                      isPositive: true)
                  : Column(
                      children: data.overdueTasks
                          .map((t) => _buildOverdueRow(colors, t))
                          .toList(),
                    ),
            ),
            const SizedBox(height: AppSpacing.s4),

            // Active Goals
            _buildSection(
              colors,
              icon: '🏁',
              title: 'Active Goals',
              child: data.activeGoals.isEmpty
                  ? _buildEmptyHint(colors, 'No active goals set')
                  : Column(
                      children: data.activeGoals
                          .map((g) => _buildGoalRow(colors, g))
                          .toList(),
                    ),
            ),
            const SizedBox(height: AppSpacing.s4),

            // Weekly Stats
            _buildWeeklyStats(colors, data.weeklyHours),
            const SizedBox(height: AppSpacing.s5),

            // Message
            _buildMessageCard(colors, message),
            const SizedBox(height: AppSpacing.s8),
          ],
        ),
      ),
    );
  }

  Widget _buildGreetingHeader(
      VelaColorScheme colors, String greeting, String userName) {
    final now = DateTime.now();
    final dateStr =
        '${_weekday(now.weekday)}, ${_monthName(now.month)} ${now.day}';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.s5),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            colors.brandAccent.withValues(alpha: 0.15),
            colors.brandAccent.withValues(alpha: 0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.brandAccent.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$greeting${userName.isNotEmpty ? ', $userName' : ''}',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: colors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            dateStr,
            style: TextStyle(fontSize: 13, color: colors.textTertiary),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(
    VelaColorScheme colors, {
    required String icon,
    required String title,
    required Widget child,
    String? badge,
    Color? badgeColor,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.surfaceBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
                AppSpacing.s4, AppSpacing.s3, AppSpacing.s4, AppSpacing.s2),
            child: Row(
              children: [
                Text(icon, style: const TextStyle(fontSize: 16)),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: colors.textPrimary,
                  ),
                ),
                if (badge != null) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: (badgeColor ?? colors.brandAccent)
                          .withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      badge,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: badgeColor ?? colors.brandAccent,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          Divider(height: 1, color: colors.surfaceBorder),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.s3),
            child: child,
          ),
        ],
      ),
    );
  }

  Widget _buildTaskRow(VelaColorScheme colors, Task task) {
    final priorityColor = task.priority == 'HIGH'
        ? colors.stateError
        : task.priority == 'MEDIUM'
            ? colors.stateWarning
            : colors.textTertiary;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Icon(Icons.radio_button_unchecked,
              size: 16, color: colors.textTertiary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              task.title,
              style: TextStyle(fontSize: 14, color: colors.textPrimary),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (task.priority != null) ...[
            const SizedBox(width: 8),
            Text(
              task.priority!,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: priorityColor,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildOverdueRow(VelaColorScheme colors, Task task) {
    final reminder = task.reminderTime;
    String daysAgo = '';
    if (reminder != null) {
      final diff = DateTime.now().difference(reminder).inDays;
      daysAgo = diff == 0
          ? 'today'
          : diff == 1
              ? '1 day ago'
              : '$diff days ago';
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Icon(Icons.warning_amber_rounded,
              size: 16, color: colors.stateWarning),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              task.title,
              style: TextStyle(fontSize: 14, color: colors.textPrimary),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (daysAgo.isNotEmpty)
            Text(
              daysAgo,
              style: TextStyle(fontSize: 11, color: colors.textTertiary),
            ),
        ],
      ),
    );
  }

  Widget _buildGoalRow(VelaColorScheme colors, Goal goal) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(Icons.flag_outlined, size: 16, color: colors.brandAccent),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              goal.title,
              style: TextStyle(fontSize: 14, color: colors.textPrimary),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
            decoration: BoxDecoration(
              color: colors.brandAccent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              goal.progress > 0 ? '${goal.progress}%' : goal.status,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: colors.brandAccent,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWeeklyStats(VelaColorScheme colors, double weeklyHours) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.s4),
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.surfaceBorder),
      ),
      child: Row(
        children: [
          Icon(Icons.timer_outlined, size: 20, color: colors.textTertiary),
          const SizedBox(width: 10),
          Text(
            'This week: ',
            style: TextStyle(fontSize: 14, color: colors.textSecondary),
          ),
          Text(
            '${weeklyHours.toStringAsFixed(1)} hrs studied',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: colors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageCard(VelaColorScheme colors, String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.s4),
      decoration: BoxDecoration(
        color: colors.brandAccent.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border:
            Border.all(color: colors.brandAccent.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('💬', style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              '"$message"',
              style: TextStyle(
                fontSize: 14,
                fontStyle: FontStyle.italic,
                color: colors.textSecondary,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyHint(VelaColorScheme colors, String text,
      {bool isPositive = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 13,
          color: isPositive ? colors.stateSuccess : colors.textTertiary,
          fontStyle: FontStyle.italic,
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  String _greeting(int hour) {
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  String _weekday(int weekday) {
    const days = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday', 'Sunday'
    ];
    return days[(weekday - 1).clamp(0, 6)];
  }

  String _monthName(int month) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[(month - 1).clamp(0, 11)];
  }
}
