import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class VelaTextArea extends StatelessWidget {
  final String? label;
  final String? helperText;
  final String? error;
  final String? placeholder;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final bool disabled;
  final bool required;
  final int minLines;
  final int maxLines;

  const VelaTextArea({
    super.key,
    this.label,
    this.helperText,
    this.error,
    this.placeholder,
    this.controller,
    this.onChanged,
    this.disabled = false,
    this.required = false,
    this.minLines = 3,
    this.maxLines = 8,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;
    final hasError = error != null && error!.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (label != null) ...[
          Row(
            children: [
              Text(label!,
                  style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w500)),
              if (required)
                Text(' *',
                    style: TextStyle(color: colors.stateError, fontSize: 14)),
            ],
          ),
          const SizedBox(height: 6),
        ],
        ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 80),
          child: TextField(
            controller: controller,
            onChanged: onChanged,
            enabled: !disabled,
            minLines: minLines,
            maxLines: maxLines,
            style: TextStyle(color: colors.textPrimary, fontSize: 16),
            decoration: InputDecoration(
              hintText: placeholder,
              hintStyle: TextStyle(color: colors.textTertiary),
              contentPadding: const EdgeInsets.all(12),
              filled: true,
              fillColor: colors.surfaceDefault,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide: BorderSide(
                    color: hasError ? colors.stateError : colors.surfaceBorder),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide: BorderSide(
                    color: hasError ? colors.stateError : colors.surfaceBorder),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide: BorderSide(color: colors.brandAccent, width: 2),
              ),
            ),
          ),
        ),
        if (hasError) ...[
          const SizedBox(height: 4),
          Text(error!,
              style: TextStyle(color: colors.stateError, fontSize: 12)),
        ] else if (helperText != null) ...[
          const SizedBox(height: 4),
          Text(helperText!,
              style: TextStyle(color: colors.textTertiary, fontSize: 12)),
        ],
      ],
    );
  }
}
