import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';

class GoalsRepository {
  final DioClient _dioClient;

  GoalsRepository(this._dioClient);

  Future<List<Map<String, dynamic>>> getAll() async {
    final response = await _dioClient.dio.get(ApiConstants.goals);
    final list = response.data as List;
    return list.map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> data) async {
    final response = await _dioClient.dio.post(ApiConstants.goals, data: data);
    return Map<String, dynamic>.from(response.data);
  }

  Future<Map<String, dynamic>> update(int id, Map<String, dynamic> data) async {
    final response = await _dioClient.dio.put('${ApiConstants.goals}/$id', data: data);
    return Map<String, dynamic>.from(response.data);
  }

  Future<void> delete(int id) async {
    await _dioClient.dio.delete('${ApiConstants.goals}/$id');
  }
}
