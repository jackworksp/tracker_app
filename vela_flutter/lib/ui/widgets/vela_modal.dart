import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_animations.dart';

enum VelaModalSize { sm, md, lg, xl, full }

class VelaModal extends StatelessWidget {
  final String? title;
  final Widget child;
  final Widget? footer;
  final VelaModalSize size;
  final bool closeOnOverlayTap;
  final bool showCloseButton;
  final VoidCallback onClose;

  const VelaModal({
    super.key,
    this.title,
    required this.child,
    this.footer,
    this.size = VelaModalSize.md,
    this.closeOnOverlayTap = true,
    this.showCloseButton = true,
    required this.onClose,
  });

  static Future<T?> show<T>({
    required BuildContext context,
    required Widget Function(BuildContext) builder,
  }) {
    // Issue 09: skip decorative fade when OS prefers reduced motion
    final reduceMotion =
        MediaQuery.maybeOf(context)?.disableAnimations ?? false;
    return showGeneralDialog<T>(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Dismiss',
      barrierColor: Colors.transparent,
      transitionDuration:
          reduceMotion ? AppAnimations.none : AppAnimations.base,
      pageBuilder: (context, animation, secondaryAnimation) {
        return builder(context);
      },
      transitionBuilder: (context, animation, secondaryAnimation, child) {
        if (reduceMotion) return child;
        return FadeTransition(
          opacity: animation,
          child: child,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 640;

    final maxWidth = isMobile ? screenWidth : switch (size) {
      VelaModalSize.sm => 400.0,
      VelaModalSize.md => 560.0,
      VelaModalSize.lg => 720.0,
      VelaModalSize.xl => 960.0,
      VelaModalSize.full => screenWidth - 32,
    };

    return Material(
      type: MaterialType.transparency,
      child: GestureDetector(
        onTap: closeOnOverlayTap ? onClose : null,
        child: Container(
          color: isDark
              ? const Color(0xFF0F0F0F).withOpacity(0.8)
              : Colors.white.withOpacity(0.9),
          alignment: Alignment.center,
          padding: isMobile ? EdgeInsets.zero : const EdgeInsets.all(16),
          child: GestureDetector(
            onTap: () {}, // prevent overlay tap
            child: AnimatedContainer(
              // Issue 09: respect reduced motion preference
              duration: AppAnimations.baseOrNone(context),
              constraints: BoxConstraints(
                maxWidth: maxWidth,
                maxHeight: isMobile
                    ? MediaQuery.of(context).size.height
                    : MediaQuery.of(context).size.height - 32,
              ),
              decoration: BoxDecoration(
                color: colors.surfaceDefault,
                borderRadius: isMobile ? BorderRadius.zero : BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    offset: const Offset(0, 15),
                    blurRadius: 30,
                    color: Colors.black.withOpacity(0.2),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Header
                  if (title != null || showCloseButton)
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: colors.surfaceBorder),
                        ),
                      ),
                      child: Row(
                        children: [
                          if (title != null)
                            Expanded(
                              child: Text(
                                title!,
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w600,
                                  color: colors.textPrimary,
                                ),
                              ),
                            ),
                          if (showCloseButton)
                            // Issue 01: close button must be ≥ 44×44px (WCAG 2.5.5)
                            Semantics(
                              label: 'Close dialog',
                              button: true,
                              child: Material(
                                color: Colors.transparent,
                                child: InkWell(
                                  onTap: onClose,
                                  borderRadius: BorderRadius.circular(6),
                                  child: ConstrainedBox(
                                    constraints: const BoxConstraints(
                                      minWidth: 44,
                                      minHeight: 44,
                                    ),
                                    child: Icon(
                                      Icons.close,
                                      size: 20,
                                      color: colors.textSecondary,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  // Body
                  Flexible(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(24),
                      child: child,
                    ),
                  ),
                  // Footer
                  if (footer != null)
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: colors.surfaceBorder),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [footer!],
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
