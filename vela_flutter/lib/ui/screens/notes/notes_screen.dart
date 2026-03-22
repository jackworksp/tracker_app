import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_slidable/flutter_slidable.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/utils/error_messages.dart';
import '../../../data/models/note.dart';
import '../../../providers/notes_provider.dart';
import '../../widgets/vela_badge.dart';
import '../../widgets/vela_button.dart';
import '../../widgets/vela_card.dart';
import '../../widgets/vela_input.dart';
import '../../widgets/vela_skeleton.dart';
import 'add_note_modal.dart';

enum _SortMode { pinnedFirst, newest, oldest, alphabetical }

class NotesScreen extends ConsumerStatefulWidget {
  const NotesScreen({super.key});

  @override
  ConsumerState<NotesScreen> createState() => _NotesScreenState();
}

class _NotesScreenState extends ConsumerState<NotesScreen> {
  final _searchController = TextEditingController();
  _SortMode _sortMode = _SortMode.pinnedFirst;
  String? _selectedTag;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notesProvider.notifier).loadNotes();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final notesState = ref.watch(notesProvider);

    // Collect all unique tags
    final allTags = <String>{};
    for (final note in notesState.notes) {
      allTags.addAll(note.tags);
    }
    final tagList = allTags.toList()..sort();

    // Filter and sort notes
    final filteredNotes = _filterAndSort(notesState.notes);

    return Scaffold(
      backgroundColor: colors.bgPrimary,
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddNoteModal(context),
        backgroundColor: colors.brandAccent,
        child: Icon(Icons.add, color: colors.textInverse),
      ),
      body: RefreshIndicator(
        color: colors.brandAccent,
        onRefresh: () async {
          await ref.read(notesProvider.notifier).loadNotes();
        },
        child: CustomScrollView(
          slivers: [
            // Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.s5, AppSpacing.s6, AppSpacing.s5, 0),
                child: Text(
                  'Notes',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    color: colors.textPrimary,
                  ),
                ),
              ),
            ),

            // Search bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.s5, AppSpacing.s4, AppSpacing.s5, 0),
                child: VelaInput(
                  placeholder: 'Search notes...',
                  controller: _searchController,
                  leftIcon: const Icon(Icons.search),
                  size: VelaInputSize.md,
                  onChanged: (value) {
                    setState(() => _searchQuery = value.trim().toLowerCase());
                  },
                  rightIcon: _searchQuery.isNotEmpty
                      ? GestureDetector(
                          onTap: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                          child: const Icon(Icons.close),
                        )
                      : null,
                ),
              ),
            ),

            // Sort dropdown + tag filters
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.s5, AppSpacing.s3 + AppSpacing.s0_5, AppSpacing.s5, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Sort dropdown
                    Row(
                      children: [
                        Icon(Icons.sort, size: 16, color: colors.textTertiary),
                        const SizedBox(width: AppSpacing.s1 + AppSpacing.s0_5),
                        Text(
                          'Sort:',
                          style: TextStyle(
                            fontSize: 13,
                            color: colors.textTertiary,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.s2),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s2 + AppSpacing.s0_5),
                          decoration: BoxDecoration(
                            color: colors.surfaceCard,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: colors.surfaceBorder),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<_SortMode>(
                              value: _sortMode,
                              isDense: true,
                              dropdownColor: colors.surfaceDefault,
                              style: TextStyle(
                                fontSize: 13,
                                color: colors.textPrimary,
                              ),
                              icon: Icon(
                                Icons.keyboard_arrow_down,
                                size: 18,
                                color: colors.textTertiary,
                              ),
                              items: const [
                                DropdownMenuItem(
                                  value: _SortMode.pinnedFirst,
                                  child: Text('Pinned first'),
                                ),
                                DropdownMenuItem(
                                  value: _SortMode.newest,
                                  child: Text('Newest'),
                                ),
                                DropdownMenuItem(
                                  value: _SortMode.oldest,
                                  child: Text('Oldest'),
                                ),
                                DropdownMenuItem(
                                  value: _SortMode.alphabetical,
                                  child: Text('A-Z'),
                                ),
                              ],
                              onChanged: (mode) {
                                if (mode != null) setState(() => _sortMode = mode);
                              },
                            ),
                          ),
                        ),
                      ],
                    ),

                    // Tag filter pills
                    if (tagList.isNotEmpty) ...[
                      const SizedBox(height: AppSpacing.s3),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            // "All" pill
                            Padding(
                              padding: const EdgeInsets.only(right: AppSpacing.s1 + AppSpacing.s0_5),
                              child: VelaBadge(
                                variant: _selectedTag == null
                                    ? VelaBadgeVariant.brand
                                    : VelaBadgeVariant.defaultVariant,
                                size: VelaBadgeSize.md,
                                active: _selectedTag == null,
                                onTap: () => setState(() => _selectedTag = null),
                                child: const Text('All'),
                              ),
                            ),
                            ...tagList.map((tag) {
                              final isActive = _selectedTag == tag;
                              return Padding(
                                padding: const EdgeInsets.only(right: AppSpacing.s1 + AppSpacing.s0_5),
                                child: VelaBadge(
                                  variant: isActive
                                      ? VelaBadgeVariant.brand
                                      : VelaBadgeVariant.defaultVariant,
                                  size: VelaBadgeSize.md,
                                  active: isActive,
                                  onTap: () => setState(() {
                                    _selectedTag = isActive ? null : tag;
                                  }),
                                  child: Text(tag),
                                ),
                              );
                            }),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.s4)),

            // Issue 07: skeleton loader replaces the bare spinner
            if (notesState.isLoading)
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s4),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (_, __) => const VelaSkeletonNoteCard(),
                    childCount: 4,
                  ),
                ),
              )
            // Error
            else if (notesState.error != null)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.s8),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(Icons.error_outline, size: 48, color: colors.stateError),
                        const SizedBox(height: AppSpacing.s3),
                        // Issue 06: specific actionable error message
                        Text(
                          ErrorMessages.noteLoadFailed,
                          style: TextStyle(color: colors.textSecondary, fontSize: 16),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: AppSpacing.s2),
                        VelaButton(
                          variant: VelaButtonVariant.outline,
                          onPressed: () => ref.read(notesProvider.notifier).loadNotes(),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            // Empty state
            else if (filteredNotes.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.edit_note, size: 64, color: colors.textTertiary),
                      const SizedBox(height: AppSpacing.s4),
                      Text(
                        _searchQuery.isNotEmpty || _selectedTag != null
                            ? 'No matching notes found'
                            : 'No notes yet. Create your first note!',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: colors.textSecondary,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      if (_searchQuery.isEmpty && _selectedTag == null) ...[
                        const SizedBox(height: AppSpacing.s6),
                        VelaButton(
                          variant: VelaButtonVariant.primary,
                          leftIcon: const Icon(Icons.add),
                          onPressed: () => _showAddNoteModal(context),
                          child: const Text('Create Note'),
                        ),
                      ],
                    ],
                  ),
                ),
              )
            // Notes list
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s4),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final note = filteredNotes[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.s2 + AppSpacing.s0_5),
                        child: _NoteCard(
                          note: note,
                          colors: colors,
                          onTap: () => _showAddNoteModal(context, note: note),
                          onDelete: () => _deleteNote(note),
                        ),
                      );
                    },
                    childCount: filteredNotes.length,
                  ),
                ),
              ),

            // Issue 11: fabClearance token + safe-area inset
            SliverToBoxAdapter(
              child: Builder(
                builder: (ctx) => SizedBox(
                  height: AppSpacing.fabClearance + MediaQuery.of(ctx).padding.bottom,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Note> _filterAndSort(List<Note> notes) {
    var result = List<Note>.from(notes);

    // Search filter
    if (_searchQuery.isNotEmpty) {
      result = result.where((n) {
        final title = n.title.toLowerCase();
        final content = (n.content ?? '').toLowerCase();
        final tags = n.tags.join(' ').toLowerCase();
        return title.contains(_searchQuery) ||
            content.contains(_searchQuery) ||
            tags.contains(_searchQuery);
      }).toList();
    }

    // Tag filter
    if (_selectedTag != null) {
      result = result.where((n) => n.tags.contains(_selectedTag)).toList();
    }

    // Sort
    switch (_sortMode) {
      case _SortMode.pinnedFirst:
        result.sort((a, b) {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          final aDate = a.updatedAt ?? a.createdAt ?? DateTime(2000);
          final bDate = b.updatedAt ?? b.createdAt ?? DateTime(2000);
          return bDate.compareTo(aDate);
        });
      case _SortMode.newest:
        result.sort((a, b) {
          final aDate = a.updatedAt ?? a.createdAt ?? DateTime(2000);
          final bDate = b.updatedAt ?? b.createdAt ?? DateTime(2000);
          return bDate.compareTo(aDate);
        });
      case _SortMode.oldest:
        result.sort((a, b) {
          final aDate = a.createdAt ?? DateTime(2000);
          final bDate = b.createdAt ?? DateTime(2000);
          return aDate.compareTo(bDate);
        });
      case _SortMode.alphabetical:
        result.sort((a, b) => a.title.toLowerCase().compareTo(b.title.toLowerCase()));
    }

    return result;
  }

  void _showAddNoteModal(BuildContext context, {Note? note}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AddNoteModal(
        note: note,
        onSaved: () {
          ref.read(notesProvider.notifier).loadNotes();
        },
      ),
    );
  }

  Future<void> _deleteNote(Note note) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        final colors = isDark ? AppColors.dark : AppColors.light;
        return AlertDialog(
          backgroundColor: colors.surfaceDefault,
          title: Text('Delete Note', style: TextStyle(color: colors.textPrimary)),
          content: Text(
            'Are you sure you want to delete "${note.title}"?',
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
        await ref.read(notesProvider.notifier).deleteNote(note.id);
      } catch (e) {
        if (mounted) {
          // Issue 06: use centralized error message constant
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(ErrorMessages.noteDeleteFailed)),
          );
        }
      }
    }
  }
}

class _NoteCard extends StatelessWidget {
  final Note note;
  final VelaColorScheme colors;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _NoteCard({
    required this.note,
    required this.colors,
    required this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final dateStr = note.updatedAt != null
        ? VelaDateUtils.timeAgo(note.updatedAt!)
        : note.createdAt != null
            ? VelaDateUtils.timeAgo(note.createdAt!)
            : '';

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
      child: VelaCard(
        interactive: true,
        onTap: onTap,
        padding: VelaCardPadding.none,
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.s4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title row
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (note.isPinned)
                    Padding(
                      padding: const EdgeInsets.only(right: AppSpacing.s1 + AppSpacing.s0_5, top: AppSpacing.s0_5),
                      child: Icon(
                        Icons.push_pin,
                        size: 16,
                        color: colors.brandAccent,
                      ),
                    ),
                  Expanded(
                    child: Text(
                      note.title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: colors.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),

              // Content preview
              if (note.content != null && note.content!.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.s1 + AppSpacing.s0_5),
                Text(
                  note.content!,
                  style: TextStyle(
                    fontSize: 14,
                    color: colors.textSecondary,
                    height: 1.5,
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ],

              // Tags
              if (note.tags.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.s2 + AppSpacing.s0_5),
                Wrap(
                  spacing: AppSpacing.s1 + AppSpacing.s0_5,
                  runSpacing: AppSpacing.s1,
                  children: note.tags.map((tag) {
                    return VelaBadge(
                      variant: VelaBadgeVariant.defaultVariant,
                      size: VelaBadgeSize.sm,
                      child: Text(tag),
                    );
                  }).toList(),
                ),
              ],

              // Date
              if (dateStr.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.s2 + AppSpacing.s0_5),
                Text(
                  dateStr,
                  style: TextStyle(
                    fontSize: 12,
                    color: colors.textTertiary,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
