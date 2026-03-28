import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/error_messages.dart';
import '../../../core/utils/link_utils.dart';
import '../../../providers/attachments_provider.dart';
import '../../widgets/vela_skeleton.dart';
import 'add_attachment_modal.dart';
import 'attachment_viewer_modal.dart';

class AttachmentsScreen extends ConsumerStatefulWidget {
  const AttachmentsScreen({super.key});

  @override
  ConsumerState<AttachmentsScreen> createState() => _AttachmentsScreenState();
}

class _AttachmentsScreenState extends ConsumerState<AttachmentsScreen> {
  String _selectedFilter = 'All';

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(attachmentsProvider.notifier).loadAttachments());
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
                      'Attachments',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                        color: colors.textPrimary,
                      ),
                    ),
                  ),
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: colors.brandAccent,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: IconButton(
                      icon: Icon(Icons.add, color: colors.bgPrimary),
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
    final filters = [
      {'label': 'All', 'icon': Icons.grid_view, 'filter': null},
      {'label': 'Youtube', 'icon': Icons.play_circle_filled, 'filter': {'platform': 'youtube'}},
      {'label': 'Link', 'icon': Icons.link, 'filter': {'file_type': 'link'}},
      {'label': 'Instagram', 'icon': Icons.camera_alt, 'filter': {'platform': 'instagram'}},
      {'label': 'Document', 'icon': Icons.description, 'filter': {'file_type': 'pdf'}},
      {'label': 'Image', 'icon': Icons.image, 'filter': {'file_type': 'image'}},
    ];

    return SizedBox(
      height: 72,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: filters.length,
        itemBuilder: (context, index) {
          final f = filters[index];
          final label = f['label'] as String;
          final icon = f['icon'] as IconData;
          final filterDict = f['filter'] as Map<String, String>?;
          
          final isSelected = _selectedFilter == label;
          
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () {
                setState(() => _selectedFilter = label);
                if (filterDict == null) {
                  ref.read(attachmentsProvider.notifier).loadAttachments(filters: {}); // Explicitly clear
                } else {
                  ref.read(attachmentsProvider.notifier).loadAttachments(filters: filterDict);
                }
              },
              child: Container(
                width: 68,
                decoration: BoxDecoration(
                  color: isSelected ? colors.interactiveSelected : colors.surfaceCard,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      icon,
                      size: 24,
                      color: isSelected ? colors.brandAccent : colors.textSecondary,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: isSelected ? colors.brandAccent : colors.textSecondary,
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
      return ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: 4,
        itemBuilder: (_, __) => const VelaSkeletonAttachmentCard(),
      );
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
              onPressed: () => ref.read(attachmentsProvider.notifier).loadAttachments(),
              child: Text('Retry', style: TextStyle(color: colors.brandAccent)),
            ),
          ],
        ),
      );
    }

    if (state.attachments.isEmpty) {
      return _buildEmptyState(colors);
    }

    final itemCount = state.attachments.length + (state.hasNextPage ? 1 : 0);

    return RefreshIndicator(
      color: colors.brandAccent,
      onRefresh: () => ref.read(attachmentsProvider.notifier).loadAttachments(
        page: state.currentPage,
      ),
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16), // Bottom: 16
        itemCount: itemCount,
        itemBuilder: (context, index) {
          if (index == state.attachments.length) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: TextButton(
                  onPressed: () => ref.read(attachmentsProvider.notifier).loadAttachments(page: state.currentPage + 1),
                  child: Text(
                    'Load More',
                    style: TextStyle(color: colors.brandAccent, fontSize: 15, fontWeight: FontWeight.w500),
                  ),
                ),
              ),
            );
          }

          final attachment = state.attachments[index];
          return _AttachmentCard(
            attachment: attachment,
            colors: colors,
            onTap: () {
              if (attachment.url != null) {
                AttachmentViewerModal.show(context, attachment);
              }
            },
            onDismissed: () => _deleteAttachment(attachment),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState(VelaColorScheme colors) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.attach_file, size: 64, color: colors.textTertiary),
          const SizedBox(height: 16),
          Text(
            'No attachments found',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: colors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Add links to resources you want to save',
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
      await ref.read(attachmentsProvider.notifier).deleteAttachment(attachment.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('"${attachment.title}" deleted')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ErrorMessages.attachmentDeleteFailed)),
        );
        ref.read(attachmentsProvider.notifier).loadAttachments();
      }
    }
  }
}

// ─── Attachment Card ─────────────────────────────────────────────────────────

class _AttachmentCard extends StatelessWidget {
  final Attachment attachment;
  final VelaColorScheme colors;
  final VoidCallback onTap;
  final VoidCallback onDismissed;

  const _AttachmentCard({
    required this.attachment,
    required this.colors,
    required this.onTap,
    required this.onDismissed,
  });

  @override
  Widget build(BuildContext context) {
    final platform = attachment.platform ?? (attachment.url != null ? LinkUtils.detectPlatform(attachment.url!) : null);
    final isYoutube = platform == 'youtube';
    final youtubeId = isYoutube && attachment.url != null ? LinkUtils.extractYoutubeId(attachment.url!) : null;

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
            title: Text('Delete Attachment', style: TextStyle(color: colors.textPrimary)),
            content: Text(
              'Are you sure you want to delete "${attachment.title}"?',
              style: TextStyle(color: colors.textSecondary),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: Text('Cancel', style: TextStyle(color: colors.textSecondary)),
              ),
              TextButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: Text('Delete', style: TextStyle(color: colors.stateError)),
              ),
            ],
          ),
        );
      },
      onDismissed: (_) => onDismissed(),
      child: GestureDetector(
        onTap: onTap,
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
                          _capitalize(platform ?? attachment.type),
                          style: TextStyle(
                            fontSize: 13,
                            color: colors.brandAccent,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          ' · ',
                          style: TextStyle(fontSize: 13, color: colors.textSecondary),
                        ),
                        if (attachment.createdAt != null)
                          Text(
                            _formatDate(attachment.createdAt!),
                            style: TextStyle(fontSize: 13, color: colors.textTertiary),
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
    } else if (attachment.type == 'image' && attachment.url != null) {
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
    } else if (attachment.type == 'pdf' || attachment.type == 'document') {
      icon = Icons.description;
    } else if (attachment.type == 'image') {
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

  String _capitalize(String s) {
    if (s.isEmpty) return s;
    return s[0].toUpperCase() + s.substring(1).toLowerCase();
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}

