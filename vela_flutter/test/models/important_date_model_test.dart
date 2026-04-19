import 'package:flutter_test/flutter_test.dart';
import 'package:vela_flutter/data/models/important_date.dart';

void main() {
  group('ImportantDate.fromJson()', () {
    test('parses date, optional time, recurrence, offsets, and links', () {
      final date = ImportantDate.fromJson({
        'id': 3,
        'user_id': 42,
        'title': 'Certification exam',
        'description': 'AWS SAA',
        'category': 'exam',
        'date': '2026-05-20',
        'time': '10:30:00',
        'recurrence': 'yearly',
        'reminder_offsets_days': [7, 1, 0],
        'task_id': 9,
        'goal_id': 11,
        'next_occurrence': '2026-05-20',
      });

      expect(date.id, 3);
      expect(date.title, 'Certification exam');
      expect(date.date, DateTime(2026, 5, 20));
      expect(date.time, '10:30:00');
      expect(date.repeatsYearly, isTrue);
      expect(date.reminderOffsetsDays, [7, 1, 0]);
      expect(date.taskId, 9);
      expect(date.goalId, 11);
      expect(date.displayDate, DateTime(2026, 5, 20));
    });

    test('uses defaults for optional fields', () {
      final date = ImportantDate.fromJson({
        'id': 1,
        'user_id': 42,
        'title': 'Renewal',
        'date': '2026-08-01',
      });

      expect(date.category, 'other');
      expect(date.time, isNull);
      expect(date.recurrence, 'none');
      expect(date.reminderOffsetsDays, [7, 1, 0]);
    });
  });

  group('ImportantDate.toJson()', () {
    test('serializes API field names', () {
      final json = ImportantDate(
        id: 1,
        userId: 42,
        title: 'Birthday',
        category: 'birthday',
        date: DateTime(2026, 2, 3),
        time: '09:00:00',
        recurrence: 'yearly',
        reminderOffsetsDays: const [7, 0],
      ).toJson();

      expect(json['user_id'], 42);
      expect(json['date'], '2026-02-03');
      expect(json['time'], '09:00:00');
      expect(json['reminder_offsets_days'], [7, 0]);
    });
  });
}
