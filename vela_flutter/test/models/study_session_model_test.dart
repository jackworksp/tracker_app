import 'package:flutter_test/flutter_test.dart';
import 'package:vela_flutter/core/constants/activity_types.dart';
import 'package:vela_flutter/data/models/study_session.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  test('StudySession.fromJson parses fields and defaults attachment count', () {
    final session = StudySession.fromJson(buildSessionJson()
      ..remove('attachment_count')
      ..['goal_id'] = null
      ..['url'] = null);

    expect(session.id, 1);
    expect(session.subjectId, 1);
    expect(session.timeSpent, 30);
    expect(session.attachmentCount, 0);
    expect(session.goalId, isNull);
    expect(session.url, isNull);
  });

  test('ActivityType.fromString falls back safely for unknown types', () {
    expect(ActivityType.fromString('BOGUS'), ActivityType.study);
  });
}
