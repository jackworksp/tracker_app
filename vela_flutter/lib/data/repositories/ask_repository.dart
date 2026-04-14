import 'package:dio/dio.dart';

import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';

class AskRepository {
  final DioClient _dioClient;

  AskRepository(this._dioClient);

  Future<Response> chat(List<Map<String, dynamic>> messages,
      {String? mode, String? model}) async {
    final data = <String, dynamic>{
      'messages': messages,
    };
    if (mode != null) {
      data['mode'] = mode;
    }
    if (model != null) {
      data['model'] = model;
    }

    final response = await _dioClient.dio.post(
      ApiConstants.ask,
      data: data,
      options: Options(responseType: ResponseType.stream),
    );
    return response;
  }
}
