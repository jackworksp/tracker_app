import 'package:flutter/material.dart';

enum ActivityType {
  study('STUDY', 'Study', Icons.menu_book),
  watch('WATCH', 'Watch', Icons.play_circle_outline),
  read('READ', 'Read', Icons.auto_stories),
  practice('PRACTICE', 'Practice', Icons.code),
  notes('NOTES', 'Notes', Icons.edit_note),
  listen('LISTEN', 'Listen', Icons.headphones);

  final String value;
  final String label;
  final IconData icon;

  const ActivityType(this.value, this.label, this.icon);

  static ActivityType fromString(String value) {
    return ActivityType.values.firstWhere(
      (e) => e.value == value,
      orElse: () => ActivityType.study,
    );
  }
}
