import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_animations.dart';
import '../../../providers/auth_provider.dart';

// ---------------------------------------------------------------------------
// Issue 03 — Onboarding tooltips
// Shown once on first launch.  Completion is persisted via LocalStorage.
// ---------------------------------------------------------------------------

class OnboardingTooltips extends ConsumerStatefulWidget {
  /// Called after the user completes or skips the walkthrough.
  final VoidCallback? onCompleted;

  const OnboardingTooltips({super.key, this.onCompleted});

  @override
  ConsumerState<OnboardingTooltips> createState() => _OnboardingTooltipsState();
}

class _OnboardingTooltipsState extends ConsumerState<OnboardingTooltips>
    with SingleTickerProviderStateMixin {
  int _step = 0;
  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  static const _steps = [
    _OnboardingStep(
      icon: Icons.swipe,
      title: 'Swipe to Take Action',
      message: 'Swipe a task card left to mark it done, or right to delete it. '
          'Give it a try!',
    ),
    _OnboardingStep(
      icon: Icons.camera_alt_outlined,
      title: 'Capture Materials',
      message: 'Tap the camera icon inside the Attachments screen to quickly '
          'save notes, diagrams, or screenshots.',
    ),
    _OnboardingStep(
      icon: Icons.share_outlined,
      title: 'Share from Any App',
      message: 'Share YouTube videos, articles, or links from any app directly '
          'to Vela using Android\'s share menu.',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: AppAnimations.base,
    );
    _fadeAnim = CurvedAnimation(
      parent: _animController,
      curve: AppAnimations.defaultCurve,
    );
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  Future<void> _dismiss() async {
    await _animController.reverse();
    if (!mounted) return;
    final localStorage = ref.read(localStorageProvider);
    await localStorage.setHasSeenOnboarding();
    widget.onCompleted?.call();
  }

  Future<void> _next() async {
    if (_step < _steps.length - 1) {
      await _animController.reverse();
      if (!mounted) return;
      setState(() => _step++);
      _animController.forward();
    } else {
      await _dismiss();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final step = _steps[_step];

    return FadeTransition(
      opacity: _fadeAnim,
      child: Material(
        type: MaterialType.transparency,
        child: GestureDetector(
          onTap: _dismiss,
          child: Container(
            color: Colors.black.withOpacity(0.55),
            alignment: Alignment.bottomCenter,
            padding: EdgeInsets.only(
              left: AppSpacing.s4,
              right: AppSpacing.s4,
              bottom: MediaQuery.of(context).padding.bottom + AppSpacing.s20,
            ),
            child: GestureDetector(
              onTap: () {}, // prevent overlay tap
              child: Container(
                padding: const EdgeInsets.all(AppSpacing.s6),
                decoration: BoxDecoration(
                  color: colors.surfaceDefault,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      offset: const Offset(0, 8),
                      blurRadius: 24,
                      color: Colors.black.withOpacity(0.25),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Step indicator dots
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(_steps.length, (i) {
                        return AnimatedContainer(
                          duration: AppAnimations.base,
                          margin: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.s0_5,
                          ),
                          width: i == _step ? 20 : 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: i == _step
                                ? colors.brandAccent
                                : colors.surfaceBorder,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: AppSpacing.s5),
                    // Icon
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: colors.brandAccent.withOpacity(0.12),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        step.icon,
                        size: 32,
                        color: colors.brandAccent,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.s4),
                    // Title
                    Text(
                      step.title,
                      style: AppTypography.headingLg(colors.textPrimary),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: AppSpacing.s2),
                    // Message
                    Text(
                      step.message,
                      style: AppTypography.bodySm(colors.textSecondary),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: AppSpacing.s6),
                    // Buttons row
                    Row(
                      children: [
                        // Skip
                        Expanded(
                          child: Semantics(
                            label: 'Skip onboarding',
                            button: true,
                            child: GestureDetector(
                              onTap: _dismiss,
                              child: ConstrainedBox(
                                constraints: const BoxConstraints(
                                  minHeight: 44,
                                ),
                                child: Container(
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    border: Border.all(
                                      color: colors.surfaceBorder,
                                    ),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    'Skip',
                                    style: AppTypography.bodySmSemibold(
                                      colors.textSecondary,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.s3),
                        // Next / Get Started
                        Expanded(
                          child: Semantics(
                            label: _step < _steps.length - 1
                                ? 'Next onboarding step'
                                : 'Finish onboarding',
                            button: true,
                            child: GestureDetector(
                              onTap: _next,
                              child: ConstrainedBox(
                                constraints: const BoxConstraints(
                                  minHeight: 44,
                                ),
                                child: Container(
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    color: colors.brandAccent,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    _step < _steps.length - 1
                                        ? 'Next'
                                        : 'Get Started',
                                    style: AppTypography.bodySmSemibold(
                                      colors.textInverse,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _OnboardingStep {
  final IconData icon;
  final String title;
  final String message;

  const _OnboardingStep({
    required this.icon,
    required this.title,
    required this.message,
  });
}
