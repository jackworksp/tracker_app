import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';

class AttachmentsRepository {
  final DioClient _dioClient;

  AttachmentsRepository(this._dioClient);

  Future<Map<String, dynamic>> getAll({
    Map<String, dynamic>? filters,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParameters = <String, dynamic>{
      'page': page,
      'limit': limit,
      ...?filters,
    };

    final response = await _dioClient.dio.get(
      ApiConstants.attachments,
      queryParameters: queryParameters,
    );
    return Map<String, dynamic>.from(response.data);
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> data) async {
    final response = await _dioClient.dio.post(ApiConstants.attachments, data: data);
    return Map<String, dynamic>.from(response.data);
  }

  Future<void> delete(int id) async {
    await _dioClient.dio.delete('${ApiConstants.attachments}/$id');
  }

  Future<Map<String, dynamic>> move(int id, int? folderId) async {
    final response = await _dioClient.dio.put(
      '${ApiConstants.attachments}/$id/move',
      data: {'folder_id': folderId},
    );
    return Map<String, dynamic>.from(response.data);
  }

  Future<Map<String, dynamic>> moveToSubject(
    String attachmentId,
    int? subjectId,
  ) async {
    final response = await _dioClient.dio.put(
      '${ApiConstants.attachments}/$attachmentId/subject',
      data: {'subject_id': subjectId},
    );
    return Map<String, dynamic>.from(response.data);
  }

  Future<Map<String, dynamic>> bulkMove(List<int> ids, int folderId) async {
    final response = await _dioClient.dio.post(
      '${ApiConstants.attachments}/bulk-move',
      data: {
        'attachment_ids': ids,
        'folder_id': folderId,
      },
    );
    return Map<String, dynamic>.from(response.data);
  }
}
