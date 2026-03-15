import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../models/task.dart';

class TasksRepository {
  final DioClient _dioClient;

  TasksRepository(this._dioClient);

  Future<List<Task>> getAll({Map<String, dynamic>? filters}) async {
    final response = await _dioClient.dio.get(
      ApiConstants.tasks,
      queryParameters: filters,
    );
    final list = response.data as List;
    return list.map((json) => Task.fromJson(json)).toList();
  }

  Future<List<Task>> getBySubject(int subjectId, {Map<String, dynamic>? filters}) async {
    final response = await _dioClient.dio.get(
      '${ApiConstants.tasks}/$subjectId',
      queryParameters: filters,
    );
    final list = response.data as List;
    return list.map((json) => Task.fromJson(json)).toList();
  }

  Future<Task> create(Map<String, dynamic> data) async {
    final response = await _dioClient.dio.post(ApiConstants.tasks, data: data);
    return Task.fromJson(response.data);
  }

  Future<Task> update(int id, Map<String, dynamic> data) async {
    final response = await _dioClient.dio.put('${ApiConstants.tasks}/$id', data: data);
    return Task.fromJson(response.data);
  }

  Future<void> delete(int id) async {
    await _dioClient.dio.delete('${ApiConstants.tasks}/$id');
  }

  Future<Task> setReminder(int id, Map<String, dynamic> data) async {
    final response = await _dioClient.dio.put(
      '${ApiConstants.tasks}/$id/reminder',
      data: data,
    );
    return Task.fromJson(response.data);
  }

  Future<Task> snoozeReminder(int id, int minutes) async {
    final response = await _dioClient.dio.post(
      '${ApiConstants.tasks}/$id/reminder/snooze',
      data: {'snooze_minutes': minutes},
    );
    return Task.fromJson(response.data);
  }

  Future<Task> dismissReminder(int id) async {
    final response = await _dioClient.dio.post(
      '${ApiConstants.tasks}/$id/reminder/dismiss',
    );
    return Task.fromJson(response.data);
  }

  Future<void> removeReminder(int id) async {
    await _dioClient.dio.delete('${ApiConstants.tasks}/$id/reminder');
  }

  Future<List<Task>> getPendingReminders() async {
    final response = await _dioClient.dio.get('${ApiConstants.tasks}/reminders/pending');
    final list = response.data as List;
    return list.map((json) => Task.fromJson(json)).toList();
  }

  Future<List<Task>> getSubtasks(int taskId) async {
    final response = await _dioClient.dio.get('${ApiConstants.tasks}/$taskId/subtasks');
    final list = response.data as List;
    return list.map((json) => Task.fromJson(json)).toList();
  }

  Future<Task> convertToSubtask(int taskId, int parentId) async {
    final response = await _dioClient.dio.put(
      '${ApiConstants.tasks}/$taskId/convert-to-subtask',
      data: {'parent_task_id': parentId},
    );
    return Task.fromJson(response.data);
  }

  Future<Task> removeFromSubtask(int taskId) async {
    final response = await _dioClient.dio.put(
      '${ApiConstants.tasks}/$taskId/remove-from-subtask',
    );
    return Task.fromJson(response.data);
  }
}
