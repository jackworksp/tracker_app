import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
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
          onTap: () => _showSubjectPicker(context, colors, subjectsState),
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
              Icon(Icons.keyboard_arrow_down, color: colors.textSecondary, size: 20),
            ],
          ),
        ),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: colors.surfaceBorder),
        ),
      ),
      body: widget.navigationShell,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: colors.bgSecondary,
          border: Border(top: BorderSide(color: colors.surfaceBorder)),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 56,
            child: Row(
              children: [
                _navItem(0, Icons.checklist, 'Tasks', colors),
                _navItem(1, Icons.timeline, 'Timeline', colors),
                _navItem(2, Icons.attach_file, 'Files', colors),
                _navItem(3, Icons.edit_note, 'Notes', colors),
                _navItem(4, Icons.chat_bubble_outline, 'Ask', colors),
                _navItem(5, Icons.search, 'Search', colors),
                _navItem(6, Icons.flag_outlined, 'Goals', colors),
                _navItem(7, Icons.person_outline, 'Profile', colors),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _navItem(int index, IconData icon, String label, VelaColorScheme colors) {
    final isActive = widget.navigationShell.currentIndex == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => widget.navigationShell.goBranch(index),
        behavior: HitTestBehavior.opaque,
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
              style: TextStyle(
                fontSize: 10,
                color: isActive ? colors.brandAccent : colors.textTertiary,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSubjectPicker(BuildContext context, VelaColorScheme colors, SubjectsState subjectsState) {
    showModalBottomSheet(
      context: context,
      backgroundColor: colors.surfaceDefault,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    Text(
                      'Switch Subject',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: colors.textPrimary,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: Icon(Icons.close, color: colors.textSecondary),
                    ),
                  ],
                ),
              ),
              Divider(color: colors.surfaceBorder, height: 1),
              ...subjectsState.subjects.map((subject) {
                final isActive = subject.id == subjectsState.currentSubject?.id;
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
                      color: isActive ? colors.brandAccent : colors.textPrimary,
                      fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                  trailing: isActive
                      ? Icon(Icons.check, color: colors.brandAccent, size: 18)
                      : null,
                  onTap: () {
                    ref.read(subjectsProvider.notifier).setCurrentSubject(subject);
                    Navigator.pop(context);
                  },
                );
              }),
            ],
          ),
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
