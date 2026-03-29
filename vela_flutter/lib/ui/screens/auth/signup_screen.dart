import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/error_messages.dart';
import '../../../providers/auth_provider.dart';
import '../../widgets/vela_button.dart';
import '../../widgets/vela_input.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  String? _error;
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleSignup() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (name.isEmpty || email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setState(() => _error = 'Password must be at least 6 characters');
      return;
    }
    if (password != confirmPassword) {
      setState(() => _error = 'Passwords do not match');
      return;
    }

    setState(() {
      _error = null;
      _isLoading = true;
    });

    try {
      await ref.read(authProvider.notifier).signup(
            name: name,
            email: email,
            password: password,
          );
      if (mounted) context.go('/tasks');
    } on DioException catch (e) {
      if (mounted) {
        setState(() {
          _error = e.message ?? ErrorMessages.serverError;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return Scaffold(
      backgroundColor: colors.bgPrimary,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              IconButton(
                onPressed: () => context.go('/landing'),
                icon: Icon(Icons.arrow_back, color: colors.textPrimary),
              ),
              const SizedBox(height: 24),
              Center(
                child: Column(
                  children: [
                    Text(
                      'Create Account',
                      style: TextStyle(
                        fontSize: 30,
                        fontWeight: FontWeight.w700,
                        color: colors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Start your learning journey with Vela',
                      style:
                          TextStyle(fontSize: 16, color: colors.textSecondary),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: colors.surfaceCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: colors.surfaceBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_error != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFfde8e8),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          _error!,
                          style:
                              TextStyle(color: colors.stateError, fontSize: 14),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    VelaInput(
                      label: 'Full Name',
                      placeholder: 'Enter your full name',
                      controller: _nameController,
                    ),
                    const SizedBox(height: 16),
                    VelaInput(
                      label: 'Email',
                      placeholder: 'Enter your email',
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 16),
                    VelaInput(
                      label: 'Password',
                      placeholder: 'At least 6 characters',
                      controller: _passwordController,
                      obscureText: true,
                    ),
                    const SizedBox(height: 16),
                    VelaInput(
                      label: 'Confirm Password',
                      placeholder: 'Re-enter your password',
                      controller: _confirmPasswordController,
                      obscureText: true,
                    ),
                    const SizedBox(height: 24),
                    VelaButton(
                      variant: VelaButtonVariant.primary,
                      size: VelaButtonSize.lg,
                      fullWidth: true,
                      loading: _isLoading,
                      onPressed: _handleSignup,
                      child: const Text('Create Account'),
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      alignment: WrapAlignment.center,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(
                          'Already have an account? ',
                          style: TextStyle(
                              color: colors.textSecondary, fontSize: 14),
                        ),
                        GestureDetector(
                          onTap: () => context.go('/login'),
                          child: Text(
                            'Sign In',
                            style: TextStyle(
                              color: colors.brandAccent,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
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
}
