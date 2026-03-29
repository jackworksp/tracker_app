import 'dart:io';
import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../../core/utils/error_messages.dart';
import '../models/user.dart';

class AuthRepository {
  final DioClient _dioClient;

  // Separate Dio for auth calls (no token injection)
  late final Dio _authDio;

  AuthRepository(this._dioClient, {Dio? authDio}) {
    _authDio = authDio ??
        Dio(
          BaseOptions(
            baseUrl: ApiConstants.apiBaseUrl,
            connectTimeout: ApiConstants.requestTimeout,
            receiveTimeout: ApiConstants.requestTimeout,
            headers: {'Content-Type': 'application/json'},
          ),
        );
  }

  Future<({String token, User user})> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _authDio.post(
        ApiConstants.login,
        data: {'email': email, 'password': password},
      );
      final data = response.data;
      return (
        token: data['token'] as String,
        user: User.fromJson(data['user']),
      );
    } on DioException catch (e) {
      throw DioException(
        requestOptions: e.requestOptions,
        response: e.response,
        type: e.type,
        error: ErrorMessages.fromDioMessage(_extractError(e)),
        message: ErrorMessages.fromDioMessage(_extractError(e)),
      );
    }
  }

  Future<({String token, User user})> signup({
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      final response = await _authDio.post(
        ApiConstants.signup,
        data: {'name': name, 'email': email, 'password': password},
      );
      final data = response.data;
      return (
        token: data['token'] as String,
        user: User.fromJson(data['user']),
      );
    } on DioException catch (e) {
      throw DioException(
        requestOptions: e.requestOptions,
        response: e.response,
        type: e.type,
        error: ErrorMessages.fromDioMessage(_extractError(e)),
        message: ErrorMessages.fromDioMessage(_extractError(e)),
      );
    }
  }

  Future<User> getCurrentUser() async {
    final response = await _dioClient.dio.get(ApiConstants.me);
    return User.fromJson(response.data);
  }

  Future<String> uploadProfilePhoto(File file) async {
    final formData = FormData.fromMap({
      'photo': await MultipartFile.fromFile(file.path),
    });
    final response = await _dioClient.dio.post(
      ApiConstants.uploadPhoto,
      data: formData,
    );
    return response.data['url'] as String;
  }

  Future<String?> getMcpKey() async {
    final response = await _dioClient.dio.get(ApiConstants.mcpKey);
    return response.data['mcp_api_key'] as String?;
  }

  Future<String> regenerateMcpKey() async {
    final response = await _dioClient.dio.post(ApiConstants.regenerateMcpKey);
    return response.data['mcp_api_key'] as String;
  }

  String? _extractError(DioException e) {
    final data = e.response?.data;
    if (data is Map && data['error'] is String) {
      return data['error'] as String;
    }
    return e.message;
  }
}
