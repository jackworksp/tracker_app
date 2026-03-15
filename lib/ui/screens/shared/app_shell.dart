import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../providers/subjects_provider.dart';
import '../../../providers/auth_provider.dart';

class AppShell extends ConsumerStatefulWidget {
  final StatefulNavigationShell navigationShell;

  const AppShell({super.key, required this.navigationShell});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

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

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        if (_scaffoldKey.currentState?.isDrawerOpen ?? false) {
          Navigator.pop(context);
          return;
        }
        if (widget.navigationShell.currentIndex != 0) {
          widget.navigationShell.goBranch(0);
        }
      },
      child: Scaffold(
        key: _scaffoldKey,
        backgroundColor: colors.bgPrimary,
        appBar: AppBar(
          backgroundColor: colors.bgSecondary,
          elevation: 0,
          toolbarHeight: 45,
          leading: IconButton(
            icon: Icon(Icons.menu, color: colors.textPrimary),
            onPressed: () => _scaffoldKey.currentState?.openDrawer(),
          ),
          title: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => _showSubjectPicker(context, colors, subjectsState),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
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
          ),
          actions: [
            IconButton(
              icon: Icon(Icons.person_outline, color: colors.textPrimary),
              onPressed: () => widget.navigationShell.goBranch(7),
            ),
          ],
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(1),
            child: Container(height: 1, color: colors.surfaceBorder),
          ),
        ),
        drawer: _buildDrawer(context, colors),
        body: widget.navigationShell,
      ),
    );
  }

  Widget _buildDrawer(BuildContext context, VelaColorScheme colors) {
    final currentIndex = widget.navigationShell.currentIndex;
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Drawer(
      backgroundColor: colors.bgSecondary,
      child: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: colors.brandAccent,
                    backgroundImage: user?.profilePhotoUrl != null
                        ? NetworkImage(user!.profilePhotoUrl!)
                        : null,
                    child: user?.profilePhotoUrl == null
                        ? Text(
                            (user?.name ?? 'V').substring(0, 1).toUpperCase(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                              fontSize: 18,
                            ),
                          )
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Vela',
                          style: TextStyle(
                            color: colors.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        if (user != null)
                          Text(
                            user.name ?? user.email,
                            style: TextStyle(
                              color: colors.textSecondary,
                              fontSize: 13,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Divider(color: colors.surfaceBorder, height: 1),
            // Nav items
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                children: [
                  _drawerItem(0, Icons.checklist, 'Tasks', colors, currentIndex),
                  _drawerItem(1, Icons.timeline, 'Timeline', colors, currentIndex),
                  _drawerItem(2, Icons.attach_file, 'Files', colors, currentIndex),
                  _drawerItem(3, Icons.edit_note, 'Notes', colors, currentIndex),
                  _drawerItem(4, Icons.chat_bubble_outline, 'Ask', colors, currentIndex),
                  _drawerItem(5, Icons.search, 'Search', colors, currentIndex),
                  _drawerItem(6, Icons.flag_outlined, 'Goals', colors, currentIndex),
                ],
              ),
            ),
            Divider(color: colors.surfaceBorder, height: 1),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: _drawerItem(7, Icons.person_outline, 'Profile', colors, currentIndex),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _drawerItem(int index, IconData icon, String label, VelaColorScheme colors, int currentIndex) {
    final isActive = currentIndex == index;
    return ListTile(
      leading: Icon(icon, color: isActive ? colors.brandAccent : colors.textSecondary),
      title: Text(
        label,
        style: TextStyle(
          color: isActive ? colors.brandAccent : colors.textPrimary,
          fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
        ),
      ),
      selected: isActive,
      selectedTileColor: colors.interactiveSelected,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
      onTap: () {
        widget.navigationShell.goBranch(index);
        Navigator.pop(context);
      },
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
