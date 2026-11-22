import 'dart:async';
import 'package:dio/dio.dart';
import '../storage/token_storage.dart';

class ApiClient {
  ApiClient({required this.storage, this.onSessionExpired})
      : _dio = Dio(
          BaseOptions(
            connectTimeout: const Duration(seconds: 12),
            receiveTimeout: const Duration(seconds: 15),
            headers: {'Content-Type': 'application/json'},
          ),
        ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          if (options.baseUrl.isEmpty) {
            options.baseUrl = await storage.getApiBaseUrl();
          }
          final token = await storage.getAccessToken();
          if (token != null &&
              token.isNotEmpty &&
              options.extra['skipAuth'] != true) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final status = error.response?.statusCode;
          final alreadyRetried = error.requestOptions.extra['retried'] == true;
          final isAuthEndpoint =
              error.requestOptions.path.contains('/auth/login') ||
                  error.requestOptions.path.contains('/auth/pin-login') ||
                  error.requestOptions.path.contains('/auth/refresh');

          if (status == 401 && !alreadyRetried && !isAuthEndpoint) {
            final refreshed = await _refreshTokens();
            if (refreshed) {
              final newToken = await storage.getAccessToken();
              final retryOpts = error.requestOptions;
              retryOpts.extra['retried'] = true;
              retryOpts.headers['Authorization'] = 'Bearer $newToken';
              try {
                final response = await _dio.fetch(retryOpts);
                return handler.resolve(response);
              } on DioException catch (retryErr) {
                return handler.next(retryErr);
              }
            } else {
              await storage.clearTokens();
              onSessionExpired?.call();
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  final TokenStorage storage;
  final void Function()? onSessionExpired;
  final Dio _dio;
  Completer<bool>? _refreshCompleter;

  Dio get dio => _dio;

  Future<bool> _refreshTokens() async {
    if (_refreshCompleter != null) {
      return _refreshCompleter!.future;
    }
    _refreshCompleter = Completer<bool>();
    try {
      final refreshToken = await storage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        _refreshCompleter!.complete(false);
        return false;
      }
      final baseUrl = await storage.getApiBaseUrl();
      final res = await Dio(BaseOptions(baseUrl: baseUrl)).post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      final data = res.data;
      if (data != null &&
          data['accessToken'] is String &&
          data['refreshToken'] is String) {
        await storage.saveTokens(
          accessToken: data['accessToken'] as String,
          refreshToken: data['refreshToken'] as String,
        );
        _refreshCompleter!.complete(true);
        return true;
      }
      _refreshCompleter!.complete(false);
      return false;
    } catch (_) {
      _refreshCompleter!.complete(false);
      return false;
    } finally {
      _refreshCompleter = null;
    }
  }

  static String extractErrorMessage(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map && data['message'] != null) {
        return data['message'].toString();
      }
      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.connectionError) {
        return 'Tidak dapat terhubung ke server Kassa POS. Periksa koneksi atau URL API.';
      }
      return error.message ?? 'Terjadi kesalahan jaringan';
    }
    return error.toString();
  }
}
