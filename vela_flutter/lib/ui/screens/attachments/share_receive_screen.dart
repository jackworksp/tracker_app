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
  bool _isLoading = true;
  bool _isSaving = false;
  String? _error;

  StreamSubscription? _mediaStream;

  @override
  void initState() {
    super.initState();
    _initShareHandler();
  }

  Future<void> _initShareHandler() async {
    try {
      // Pick up the media that launched the app via share intent.
      final initial = await ShareHandlerPlatform.instance.getInitialSharedMedia();
      if (mounted) {
        setState(() {
          _sharedMedia = initial;
          _isLoading = false;
        });
      }

      // Also listen for shares that arrive while the app is already running.
      _mediaStream = ShareHandlerPlatform.instance.sharedMediaStream.listen(
        (media) {
          if (mounted) {
            setState(() {
              _sharedMedia = media;
              _error = null;
            });
          }
        },
      );
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = 'Could not read shared content.';
        });
      }
    }
  }

  @override
  void dispose() {
    _mediaStream?.cancel();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  Future<void> _saveAsAttachment() async {
    final url = _urlFromMedia();
    if (url == null) return;

    final subjectId = ref.read(subjectsProvider).currentSubject?.id;

    setState(() => _isSaving = true);

    try {
      await ref.read(attachmentsProvider.notifier).createAttachment({
        'url': url,
        'title': _sharedMedia?.content ?? url,
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
    final subjectId = ref.read(subjectsProvider).currentSubject?.id;

    setState(() => _isSaving = true);

    try {
      await ref.read(tasksProvider.notifier).createTask({
        'title': _sharedMedia?.content ?? (url ?? 'Shared item'),
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
    if (_sharedMedia == null) return null;
    // The shared text may be a bare URL or a URL embedded in text.
    final content = _sharedMedia!.content ?? '';
    final uriPattern = RegExp(
      r'https?://[^\s]+',
      caseSensitive: false,
    );
    final match = uriPattern.firstMatch(content);
    return match?.group(0) ?? (content.isNotEmpty ? content : null);
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
            child: const ConstrainedBox(
              constraints: BoxConstraints(
                minWidth: AppSpacing.minTouchTarget,
                minHeight: AppSpacing.minTouchTarget,
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
                      style: AppTypography.labelBase(colors.textTertiary).copyWith(
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
                      child: _sharedMedia?.content != null &&
                              _sharedMedia!.content!.isNotEmpty
                          ? Text(
                              _sharedMedia!.content!,
                              style: AppTypography.bodyBase(colors.textPrimary),
                            )
                          : Text(
                              'No text content received.',
                              style: AppTypography.bodyBase(colors.textTertiary),
                            ),
                    ),

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
                      style: AppTypography.labelBase(colors.textTertiary).copyWith(
                        letterSpacing: 0.5,
                        fontWeight: AppTypography.weightSemibold,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.s3),
                    _ActionButton(
                      icon: Icons.task_alt_outlined,
                      label: 'Task',
                      subtitle: 'Add to your task list',
                      colors: colors,
                      loading: _isSaving,
                      onTap: _saveAsTask,
                    ),
                    const SizedBox(height: AppSpacing.s3),
                    _ActionButton(
                      icon: Icons.attach_file_outlined,
                      label: 'Attachment',
                      subtitle: 'Save as a study link',
                      colors: colors,
                      loading: _isSaving,
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
          Icon(Icons.warning_amber_outlined, size: 16, color: colors.stateWarning),
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
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.colors,
    required this.loading,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: InkWell(
        borderRadius: AppBorders.md,
        onTap: loading ? null : onTap,
        child: Container(
          width: double.infinity,
          constraints: const BoxConstraints(minHeight: AppSpacing.minTouchTarget),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.s4,
            vertical: AppSpacing.s3,
          ),
          decoration: BoxDecoration(
            color: colors.surfaceCard,
            borderRadius: AppBorders.md,
            border: Border.all(color: colors.surfaceBorder),
          ),
          child: Row(
            children: [
              Icon(icon, size: 24, color: colors.brandAccent),
              const SizedBox(width: AppSpacing.s3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: AppTypography.bodyBase(colors.textPrimary).copyWith(
                        fontWeight: AppTypography.weightSemibold,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: AppTypography.bodySm(colors.textSecondary),
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
                Icon(Icons.chevron_right, color: colors.textTertiary),
            ],
          ),
        ),
      ),
    );
  }
}
