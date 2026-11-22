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

class AuthState {
  const AuthState({
    this.user,
    this.isInitialized = false,
    this.isLoading = false,
    this.error,
  });

  final AuthUser? user;
  final bool isInitialized;
  final bool isLoading;
  final String? error;

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    AuthUser? user,
    bool clearUser = false,
    bool? isInitialized,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isInitialized: isInitialized ?? this.isInitialized,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
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
      );
      return false;
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

final socketServiceProvider = Provider<KassaSocketService>((ref) {
  final storage = ref.watch(tokenStorageProvider);
  final service = KassaSocketService(storage);
  ref.onDispose(service.dispose);
  return service;
});
