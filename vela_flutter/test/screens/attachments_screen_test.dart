import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vela_flutter/core/utils/attachment_classifier.dart';
import 'package:vela_flutter/data/repositories/attachments_repository.dart';
import 'package:vela_flutter/providers/attachments_provider.dart';
import 'package:vela_flutter/providers/auth_provider.dart';
import 'package:vela_flutter/ui/screens/attachments/attachments_screen.dart';

import '../test_helpers/test_helpers.dart';

class TestAttachmentsNotifier extends AttachmentsNotifier {
  TestAttachmentsNotifier(this._allAttachments)
      : super(_FakeAttachmentsRepository()) {
    state = AttachmentsState(attachments: _allAttachments);
  }

  final List<Attachment> _allAttachments;

  @override
  Future<void> loadAttachments({
    Map<String, dynamic>? filters,
    int page = 1,
  }) async {
    final platform = filters?['platform'] as String?;
    final fileType = filters?['file_type'] as String?;

    final filtered = _allAttachments.where((attachment) {
      final classification = AttachmentClassifier.classify(
        url: attachment.url,
        type: attachment.type,
        metadata: attachment.metadata,
      );

      if (platform != null) {
        return classification.platform == platform ||
            classification.kind == platform;
      }

      if (fileType == 'pdf') {
        return classification.kind == 'document';
      }
      if (fileType == 'image') {
        return classification.kind == 'image';
      }
      if (fileType == 'link') {
        return classification.kind == 'link';
      }

      return true;
    }).toList();

    state = AttachmentsState(
      attachments: filtered,
      filters: filters ?? const {},
      currentPage: page,
    );
  }
}

class _FakeAttachmentsRepository extends AttachmentsRepository {
  _FakeAttachmentsRepository() : super(MockDioClient());
}

void main() {
  late MemoryLocalStorage localStorage;
  late List<Attachment> attachments;

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    localStorage = MemoryLocalStorage();
    attachments = [
      const Attachment(
        id: 'attachment-1',
        title: 'YouTube Video',
        type: 'url',
        metadata: {'platform': 'youtube'},
      ),
      const Attachment(
        id: 'attachment-2',
        title: 'Syllabus PDF',
        type: 'url',
        url: 'https://docs.google.com/document/d/123/edit',
      ),
      const Attachment(
        id: 'attachment-3',
        title: 'Plain Link',
        type: 'url',
        url: 'https://example.com/article',
      ),
    ];
  });

  testWidgets('tapping a chip filters visible files', (tester) async {
    final notifier = TestAttachmentsNotifier(attachments);

    await pumpTestApp(
      tester,
      const AttachmentsScreen(),
      overrides: [
        attachmentsProvider.overrideWith((ref) => notifier),
        localStorageProvider.overrideWithValue(localStorage),
      ],
    );
    await tester.pump();
    await tester.pump();

    expect(find.text('YouTube Video'), findsOneWidget);
    expect(find.text('Syllabus PDF'), findsOneWidget);
    expect(find.text('Plain Link'), findsOneWidget);

    await tester.tap(find.text('Youtube').first);
    await tester.pump();

    expect(find.text('YouTube Video'), findsOneWidget);
    expect(find.text('Syllabus PDF'), findsNothing);
    expect(find.text('Plain Link'), findsNothing);
  });

  testWidgets('empty state appears when a chip has no matches', (tester) async {
    final notifier = TestAttachmentsNotifier(attachments);

    await pumpTestApp(
      tester,
      const AttachmentsScreen(),
      overrides: [
        attachmentsProvider.overrideWith((ref) => notifier),
        localStorageProvider.overrideWithValue(localStorage),
      ],
    );
    await tester.pump();
    await tester.pump();

    await tester.tap(find.text('Image').first);
    await tester.pump();

    expect(find.text('No files match this filter'), findsOneWidget);
  });

  testWidgets('view toggle switches between list and grid', (tester) async {
    final notifier = TestAttachmentsNotifier(attachments);

    await pumpTestApp(
      tester,
      const AttachmentsScreen(),
      overrides: [
        attachmentsProvider.overrideWith((ref) => notifier),
        localStorageProvider.overrideWithValue(localStorage),
      ],
    );
    await tester.pump();
    await tester.pump();

    expect(find.byType(Dismissible), findsWidgets);

    await tester.tap(find.byTooltip('Switch to grid view'));
    await tester.pump();

    expect(find.byType(Dismissible), findsNothing);
    expect(localStorage.attachmentsViewMode, 'grid');
    expect(find.byTooltip('Switch to list view'), findsOneWidget);
  });

  testWidgets('saved view mode is restored on open', (tester) async {
    localStorage.attachmentsViewMode = 'grid';
    final notifier = TestAttachmentsNotifier(attachments);

    await pumpTestApp(
      tester,
      const AttachmentsScreen(),
      overrides: [
        attachmentsProvider.overrideWith((ref) => notifier),
        localStorageProvider.overrideWithValue(localStorage),
      ],
    );
    await tester.pump();
    await tester.pump();

    expect(find.byTooltip('Switch to list view'), findsOneWidget);
    expect(find.byType(Dismissible), findsNothing);
  });
}
