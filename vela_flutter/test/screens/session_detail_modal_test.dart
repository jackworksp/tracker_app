import 'package:flutter_test/flutter_test.dart';
import 'package:vela_flutter/data/repositories/goals_repository.dart';
import 'package:vela_flutter/data/repositories/note_folders_repository.dart';
import 'package:vela_flutter/data/repositories/notes_repository.dart';
import 'package:vela_flutter/data/models/study_session.dart';
import 'package:vela_flutter/providers/goals_provider.dart';
import 'package:vela_flutter/providers/notes_provider.dart';
import 'package:vela_flutter/ui/screens/sessions/session_detail_modal.dart';

import '../test_helpers/test_helpers.dart';

class _DummyGoalsRepository extends GoalsRepository {
  _DummyGoalsRepository() : super(MockDioClient());
}

class _DummyNotesRepository extends NotesRepository {
  _DummyNotesRepository() : super(MockDioClient());
}

class _DummyNoteFoldersRepository extends NoteFoldersRepository {
  _DummyNoteFoldersRepository() : super(MockDioClient());
}

void main() {
  testWidgets('attachment count re-syncs when widget session changes',
      (tester) async {
    final sessionOne =
        StudySession.fromJson(buildSessionJson(attachmentCount: 1));
    final sessionTwo = sessionOne.copyWith(attachmentCount: 3);

    await pumpTestApp(
      tester,
      SessionDetailModal(
        session: sessionOne,
        onEdit: () {},
        onDelete: () {},
        onRevise: () {},
      ),
      overrides: [
        goalsProvider
            .overrideWith((ref) => GoalsNotifier(_DummyGoalsRepository())),
        notesProvider.overrideWith((ref) => NotesNotifier(
            _DummyNotesRepository(), _DummyNoteFoldersRepository())),
      ],
    );
    await tester.pump();

    expect(find.textContaining('ATTACHMENTS (1)'), findsOneWidget);

    await pumpTestApp(
      tester,
      SessionDetailModal(
        session: sessionTwo,
        onEdit: () {},
        onDelete: () {},
        onRevise: () {},
      ),
      overrides: [
        goalsProvider
            .overrideWith((ref) => GoalsNotifier(_DummyGoalsRepository())),
        notesProvider.overrideWith((ref) => NotesNotifier(
            _DummyNotesRepository(), _DummyNoteFoldersRepository())),
      ],
    );
    await tester.pump();

    expect(find.textContaining('ATTACHMENTS (3)'), findsOneWidget);
  });
}
