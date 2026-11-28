import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'network/api_client.dart';
import 'network/socket_service.dart';
import 'rbac/rbac.dart';
import 'storage/token_storage.dart';
import 'theme/cadra_theme.dart';

final tokenStorageProvider = Provider<TokenStorage>((ref) => TokenStorage());

final themeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.light);
final cadraAccentProvider =
    StateProvider<CadraAccent>((ref) => CadraAccent.ocean);

class RegisterResult {
  const RegisterResult({
    required this.email,
    required this.message,
    this.outletCode,
    this.devVerifyUrl,
  });

  final String email;
  final String message;
  final String? outletCode;
  final String? devVerifyUrl;
}

class AuthState {
  const AuthState({
    this.user,
    this.isInitialized = false,
    this.isLoading = false,
    this.error,
    this.errorCode,
    this.retryAfterSec,
  });

  final AuthUser? user;
  final bool isInitialized;
  final bool isLoading;
  final String? error;
  final String? errorCode;
  final int? retryAfterSec;

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    AuthUser? user,
    bool clearUser = false,
    bool? isInitialized,
    bool? isLoading,
    String? error,
    String? errorCode,
    int? retryAfterSec,
    bool clearError = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isInitialized: isInitialized ?? this.isInitialized,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      errorCode: clearError ? null : (errorCode ?? this.errorCode),
      retryAfterSec: clearError ? null : (retryAfterSec ?? this.retryAfterSec),
    );
  }
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._storage) : super(const AuthState()) {
    _api = ApiClient(
      storage: _storage,
      onSessionExpired: () {
        state = state.copyWith(clearUser: true, isInitialized: true);
      },
    );
  }

  final TokenStorage _storage;
  late final ApiClient _api;

  ApiClient get api => _api;

  Future<void> bootstrap() async {
    final token = await _storage.getAccessToken();
    if (token == null || token.isEmpty) {
      state = state.copyWith(isInitialized: true, clearUser: true);
      return;
    }
    try {
      final res = await _api.dio.get<Map<String, dynamic>>('/auth/me');
      final userJson = res.data?['user'];
      if (userJson is Map<String, dynamic>) {
        state = state.copyWith(
          user: AuthUser.fromJson(userJson),
          isInitialized: true,
          clearError: true,
        );
        return;
      }
    } catch (_) {
      await _storage.clearTokens();
    }
    state = state.copyWith(isInitialized: true, clearUser: true);
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  Future<bool> loginEmail({
    required String email,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final res = await _api.dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'email': email.trim(), 'password': password},
      );
      return await _handleAuthResponse(res.data);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ApiClient.extractErrorMessage(e),
        errorCode: ApiClient.extractErrorCode(e),
        retryAfterSec: ApiClient.extractRetryAfterSec(e),
      );
      return false;
    }
  }

  Future<bool> loginPin({
    required String outletCode,
    required String pin,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _storage.setLastOutletCode(outletCode);
      final res = await _api.dio.post<Map<String, dynamic>>(
        '/auth/pin-login',
        data: {
          'outletCode': outletCode.trim().toUpperCase(),
          'pin': pin.trim(),
        },
      );
      return await _handleAuthResponse(res.data);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ApiClient.extractErrorMessage(e),
        errorCode: ApiClient.extractErrorCode(e),
        retryAfterSec: ApiClient.extractRetryAfterSec(e),
      );
      return false;
    }
  }

  Future<({RegisterResult? result, String? error})> registerOwner({
    required String businessName,
    String? outletName,
    required String ownerName,
    required String email,
    required String password,
  }) async {
    try {
      final res = await _api.dio.post<Map<String, dynamic>>(
        '/auth/register',
        data: {
          'businessName': businessName.trim(),
          if (outletName != null && outletName.trim().isNotEmpty)
            'outletName': outletName.trim(),
          'ownerName': ownerName.trim(),
          'email': email.trim().toLowerCase(),
          'password': password,
        },
      );
      final data = res.data ?? const <String, dynamic>{};
      final outletCode = data['outletCode']?.toString();
      if (outletCode != null && outletCode.isNotEmpty) {
        await _storage.setLastOutletCode(outletCode);
      }
      return (
        result: RegisterResult(
          email: (data['email'] ?? email.trim().toLowerCase()).toString(),
          message: (data['message'] ??
                  'Pendaftaran berhasil! Cek email Anda untuk konfirmasi.')
              .toString(),
          outletCode: outletCode,
          devVerifyUrl: data['devVerifyUrl']?.toString(),
        ),
        error: null,
      );
    } catch (e) {
      return (result: null, error: ApiClient.extractErrorMessage(e));
    }
  }

  Future<({String? message, String? devVerifyUrl, String? error})>
      resendVerificationEmail(String email) async {
    try {
      final res = await _api.dio.post<Map<String, dynamic>>(
        '/auth/resend-verification',
        data: {'email': email.trim().toLowerCase()},
      );
      final data = res.data ?? const <String, dynamic>{};
      return (
        message: (data['message'] ?? 'Email konfirmasi telah dikirim ulang!')
            .toString(),
        devVerifyUrl: data['devVerifyUrl']?.toString(),
        error: null,
      );
    } catch (e) {
      return (
        message: null,
        devVerifyUrl: null,
        error: ApiClient.extractErrorMessage(e),
      );
    }
  }

  /// Verifikasi email memakai raw token atau full URL (`/verify-email?token=...`).
  Future<({bool ok, String? error})> verifyEmailToken(String tokenOrUrl) async {
    var token = tokenOrUrl.trim();
    final uri = Uri.tryParse(token);
    if (uri != null && uri.queryParameters['token'] != null) {
      token = uri.queryParameters['token']!.trim();
    }
    if (token.isEmpty) {
      return (ok: false, error: 'Token verifikasi tidak valid');
    }
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final res = await _api.dio.post<Map<String, dynamic>>(
        '/auth/verify-email',
        data: {'token': token},
      );
      final ok = await _handleAuthResponse(res.data);
      return (ok: ok, error: ok ? null : 'Verifikasi gagal');
    } catch (e) {
      final msg = ApiClient.extractErrorMessage(e);
      state = state.copyWith(isLoading: false, error: msg);
      return (ok: false, error: msg);
    }
  }

  Future<bool> _handleAuthResponse(Map<String, dynamic>? data) async {
    if (data == null ||
        data['accessToken'] is! String ||
        data['refreshToken'] is! String ||
        data['user'] is! Map<String, dynamic>) {
      state = state.copyWith(
        isLoading: false,
        error: 'Respons server tidak valid',
      );
      return false;
    }

    await _storage.saveTokens(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
    );
    final user = AuthUser.fromJson(data['user'] as Map<String, dynamic>);
    if (user.outletCode != null && user.outletCode!.isNotEmpty) {
      await _storage.setLastOutletCode(user.outletCode!);
    }
    state = state.copyWith(
      user: user,
      isInitialized: true,
      isLoading: false,
      clearError: true,
    );
    return true;
  }

  Future<void> logout() async {
    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken != null && refreshToken.isNotEmpty) {
        await _api.dio.post(
          '/auth/logout',
          data: {'refreshToken': refreshToken},
        );
      }
    } catch (_) {
      // Abaikan error network saat logout lokal
    } finally {
      await _storage.clearTokens();
      state = const AuthState(isInitialized: true);
    }
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  final storage = ref.watch(tokenStorageProvider);
  final controller = AuthController(storage);
  controller.bootstrap();
  return controller;
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ref.watch(authControllerProvider.notifier).api;
});

final socketServiceProvider = Provider<TumpuSocketService>((ref) {
  final storage = ref.watch(tokenStorageProvider);
  final service = TumpuSocketService(storage);
  ref.onDispose(service.dispose);
  return service;
});
