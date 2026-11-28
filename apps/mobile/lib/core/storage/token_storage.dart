import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class TokenStorage {
  TokenStorage({FlutterSecureStorage? secureStorage})
      : _secure = secureStorage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(
                accessibility: KeychainAccessibility.first_unlock,
              ),
            );

  static const _kAccessToken = 'tumpu_access_token';
  static const _kRefreshToken = 'tumpu_refresh_token';
  static const _kApiBaseUrl = 'tumpu_api_base_url';
  static const _kLastOutletCode = 'tumpu_last_outlet_code';

  final FlutterSecureStorage _secure;

  Future<String?> getAccessToken() => _secure.read(key: _kAccessToken);
  Future<String?> getRefreshToken() => _secure.read(key: _kRefreshToken);

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _secure.write(key: _kAccessToken, value: accessToken),
      _secure.write(key: _kRefreshToken, value: refreshToken),
    ]);
  }

  Future<void> clearTokens() async {
    await Future.wait([
      _secure.delete(key: _kAccessToken),
      _secure.delete(key: _kRefreshToken),
    ]);
  }

  Future<String> getApiBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_kApiBaseUrl);
    if (saved != null && saved.trim().isNotEmpty) {
      return AppConfig.normalizeApiUrl(saved);
    }
    return AppConfig.defaultApiBaseUrl;
  }

  Future<void> setApiBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kApiBaseUrl, AppConfig.normalizeApiUrl(url));
  }

  Future<String?> getLastOutletCode() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kLastOutletCode);
  }

  Future<void> setLastOutletCode(String code) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kLastOutletCode, code.trim().toUpperCase());
  }
}
