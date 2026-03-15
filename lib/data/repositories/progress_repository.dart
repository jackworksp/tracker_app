import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../models/study_session.dart';

class ProgressRepository {
  final DioClient _dioClient;

  ProgressRepository(this._dioClient);

  List _extractList(dynamic data, [String? key]) {
    if (data is List) return data;
    if (data is Map) {
      if (key != null && data[key] is List) return data[key] as List;
      if (data['data'] is List) return data['data'] as List;
      // If key was specified but not found, don't silently fallback
      if (key != null) return [];
    }
    return [];
  }

  Future<List<StudySession>> getSessions(int subjectId, {Map<String, dynamic>? filters}) async {
    final params = <String, dynamic>{'subject_id': subjectId, ...?filters};
    final response = await _dioClient.dio.get(
      ApiConstants.sessions,
      queryParameters: params,
    );
    final list = _extractList(response.data, 'sessions');
    return list.map((json) => StudySession.fromJson(json)).toList();
  }

  Future<List<Map<String, dynamic>>> getTopics(int subjectId) async {
    final response = await _dioClient.dio.get(
      ApiConstants.topics,
      queryParameters: {'subject_id': subjectId},
    );
    final list = _extractList(response.data, 'topics');
    return list.map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<Map<String, dynamic>> getStats(int subjectId) async {
    final response = await _dioClient.dio.get(
      '${ApiConstants.progress}/$subjectId',
    );
    return Map<String, dynamic>.from(response.data);
  }

  dynamic _extractObject(dynamic data) {
    if (data is Map && data.containsKey('data') && data['data'] is Map) {
      return data['data'];
    }
    return data;
  }

  Future<StudySession> createSession(Map<String, dynamic> data) async {
    final response = await _dioClient.dio.post(ApiConstants.sessions, data: data);
    return StudySession.fromJson(_extractObject(response.data));
  }

  Future<StudySession> updateSession(int id, Map<String, dynamic> data) async {
    final response = await _dioClient.dio.put('${ApiConstants.sessions}/$id', data: data);
    return StudySession.fromJson(_extractObject(response.data));
  }

  Future<void> deleteSession(int id) async {
    await _dioClient.dio.delete('${ApiConstants.sessions}/$id');
  }
}
