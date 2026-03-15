import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';

class NoteFoldersRepository {
  final DioClient _dioClient;

  NoteFoldersRepository(this._dioClient);

  List _extractList(dynamic data) {
    if (data is List) return data;
    if (data is Map) return (data['data'] as List?) ?? [];
    return [];
  }

  Future<List<Map<String, dynamic>>> getAll() async {
    final response = await _dioClient.dio.get(ApiConstants.noteFolders);
    final list = _extractList(response.data);
    return list.map((e) => Map<String, dynamic>.from(e)).toList();
  }

  dynamic _extractObject(dynamic data) {
    if (data is Map && data.containsKey('data') && data['data'] is Map) {
      return data['data'];
    }
    return data;
  }

  Future<Map<String, dynamic>> get(int id) async {
    final response = await _dioClient.dio.get('${ApiConstants.noteFolders}/$id');
    return Map<String, dynamic>.from(_extractObject(response.data));
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> data) async {
    final response = await _dioClient.dio.post(ApiConstants.noteFolders, data: data);
    return Map<String, dynamic>.from(_extractObject(response.data));
  }

  Future<Map<String, dynamic>> update(int id, Map<String, dynamic> data) async {
    final response = await _dioClient.dio.put('${ApiConstants.noteFolders}/$id', data: data);
    return Map<String, dynamic>.from(_extractObject(response.data));
  }

  Future<void> delete(int id) async {
    await _dioClient.dio.delete('${ApiConstants.noteFolders}/$id');
  }
}
