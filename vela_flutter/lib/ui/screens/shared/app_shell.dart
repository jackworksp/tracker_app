import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/haptics.dart';
import '../../../providers/subjects_provider.dart';

class AppShell extends ConsumerStatefulWidget {
  final StatefulNavigationShell navigationShell;

  const AppShell({super.key, required this.navigationShell});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  @override
  void initState() {
    super.initState();
    // Load subjects when shell mounts
    Future.microtask(() {
      ref.read(subjectsProvider.notifier).loadSubjects();
    });
  }

  /// Maps the current shell branch index to one of the 5 visible nav positions.
  /// Positions: 0=Tasks, 1=Timeline, 2=Notes, 3=Goals, 4=More
  int get _activeNavIndex {
    final i = widget.navigationShell.currentIndex;
    if (i == 0) return 0; // Tasks
    if (i == 1) return 1; // Timeline
    if (i == 3) return 2; // Notes
    if (i == 6) return 3; // Goals
    return 4; // More: Files(2), Ask(4), Search(5), Profile(7), Routines(8)
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final subjectsState = ref.watch(subjectsProvider);

    return Scaffold(
      backgroundColor: colors.bgPrimary,
      appBar: AppBar(
        backgroundColor: colors.bgSecondary,
        elevation: 0,
        toolbarHeight: 45,
        title: GestureDetector(
          onTap: () => _showSubjectPicker(context, colors),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                subjectsState.currentSubject?.name ?? 'Vela',
                style: TextStyle(
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: 4),
              Icon(Icons.keyboard_arrow_down,
                  color: colors.textSecondary, size: 20),
            ],
          ),
        ),
        centerTitle: true,
        // No bottom border — tonal separation via bgSecondary vs bgPrimary
      ),
      body: widget.navigationShell,
      // Glassmorphism floating nav bar — blur(24px), 70% opacity surface
      bottomNavigationBar: ClipRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
          child: Container(
            decoration: BoxDecoration(
              // Surface container high at 70% opacity — no border line
              color: colors.surfaceContainerHigh.withValues(alpha: 0.7),
            ),
            child: SafeArea(
              child: SizedBox(
                height: 58,
                child: Row(
                  children: [
                    _navItem(0, 0, Icons.checklist, 'Tasks', colors),
                    _navItem(1, 1, Icons.timeline, 'Timeline', colors),
                    _navItem(2, 3, Icons.edit_note, 'Notes', colors),
                    _navItem(3, 6, Icons.flag_outlined, 'Goals', colors),
                    _moreNavItem(colors),
                  ],
                ),
              ),
            ),
          ), // Container (glassmorphism)
        ), // BackdropFilter
      ), // ClipRect
    );
  }

  Widget _navItem(int navPos, int branchIndex, IconData icon, String label,
      VelaColorScheme colors) {
    final isActive = _activeNavIndex == navPos;
    return Expanded(
      child: Semantics(
        label: label,
        selected: isActive,
        button: true,
        child: GestureDetector(
          onTap: () async {
            await VelaHaptics.selection();
            widget.navigationShell.goBranch(branchIndex);
          },
          behavior: HitTestBehavior.opaque,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 44),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  icon,
                  size: 22,
                  color: isActive ? colors.brandAccent : colors.textTertiary,
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: AppTypography.navLabel(
                    isActive ? colors.brandAccent : colors.textTertiary,
                    active: isActive,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _moreNavItem(VelaColorScheme colors) {
    final isActive = _activeNavIndex == 4;
    return Expanded(
      child: Semantics(
        label: 'More',
        button: true,
        child: GestureDetector(
          onTap: () => _showMore(context, colors),
          behavior: HitTestBehavior.opaque,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 44),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.more_horiz,
                  size: 22,
                  color: isActive ? colors.brandAccent : colors.textTertiary,
                ),
                const SizedBox(height: 2),
                Text(
                  'More',
                  style: AppTypography.navLabel(
                    isActive ? colors.brandAccent : colors.textTertiary,
                    active: isActive,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showMore(BuildContext context, VelaColorScheme colors) {
    showModalBottomSheet(
      context: context,
      backgroundColor: colors.surfaceDefault,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _moreSheetItem(
                    sheetContext, Icons.attach_file, 'Files', 2, colors),
                _moreSheetItem(
                    sheetContext, Icons.chat_bubble_outline, 'Ask', 4, colors),
                _moreSheetItem(sheetContext, Icons.search, 'Search', 5, colors),
                _moreSheetItem(
                    sheetContext, Icons.person_outline, 'Profile', 7, colors),
                _moreSheetItem(
                    sheetContext, Icons.repeat_rounded, 'Routines', 8, colors),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _moreSheetItem(BuildContext sheetContext, IconData icon, String label,
      int branchIndex, VelaColorScheme colors) {
    final isActive = widget.navigationShell.currentIndex == branchIndex;
    return ListTile(
      leading: Icon(
        icon,
        color: isActive ? colors.brandAccent : colors.textSecondary,
      ),
      title: Text(
        label,
        style: TextStyle(
          color: isActive ? colors.brandAccent : colors.textPrimary,
          fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
        ),
      ),
      trailing: isActive
          ? Icon(Icons.check, color: colors.brandAccent, size: 18)
          : null,
      onTap: () async {
        Navigator.pop(sheetContext);
        await VelaHaptics.selection();
        widget.navigationShell.goBranch(branchIndex);
      },
    );
  }

  void _showSubjectPicker(BuildContext context, VelaColorScheme colors) {
    showModalBottomSheet(
      context: context,
      backgroundColor: colors.surfaceDefault,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      builder: (context) {
        return Consumer(
          builder: (context, ref, _) {
            final subjectsState = ref.watch(subjectsProvider);
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      children: [
                        Text(
                          'Switch Life Area',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: colors.textPrimary,
                          ),
                        ),
                        const Spacer(),
                        Semantics(
                          label: 'Close subject picker',
                          button: true,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(8),
                            onTap: () => Navigator.pop(context),
                            child: ConstrainedBox(
                              constraints: const BoxConstraints(
                                minWidth: 44,
                                minHeight: 44,
                              ),
                              child: Icon(Icons.close,
                                  color: colors.textSecondary),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (subjectsState.currentSubject != null)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: colors.interactiveSelected,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                              color: colors.brandAccent.withValues(alpha: 0.4)),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.label_outline,
                                size: 14, color: colors.brandAccent),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                'Currently: ${subjectsState.currentSubject!.name}',
                                style: AppTypography.bodySm(colors.brandAccent)
                                    .copyWith(
                                        fontWeight:
                                            AppTypography.weightSemibold),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  else if (!subjectsState.isLoading)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: colors.stateWarningBg,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                              color:
                                  colors.stateWarning.withValues(alpha: 0.5)),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.warning_amber_outlined,
                                size: 14, color: colors.stateWarning),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                'No life area selected — content goes to default',
                                style:
                                    AppTypography.bodySm(colors.stateWarning),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  Divider(color: colors.surfaceBorder, height: 1),
                  if (subjectsState.isLoading && subjectsState.subjects.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Center(
                        child: CircularProgressIndicator(
                          color: colors.brandAccent,
                          strokeWidth: 2,
                        ),
                      ),
                    )
                  else
                    ...subjectsState.subjects.map((subject) {
                      final isActive =
                          subject.id == subjectsState.currentSubject?.id;
                      return ListTile(
                        leading: Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: _parseColor(subject.color),
                            shape: BoxShape.circle,
                          ),
                        ),
                        title: Text(
                          subject.name,
                          style: TextStyle(
                            color: isActive
                                ? colors.brandAccent
                                : colors.textPrimary,
                            fontWeight:
                                isActive ? FontWeight.w600 : FontWeight.w400,
                          ),
                        ),
                        trailing: isActive
                            ? Icon(Icons.check,
                                color: colors.brandAccent, size: 18)
                            : null,
                        onTap: () {
                          ref
                              .read(subjectsProvider.notifier)
                              .setCurrentSubject(subject);
                          Navigator.pop(context);
                        },
                      );
                    }),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Color _parseColor(String hex) {
    hex = hex.replaceFirst('#', '');
    if (hex.length == 6) hex = 'FF$hex';
    return Color(int.parse(hex, radix: 16));
  }
}
