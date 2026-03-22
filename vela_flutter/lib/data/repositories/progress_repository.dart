import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../models/study_session.dart';

class ProgressRepository {
  final DioClient _dioClient;

  ProgressRepository(this._dioClient);

  /// Fetches all progress data for a subject in a single request.
  ///
  /// Backend route: GET /api/progress/:subject_id
  /// Response shape: { sessions: [...], topics: [...], revisionItems: [...], pagination: {...} }
  ///
  /// This is NOT a standard paginated { "data": [...] } envelope — sessions and
  /// topics are top-level keys. Both getSessions() and getTopics() previously
  /// called non-existent sub-routes (/progress/sessions, /progress/topics) and
  /// tried to cast response.data directly as List, causing load failures.
  Future<Map<String, dynamic>> getProgress(
    int subjectId, {
    Map<String, dynamic>? filters,
  }) async {
    final params = <String, dynamic>{...?filters};
    final response = await _dioClient.dio.get(
      '${ApiConstants.progress}/$subjectId',
      queryParameters: params.isEmpty ? null : params,
    );
    return Map<String, dynamic>.from(response.data as Map);
  }

  /// Convenience wrapper — extracts sessions from the progress response.
  Future<List<StudySession>> getSessions(
    int subjectId, {
    Map<String, dynamic>? filters,
  }) async {
    final data = await getProgress(subjectId, filters: filters);
    final list = data['sessions'] as List;
    return list.map((json) => StudySession.fromJson(json)).toList();
  }

  /// Convenience wrapper — extracts topics from the progress response.
  Future<List<Map<String, dynamic>>> getTopics(int subjectId) async {
    final data = await getProgress(subjectId);
    final list = data['topics'] as List;
    return list.map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<Map<String, dynamic>> getStats(int subjectId) async {
    final data = await getProgress(subjectId);
    // Return pagination + aggregate counts that callers use for stats display.
    return data;
  }

  Future<StudySession> reviseSession(int id) async {
    final response = await _dioClient.dio.post('${ApiConstants.sessions}/$id/revise');
    return StudySession.fromJson(response.data);
  }

  Future<StudySession> createSession(Map<String, dynamic> data) async {
    final response = await _dioClient.dio.post(ApiConstants.sessions, data: data);
    return StudySession.fromJson(response.data);
  }

  Future<StudySession> updateSession(int id, Map<String, dynamic> data) async {
    final response = await _dioClient.dio.put('${ApiConstants.sessions}/$id', data: data);
    return StudySession.fromJson(response.data);
  }

  Future<void> deleteSession(int id) async {
    await _dioClient.dio.delete('${ApiConstants.sessions}/$id');
  }
}
