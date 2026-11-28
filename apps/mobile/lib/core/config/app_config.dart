import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb, kReleaseMode;

class AppConfig {
  static const String envApiUrl = String.fromEnvironment('API_BASE_URL');
  static const String productionApiBaseUrl = 'https://app-api.tumpu.biz.id/api/v1';

  /// Default API URL per build mode & platform:
  /// - Release build selalu mengarah ke HTTPS produksi (`app-api.tumpu.biz.id`)
  /// - Debug Android Emulator mengakses host Mac lewat `10.0.2.2:4000`
  /// - Debug iOS Simulator / macOS mengakses `localhost:4000`
  static String get defaultApiBaseUrl {
    if (envApiUrl.isNotEmpty) return _normalizeUrl(envApiUrl);
    if (kReleaseMode) return productionApiBaseUrl;
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:4000/api/v1';
    }
    return 'http://localhost:4000/api/v1';
  }

  /// Di build Release, hanya izinkan endpoint HTTPS untuk mencegah downgrade MITM.
  static bool isAllowedApiUrl(String raw) {
    final uri = Uri.tryParse(_normalizeUrl(raw));
    if (uri == null || !uri.hasScheme || uri.host.isEmpty) return false;
    if (kReleaseMode) {
      return uri.scheme == 'https';
    }
    return uri.scheme == 'https' || uri.scheme == 'http';
  }

  /// Derive Socket.IO origin dari API Base URL (menghapus suffix `/api/v1`).
  static String socketOriginFromApiUrl(String apiBaseUrl) {
    final normalized = _normalizeUrl(apiBaseUrl);
    if (normalized.endsWith('/api/v1')) {
      return normalized.substring(0, normalized.length - '/api/v1'.length);
    }
    return normalized;
  }

  static String normalizeApiUrl(String raw) => _normalizeUrl(raw);

  static String _normalizeUrl(String raw) {
    var trimmed = raw.trim();
    while (trimmed.endsWith('/')) {
      trimmed = trimmed.substring(0, trimmed.length - 1);
    }
    return trimmed;
  }
}
