import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/theme_provider.dart';
import '../../../providers/subjects_provider.dart';
import '../../../providers/tasks_provider.dart';
import '../../../providers/notes_provider.dart';
import '../../../providers/progress_provider.dart';
import '../../../providers/goals_provider.dart';
import '../../../providers/attachments_provider.dart';

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
              Center(
                child: Text(
                  'Vela v1.0.0',
                  style: TextStyle(
                    fontSize: 13,
                    color: colors.textDisabled,
                  ),
                ),
              ),
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
