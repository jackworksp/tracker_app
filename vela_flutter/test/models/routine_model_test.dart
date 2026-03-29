import 'package:flutter_test/flutter_test.dart';
import 'package:vela_flutter/data/models/routine.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  test('Routine.fromJson parses fields and defaults optional values', () {
    final routine = Routine.fromJson(buildRoutineJson()
      ..remove('streak')
      ..remove('is_completed_today')
      ..remove('active'));

    expect(routine.id, 1);
    expect(routine.title, 'Daily review');
    expect(routine.streak, 0);
    expect(routine.isCompletedToday, isFalse);
    expect(routine.active, isTrue);
  });
}
