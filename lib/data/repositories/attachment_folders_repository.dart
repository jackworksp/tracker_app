import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';

class AttachmentFoldersRepository {
  final DioClient _dioClient;

  AttachmentFoldersRepository(this._dioClient);

  dynamic _extractData(dynamic data) {
    if (data is Map && data.containsKey('data')) return data['data'];
    return data;
  }

  Future<List<Map<String, dynamic>>> getAll() async {
    final response = await _dioClient.dio.get(ApiConstants.attachmentFolders);
    final extracted = _extractData(response.data);
    final list = (extracted is List) ? extracted : <dynamic>[];
    return list.map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<Map<String, dynamic>> get(int id) async {
    final response = await _dioClient.dio.get('${ApiConstants.attachmentFolders}/$id');
    return Map<String, dynamic>.from(_extractData(response.data));
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> data) async {
    final response = await _dioClient.dio.post(ApiConstants.attachmentFolders, data: data);
    return Map<String, dynamic>.from(_extractData(response.data));
  }

  Future<Map<String, dynamic>> update(int id, Map<String, dynamic> data) async {
    final response = await _dioClient.dio.put('${ApiConstants.attachmentFolders}/$id', data: data);
    return Map<String, dynamic>.from(_extractData(response.data));
  }

  Future<void> delete(int id) async {
    await _dioClient.dio.delete('${ApiConstants.attachmentFolders}/$id');
  }
}
