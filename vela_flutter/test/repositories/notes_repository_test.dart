import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:vela_flutter/data/repositories/notes_repository.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  late MockDioClient mockDioClient;
  late MockDio mockDio;
  late NotesRepository repository;

  setUp(() {
    mockDioClient = MockDioClient();
    mockDio = MockDio();
    when(() => mockDioClient.dio).thenReturn(mockDio);
    repository = NotesRepository(mockDioClient);
  });

  group('getAll()', () {
    test('returns list from flat array response', () async {
      when(() => mockDio.get(any(),
              queryParameters: any(named: 'queryParameters')))
          .thenAnswer((_) async => buildResponse(data: [
                {'id': 1, 'title': 'Session notes'}
              ]));

      final notes = await repository.getAll();

      expect(notes, hasLength(1));
      expect(notes.first['title'], 'Session notes');
    });

    test('passes folderId and subjectId as query params when provided',
        () async {
      when(() => mockDio.get(any(),
              queryParameters: any(named: 'queryParameters')))
          .thenAnswer((_) async => buildResponse(data: const []));

      await repository.getAll(folderId: 8, subjectId: 3);

      verify(() => mockDio.get(
            any(),
            queryParameters: {'folder_id': 8, 'subject_id': 3},
          )).called(1);
    });
  });

  group('getSessionNotes()', () {
    test('returns list from flat array response', () async {
      when(() => mockDio.get(any(),
              queryParameters: any(named: 'queryParameters')))
          .thenAnswer((_) async => buildResponse(data: [
                {'id': 1, 'title': 'Linked note'}
              ]));

      final notes = await repository.getSessionNotes(7);

      expect(notes, hasLength(1));
    });

    test('returns empty list when response.data is null', () async {
      when(() => mockDio.get(any(),
              queryParameters: any(named: 'queryParameters')))
          .thenAnswer((_) async => buildResponse(data: null));

      final notes = await repository.getSessionNotes(7);

      expect(notes, isEmpty);
    });
  });

  group('getTaskNotes()', () {
    test('returns empty list when response.data is null', () async {
      when(() => mockDio.get(any(),
              queryParameters: any(named: 'queryParameters')))
          .thenAnswer((_) async => buildResponse(data: null));

      final notes = await repository.getTaskNotes(5);

      expect(notes, isEmpty);
    });
  });

  group('linkNoteToSession() / unlinkNoteFromSession()', () {
    test('calls session note link endpoints', () async {
      when(() => mockDio.post(any(), data: any(named: 'data')))
          .thenAnswer((_) async => buildResponse(data: const {}));
      when(() => mockDio.delete(any(), data: any(named: 'data')))
          .thenAnswer((_) async => buildResponse(data: const {}));

      await repository.linkNoteToSession(4, 9);
      await repository.unlinkNoteFromSession(4, 9);

      verify(() => mockDio.post(
            '/note-links/session/4/note/9',
            data: any(named: 'data'),
          )).called(1);
      verify(() => mockDio.delete(
            '/note-links/session/4/note/9',
            data: any(named: 'data'),
          )).called(1);
    });
  });
}
