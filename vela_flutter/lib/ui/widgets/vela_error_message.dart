import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';

// ---------------------------------------------------------------------------
// Issue 06 — VelaErrorMessage
// Inline error message widget for form validation and inline error states.
// Uses Semantics(liveRegion: true) so screen-readers announce the error.
// ---------------------------------------------------------------------------

class VelaErrorMessage extends StatelessWidget {
  final String message;

  const VelaErrorMessage({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return Semantics(
      // liveRegion ensures screen-readers announce when the error appears
      liveRegion: true,
      child: Container(
        margin: const EdgeInsets.only(top: AppSpacing.s2),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.s3,
          vertical: AppSpacing.s2,
        ),
        decoration: BoxDecoration(
          color: colors.stateErrorBg,
          border: Border(
            left: BorderSide(color: colors.stateError, width: 3),
          ),
          borderRadius: const BorderRadius.only(
            topRight: Radius.circular(4),
            bottomRight: Radius.circular(4),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              Icons.error_outline,
              size: 16,
              color: colors.stateError,
            ),
            const SizedBox(width: AppSpacing.s2),
            Expanded(
              child: Text(
                message,
                style: AppTypography.bodySm(colors.stateError),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// VelaScreenError
// Full-screen centered error state with an icon, actionable message,
// and a Retry button. Use this in place of CircularProgressIndicator
// when a screen-level load fails.
// ---------------------------------------------------------------------------

class VelaScreenError extends StatelessWidget {
  /// The user-facing error message. Use ErrorMessages constants.
  final String message;

  /// Called when the user taps "Retry".
  final VoidCallback onRetry;

  const VelaScreenError({
    super.key,
    required this.message,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return Semantics(
      liveRegion: true,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.s8),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline_rounded,
                size: 48,
                color: colors.stateError,
              ),
              const SizedBox(height: AppSpacing.s4),
              Text(
                message,
                style: AppTypography.bodyBase(colors.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.s6),
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Retry'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: colors.brandAccent,
                  side: BorderSide(color: colors.brandAccent),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.s6,
                    vertical: AppSpacing.s3,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
