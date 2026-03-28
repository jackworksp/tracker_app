import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';

class RoutinesRepository {
  final DioClient _dioClient;

  RoutinesRepository(this._dioClient);

  Future<List<Map<String, dynamic>>> getAll() async {
    final response = await _dioClient.dio.get(ApiConstants.routines);
    final list = response.data as List;
    return list.map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> data) async {
    final response =
        await _dioClient.dio.post(ApiConstants.routines, data: data);
    return Map<String, dynamic>.from(response.data);
  }

  Future<Map<String, dynamic>> update(int id, Map<String, dynamic> data) async {
    final response =
        await _dioClient.dio.put('${ApiConstants.routines}/$id', data: data);
    return Map<String, dynamic>.from(response.data);
  }

  Future<void> delete(int id) async {
    await _dioClient.dio.delete('${ApiConstants.routines}/$id');
  }

  Future<void> completeToday(int id) async {
    await _dioClient.dio.post('${ApiConstants.routines}/$id/complete');
  }

  Future<void> uncompleteToday(int id) async {
    await _dioClient.dio.delete('${ApiConstants.routines}/$id/complete');
  }
}
