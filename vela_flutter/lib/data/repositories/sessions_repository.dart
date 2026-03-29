import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../models/study_session.dart';

class SessionsRepository {
  final DioClient _dioClient;

  SessionsRepository(this._dioClient);

  Future<Map<String, dynamic>> getBySubject(int subjectId,
      {Map<String, dynamic>? filters}) async {
    final response = await _dioClient.dio.get(
      '${ApiConstants.progress}/$subjectId',
      queryParameters: filters,
    );
    return Map<String, dynamic>.from(response.data);
  }

  Future<Map<String, dynamic>> getAllSessions(
      {Map<String, dynamic>? filters}) async {
    final response = await _dioClient.dio.get(
      '${ApiConstants.progress}/all',
      queryParameters: filters,
    );
    return Map<String, dynamic>.from(response.data);
  }

  Future<StudySession> create(Map<String, dynamic> data) async {
    final response =
        await _dioClient.dio.post(ApiConstants.sessions, data: data);
    return StudySession.fromJson(response.data);
  }

  Future<StudySession> update(int id, Map<String, dynamic> data) async {
    final response =
        await _dioClient.dio.put('${ApiConstants.sessions}/$id', data: data);
    return StudySession.fromJson(response.data);
  }

  Future<void> delete(int id) async {
    await _dioClient.dio.delete('${ApiConstants.sessions}/$id');
  }

  Future<StudySession> incrementRevision(int id) async {
    final response =
        await _dioClient.dio.post('${ApiConstants.sessions}/$id/revise');
    return StudySession.fromJson(response.data);
  }
}
