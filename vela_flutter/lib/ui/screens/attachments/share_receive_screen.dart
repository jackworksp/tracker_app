import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_handler/share_handler.dart';

import '../../../core/theme/app_borders.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../providers/attachments_provider.dart';
import '../../../providers/subjects_provider.dart';
import '../../../providers/tasks_provider.dart';
import '../../../services/android_share_bridge.dart';

// ---------------------------------------------------------------------------
// Issue 05 — Share Receive Screen
//
// Handles incoming intents (share target) from other Android apps.
// Shows the active subject prominently so the user always knows where the
// shared content will land before committing.
// ---------------------------------------------------------------------------

class ShareReceiveScreen extends ConsumerStatefulWidget {
  const ShareReceiveScreen({super.key});

  @override
  ConsumerState<ShareReceiveScreen> createState() => _ShareReceiveScreenState();
}

class _ShareReceiveScreenState extends ConsumerState<ShareReceiveScreen> {
  SharedMedia? _sharedMedia;
  AndroidSharePayload? _fallbackPayload;
  bool _isLoading = true;
  bool _isSaving = false;
  String? _error;

  StreamSubscription<SharedMedia>? _storeStream;

  @override
  void initState() {
    super.initState();
    _initShareHandler();
  }

  Future<void> _initShareHandler() async {
    final cachedMedia = SharePayloadStore.instance.currentMedia;
    if (cachedMedia != null) {
      SharePayloadStore.instance.clear();
    }

    SharedMedia? initial;
    AndroidSharePayload? fallback;

    try {
      // Pick up the media that launched the app via share intent.
      if (cachedMedia == null) {
        initial = await ShareHandlerPlatform.instance.getInitialSharedMedia();
      }
    } catch (_) {
      // Fall back to the app-side Android bridge below.
    }

    try {
      fallback = await AndroidShareBridge.getInitialSharedPayload();
    } catch (_) {
      // Android fallback is best-effort only.
    }

    _storeStream = SharePayloadStore.instance.stream.listen((media) {
      if (mounted) {
        setState(() {
          _sharedMedia = media;
          _fallbackPayload = null;
          _error = null;
        });
      }
      SharePayloadStore.instance.clear();
    });

    if (cachedMedia != null) {
      initial = cachedMedia;
    }

    if (mounted) {
      setState(() {
        _sharedMedia = initial;
        _fallbackPayload = fallback;
        _isLoading = false;
        if ((initial == null ||
                ((initial.content?.isEmpty ?? true) &&
                    (initial.attachments?.isEmpty ?? true))) &&
            fallback == null) {
          _error = 'Could not read shared content.';
        }
      });
    }
  }

  @override
  void dispose() {
    _storeStream?.cancel();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  Future<void> _saveAsAttachment() async {
    final url = _urlFromMedia();
    if (url == null) {
      setState(() {
        _error =
            'Only shares with a link can be saved as attachments right now.';
      });
      return;
    }

    final subjectId = ref.read(subjectsProvider).currentSubject?.id;

    setState(() => _isSaving = true);

    try {
      await ref.read(attachmentsProvider.notifier).createAttachment({
        'url': url,
        'title': _titleFromMedia() ?? url,
        if (subjectId != null) 'subject_id': subjectId,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Saved as attachment')),
        );
        context.go('/attachments');
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isSaving = false;
          _error = 'Failed to save attachment. Please try again.';
        });
      }
    }
  }

  Future<void> _saveAsTask() async {
    final url = _urlFromMedia();
    final title = _titleFromMedia();
    final subjectId = ref.read(subjectsProvider).currentSubject?.id;

    if (title == null) {
      setState(() {
        _error = 'Could not read enough shared content to create a task.';
      });
      return;
    }

    setState(() => _isSaving = true);

    try {
      await ref.read(tasksProvider.notifier).createTask({
        'title': title,
        'type': 'WATCH',
        if (url != null) 'url': url,
        if (subjectId != null) 'subject_id': subjectId,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Saved as task')),
        );
        context.go('/tasks');
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isSaving = false;
          _error = 'Failed to save task. Please try again.';
        });
      }
    }
  }

  String? _urlFromMedia() {
    final media = _effectiveMedia();
    if (media == null) return null;
    // The shared text may be a bare URL or a URL embedded in text.
    final content = media.content ?? '';
    final uriPattern = RegExp(
      r'https?://[^\s]+',
      caseSensitive: false,
    );
    final match = uriPattern.firstMatch(content);
    return match?.group(0) ?? (content.isNotEmpty ? content : null);
  }

  SharedMedia? _effectiveMedia() {
    final primary = _sharedMedia;
    if (primary != null &&
        (primary.content?.isNotEmpty == true ||
            primary.attachments?.isNotEmpty == true)) {
      return primary;
    }

    if (_fallbackPayload?.hasPayload == true) {
      return _fallbackPayload!.toSharedMedia();
    }

    return primary;
  }

  String? _titleFromMedia() {
    final media = _effectiveMedia();
    final content = media?.content?.trim();
    if (content?.isNotEmpty == true) return content;

    final attachments =
        media?.attachments?.whereType<SharedAttachment>().toList() ?? const [];
    final firstAttachment = attachments.isNotEmpty ? attachments.first : null;
    final path = firstAttachment?.path;
    if (path == null || path.isEmpty) return null;

    final segments = path.split(RegExp(r'[\\/]'));
    final fileName = segments.isNotEmpty ? segments.last : path;
    return fileName.isNotEmpty ? fileName : 'Shared item';
  }

  String _attachmentSummary() {
    final media = _effectiveMedia();
    final attachments =
        media?.attachments?.whereType<SharedAttachment>().toList() ?? const [];
    if (attachments.isEmpty) return 'No attachments received.';

    if (attachments.length == 1) {
      final attachment = attachments.first;
      final name = attachment.path.split(RegExp(r'[\\/]')).last;
      final kind = switch (attachment.type) {
        SharedAttachmentType.image => 'Image',
        SharedAttachmentType.video => 'Video',
        SharedAttachmentType.audio => 'Audio',
        SharedAttachmentType.file => 'File',
      };
      return '$kind received: ${name.isEmpty ? attachment.path : name}';
    }

    return '${attachments.length} attachments received.';
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final subjectsState = ref.watch(subjectsProvider);
    final currentSubject = subjectsState.currentSubject;
    final media = _effectiveMedia();
    final hasTextContent = media?.content?.isNotEmpty == true;
    final hasAttachments = media?.attachments?.isNotEmpty == true;
    final canSaveAttachment = _urlFromMedia() != null;
    final canSaveTask = _titleFromMedia() != null;

    return Scaffold(
      backgroundColor: colors.bgPrimary,
      appBar: AppBar(
        backgroundColor: colors.bgSecondary,
        elevation: 0,
        // Issue 04 — explicit back button with ≥ 44px touch target
        leading: Semantics(
          label: 'Close',
          button: true,
          child: InkWell(
            onTap: () {
              if (context.canPop()) {
                context.pop();
              } else {
                context.go('/tasks');
              }
            },
            child: ConstrainedBox(
              constraints: const BoxConstraints(
                minWidth: 44.0,
                minHeight: 44.0,
              ),
              child: Icon(Icons.close),
            ),
          ),
        ),
        title: Text(
          'Add to Vela',
          style: AppTypography.headingLg(colors.textPrimary),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: colors.surfaceBorder),
        ),
      ),
      body: SafeArea(
        child: _isLoading
            ? Center(
                child: CircularProgressIndicator(
                  color: colors.brandAccent,
                  strokeWidth: 2,
                ),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.s6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ---------------------------------------------------------
                    // Issue 05: Active subject indicator — always shown first
                    // so the user never wonders where the content will land.
                    // ---------------------------------------------------------
                    if (currentSubject != null)
                      _SubjectBadge(
                        label: currentSubject.name,
                        colors: colors,
                      )
                    else
                      _NoSubjectWarning(colors: colors),

                    const SizedBox(height: AppSpacing.s5),

                    // ---------------------------------------------------------
                    // Shared content preview
                    // ---------------------------------------------------------
                    Text(
                      'Shared Content',
                      style:
                          AppTypography.labelBase(colors.textTertiary).copyWith(
                        letterSpacing: 0.5,
                        fontWeight: AppTypography.weightSemibold,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.s2),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(AppSpacing.s4),
                      decoration: BoxDecoration(
                        color: colors.surfaceCard,
                        borderRadius: AppBorders.md,
                        border: Border.all(color: colors.surfaceBorder),
                      ),
                      child: hasTextContent
                          ? Text(
                              media!.content!,
                              style: AppTypography.bodyBase(colors.textPrimary),
                            )
                          : Text(
                              hasAttachments
                                  ? _attachmentSummary()
                                  : 'No text content received.',
                              style:
                                  AppTypography.bodyBase(colors.textTertiary),
                            ),
                    ),

                    if (hasAttachments) ...[
                      const SizedBox(height: AppSpacing.s3),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(AppSpacing.s3),
                        decoration: BoxDecoration(
                          color: colors.bgSecondary,
                          borderRadius: AppBorders.md,
                          border: Border.all(color: colors.surfaceBorder),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.perm_media_outlined,
                              size: 16,
                              color: colors.textSecondary,
                            ),
                            const SizedBox(width: AppSpacing.s2),
                            Expanded(
                              child: Text(
                                _attachmentSummary(),
                                style:
                                    AppTypography.bodySm(colors.textSecondary),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    // ---------------------------------------------------------
                    // Error
                    // ---------------------------------------------------------
                    if (_error != null) ...[
                      const SizedBox(height: AppSpacing.s4),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(AppSpacing.s3),
                        decoration: BoxDecoration(
                          color: colors.stateErrorBg,
                          borderRadius: AppBorders.md,
                          border: Border.all(
                            color: colors.stateError.withOpacity(0.4),
                          ),
                        ),
                        child: Text(
                          _error!,
                          style: AppTypography.bodySm(colors.stateError),
                        ),
                      ),
                    ],

                    const SizedBox(height: AppSpacing.s6),

                    // ---------------------------------------------------------
                    // Action buttons
                    // ---------------------------------------------------------
                    Text(
                      'Save As',
                      style:
                          AppTypography.labelBase(colors.textTertiary).copyWith(
                        letterSpacing: 0.5,
                        fontWeight: AppTypography.weightSemibold,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.s3),
                    _ActionButton(
                      icon: Icons.task_alt_outlined,
                      label: 'Task',
                      subtitle: canSaveTask
                          ? 'Add to your task list'
                          : 'No usable content for a task',
                      colors: colors,
                      loading: _isSaving,
                      enabled: canSaveTask,
                      onTap: _saveAsTask,
                    ),
                    const SizedBox(height: AppSpacing.s3),
                    _ActionButton(
                      icon: Icons.attach_file_outlined,
                      label: 'Attachment',
                      subtitle: canSaveAttachment
                          ? 'Save as a study link'
                          : 'Requires a shared link URL',
                      colors: colors,
                      loading: _isSaving,
                      enabled: canSaveAttachment,
                      onTap: _saveAsAttachment,
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Sub-widgets
// ---------------------------------------------------------------------------

/// Green badge shown when a subject is active.
class _SubjectBadge extends StatelessWidget {
  final String label;
  final VelaColorScheme colors;

  const _SubjectBadge({required this.label, required this.colors});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s3,
        vertical: AppSpacing.s3,
      ),
      decoration: BoxDecoration(
        color: colors.interactiveSelected,
        borderRadius: AppBorders.md,
        border: Border.all(color: colors.brandAccent.withOpacity(0.4)),
      ),
      child: Row(
        children: [
          Icon(Icons.label_outline, size: 16, color: colors.brandAccent),
          const SizedBox(width: AppSpacing.s2),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Adding to subject',
                  style: AppTypography.labelBase(colors.textTertiary),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: AppTypography.bodyBase(colors.brandAccent).copyWith(
                    fontWeight: AppTypography.weightSemibold,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Amber warning shown when no subject is active.
class _NoSubjectWarning extends StatelessWidget {
  final VelaColorScheme colors;

  const _NoSubjectWarning({required this.colors});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s3,
        vertical: AppSpacing.s3,
      ),
      decoration: BoxDecoration(
        color: colors.stateWarningBg,
        borderRadius: AppBorders.md,
        border: Border.all(color: colors.stateWarning.withOpacity(0.5)),
      ),
      child: Row(
        children: [
          Icon(Icons.warning_amber_outlined,
              size: 16, color: colors.stateWarning),
          const SizedBox(width: AppSpacing.s2),
          Expanded(
            child: Text(
              'No subject selected — content will be saved to your default subject. '
              'Open Vela and switch subjects to change this.',
              style: AppTypography.bodySm(colors.stateWarning),
            ),
          ),
        ],
      ),
    );
  }
}

/// Single action row card for Save As options.
class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final VelaColorScheme colors;
  final bool loading;
  final bool enabled;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.colors,
    required this.loading,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: InkWell(
        borderRadius: AppBorders.md,
        onTap: loading || !enabled ? null : onTap,
        child: Container(
          width: double.infinity,
          constraints:
              const BoxConstraints(minHeight: AppSpacing.minTouchTarget),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.s4,
            vertical: AppSpacing.s3,
          ),
          decoration: BoxDecoration(
            color: enabled ? colors.surfaceCard : colors.bgSecondary,
            borderRadius: AppBorders.md,
            border: Border.all(color: colors.surfaceBorder),
          ),
          child: Row(
            children: [
              Icon(
                icon,
                size: 24,
                color: enabled ? colors.brandAccent : colors.textTertiary,
              ),
              const SizedBox(width: AppSpacing.s3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: AppTypography.bodyBase(
                        enabled ? colors.textPrimary : colors.textTertiary,
                      ).copyWith(
                        fontWeight: AppTypography.weightSemibold,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: AppTypography.bodySm(
                        enabled ? colors.textSecondary : colors.textTertiary,
                      ),
                    ),
                  ],
                ),
              ),
              if (loading)
                SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: colors.brandAccent,
                  ),
                )
              else
                Icon(
                  Icons.chevron_right,
                  color: enabled ? colors.textTertiary : colors.surfaceBorder,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
