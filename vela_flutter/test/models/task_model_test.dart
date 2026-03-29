import 'package:flutter_test/flutter_test.dart';
import 'package:vela_flutter/data/models/task.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  group('Task.fromJson()', () {
    test('parses required fields and defaults nullable lists', () {
      final task = Task.fromJson(buildTaskJson()
        ..['tags'] = null
        ..['subtasks'] = null
        ..['resources'] = null);

      expect(task.id, 1);
      expect(task.title, 'Study Flutter testing');
      expect(task.tags, isEmpty);
      expect(task.subtasks, isEmpty);
      expect(task.resources, isEmpty);
      expect(task.reminderDismissed, isFalse);
    });

    test('parses reminder timestamps when present', () {
      final reminder = DateTime.utc(2024, 1, 1, 9);
      final snoozed = reminder.add(const Duration(minutes: 10));
      final task = Task.fromJson(buildTaskJson(
        reminderTime: reminder,
        reminderSnoozedUntil: snoozed,
      ));

      expect(task.reminderTime, reminder);
      expect(task.reminderSnoozedUntil, snoozed);
    });
  });

  group('Task.toJson()', () {
    test('omits null nullable fields', () {
      final json = Task.fromJson(buildTaskJson()).toJson();

      expect(json.containsKey('subject_id'), isFalse);
      expect(json.containsKey('url'), isFalse);
      expect(json['title'], 'Study Flutter testing');
    });
  });

  group('Task.copyWith()', () {
    test('copyWith() with no args preserves values', () {
      final task = Task.fromJson(buildTaskJson(subjectId: 9));

      final copy = task.copyWith();

      expect(copy.subjectId, 9);
      expect(copy.title, task.title);
    });

    test('copyWith can explicitly clear nullable fields', () {
      final task = Task.fromJson(buildTaskJson(subjectId: 9));

      final cleared = task.copyWith(subjectId: null, reminderTime: null);

      expect(cleared.subjectId, isNull);
      expect(cleared.reminderTime, isNull);
    });
  });
}
