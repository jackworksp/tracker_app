import 'package:flutter_test/flutter_test.dart';
import 'package:vela_flutter/data/models/user.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  test('User.fromJson parses optional fields', () {
    final user = User.fromJson(buildUserJson());

    expect(user.id, 1);
    expect(user.name, 'Ada');
    expect(user.profilePhotoUrl, isNull);
    expect(user.mcpApiKey, isNull);
  });

  test('toJsonString and fromJsonString round-trip', () {
    final user = User.fromJson(buildUserJson());

    final roundTripped = User.fromJsonString(user.toJsonString());

    expect(roundTripped, user);
  });
}
