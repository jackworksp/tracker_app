import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/link_utils.dart';
import '../../../providers/attachments_provider.dart';
import 'add_attachment_modal.dart';

class AttachmentsScreen extends ConsumerStatefulWidget {
  const AttachmentsScreen({super.key});

  @override
  ConsumerState<AttachmentsScreen> createState() => _AttachmentsScreenState();
}

class _AttachmentsScreenState extends ConsumerState<AttachmentsScreen> {
  String _selectedPlatform = 'All';

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
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Attachments',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                            color: colors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${state.totalCount} item${state.totalCount != 1 ? 's' : ''}',
                          style: TextStyle(fontSize: 14, color: colors.textTertiary),
                        ),
                      ],
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () => _showAddAttachmentModal(context),
                    icon: Icon(Icons.add, size: 18, color: colors.brandAccent),
                    label: Text(
                      'Add Link',
                      style: TextStyle(color: colors.brandAccent, fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
            ),
            // Platform filter pills
            if (state.attachments.isNotEmpty) ...[
              const SizedBox(height: 8),
              _buildPlatformFilter(state, colors),
            ],
            const SizedBox(height: 8),
            // Content
            Expanded(
              child: _buildContent(state, colors),
            ),
            // Pagination
            if (state.totalPages > 1)
              _buildPagination(state, colors),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddAttachmentModal(context),
        backgroundColor: colors.brandAccent,
        child: Icon(Icons.add, color: colors.textInverse),
      ),
    );
  }

  Widget _buildPlatformFilter(AttachmentsState state, VelaColorScheme colors) {
    // Collect unique platforms from attachments
    final platforms = <String>{'All'};
    for (final a in state.attachments) {
      final detected = a.platform ?? (a.url != null ? LinkUtils.detectPlatform(a.url!) : null);
      if (detected != null && detected.isNotEmpty) {
        platforms.add(_capitalize(detected));
      }
    }

    return SizedBox(
      height: 38,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: platforms.map((platform) {
          final isSelected = _selectedPlatform == platform;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () {
                setState(() => _selectedPlatform = platform);
                if (platform == 'All') {
                  ref.read(attachmentsProvider.notifier).loadAttachments();
                } else {
                  ref.read(attachmentsProvider.notifier).loadAttachments(
                    filters: {'platform': platform.toLowerCase()},
                  );
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? colors.interactiveSelected : colors.surfaceCard,
                  border: Border.all(
                    color: isSelected ? colors.brandAccent : colors.surfaceBorder,
                  ),
                  borderRadius: BorderRadius.circular(9999),
                ),
                child: Text(
                  platform,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: isSelected ? colors.brandAccent : colors.textSecondary,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildContent(AttachmentsState state, VelaColorScheme colors) {
    if (state.isLoading) {
      return Center(
        child: CircularProgressIndicator(color: colors.brandAccent),
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
              'Failed to load attachments',
              style: TextStyle(fontSize: 16, color: colors.textSecondary),
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

    return RefreshIndicator(
      color: colors.brandAccent,
      onRefresh: () => ref.read(attachmentsProvider.notifier).loadAttachments(
        page: state.currentPage,
      ),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: state.attachments.length,
        itemBuilder: (context, index) {
          final attachment = state.attachments[index];
          return _AttachmentCard(
            attachment: attachment,
            colors: colors,
            onTap: () { if (attachment.url != null) LinkUtils.openUrl(attachment.url!); },
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

  Widget _buildPagination(AttachmentsState state, VelaColorScheme colors) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: colors.surfaceElevated,
        border: Border(top: BorderSide(color: colors.surfaceBorder)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            onPressed: state.hasPreviousPage
                ? () => ref
                    .read(attachmentsProvider.notifier)
                    .loadAttachments(page: state.currentPage - 1)
                : null,
            icon: Icon(
              Icons.chevron_left,
              color: state.hasPreviousPage ? colors.textPrimary : colors.textDisabled,
            ),
          ),
          const SizedBox(width: 12),
          Text(
            'Page ${state.currentPage} of ${state.totalPages}',
            style: TextStyle(fontSize: 14, color: colors.textSecondary),
          ),
          const SizedBox(width: 12),
          IconButton(
            onPressed: state.hasNextPage
                ? () => ref
                    .read(attachmentsProvider.notifier)
                    .loadAttachments(page: state.currentPage + 1)
                : null,
            icon: Icon(
              Icons.chevron_right,
              color: state.hasNextPage ? colors.textPrimary : colors.textDisabled,
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
          SnackBar(content: Text('\"${attachment.title}\" deleted')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to delete attachment')),
        );
        ref.read(attachmentsProvider.notifier).loadAttachments();
      }
    }
  }

  String _capitalize(String s) {
    if (s.isEmpty) return s;
    return s[0].toUpperCase() + s.substring(1);
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
              'Are you sure you want to delete \"${attachment.title}\"?',
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
          decoration: BoxDecoration(
            color: colors.surfaceCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: colors.surfaceBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // YouTube thumbnail
              if (isYoutube && youtubeId != null)
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                  child: Image.network(
                    LinkUtils.getYoutubeThumbnail(youtubeId),
                    width: double.infinity,
                    height: 160,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      height: 80,
                      color: colors.surfaceElevated,
                      child: Center(
                        child: Icon(Icons.play_circle_outline, size: 40, color: colors.textTertiary),
                      ),
                    ),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Platform badge + type badge
                    Row(
                      children: [
                        if (platform != null)
                          _PlatformBadge(platform: platform, colors: colors),
                        if (platform != null) const SizedBox(width: 8),
                        _TypeBadge(type: attachment.type, colors: colors),
                        const Spacer(),
                        if (attachment.createdAt != null)
                          Text(
                            _formatDate(attachment.createdAt!),
                            style: TextStyle(fontSize: 12, color: colors.textTertiary),
                          ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    // Title
                    Text(
                      attachment.title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: colors.textPrimary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    // URL truncated
                    if (attachment.url != null)
                    Text(
                      _truncateUrl(attachment.url!),
                      style: TextStyle(fontSize: 13, color: colors.textLink),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
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

  String _truncateUrl(String url) {
    // Remove protocol prefix for cleaner display
    var cleaned = url.replaceFirst(RegExp(r'https?://'), '');
    if (cleaned.length > 50) {
      cleaned = '${cleaned.substring(0, 50)}...';
    }
    return cleaned;
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}

// ─── Platform Badge ──────────────────────────────────────────────────────────

class _PlatformBadge extends StatelessWidget {
  final String platform;
  final VelaColorScheme colors;

  const _PlatformBadge({required this.platform, required this.colors});

  @override
  Widget build(BuildContext context) {
    final (Color bg, Color text, IconData icon) = switch (platform.toLowerCase()) {
      'youtube' => (const Color(0x26FF0000), const Color(0xFFFF0000), Icons.play_circle_filled),
      'github' => (const Color(0x26333333), colors.textPrimary, Icons.code),
      'stackoverflow' => (const Color(0x26F48024), const Color(0xFFF48024), Icons.question_answer),
      'medium' => (const Color(0x26000000), colors.textPrimary, Icons.article),
      'dev.to' => (const Color(0x26000000), colors.textPrimary, Icons.developer_mode),
      _ => (colors.interactiveHover, colors.textSecondary, Icons.link),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(9999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: text),
          const SizedBox(width: 4),
          Text(
            _capitalize(platform),
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: text),
          ),
        ],
      ),
    );
  }

  String _capitalize(String s) {
    if (s.isEmpty) return s;
    return s[0].toUpperCase() + s.substring(1);
  }
}

// ─── Type Badge ──────────────────────────────────────────────────────────────

class _TypeBadge extends StatelessWidget {
  final String type;
  final VelaColorScheme colors;

  const _TypeBadge({required this.type, required this.colors});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: colors.interactiveHover,
        borderRadius: BorderRadius.circular(9999),
      ),
      child: Text(
        type.toUpperCase(),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: colors.textSecondary,
        ),
      ),
    );
  }
}
