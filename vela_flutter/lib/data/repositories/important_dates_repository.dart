import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../models/important_date.dart';

class ImportantDatesRepository {
  final DioClient _dioClient;

  ImportantDatesRepository(this._dioClient);

  Future<List<ImportantDate>> getAll() async {
    final response = await _dioClient.dio.get(ApiConstants.importantDates);
    final list = response.data as List;
    return list.map((json) => ImportantDate.fromJson(json)).toList();
  }

  Future<ImportantDate> create(Map<String, dynamic> data) async {
    final response =
        await _dioClient.dio.post(ApiConstants.importantDates, data: data);
    return ImportantDate.fromJson(response.data);
  }

  Future<ImportantDate> update(int id, Map<String, dynamic> data) async {
    final response = await _dioClient.dio.put(
      '${ApiConstants.importantDates}/$id',
      data: data,
    );
    return ImportantDate.fromJson(response.data);
  }

  Future<void> delete(int id) async {
    await _dioClient.dio.delete('${ApiConstants.importantDates}/$id');
  }
}
