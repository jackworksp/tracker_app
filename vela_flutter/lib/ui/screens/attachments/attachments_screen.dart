import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/storage/local_storage.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/attachment_classifier.dart';
import '../../../core/utils/error_messages.dart';
import '../../../core/utils/link_utils.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/attachments_provider.dart';
import '../../widgets/vela_skeleton.dart';
import 'add_attachment_modal.dart';
import 'attachment_viewer_modal.dart';
import 'move_subject_sheet.dart';

enum FilesViewMode { list, grid }

class _FilterOption {
  final String label;
  final IconData icon;
  final Map<String, dynamic> serverFilters;
  final bool Function(Attachment attachment) matches;

  const _FilterOption({
    required this.label,
    required this.icon,
    required this.serverFilters,
    required this.matches,
  });
}

class AttachmentsScreen extends ConsumerStatefulWidget {
  const AttachmentsScreen({super.key});

  @override
  ConsumerState<AttachmentsScreen> createState() => _AttachmentsScreenState();
}

class _AttachmentsScreenState extends ConsumerState<AttachmentsScreen> {
  static const _defaultFilterLabel = 'All';

  late final List<_FilterOption> _filters;
  String _selectedFilter = _defaultFilterLabel;
  FilesViewMode _viewMode = FilesViewMode.list;

  @override
  void initState() {
    super.initState();
    _filters = _buildFilters();
    Future.microtask(() async {
      await _restoreViewMode();
      if (!mounted) return;
      await ref.read(attachmentsProvider.notifier).loadAttachments();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final state = ref.watch(attachmentsProvider);

    return Scaffold(
      backgroundColor: colors.bgPrimary,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Files',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                        color: colors.textPrimary,
                      ),
                    ),
                  ),
                  _buildHeaderAction(
                    icon: _viewMode == FilesViewMode.list
                        ? Icons.grid_view_rounded
                        : Icons.view_agenda_rounded,
                    colors: colors,
                    tooltip: _viewMode == FilesViewMode.list
                        ? 'Switch to grid view'
                        : 'Switch to list view',
                    onPressed: _toggleViewMode,
                  ),
                  const SizedBox(width: 10),
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: colors.brandAccent,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: IconButton(
                      icon: Icon(Icons.add, color: colors.bgPrimary),
                      tooltip: 'Add file',
                      onPressed: () => _showAddAttachmentModal(context),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Filter Chips
            _buildFilterRow(colors),
            const SizedBox(height: 16),
            // Content
            Expanded(
              child: _buildContent(state, colors),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterRow(VelaColorScheme colors) {
    return SizedBox(
      height: 72,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _filters.length,
        itemBuilder: (context, index) {
          final filter = _filters[index];
          final label = filter.label;
          final icon = filter.icon;

          final isSelected = _selectedFilter == label;

          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => _applyFilter(filter),
              child: Container(
                width: 76,
                decoration: BoxDecoration(
                  color: isSelected
                      ? colors.interactiveSelected
                      : colors.surfaceCard,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      icon,
                      size: 24,
                      color: isSelected
                          ? colors.brandAccent
                          : colors.textSecondary,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: isSelected
                            ? colors.brandAccent
                            : colors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildContent(AttachmentsState state, VelaColorScheme colors) {
    if (state.isLoading && state.attachments.isEmpty) {
      return _buildSkeletons();
    }

    if (state.error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: colors.stateError),
            const SizedBox(height: 12),
            Text(
              ErrorMessages.attachmentLoadFailed,
              style: TextStyle(fontSize: 16, color: colors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () =>
                  ref.read(attachmentsProvider.notifier).loadAttachments(),
              child: Text('Retry', style: TextStyle(color: colors.brandAccent)),
            ),
          ],
        ),
      );
    }

    if (state.attachments.isEmpty) {
      return _selectedFilter == _defaultFilterLabel
          ? _buildEmptyState(colors)
          : _buildEmptyState(
              colors,
              title: 'No files match this filter',
              subtitle: 'Try a different chip or add a new file',
            );
    }

    final filteredAttachments = _filteredAttachments(state.attachments);

    if (filteredAttachments.isEmpty) {
      return _buildEmptyState(
        colors,
        title: 'No files match this filter',
        subtitle: 'Try a different chip or add a new file',
      );
    }

    return RefreshIndicator(
      color: colors.brandAccent,
      onRefresh: () =>
          ref.read(attachmentsProvider.notifier).loadAttachments(page: 1),
      child: _viewMode == FilesViewMode.list
          ? _buildListView(filteredAttachments, state, colors)
          : _buildGridView(filteredAttachments, state, colors),
    );
  }

  Future<void> _restoreViewMode() async {
    final localStorage = ref.read(localStorageProvider);
    final savedMode = localStorage.getAttachmentsViewMode();
    if (savedMode == 'grid' && mounted) {
      setState(() => _viewMode = FilesViewMode.grid);
    }
  }

  Future<void> _toggleViewMode() async {
    final nextMode = _viewMode == FilesViewMode.list
        ? FilesViewMode.grid
        : FilesViewMode.list;
    setState(() => _viewMode = nextMode);
    await ref.read(localStorageProvider).setAttachmentsViewMode(nextMode.name);
  }

  List<_FilterOption> _buildFilters() {
    return [
      _FilterOption(
        label: _defaultFilterLabel,
        icon: Icons.grid_view_rounded,
        serverFilters: const {},
        matches: (_) => true,
      ),
      _FilterOption(
        label: 'Youtube',
        icon: Icons.play_circle_filled,
        serverFilters: const {'platform': 'youtube'},
        matches: (attachment) =>
            _classifyAttachment(attachment).kind == 'youtube',
      ),
      _FilterOption(
        label: 'Link',
        icon: Icons.link,
        serverFilters: const {'file_type': 'link'},
        matches: (attachment) => _classifyAttachment(attachment).kind == 'link',
      ),
      _FilterOption(
        label: 'Instagram',
        icon: Icons.camera_alt,
        serverFilters: const {'platform': 'instagram'},
        matches: (attachment) =>
            _classifyAttachment(attachment).kind == 'instagram',
      ),
      _FilterOption(
        label: 'PDFs',
        icon: Icons.description,
        serverFilters: const {'file_type': 'pdf'},
        matches: (attachment) =>
            _classifyAttachment(attachment).kind == 'document',
      ),
      _FilterOption(
        label: 'Image',
        icon: Icons.image,
        serverFilters: const {'file_type': 'image'},
        matches: (attachment) =>
            _classifyAttachment(attachment).kind == 'image',
      ),
    ];
  }

  AttachmentClassification _classifyAttachment(Attachment attachment) {
    return AttachmentClassifier.classify(
      url: attachment.url,
      type: attachment.type,
      metadata: attachment.metadata,
    );
  }

  List<Attachment> _filteredAttachments(List<Attachment> attachments) {
    final activeFilter = _filters.firstWhere(
      (filter) => filter.label == _selectedFilter,
      orElse: () => _filters.first,
    );
    return attachments.where(activeFilter.matches).toList();
  }

  Future<void> _applyFilter(_FilterOption filter) async {
    setState(() => _selectedFilter = filter.label);
    await ref
        .read(attachmentsProvider.notifier)
        .loadAttachments(filters: filter.serverFilters, page: 1);
  }

  Widget _buildHeaderAction({
    required IconData icon,
    required VelaColorScheme colors,
    required String tooltip,
    required VoidCallback onPressed,
  }) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(16),
      ),
      child: IconButton(
        icon: Icon(icon, color: colors.textPrimary),
        tooltip: tooltip,
        onPressed: onPressed,
      ),
    );
  }

  Widget _buildSkeletons() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: 4,
      itemBuilder: (_, __) => const VelaSkeletonAttachmentCard(),
    );
  }

  Widget _buildListView(
    List<Attachment> attachments,
    AttachmentsState state,
    VelaColorScheme colors,
  ) {
    final itemCount = attachments.length + (state.hasNextPage ? 1 : 0);

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      itemCount: itemCount,
      itemBuilder: (context, index) {
        if (index == attachments.length) {
          return _buildLoadMoreButton(state, colors);
        }

        final attachment = attachments[index];
        return _AttachmentCard(
          attachment: attachment,
          colors: colors,
          onTap: () => _openAttachment(attachment),
          onLongPress: () => _showCardOptions(context, attachment),
          onDismissed: () => _deleteAttachment(attachment),
        );
      },
    );
  }

  Widget _buildGridView(
    List<Attachment> attachments,
    AttachmentsState state,
    VelaColorScheme colors,
  ) {
    final itemCount = attachments.length + (state.hasNextPage ? 1 : 0);

    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.78,
      ),
      itemCount: itemCount,
      itemBuilder: (context, index) {
        if (index == attachments.length) {
          return _LoadMoreGridTile(
            colors: colors,
            onTap: () => ref
                .read(attachmentsProvider.notifier)
                .loadAttachments(page: state.currentPage + 1),
          );
        }

        final attachment = attachments[index];
        return _AttachmentGridCard(
          attachment: attachment,
          colors: colors,
          onTap: () => _openAttachment(attachment),
          onLongPress: () => _showCardOptions(context, attachment),
        );
      },
    );
  }

  Widget _buildLoadMoreButton(AttachmentsState state, VelaColorScheme colors) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: TextButton(
          onPressed: () => ref
              .read(attachmentsProvider.notifier)
              .loadAttachments(page: state.currentPage + 1),
          child: Text(
            'Load More',
            style: TextStyle(
              color: colors.brandAccent,
              fontSize: 15,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }

  void _openAttachment(Attachment attachment) {
    if (attachment.url != null) {
      AttachmentViewerModal.show(context, attachment);
    }
  }

  Widget _buildEmptyState(
    VelaColorScheme colors, {
    String title = 'No attachments found',
    String subtitle = 'Add links to resources you want to save',
  }) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.attach_file, size: 64, color: colors.textTertiary),
          const SizedBox(height: 16),
          Text(
            title,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: colors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: TextStyle(fontSize: 14, color: colors.textTertiary),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => _showAddAttachmentModal(context),
            icon: const Icon(Icons.add),
            label: const Text('Add Your First Link'),
            style: ElevatedButton.styleFrom(
              backgroundColor: colors.brandAccent,
              foregroundColor: colors.textInverse,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showAddAttachmentModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const AddAttachmentModal(),
    );
  }

  Future<void> _deleteAttachment(Attachment attachment) async {
    try {
      await ref
          .read(attachmentsProvider.notifier)
          .deleteAttachment(attachment.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('"${attachment.title}" deleted')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text(ErrorMessages.attachmentDeleteFailed)),
        );
        ref.read(attachmentsProvider.notifier).loadAttachments();
      }
    }
  }

  Future<void> _showCardOptions(BuildContext context, Attachment attachment) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final canMoveToSubject = _isStandaloneAttachment(attachment);
    final canRename = _canRenameAttachment(attachment);

    return showModalBottomSheet(
      context: context,
      backgroundColor: colors.surfaceElevated,
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
                if (canRename)
                  ListTile(
                    leading: Icon(Icons.drive_file_rename_outline,
                        color: colors.textSecondary),
                    title: Text(
                      'Rename',
                      style: TextStyle(color: colors.textPrimary),
                    ),
                    onTap: () async {
                      Navigator.pop(sheetContext);
                      await _showRenameAttachmentDialog(attachment);
                    },
                  ),
                if (canMoveToSubject)
                  ListTile(
                    leading:
                        Icon(Icons.book_outlined, color: colors.textSecondary),
                    title: Text(
                      'Move to Subject',
                      style: TextStyle(color: colors.textPrimary),
                    ),
                    onTap: () async {
                      Navigator.pop(sheetContext);
                      await MoveSubjectSheet.show(
                        context,
                        attachment: attachment,
                      );
                    },
                  ),
                ListTile(
                  leading: Icon(Icons.delete_outline, color: colors.stateError),
                  title: Text(
                    'Delete',
                    style: TextStyle(color: colors.stateError),
                  ),
                  onTap: () async {
                    Navigator.pop(sheetContext);
                    final confirmed =
                        await _confirmDeleteAttachment(attachment);
                    if (confirmed == true) {
                      await _deleteAttachment(attachment);
                    }
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  bool _isStandaloneAttachment(Attachment attachment) {
    return attachment.source == 'standalone' &&
        attachment.id.startsWith('attachment-');
  }

  bool _canRenameAttachment(Attachment attachment) {
    if (attachment.type != 'url') return false;
    return attachment.id.startsWith('attachment-') ||
        attachment.id.startsWith('task-') ||
        attachment.id.startsWith('session-');
  }

  Future<void> _showRenameAttachmentDialog(Attachment attachment) async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final messenger = ScaffoldMessenger.of(context);
    final controller = TextEditingController(text: attachment.title);
    String? errorText;
    var isSaving = false;

    await showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          backgroundColor: colors.surfaceElevated,
          title: Text(
            'Rename Attachment',
            style: TextStyle(color: colors.textPrimary),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: controller,
                autofocus: true,
                maxLength: 500,
                style: TextStyle(color: colors.textPrimary),
                decoration: InputDecoration(
                  labelText: 'Title',
                  errorText: errorText,
                  labelStyle: TextStyle(color: colors.textSecondary),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: isSaving ? null : () => Navigator.pop(ctx),
              child:
                  Text('Cancel', style: TextStyle(color: colors.textSecondary)),
            ),
            TextButton(
              onPressed: isSaving
                  ? null
                  : () async {
                      final title = controller.text.trim();
                      if (title.isEmpty) {
                        setState(() => errorText = 'Title is required');
                        return;
                      }
                      if (title.length > 500) {
                        setState(() => errorText =
                            'Title must be 500 characters or fewer');
                        return;
                      }

                      setState(() {
                        isSaving = true;
                        errorText = null;
                      });

                      try {
                        await ref
                            .read(attachmentsProvider.notifier)
                            .renameAttachment(attachment.id, title);
                        if (!ctx.mounted) return;
                        Navigator.pop(ctx);
                        messenger.showSnackBar(
                          const SnackBar(
                            content: Text('Attachment renamed'),
                          ),
                        );
                      } catch (_) {
                        if (mounted) {
                          setState(() => isSaving = false);
                          messenger.showSnackBar(
                            const SnackBar(
                              content: Text('Failed to rename attachment'),
                            ),
                          );
                        }
                      }
                    },
              child: isSaving
                  ? SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: colors.brandAccent,
                      ),
                    )
                  : Text('Save', style: TextStyle(color: colors.brandAccent)),
            ),
          ],
        ),
      ),
    );

    controller.dispose();
  }

  Future<bool?> _confirmDeleteAttachment(Attachment attachment) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: colors.surfaceElevated,
        title: Text('Delete Attachment',
            style: TextStyle(color: colors.textPrimary)),
        content: Text(
          'Are you sure you want to delete "${attachment.title}"?',
          style: TextStyle(color: colors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child:
                Text('Cancel', style: TextStyle(color: colors.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text('Delete', style: TextStyle(color: colors.stateError)),
          ),
        ],
      ),
    );
  }
}

// ─── Attachment Card ─────────────────────────────────────────────────────────

class _AttachmentCard extends StatelessWidget {
  final Attachment attachment;
  final VelaColorScheme colors;
  final VoidCallback onTap;
  final VoidCallback onLongPress;
  final VoidCallback onDismissed;

  const _AttachmentCard({
    required this.attachment,
    required this.colors,
    required this.onTap,
    required this.onLongPress,
    required this.onDismissed,
  });

  @override
  Widget build(BuildContext context) {
    final classification = AttachmentClassifier.classify(
      url: attachment.url,
      type: attachment.type,
      metadata: attachment.metadata,
    );
    final platform = classification.platform ??
        (attachment.url != null
            ? LinkUtils.detectPlatform(attachment.url!)
            : null);
    final isYoutube = classification.kind == 'youtube';
    final youtubeId = isYoutube && attachment.url != null
        ? LinkUtils.extractYoutubeId(attachment.url!)
        : null;

    return Dismissible(
      key: ValueKey(attachment.id),
      direction: DismissDirection.startToEnd,
      background: Container(
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.only(left: 24),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: colors.stateError,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(Icons.delete_outline, color: colors.textInverse),
      ),
      confirmDismiss: (_) async {
        return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: colors.surfaceElevated,
            title: Text('Delete Attachment',
                style: TextStyle(color: colors.textPrimary)),
            content: Text(
              'Are you sure you want to delete "${attachment.title}"?',
              style: TextStyle(color: colors.textSecondary),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: Text('Cancel',
                    style: TextStyle(color: colors.textSecondary)),
              ),
              TextButton(
                onPressed: () => Navigator.pop(ctx, true),
                child:
                    Text('Delete', style: TextStyle(color: colors.stateError)),
              ),
            ],
          ),
        );
      },
      onDismissed: (_) => onDismissed(),
      child: GestureDetector(
        onTap: onTap,
        onLongPress: onLongPress,
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: colors.surfaceCard,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Thumbnail
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: _buildThumbnail(platform, isYoutube, youtubeId),
              ),
              const SizedBox(width: 12),
              // Text Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      attachment.title,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: colors.textPrimary,
                        height: 1.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Text(
                          _displayLabel(classification.kind, platform),
                          style: TextStyle(
                            fontSize: 13,
                            color: colors.brandAccent,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          ' · ',
                          style: TextStyle(
                              fontSize: 13, color: colors.textSecondary),
                        ),
                        if (attachment.createdAt != null)
                          Expanded(
                            child: Text(
                              _formatDate(attachment.createdAt!),
                              style: TextStyle(
                                  fontSize: 13, color: colors.textTertiary),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
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
    );
  }

  Widget _buildThumbnail(String? platform, bool isYoutube, String? youtubeId) {
    if (isYoutube && youtubeId != null) {
      return Image.network(
        LinkUtils.getYoutubeThumbnail(youtubeId),
        width: 80,
        height: 80,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _buildPlaceholder(platform),
      );
    } else if (AttachmentClassifier.classify(
              url: attachment.url,
              type: attachment.type,
              metadata: attachment.metadata,
            ).kind ==
            'image' &&
        attachment.url != null) {
      return Image.network(
        attachment.url!,
        width: 80,
        height: 80,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _buildPlaceholder(platform),
      );
    } else {
      return _buildPlaceholder(platform);
    }
  }

  Widget _buildPlaceholder(String? platform) {
    IconData icon;
    if (platform == 'instagram') {
      icon = Icons.camera_alt;
    } else if (AttachmentClassifier.classify(
          url: attachment.url,
          type: attachment.type,
          metadata: attachment.metadata,
        ).kind ==
        'document') {
      icon = Icons.description;
    } else if (AttachmentClassifier.classify(
          url: attachment.url,
          type: attachment.type,
          metadata: attachment.metadata,
        ).kind ==
        'image') {
      icon = Icons.image;
    } else {
      icon = Icons.link;
    }

    return Container(
      width: 80,
      height: 80,
      color: colors.surfaceElevated,
      child: Center(
        child: Icon(icon, size: 32, color: colors.textTertiary),
      ),
    );
  }

  String _displayLabel(String kind, String? platform) {
    switch (kind) {
      case 'youtube':
        return 'Youtube';
      case 'instagram':
        return 'Instagram';
      case 'document':
        return 'PDF';
      case 'image':
        return 'Image';
      case 'link':
      default:
        if (platform == 'google_drive') return 'Docs';
        return 'Link';
    }
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}

class _AttachmentGridCard extends StatelessWidget {
  final Attachment attachment;
  final VelaColorScheme colors;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  const _AttachmentGridCard({
    required this.attachment,
    required this.colors,
    required this.onTap,
    required this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    final classification = AttachmentClassifier.classify(
      url: attachment.url,
      type: attachment.type,
      metadata: attachment.metadata,
    );
    final platform = classification.platform ??
        (attachment.url != null
            ? LinkUtils.detectPlatform(attachment.url!)
            : null);
    final isYoutube = classification.kind == 'youtube';
    final youtubeId = isYoutube && attachment.url != null
        ? LinkUtils.extractYoutubeId(attachment.url!)
        : null;

    return GestureDetector(
      onTap: onTap,
      onLongPress: onLongPress,
      child: Container(
        decoration: BoxDecoration(
          color: colors.surfaceCard,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(16)),
                child: SizedBox(
                  width: double.infinity,
                  child: _GridThumbnail(
                    attachment: attachment,
                    colors: colors,
                    platform: platform,
                    isYoutube: isYoutube,
                    youtubeId: youtubeId,
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    attachment.title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: colors.textPrimary,
                      height: 1.25,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _displayLabel(classification.kind, platform),
                    style: TextStyle(
                      fontSize: 12,
                      color: colors.brandAccent,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (attachment.createdAt != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      _formatDate(attachment.createdAt!),
                      style: TextStyle(
                        fontSize: 12,
                        color: colors.textTertiary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _displayLabel(String kind, String? platform) {
    switch (kind) {
      case 'youtube':
        return 'Youtube';
      case 'instagram':
        return 'Instagram';
      case 'document':
        return 'PDF';
      case 'image':
        return 'Image';
      case 'link':
      default:
        if (platform == 'google_drive') return 'Docs';
        return 'Link';
    }
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}

class _GridThumbnail extends StatelessWidget {
  final Attachment attachment;
  final VelaColorScheme colors;
  final String? platform;
  final bool isYoutube;
  final String? youtubeId;

  const _GridThumbnail({
    required this.attachment,
    required this.colors,
    required this.platform,
    required this.isYoutube,
    required this.youtubeId,
  });

  @override
  Widget build(BuildContext context) {
    final classification = AttachmentClassifier.classify(
      url: attachment.url,
      type: attachment.type,
      metadata: attachment.metadata,
    );

    if (isYoutube && youtubeId != null) {
      return Image.network(
        LinkUtils.getYoutubeThumbnail(youtubeId!),
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _placeholder(classification.kind),
      );
    }

    if (classification.kind == 'image' && attachment.url != null) {
      return Image.network(
        attachment.url!,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _placeholder(classification.kind),
      );
    }

    return _placeholder(classification.kind);
  }

  Widget _placeholder(String kind) {
    IconData icon;
    switch (kind) {
      case 'youtube':
        icon = Icons.play_circle_fill_rounded;
        break;
      case 'instagram':
        icon = Icons.camera_alt;
        break;
      case 'document':
        icon = Icons.description;
        break;
      case 'image':
        icon = Icons.image;
        break;
      default:
        icon = Icons.link;
        break;
    }

    return Container(
      color: colors.surfaceElevated,
      child: Center(
        child: Icon(icon, size: 34, color: colors.textTertiary),
      ),
    );
  }
}

class _LoadMoreGridTile extends StatelessWidget {
  final VelaColorScheme colors;
  final VoidCallback onTap;

  const _LoadMoreGridTile({
    required this.colors,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Ink(
          decoration: BoxDecoration(
            color: colors.surfaceCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: colors.surfaceElevated),
          ),
          child: Center(
            child: Text(
              'Load More',
              style: TextStyle(
                color: colors.brandAccent,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
