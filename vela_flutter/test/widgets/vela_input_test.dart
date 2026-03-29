import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vela_flutter/ui/widgets/vela_input.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  testWidgets('shows error text and required indicator', (tester) async {
    await pumpWithMaterial(
      tester,
      const VelaInput(
        label: 'Email',
        required: true,
        error: 'Email is required',
      ),
    );

    expect(find.text('Email'), findsOneWidget);
    expect(find.text(' *'), findsOneWidget);
    expect(find.text('Email is required'), findsOneWidget);
  });

  testWidgets('disabled input is not editable and md height is at least 44',
      (tester) async {
    await pumpWithMaterial(
      tester,
      const VelaInput(
        label: 'Name',
        disabled: true,
        size: VelaInputSize.md,
      ),
    );

    final textField = tester.widget<TextField>(find.byType(TextField));
    expect(textField.enabled, isFalse);
    expect(tester.getSize(find.byType(TextField)).height,
        greaterThanOrEqualTo(44));
  });
}
