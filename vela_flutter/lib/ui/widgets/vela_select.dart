import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class VelaSelectItem<T> {
  final T value;
  final String label;
  final Widget? icon;

  const VelaSelectItem({required this.value, required this.label, this.icon});
}

class VelaSelect<T> extends StatefulWidget {
  final String? label;
  final String? placeholder;
  final T? value;
  final List<VelaSelectItem<T>> items;
  final ValueChanged<T>? onChanged;
  final bool searchable;
  final bool disabled;
  final String? error;

  const VelaSelect({
    super.key,
    this.label,
    this.placeholder,
    this.value,
    required this.items,
    this.onChanged,
    this.searchable = false,
    this.disabled = false,
    this.error,
  });

  @override
  State<VelaSelect<T>> createState() => _VelaSelectState<T>();
}

class _VelaSelectState<T> extends State<VelaSelect<T>> {
  final LayerLink _layerLink = LayerLink();
  OverlayEntry? _overlayEntry;
  bool _isOpen = false;

  void _toggleDropdown() {
    if (widget.disabled) return;
    if (_isOpen) {
      _closeDropdown();
    } else {
      _openDropdown();
    }
  }

  void _openDropdown() {
    final overlay = Overlay.of(context);
    final renderBox = context.findRenderObject() as RenderBox;
    final size = renderBox.size;

    _overlayEntry = OverlayEntry(
      builder: (context) => _DropdownOverlay<T>(
        items: widget.items,
        selectedValue: widget.value,
        searchable: widget.searchable,
        width: size.width,
        layerLink: _layerLink,
        onSelect: (value) {
          widget.onChanged?.call(value);
          _closeDropdown();
        },
        onClose: _closeDropdown,
      ),
    );

    overlay.insert(_overlayEntry!);
    setState(() => _isOpen = true);
  }

  void _closeDropdown() {
    _overlayEntry?.remove();
    _overlayEntry = null;
    setState(() => _isOpen = false);
  }

  @override
  void dispose() {
    _closeDropdown();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    final selectedItem =
        widget.items.where((i) => i.value == widget.value).firstOrNull;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (widget.label != null) ...[
          Text(widget.label!,
              style: TextStyle(
                  color: colors.textPrimary,
                  fontSize: 14,
                  fontWeight: FontWeight.w500)),
          const SizedBox(height: 6),
        ],
        CompositedTransformTarget(
          link: _layerLink,
          child: GestureDetector(
            onTap: _toggleDropdown,
            child: Container(
              height: 40,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: colors.surfaceDefault,
                border: Border.all(
                  color: widget.error != null
                      ? colors.stateError
                      : colors.surfaceBorder,
                ),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      selectedItem?.label ?? widget.placeholder ?? 'Select...',
                      style: TextStyle(
                        color: selectedItem != null
                            ? colors.textPrimary
                            : colors.textTertiary,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  AnimatedRotation(
                    turns: _isOpen ? 0.5 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: Icon(Icons.keyboard_arrow_down,
                        size: 20, color: colors.textSecondary),
                  ),
                ],
              ),
            ),
          ),
        ),
        if (widget.error != null) ...[
          const SizedBox(height: 4),
          Text(widget.error!,
              style: TextStyle(color: colors.stateError, fontSize: 12)),
        ],
      ],
    );
  }
}

class _DropdownOverlay<T> extends StatefulWidget {
  final List<VelaSelectItem<T>> items;
  final T? selectedValue;
  final bool searchable;
  final double width;
  final LayerLink layerLink;
  final ValueChanged<T> onSelect;
  final VoidCallback onClose;

  const _DropdownOverlay({
    required this.items,
    this.selectedValue,
    required this.searchable,
    required this.width,
    required this.layerLink,
    required this.onSelect,
    required this.onClose,
  });

  @override
  State<_DropdownOverlay<T>> createState() => _DropdownOverlayState<T>();
}

class _DropdownOverlayState<T> extends State<_DropdownOverlay<T>> {
  String _search = '';

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    final filtered = _search.isEmpty
        ? widget.items
        : widget.items
            .where((i) => i.label.toLowerCase().contains(_search.toLowerCase()))
            .toList();

    return Stack(
      children: [
        GestureDetector(
            onTap: widget.onClose, child: Container(color: Colors.transparent)),
        CompositedTransformFollower(
          link: widget.layerLink,
          offset: const Offset(0, 44),
          child: Material(
            elevation: 8,
            borderRadius: BorderRadius.circular(6),
            color: colors.surfaceElevated,
            child: Container(
              width: widget.width,
              constraints: const BoxConstraints(maxHeight: 240),
              decoration: BoxDecoration(
                border: Border.all(color: colors.surfaceBorder),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (widget.searchable)
                    Padding(
                      padding: const EdgeInsets.all(8),
                      child: TextField(
                        autofocus: true,
                        onChanged: (v) => setState(() => _search = v),
                        style:
                            TextStyle(color: colors.textPrimary, fontSize: 14),
                        decoration: InputDecoration(
                          hintText: 'Search...',
                          hintStyle: TextStyle(color: colors.textTertiary),
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 8),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(4),
                            borderSide: BorderSide(color: colors.surfaceBorder),
                          ),
                        ),
                      ),
                    ),
                  Flexible(
                    child: ListView.builder(
                      shrinkWrap: true,
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final item = filtered[index];
                        final isSelected = item.value == widget.selectedValue;
                        return InkWell(
                          onTap: () => widget.onSelect(item.value),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 8),
                            color:
                                isSelected ? colors.interactiveSelected : null,
                            child: Row(
                              children: [
                                if (item.icon != null) ...[
                                  item.icon!,
                                  const SizedBox(width: 8)
                                ],
                                Expanded(
                                  child: Text(
                                    item.label,
                                    style: TextStyle(
                                      color: colors.textPrimary,
                                      fontSize: 14,
                                      fontWeight: isSelected
                                          ? FontWeight.w500
                                          : FontWeight.w400,
                                    ),
                                  ),
                                ),
                                if (isSelected)
                                  Icon(Icons.check,
                                      size: 16, color: colors.brandAccent),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
