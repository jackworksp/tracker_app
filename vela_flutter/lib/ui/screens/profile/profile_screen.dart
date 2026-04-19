import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/providers/update_provider.dart';
import '../../../core/services/update_service.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/theme_provider.dart';
import '../../../providers/subjects_provider.dart';
import '../../../providers/tasks_provider.dart';
import '../../../providers/notes_provider.dart';
import '../../../providers/progress_provider.dart';
import '../../../providers/goals_provider.dart';
import '../../../providers/attachments_provider.dart';
import '../../../services/morning_brief_service.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final authState = ref.watch(authProvider);
    final themeMode = ref.watch(themeModeProvider);
    final subjectsState = ref.watch(subjectsProvider);

    final user = authState.user;
    final userName = user?.name ?? 'User';
    final userEmail = user?.userId ?? '';
    final initials = _getInitials(userName);
    final profilePhotoUrl = user?.profilePhotoUrl;

    return Scaffold(
      backgroundColor: colors.bgPrimary,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.s4, vertical: AppSpacing.s4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Profile header
              _buildProfileCard(
                colors,
                initials: initials,
                name: userName,
                email: userEmail,
                photoUrl: profilePhotoUrl,
              ),

              const SizedBox(height: AppSpacing.s6),

              // Menu section
              _buildSectionLabel('Menu', colors),
              const SizedBox(height: AppSpacing.s2),
              _buildMenuCard(colors, children: [
                _buildMenuItem(
                  colors,
                  icon: Icons.flag_outlined,
                  label: 'My Goals',
                  onTap: () => context.go('/goals'),
                ),
                _buildDivider(colors),
                _buildMenuItem(
                  colors,
                  icon: Icons.book_outlined,
                  label: 'My Life Areas',
                  trailing: Text(
                    subjectsState.currentSubject?.name ?? '',
                    style: TextStyle(
                      fontSize: 13,
                      color: colors.textTertiary,
                    ),
                  ),
                  onTap: () =>
                      _showSubjectPicker(context, ref, colors, subjectsState),
                ),
              ]),

              const SizedBox(height: AppSpacing.s6),

              // Settings section
              _buildSectionLabel('Settings', colors),
              const SizedBox(height: AppSpacing.s2),
              _buildMenuCard(colors, children: [
                _buildMenuItem(
                  colors,
                  icon: isDark
                      ? Icons.dark_mode_outlined
                      : Icons.light_mode_outlined,
                  label: 'Dark Mode',
                  trailing: Switch.adaptive(
                    value: themeMode == ThemeMode.dark,
                    onChanged: (_) =>
                        ref.read(themeModeProvider.notifier).toggleTheme(),
                    activeColor: colors.brandAccent,
                    activeTrackColor: colors.brandAccent.withOpacity(0.3),
                  ),
                  onTap: () =>
                      ref.read(themeModeProvider.notifier).toggleTheme(),
                ),
                _buildDivider(colors),
                const _MorningBriefTile(),
                _buildDivider(colors),
                const _CheckForUpdatesTile(),
              ]),

              const SizedBox(height: AppSpacing.s6),

              // Account section
              _buildSectionLabel('Account', colors),
              const SizedBox(height: AppSpacing.s2),
              _buildMenuCard(colors, children: [
                _buildMenuItem(
                  colors,
                  icon: Icons.logout,
                  label: 'Sign Out',
                  iconColor: colors.stateError,
                  labelColor: colors.stateError,
                  onTap: () => _confirmSignOut(context, ref, colors),
                ),
              ]),

              const SizedBox(height: AppSpacing.s8),

              // App info
              const _AppVersionText(),
              const SizedBox(height: AppSpacing.s4),
            ],
          ),
        ),
      ),
    );
  }

  String _getInitials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  Widget _buildProfileCard(
    VelaColorScheme colors, {
    required String initials,
    required String name,
    required String email,
    String? photoUrl,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.s5),
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.surfaceBorder),
      ),
      child: Column(
        children: [
          // Avatar
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: colors.brandAccent.withOpacity(0.15),
              shape: BoxShape.circle,
              image: photoUrl != null && photoUrl.isNotEmpty
                  ? DecorationImage(
                      image: NetworkImage(photoUrl),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: photoUrl == null || photoUrl.isEmpty
                ? Center(
                    child: Text(
                      initials,
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w600,
                        color: colors.brandAccent,
                      ),
                    ),
                  )
                : null,
          ),
          const SizedBox(height: AppSpacing.s3 + AppSpacing.s0_5),
          Text(
            name,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: colors.textPrimary,
            ),
          ),
          const SizedBox(height: AppSpacing.s1),
          Text(
            email,
            style: TextStyle(
              fontSize: 14,
              color: colors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionLabel(String label, VelaColorScheme colors) {
    return Padding(
      padding: const EdgeInsets.only(left: AppSpacing.s1),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: colors.textTertiary,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildMenuCard(VelaColorScheme colors,
      {required List<Widget> children}) {
    return Container(
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.surfaceBorder),
      ),
      child: Column(children: children),
    );
  }

  Widget _buildMenuItem(
    VelaColorScheme colors, {
    required IconData icon,
    required String label,
    Widget? trailing,
    VoidCallback? onTap,
    Color? iconColor,
    Color? labelColor,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.s4,
            vertical: AppSpacing.s3 + AppSpacing.s0_5),
        child: Row(
          children: [
            Icon(icon, size: 22, color: iconColor ?? colors.textSecondary),
            const SizedBox(width: AppSpacing.s3 + AppSpacing.s0_5),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: labelColor ?? colors.textPrimary,
                ),
              ),
            ),
            if (trailing != null)
              trailing
            else
              Icon(
                Icons.chevron_right,
                size: 20,
                color: colors.textDisabled,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider(VelaColorScheme colors) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s4),
      child: Divider(height: 1, color: colors.surfaceBorder),
    );
  }

  void _showSubjectPicker(
    BuildContext context,
    WidgetRef ref,
    VelaColorScheme colors,
    SubjectsState subjectsState,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: colors.surfaceElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        final subjects = subjectsState.subjects;
        final current = subjectsState.currentSubject;

        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(
                    AppSpacing.s5, AppSpacing.s5, AppSpacing.s5, AppSpacing.s3),
                child: Text(
                  'Select Life Area',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: colors.textPrimary,
                  ),
                ),
              ),
              if (subjects.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.s5),
                  child: Text(
                    'No life areas found.',
                    style: TextStyle(
                      fontSize: 15,
                      color: colors.textTertiary,
                    ),
                  ),
                )
              else
                ...subjects.map((subject) {
                  final isSelected = current?.id == subject.id;
                  return ListTile(
                    leading: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: _parseColor(subject.color).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        Icons.book_outlined,
                        color: _parseColor(subject.color),
                        size: 18,
                      ),
                    ),
                    title: Text(
                      subject.name,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight:
                            isSelected ? FontWeight.w600 : FontWeight.w400,
                        color: colors.textPrimary,
                      ),
                    ),
                    trailing: isSelected
                        ? Icon(Icons.check_circle,
                            color: colors.brandAccent, size: 22)
                        : null,
                    onTap: () {
                      ref
                          .read(subjectsProvider.notifier)
                          .setCurrentSubject(subject);
                      Navigator.pop(context);
                    },
                  );
                }),
              const SizedBox(height: AppSpacing.s2),
            ],
          ),
        );
      },
    );
  }

  Color _parseColor(String hexColor) {
    try {
      final hex = hexColor.replaceFirst('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    } catch (_) {
      return const Color(0xFF3B82F6);
    }
  }

  void _confirmSignOut(
    BuildContext context,
    WidgetRef ref,
    VelaColorScheme colors,
  ) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: colors.surfaceElevated,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Sign Out',
          style: TextStyle(color: colors.textPrimary),
        ),
        content: Text(
          'Are you sure you want to sign out?',
          style: TextStyle(color: colors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(
              'Cancel',
              style: TextStyle(color: colors.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(dialogContext);
              // Clear user-scoped SharedPreferences
              await ref.read(localStorageProvider).clearUserData();
              // Invalidate all data providers so the next user starts with a clean slate
              ref.invalidate(tasksProvider);
              ref.invalidate(notesProvider);
              ref.invalidate(progressProvider);
              ref.invalidate(goalsProvider);
              ref.invalidate(attachmentsProvider);
              ref.invalidate(subjectsProvider);
              // Clear secure storage and reset auth state
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) {
                context.go('/landing');
              }
            },
            child: Text(
              'Sign Out',
              style: TextStyle(
                color: colors.stateError,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Dynamic app version label
// ---------------------------------------------------------------------------

class _AppVersionText extends StatefulWidget {
  const _AppVersionText();

  @override
  State<_AppVersionText> createState() => _AppVersionTextState();
}

class _AppVersionTextState extends State<_AppVersionText> {
  String _version = '';

  @override
  void initState() {
    super.initState();
    PackageInfo.fromPlatform().then((info) {
      if (mounted) setState(() => _version = 'Vela v${info.version} (${info.buildNumber})');
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    return Center(
      child: Text(
        _version,
        style: TextStyle(fontSize: 13, color: colors.textDisabled),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Morning Brief settings tile — stateful to manage toggle + time picker
// ---------------------------------------------------------------------------

class _MorningBriefTile extends ConsumerStatefulWidget {
  const _MorningBriefTile();

  @override
  ConsumerState<_MorningBriefTile> createState() => _MorningBriefTileState();
}

class _MorningBriefTileState extends ConsumerState<_MorningBriefTile> {
  late bool _enabled;
  late TimeOfDay _time;

  @override
  void initState() {
    super.initState();
    final ls = ref.read(localStorageProvider);
    _enabled = ls.getMorningBriefEnabled();
    _time = TimeOfDay(
      hour: ls.getMorningBriefHour(),
      minute: ls.getMorningBriefMinute(),
    );
  }

  Future<void> _toggle(bool value) async {
    final ls = ref.read(localStorageProvider);
    if (value) {
      await MorningBriefService().schedule(ls, _time);
    } else {
      await MorningBriefService().cancel(ls);
    }
    if (mounted) setState(() => _enabled = value);
  }

  /// Optimistic toggle — flips the UI immediately, then persists.
  /// Rolls back on error and shows a snackbar.
  Future<void> _toggleWithFeedback(bool value) async {
    // Optimistically update UI so the switch feels instant
    setState(() => _enabled = value);
    try {
      await _toggle(value);
    } catch (e) {
      // Roll back on failure
      if (mounted) {
        setState(() => _enabled = !value);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Could not ${value ? 'enable' : 'disable'} Morning Brief. '
              'Check notification permissions.',
            ),
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _time,
    );
    if (picked == null || !mounted) return;
    final ls = ref.read(localStorageProvider);
    setState(() => _time = picked);
    if (_enabled) {
      await MorningBriefService().schedule(ls, picked);
    } else {
      await ls.setMorningBriefTime(picked.hour, picked.minute);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return Padding(
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.s4,
          vertical: AppSpacing.s3 + AppSpacing.s0_5),
      child: Row(
        children: [
          Icon(Icons.wb_sunny_outlined,
              size: 22, color: colors.textSecondary),
          const SizedBox(width: AppSpacing.s3 + AppSpacing.s0_5),
          // Tapping the label/time text opens the time picker
          Expanded(
            child: GestureDetector(
              onTap: _pickTime,
              behavior: HitTestBehavior.opaque,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Morning Brief',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: colors.textPrimary,
                    ),
                  ),
                  Text(
                    _enabled
                        ? 'Daily at ${_time.format(context)}'
                        : 'Tap to set time',
                    style: TextStyle(
                      fontSize: 12,
                      color: colors.textTertiary,
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Switch is fully independent — not wrapped in any InkWell
          Switch.adaptive(
            value: _enabled,
            onChanged: _toggleWithFeedback,
            activeColor: colors.brandAccent,
            activeTrackColor: colors.brandAccent.withValues(alpha: 0.3),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Check for Updates tile
// ---------------------------------------------------------------------------

class _CheckForUpdatesTile extends ConsumerStatefulWidget {
  const _CheckForUpdatesTile();

  @override
  ConsumerState<_CheckForUpdatesTile> createState() =>
      _CheckForUpdatesTileState();
}

class _CheckForUpdatesTileState extends ConsumerState<_CheckForUpdatesTile> {
  bool _checking = false;

  Future<void> _check() async {
    if (_checking) return;
    setState(() => _checking = true);
    try {
      final info =
          await ref.read(updateProvider.notifier).checkForUpdate();
      if (!mounted) return;
      if (info.hasUpdate) {
        _showUpdateSheet(info);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("You're up to date!")),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not check for updates. Try again later.')),
        );
      }
    } finally {
      if (mounted) setState(() => _checking = false);
    }
  }

  void _showUpdateSheet(UpdateInfo info) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    showModalBottomSheet(
      context: context,
      backgroundColor: colors.surfaceElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (sheetContext) => _UpdateSheet(info: info, colors: colors),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return InkWell(
      onTap: _check,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.s4,
            vertical: AppSpacing.s3 + AppSpacing.s0_5),
        child: Row(
          children: [
            _checking
                ? SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: colors.textSecondary,
                    ),
                  )
                : Icon(Icons.system_update_outlined,
                    size: 22, color: colors.textSecondary),
            const SizedBox(width: AppSpacing.s3 + AppSpacing.s0_5),
            Expanded(
              child: Text(
                'Check for Updates',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: colors.textPrimary,
                ),
              ),
            ),
            Icon(Icons.chevron_right, size: 20, color: colors.textDisabled),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Update bottom sheet with download progress
// ---------------------------------------------------------------------------

class _UpdateSheet extends StatefulWidget {
  final UpdateInfo info;
  final VelaColorScheme colors;

  const _UpdateSheet({required this.info, required this.colors});

  @override
  State<_UpdateSheet> createState() => _UpdateSheetState();
}

class _UpdateSheetState extends State<_UpdateSheet> {
  double? _progress; // null = not started, 0–1 = downloading
  bool _done = false;

  Future<void> _install() async {
    setState(() => _progress = 0);
    try {
      await UpdateService().downloadAndInstall(
        onProgress: (p) {
          if (mounted) setState(() => _progress = p);
        },
      );
      if (mounted) setState(() => _done = true);
    } catch (_) {
      if (mounted) {
        setState(() => _progress = null);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Download failed. Please try again.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = widget.colors;
    final info = widget.info;
    final isDownloading = _progress != null && !_done;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.s5),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Update Available',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: colors.textPrimary,
              ),
            ),
            const SizedBox(height: AppSpacing.s2),
            Text(
              'Build ${info.latestBuildNumber} is available (you have build ${info.currentBuildNumber}).',
              style: TextStyle(fontSize: 14, color: colors.textSecondary),
            ),
            const SizedBox(height: AppSpacing.s5),
            if (isDownloading) ...[
              LinearProgressIndicator(
                value: _progress,
                backgroundColor: colors.surfaceBorder,
                color: colors.brandAccent,
                borderRadius: BorderRadius.circular(4),
              ),
              const SizedBox(height: AppSpacing.s2),
              Text(
                'Downloading… ${((_progress ?? 0) * 100).toStringAsFixed(0)}%',
                style: TextStyle(fontSize: 13, color: colors.textTertiary),
              ),
              const SizedBox(height: AppSpacing.s3),
            ] else if (_done) ...[
              Text(
                'Download complete. Follow the installer prompt.',
                style: TextStyle(fontSize: 14, color: colors.stateSuccess),
              ),
              const SizedBox(height: AppSpacing.s3),
            ] else ...[
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _install,
                  style: FilledButton.styleFrom(
                    backgroundColor: colors.brandAccent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: AppSpacing.s3 + AppSpacing.s0_5),
                  ),
                  child: const Text(
                    'Install Update',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.s3),
            ],
          ],
        ),
      ),
    );
  }
}
