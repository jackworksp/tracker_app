import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../storage/secure_storage.dart';
// Issue 06: specific, actionable error messages
import '../utils/error_messages.dart';

class DioClient {
  late final Dio _dio;
  final SecureStorage _secureStorage;

  DioClient(this._secureStorage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.apiBaseUrl,
        connectTimeout: ApiConstants.requestTimeout,
        receiveTimeout: ApiConstants.requestTimeout,
        sendTimeout: ApiConstants.requestTimeout,
        headers: {
          'Content-Type': 'application/json',
        },
      ),
    );

    _dio.interceptors.addAll([
      AuthInterceptor(_secureStorage),
      ErrorInterceptor(),
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        logPrint: (obj) => print('[DIO] $obj'),
      ),
    ]);
  }

  Dio get dio => _dio;
}

class AuthInterceptor extends Interceptor {
  final SecureStorage _secureStorage;

  AuthInterceptor(this._secureStorage);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _secureStorage.getToken()
        .timeout(const Duration(seconds: 3), onTimeout: () => null);
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
}

// Issue 06: ErrorInterceptor now maps Dio exceptions to specific, actionable
// messages defined in ErrorMessages so every screen gets consistent copy.
class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    String message;
    switch (err.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        message = ErrorMessages.timeoutError;
        break;
      case DioExceptionType.badResponse:
        final statusCode = err.response?.statusCode;
        final data = err.response?.data;
        if (data is Map && data.containsKey('error')) {
          // Use the server-provided message if it looks specific
          final raw = data['error'] as String;
          message = ErrorMessages.fromDioMessage(raw);
        } else if (statusCode == 401) {
          message = ErrorMessages.sessionExpired;
        } else if (statusCode != null && statusCode >= 500) {
          message = ErrorMessages.serverError;
        } else {
          message = ErrorMessages.serverError;
        }
        break;
      case DioExceptionType.connectionError:
        message = ErrorMessages.networkError;
        break;
      default:
        message = ErrorMessages.serverError;
    }

    handler.next(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        type: err.type,
        error: message,
        message: message,
      ),
    );
  }
}
