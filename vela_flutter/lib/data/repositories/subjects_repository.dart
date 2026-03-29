import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../models/subject.dart';

class SubjectsRepository {
  final DioClient _dioClient;

  SubjectsRepository(this._dioClient);

  Future<List<Subject>> getAll() async {
    final response = await _dioClient.dio.get(ApiConstants.subjects);
    final list = response.data['data'] as List;
    return list.map((json) => Subject.fromJson(json)).toList();
  }

  Future<Subject> getById(int id) async {
    final response = await _dioClient.dio.get('${ApiConstants.subjects}/$id');
    return Subject.fromJson(response.data);
  }

  Future<Subject> create(Map<String, dynamic> data) async {
    final response =
        await _dioClient.dio.post(ApiConstants.subjects, data: data);
    return Subject.fromJson(response.data);
  }

  Future<Subject> update(int id, Map<String, dynamic> data) async {
    final response =
        await _dioClient.dio.put('${ApiConstants.subjects}/$id', data: data);
    return Subject.fromJson(response.data);
  }

  Future<void> delete(int id) async {
    await _dioClient.dio.delete('${ApiConstants.subjects}/$id');
  }

  Future<void> seedTopics(int id) async {
    await _dioClient.dio.post('${ApiConstants.seedTopics}/$id');
  }
}
