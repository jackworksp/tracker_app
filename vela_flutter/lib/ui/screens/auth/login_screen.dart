import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/error_messages.dart';
import '../../../providers/auth_provider.dart';
import '../../widgets/vela_button.dart';
import '../../widgets/vela_input.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String? _error;
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Please fill in all fields');
      return;
    }

    setState(() {
      _error = null;
      _isLoading = true;
    });

    try {
      await ref.read(authProvider.notifier).login(
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
              // Back button
              IconButton(
                onPressed: () => context.go('/landing'),
                icon: Icon(Icons.arrow_back, color: colors.textPrimary),
              ),
              const SizedBox(height: 40),
              // Title
              Center(
                child: Column(
                  children: [
                    Text(
                      'Welcome Back',
                      style: TextStyle(
                        fontSize: 30,
                        fontWeight: FontWeight.w700,
                        color: colors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Sign in to continue your learning journey',
                      style:
                          TextStyle(fontSize: 16, color: colors.textSecondary),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),
              // Form card
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
                      label: 'Email',
                      placeholder: 'Enter your email',
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 16),
                    VelaInput(
                      label: 'Password',
                      placeholder: 'Enter your password',
                      controller: _passwordController,
                      obscureText: true,
                    ),
                    const SizedBox(height: 24),
                    VelaButton(
                      variant: VelaButtonVariant.primary,
                      size: VelaButtonSize.lg,
                      fullWidth: true,
                      loading: _isLoading,
                      onPressed: _handleLogin,
                      child: const Text('Sign In'),
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      alignment: WrapAlignment.center,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(
                          "Don't have an account? ",
                          style: TextStyle(
                              color: colors.textSecondary, fontSize: 14),
                        ),
                        GestureDetector(
                          onTap: () => context.go('/signup'),
                          child: Text(
                            'Sign Up',
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
