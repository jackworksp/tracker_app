import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vela_flutter/ui/widgets/vela_card.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  testWidgets('interactive card calls onTap', (tester) async {
    var tapped = false;
    await pumpWithMaterial(
      tester,
      VelaCard(
        interactive: true,
        onTap: () => tapped = true,
        child: const Text('Card'),
      ),
    );

    await tester.tap(find.text('Card'));

    expect(tapped, isTrue);
  });

  testWidgets('padding variants apply expected spacing', (tester) async {
    await pumpWithMaterial(
      tester,
      const Column(
        children: [
          VelaCard(padding: VelaCardPadding.none, child: Text('None')),
          VelaCard(padding: VelaCardPadding.md, child: Text('Medium')),
        ],
      ),
    );

    final noneContainer = tester.widget<Container>(
      find
          .ancestor(of: find.text('None'), matching: find.byType(Container))
          .first,
    );
    final mdContainer = tester.widget<Container>(
      find
          .ancestor(of: find.text('Medium'), matching: find.byType(Container))
          .first,
    );
    expect((noneContainer.padding as EdgeInsets), EdgeInsets.zero);
    expect((mdContainer.padding as EdgeInsets), const EdgeInsets.all(16));
  });
}
