import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../widgets/vela_button.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return Scaffold(
      backgroundColor: colors.bgPrimary,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              children: [
                const SizedBox(height: 80),
                // Hero
                Text(
                  'Vela',
                  style: TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.w700,
                    color: colors.brandAccent,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Your Personal Learning Companion',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w600,
                    color: colors.textPrimary,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Track study time, manage tasks, organize notes, and monitor your learning goals — all in one place.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: colors.textSecondary,
                    height: 1.6,
                  ),
                ),
                const SizedBox(height: 32),
                // CTA Buttons
                VelaButton(
                  variant: VelaButtonVariant.primary,
                  size: VelaButtonSize.lg,
                  fullWidth: true,
                  onPressed: () => context.go('/signup'),
                  child: const Text('Get Started Free'),
                ),
                const SizedBox(height: 12),
                VelaButton(
                  variant: VelaButtonVariant.outline,
                  size: VelaButtonSize.lg,
                  fullWidth: true,
                  onPressed: () => context.go('/login'),
                  child: const Text('Sign In'),
                ),
                const SizedBox(height: 64),
                // Features Grid
                Text(
                  'Everything you need to learn effectively',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: colors.textPrimary,
                  ),
                ),
                const SizedBox(height: 24),
                ..._buildFeatures(colors),
                const SizedBox(height: 64),
                // Activity Types
                Text(
                  'Track All Types of Learning',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: colors.textPrimary,
                  ),
                ),
                const SizedBox(height: 24),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  alignment: WrapAlignment.center,
                  children: [
                    _activityChip('Study', colors),
                    _activityChip('Watch', colors),
                    _activityChip('Read', colors),
                    _activityChip('Practice', colors),
                    _activityChip('Notes', colors),
                    _activityChip('Listen', colors),
                  ],
                ),
                const SizedBox(height: 80),
                // Footer
                Text(
                  'Built with love for learners',
                  style: TextStyle(color: colors.textTertiary, fontSize: 14),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _buildFeatures(VelaColorScheme colors) {
    final features = [
      (Icons.folder_outlined, 'Multi-Subject Organization', 'Organize your studies by subject with custom colors and icons.'),
      (Icons.timer_outlined, 'Time Tracking', 'Log study sessions and track how you spend your learning time.'),
      (Icons.checklist, 'Task Management', 'Create tasks with priorities, deadlines, subtasks, and reminders.'),
      (Icons.edit_note, 'Smart Notes', 'Rich notes with folders, tags, and bidirectional linking.'),
      (Icons.flag_outlined, 'Goal Tracking', 'Set learning objectives and monitor your progress.'),
      (Icons.attach_file, 'File Management', 'Upload files, save links, and organize attachments.'),
    ];

    return features.map((f) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: colors.surfaceCard,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: colors.surfaceBorder),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: colors.stateInfoBg,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(f.$1, color: colors.brandAccent, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(f.$2, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: colors.textPrimary)),
                    const SizedBox(height: 4),
                    Text(f.$3, style: TextStyle(fontSize: 14, color: colors.textSecondary, height: 1.5)),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }).toList();
  }

  Widget _activityChip(String label, VelaColorScheme colors) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.surfaceBorder),
      ),
      child: Text(label, style: TextStyle(color: colors.textPrimary, fontSize: 14)),
    );
  }
}
