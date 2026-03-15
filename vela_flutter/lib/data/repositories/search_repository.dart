import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';

class SearchRepository {
  final DioClient _dioClient;

  SearchRepository(this._dioClient);

  Future<Map<String, dynamic>> search(String query, {String type = 'all'}) async {
    final response = await _dioClient.dio.get(
      ApiConstants.search,
      queryParameters: {
        'q': query,
        'type': type,
      },
    );
    return Map<String, dynamic>.from(response.data);
  }
}
