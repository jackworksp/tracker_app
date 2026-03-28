import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

// Splash-specific colors — intentionally not tied to AppColors so the
// branded splash stays consistent regardless of theme.
const _kBg = Color(0xFF0F0F0F);
const _kAccent = Color(0xFFF59E0B); // amber-500
const _kIconBg = Color(0xFF1C1C1C);
const _kSubtitle = Color(0xFF71717A);
const _kBorderMuted = Color(0x33534434);

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _kBg,
      body: Stack(
        children: [
          // Ambient glow blob
          Center(
            child: Container(
              width: 400,
              height: 400,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Color(0x12F59E0B),
                    blurRadius: 120,
                    spreadRadius: 80,
                  ),
                ],
              ),
            ),
          ),

          // Main content
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _GlowingIcon(pulseController: _pulseController)
                    .animate()
                    .scale(
                      begin: const Offset(0.6, 0.6),
                      duration: 600.ms,
                      curve: Curves.easeOutBack,
                    )
                    .fadeIn(duration: 400.ms),

                const SizedBox(height: 28),

                // App name
                const Text(
                  'Vela',
                  style: TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    letterSpacing: -1.5,
                  ),
                )
                    .animate()
                    .fadeIn(delay: 300.ms, duration: 500.ms)
                    .slideY(begin: 0.2, duration: 500.ms, curve: Curves.easeOut),

                const SizedBox(height: 12),

                const Text(
                  'Charting your journey',
                  style: TextStyle(
                    fontSize: 11,
                    color: _kSubtitle,
                    letterSpacing: 2.0,
                  ),
                ).animate().fadeIn(delay: 500.ms, duration: 500.ms),

                const SizedBox(height: 80),

                const _DotsLoader()
                    .animate()
                    .fadeIn(delay: 700.ms, duration: 400.ms),
              ],
            ),
          ),

          // Bottom decorative bar
          const Positioned(
            bottom: 48,
            left: 48,
            right: 48,
            child: Opacity(
              opacity: 0.2,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 48,
                        child: Divider(color: _kAccent, thickness: 2),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'NAVIGATION V.4.0',
                        style: TextStyle(
                          fontSize: 9,
                          color: Colors.white,
                          letterSpacing: 2.0,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    'CURATED ENVIRONMENT',
                    style: TextStyle(
                      fontSize: 9,
                      color: Colors.white,
                      letterSpacing: 2.0,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GlowingIcon extends StatelessWidget {
  const _GlowingIcon({required this.pulseController});

  final AnimationController pulseController;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 128,
      height: 128,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Pulsing outer ring
          AnimatedBuilder(
            animation: pulseController,
            builder: (context, _) {
              final scale = 0.8 + pulseController.value * 0.3;
              final opacity = 0.5 - pulseController.value * 0.3;
              return Transform.scale(
                scale: scale,
                child: Container(
                  width: 128,
                  height: 128,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: _kAccent.withOpacity(opacity),
                      width: 1,
                    ),
                  ),
                ),
              );
            },
          ),

          // Soft secondary ring
          Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _kAccent.withOpacity(0.04),
            ),
          ),

          // Icon core with glow + float
          AnimatedBuilder(
            animation: pulseController,
            builder: (context, child) {
              final glowOpacity = 0.15 + pulseController.value * 0.20;
              final floatY = -5.0 * pulseController.value; // subtle float
              return Transform.translate(
                offset: Offset(0, floatY),
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _kIconBg,
                    border: Border.all(color: _kBorderMuted, width: 1),
                    boxShadow: [
                      BoxShadow(
                        color: _kAccent.withOpacity(glowOpacity),
                        blurRadius: 30,
                        spreadRadius: 4 + pulseController.value * 8,
                      ),
                    ],
                  ),
                  child: child,
                ),
              );
            },
            child: ClipOval(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Image.asset(
                  'assets/icon.png',
                  fit: BoxFit.contain,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DotsLoader extends StatefulWidget {
  const _DotsLoader();

  @override
  State<_DotsLoader> createState() => _DotsLoaderState();
}

class _DotsLoaderState extends State<_DotsLoader>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(3, (i) {
            final phase = i / 3.0;
            final t = ((_controller.value - phase) % 1.0);
            final scale = 1.0 + 0.6 * (1 - (2 * t - 1).abs()).clamp(0.0, 1.0);
            final opacity = 0.3 + 0.7 * (1 - (2 * t - 1).abs()).clamp(0.0, 1.0);

            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Opacity(
                opacity: opacity,
                child: Transform.scale(
                  scale: scale,
                  child: Container(
                    width: 7,
                    height: 7,
                    decoration: const BoxDecoration(
                      color: _kAccent,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ),
            );
          }),
        );
      },
    );
  }
}
