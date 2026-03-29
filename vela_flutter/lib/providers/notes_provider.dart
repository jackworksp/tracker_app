import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../core/utils/error_messages.dart';
import '../data/models/note.dart';
import '../data/repositories/notes_repository.dart';
import '../data/repositories/note_folders_repository.dart';
import 'auth_provider.dart';

final notesRepositoryProvider = Provider<NotesRepository>((ref) {
  return NotesRepository(ref.watch(dioClientProvider));
});

final noteFoldersRepositoryProvider = Provider<NoteFoldersRepository>((ref) {
  return NoteFoldersRepository(ref.watch(dioClientProvider));
});

class NoteFolder {
  final int id;
  final String name;
  final int? subjectId;
  final DateTime? createdAt;

  const NoteFolder({
    required this.id,
    required this.name,
    this.subjectId,
    this.createdAt,
  });

  factory NoteFolder.fromJson(Map<String, dynamic> json) {
    return NoteFolder(
      id: json['id'] as int,
      name: json['name'] as String,
      subjectId: json['subject_id'] as int?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
    );
  }
}

class NotesState {
  final List<Note> notes;
  final List<NoteFolder> folders;
  final NoteFolder? selectedFolder;
  final bool isLoading;
  final String? error;

  const NotesState({
    this.notes = const [],
    this.folders = const [],
    this.selectedFolder,
    this.isLoading = false,
    this.error,
  });

  NotesState copyWith({
    List<Note>? notes,
    List<NoteFolder>? folders,
    NoteFolder? selectedFolder,
    bool? isLoading,
    String? error,
    bool clearSelectedFolder = false,
  }) {
    return NotesState(
      notes: notes ?? this.notes,
      folders: folders ?? this.folders,
      selectedFolder:
          clearSelectedFolder ? null : (selectedFolder ?? this.selectedFolder),
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class NotesNotifier extends StateNotifier<NotesState> {
  final NotesRepository _notesRepository;
  final NoteFoldersRepository _foldersRepository;

  NotesNotifier(this._notesRepository, this._foldersRepository)
      : super(const NotesState());

  Future<void> loadNotes({int? folderId, int? subjectId}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final data = await _notesRepository.getAll(
        folderId: folderId,
        subjectId: subjectId,
      );
      final notes = data.map((json) => Note.fromJson(json)).toList();
      state = state.copyWith(notes: notes, isLoading: false);
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.message ?? ErrorMessages.noteLoadFailed,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ErrorMessages.noteLoadFailed,
      );
    }
  }

  Future<void> loadFolders() async {
    try {
      final data = await _foldersRepository.getAll();
      final folders = data.map((json) => NoteFolder.fromJson(json)).toList();
      state = state.copyWith(folders: folders);
    } on DioException catch (e) {
      state = state.copyWith(error: e.message ?? ErrorMessages.noteLoadFailed);
    } catch (e) {
      state = state.copyWith(error: ErrorMessages.noteLoadFailed);
    }
  }

  void setSelectedFolder(NoteFolder? folder) {
    state = state.copyWith(
      selectedFolder: folder,
      clearSelectedFolder: folder == null,
    );
  }

  Future<Note> createNote(Map<String, dynamic> data) async {
    final json = await _notesRepository.create(data);
    final note = Note.fromJson(json);
    state = state.copyWith(notes: [note, ...state.notes]);
    return note;
  }

  Future<void> updateNote(int id, Map<String, dynamic> data) async {
    final json = await _notesRepository.update(id, data);
    final updated = Note.fromJson(json);
    state = state.copyWith(
      notes: state.notes.map((n) => n.id == id ? updated : n).toList(),
    );
  }

  Future<void> deleteNote(int id) async {
    await _notesRepository.delete(id);
    state = state.copyWith(
      notes: state.notes.where((n) => n.id != id).toList(),
    );
  }

  Future<void> moveNote(int id, int? folderId) async {
    final json = await _notesRepository.move(id, folderId);
    final updated = Note.fromJson(json);
    state = state.copyWith(
      notes: state.notes.map((n) => n.id == id ? updated : n).toList(),
    );
  }

  Future<NoteFolder> createFolder(String name) async {
    final json = await _foldersRepository.create({'name': name});
    final folder = NoteFolder.fromJson(json);
    state = state.copyWith(folders: [...state.folders, folder]);
    return folder;
  }

  Future<void> deleteFolder(int id) async {
    await _foldersRepository.delete(id);
    final updatedFolders = state.folders.where((f) => f.id != id).toList();
    state = state.copyWith(
      folders: updatedFolders,
      clearSelectedFolder: state.selectedFolder?.id == id,
    );
  }
}

final notesProvider = StateNotifierProvider<NotesNotifier, NotesState>((ref) {
  return NotesNotifier(
    ref.watch(notesRepositoryProvider),
    ref.watch(noteFoldersRepositoryProvider),
  );
});
