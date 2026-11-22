import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class AppConfig {
  static const String envApiUrl = String.fromEnvironment('API_BASE_URL');

  /// Default API URL per platform saat development lokal:
  /// - Android Emulator mengakses host Mac lewat `10.0.2.2:4000`
  /// - iOS Simulator / macOS mengakses `localhost:4000`
  static String get defaultApiBaseUrl {
    if (envApiUrl.isNotEmpty) return _normalizeUrl(envApiUrl);
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:4000/api/v1';
    }
    return 'http://localhost:4000/api/v1';
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
