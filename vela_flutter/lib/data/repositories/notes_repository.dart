import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';

class NotesRepository {
  final DioClient _dioClient;

  NotesRepository(this._dioClient);

  Future<List<Map<String, dynamic>>> getAll(
      {int? folderId, int? subjectId}) async {
    final queryParameters = <String, dynamic>{};
    if (folderId != null) queryParameters['folder_id'] = folderId;
    if (subjectId != null) queryParameters['subject_id'] = subjectId;

    final response = await _dioClient.dio.get(
      ApiConstants.notes,
      queryParameters: queryParameters,
    );
    final list = response.data as List;
    return list.map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> data) async {
    final response = await _dioClient.dio.post(ApiConstants.notes, data: data);
    return Map<String, dynamic>.from(response.data);
  }

  Future<Map<String, dynamic>> update(int id, Map<String, dynamic> data) async {
    final response =
        await _dioClient.dio.put('${ApiConstants.notes}/$id', data: data);
    return Map<String, dynamic>.from(response.data);
  }

  Future<void> delete(int id) async {
    await _dioClient.dio.delete('${ApiConstants.notes}/$id');
  }

  Future<Map<String, dynamic>> move(int id, int? folderId) async {
    final response = await _dioClient.dio.post(
      '${ApiConstants.notes}/$id/move',
      data: {'folder_id': folderId},
    );
    return Map<String, dynamic>.from(response.data);
  }

  Future<Map<String, dynamic>> copy(int id, int? folderId) async {
    final response = await _dioClient.dio.post(
      '${ApiConstants.notes}/$id/copy',
      data: {'folder_id': folderId},
    );
    return Map<String, dynamic>.from(response.data);
  }

  Future<List<Map<String, dynamic>>> getSessionNotes(int sessionId) async {
    final response = await _dioClient.dio.get(
      '${ApiConstants.noteLinks}/session/$sessionId',
    );
    final list = response.data as List? ?? [];
    return list.map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<void> linkNoteToSession(int sessionId, int noteId) async {
    await _dioClient.dio.post(
      '${ApiConstants.noteLinks}/session/$sessionId/note/$noteId',
    );
  }

  Future<void> unlinkNoteFromSession(int sessionId, int noteId) async {
    await _dioClient.dio.delete(
      '${ApiConstants.noteLinks}/session/$sessionId/note/$noteId',
    );
  }

  Future<List<Map<String, dynamic>>> getTaskNotes(int taskId) async {
    final response = await _dioClient.dio.get(
      '${ApiConstants.noteLinks}/task/$taskId',
    );
    final list = response.data as List? ?? [];
    return list.cast<Map<String, dynamic>>();
  }
}
