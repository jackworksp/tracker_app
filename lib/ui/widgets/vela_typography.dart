import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class VelaH1 extends StatelessWidget {
  final String text;
  final Color? color;
  const VelaH1(this.text, {super.key, this.color});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    return Text(text, style: TextStyle(fontSize: 36, fontWeight: FontWeight.w700, height: 1.2, color: color ?? colors.textPrimary));
  }
}

class VelaH2 extends StatelessWidget {
  final String text;
  final Color? color;
  const VelaH2(this.text, {super.key, this.color});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    return Text(text, style: TextStyle(fontSize: 30, fontWeight: FontWeight.w700, height: 1.2, color: color ?? colors.textPrimary));
  }
}

class VelaH3 extends StatelessWidget {
  final String text;
  final Color? color;
  const VelaH3(this.text, {super.key, this.color});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    return Text(text, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, height: 1.2, color: color ?? colors.textPrimary));
  }
}

class VelaH4 extends StatelessWidget {
  final String text;
  final Color? color;
  const VelaH4(this.text, {super.key, this.color});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    return Text(text, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, height: 1.2, color: color ?? colors.textPrimary));
  }
}

class VelaH5 extends StatelessWidget {
  final String text;
  final Color? color;
  const VelaH5(this.text, {super.key, this.color});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    return Text(text, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, height: 1.5, color: color ?? colors.textPrimary));
  }
}

class VelaH6 extends StatelessWidget {
  final String text;
  final Color? color;
  const VelaH6(this.text, {super.key, this.color});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    return Text(text, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, height: 1.5, color: color ?? colors.textPrimary));
  }
}

class VelaParagraph extends StatelessWidget {
  final String text;
  final Color? color;
  const VelaParagraph(this.text, {super.key, this.color});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    return Text(text, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w400, height: 1.6, color: color ?? colors.textPrimary));
  }
}

class VelaCaption extends StatelessWidget {
  final String text;
  final Color? color;
  const VelaCaption(this.text, {super.key, this.color});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    return Text(text, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w400, height: 1.5, color: color ?? colors.textTertiary));
  }
}

class VelaLabel extends StatelessWidget {
  final String text;
  final Color? color;
  const VelaLabel(this.text, {super.key, this.color});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    return Text(text, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, height: 1.5, color: color ?? colors.textSecondary));
  }
}

class VelaText extends StatelessWidget {
  final String text;
  final Color? color;
  final double? fontSize;
  final FontWeight? fontWeight;
  const VelaText(this.text, {super.key, this.color, this.fontSize, this.fontWeight});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    return Text(text, style: TextStyle(fontSize: fontSize ?? 16, fontWeight: fontWeight ?? FontWeight.w400, color: color ?? colors.textPrimary));
  }
}
