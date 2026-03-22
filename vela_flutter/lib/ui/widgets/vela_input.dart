import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

enum VelaInputSize { sm, md, lg }

class VelaInput extends StatelessWidget {
  final String? label;
  final String? helperText;
  final String? error;
  final String? success;
  final String? placeholder;
  final String? value;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onTap;
  final TextEditingController? controller;
  final bool disabled;
  final bool readOnly;
  final bool required;
  final bool fullWidth;
  final bool obscureText;
  final VelaInputSize size;
  final Widget? leftIcon;
  final Widget? rightIcon;
  final TextInputType? keyboardType;
  final int? maxLines;
  final FocusNode? focusNode;

  const VelaInput({
    super.key,
    this.label,
    this.helperText,
    this.error,
    this.success,
    this.placeholder,
    this.value,
    this.onChanged,
    this.onTap,
    this.controller,
    this.disabled = false,
    this.readOnly = false,
    this.required = false,
    this.fullWidth = true,
    this.obscureText = false,
    this.size = VelaInputSize.md,
    this.leftIcon,
    this.rightIcon,
    this.keyboardType,
    this.maxLines = 1,
    this.focusNode,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final hasError = error != null && error!.isNotEmpty;
    final hasSuccess = success != null && success!.isNotEmpty;

    // Issue 01: minimum touch target is 44px (WCAG 2.5.5).
    // sm stays at 36px visually but gets a 44px-minimum tap area via ConstrainedBox below.
    // md and lg already meet 44px.
    final height = switch (size) {
      VelaInputSize.sm => 36.0,
      VelaInputSize.md => 44.0,
      VelaInputSize.lg => 48.0,
    };
    final fontSize = switch (size) {
      VelaInputSize.sm => 14.0,
      VelaInputSize.md => 16.0,
      VelaInputSize.lg => 18.0,
    };

    Color borderColor = colors.surfaceBorder;
    if (hasError) borderColor = colors.stateError;
    if (hasSuccess) borderColor = colors.stateSuccess;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (label != null) ...[
          Row(
            children: [
              Text(
                label!,
                style: TextStyle(
                  color: colors.textPrimary,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              if (required)
                Text(
                  ' *',
                  style: TextStyle(color: colors.stateError, fontSize: 14),
                ),
            ],
          ),
          const SizedBox(height: 6),
        ],
        ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 44),
          child: SizedBox(
          width: fullWidth ? double.infinity : null,
          child: TextField(
            controller: controller,
            focusNode: focusNode,
            onChanged: onChanged,
            onTap: onTap,
            enabled: !disabled,
            readOnly: readOnly,
            obscureText: obscureText,
            keyboardType: keyboardType,
            maxLines: maxLines,
            style: TextStyle(
              color: colors.textPrimary,
              fontSize: fontSize,
            ),
            decoration: InputDecoration(
              hintText: placeholder,
              hintStyle: TextStyle(color: colors.textTertiary, fontSize: fontSize),
              contentPadding: EdgeInsets.symmetric(
                horizontal: 12,
                vertical: (height - fontSize - 8) / 2,
              ),
              prefixIcon: leftIcon != null
                  ? IconTheme(
                      data: IconThemeData(color: colors.textTertiary, size: 18),
                      child: leftIcon!,
                    )
                  : null,
              suffixIcon: rightIcon != null
                  ? IconTheme(
                      data: IconThemeData(color: colors.textTertiary, size: 18),
                      child: rightIcon!,
                    )
                  : null,
              filled: true,
              fillColor: colors.surfaceDefault,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide: BorderSide(color: borderColor),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide: BorderSide(color: borderColor),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide: BorderSide(color: colors.brandAccent, width: 2),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide: BorderSide(color: colors.stateError),
              ),
              disabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide: BorderSide(color: colors.surfaceBorderDark),
              ),
            ),
          ),
          ), // SizedBox
        ), // ConstrainedBox
        if (hasError) ...[
          const SizedBox(height: 4),
          Text(
            error!,
            style: TextStyle(color: colors.stateError, fontSize: 12),
          ),
        ] else if (hasSuccess) ...[
          const SizedBox(height: 4),
          Text(
            success!,
            style: TextStyle(color: colors.stateSuccess, fontSize: 12),
          ),
        ] else if (helperText != null) ...[
          const SizedBox(height: 4),
          Text(
            helperText!,
            style: TextStyle(color: colors.textTertiary, fontSize: 12),
          ),
        ],
      ],
    );
  }
}
