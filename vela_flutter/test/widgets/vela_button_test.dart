import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vela_flutter/ui/widgets/vela_button.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  testWidgets('sm and md button sizes render with minimum 44px height',
      (tester) async {
    await pumpWithMaterial(
      tester,
      Column(
        children: const [
          VelaButton(size: VelaButtonSize.sm, child: Text('Small')),
          VelaButton(size: VelaButtonSize.md, child: Text('Medium')),
        ],
      ),
    );

    expect(tester.getSize(find.text('Small')).height, greaterThanOrEqualTo(14));
    expect(tester.getSize(find.byType(VelaButton).first).height,
        greaterThanOrEqualTo(44));
    expect(tester.getSize(find.byType(VelaButton).last).height,
        greaterThanOrEqualTo(44));
  });

  testWidgets('disabled and loading buttons do not call onPressed',
      (tester) async {
    var taps = 0;
    await pumpWithMaterial(
      tester,
      Column(
        children: [
          VelaButton(
              disabled: true,
              onPressed: () => taps++,
              child: const Text('Disabled')),
          VelaButton(
              loading: true,
              onPressed: () => taps++,
              child: const Text('Loading')),
        ],
      ),
    );

    await tester.tap(find.text('Disabled'));
    await tester.tap(find.text('Loading'));

    expect(taps, 0);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('text label participates in semantics tree', (tester) async {
    await pumpWithMaterial(
      tester,
      const VelaButton(child: Text('Save changes')),
    );

    expect(find.bySemanticsLabel('Save changes'), findsOneWidget);
  });
}
