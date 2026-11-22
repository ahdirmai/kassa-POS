import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

enum CadraAccent { ocean, sage, coral, amber, mono }

class CadraPalette {
  const CadraPalette({
    required this.bg,
    required this.surface,
    required this.raised,
    required this.glass,
    required this.rim,
    required this.line,
    required this.text,
    required this.muted,
    required this.faint,
    required this.ink,
    required this.onInk,
    required this.accent,
    required this.onAccent,
    required this.iris,
    required this.good,
    required this.warn,
    required this.bad,
  });

  final Color bg;
  final Color surface;
  final Color raised;
  final Color glass;
  final Color rim;
  final Color line;
  final Color text;
  final Color muted;
  final Color faint;
  final Color ink;
  final Color onInk;
  final Color accent;
  final Color onAccent;
  final Color iris;
  final Color good;
  final Color warn;
  final Color bad;
}

/// Port langsung dari `apps/web/src/styles/tokens.css` (Light + Dark + 5 Accent).
class CadraTheme {
  static const double rCard = 24;
  static const double rTile = 16;
  static const double rCtl = 999;

  static CadraPalette palette(Brightness brightness, CadraAccent accent) {
    final isDark = brightness == Brightness.dark;
    final (accentColor, onAccentColor, irisColor) = switch ((isDark, accent)) {
      (false, CadraAccent.ocean) => (
          const Color(0xFFBCD4F2),
          const Color(0xFF0F1F33),
          const Color(0xFF2563A8),
        ),
      (true, CadraAccent.ocean) => (
          const Color(0xFF24476E),
          const Color(0xFFEEF5FC),
          const Color(0xFF6AA6E8),
        ),
      (false, CadraAccent.sage) => (
          const Color(0xFFB9DFCF),
          const Color(0xFF0F2A20),
          const Color(0xFF23795A),
        ),
      (true, CadraAccent.sage) => (
          const Color(0xFF24584A),
          const Color(0xFFEEFAF5),
          const Color(0xFF5CC5A0),
        ),
      (false, CadraAccent.coral) => (
          const Color(0xFFF4C6BB),
          const Color(0xFF3A1610),
          const Color(0xFFB8482A),
        ),
      (true, CadraAccent.coral) => (
          const Color(0xFF7A3527),
          const Color(0xFFFFF2EE),
          const Color(0xFFF08A6A),
        ),
      (false, CadraAccent.amber) => (
          const Color(0xFFF1DC9F),
          const Color(0xFF2E2205),
          const Color(0xFF976806),
        ),
      (true, CadraAccent.amber) => (
          const Color(0xFF6B4F12),
          const Color(0xFFFFF8E6),
          const Color(0xFFE2AD45),
        ),
      (false, CadraAccent.mono) => (
          const Color(0xFFDCDCD8),
          const Color(0xFF111111),
          const Color(0xFF2B2B2A),
        ),
      (true, CadraAccent.mono) => (
          const Color(0xFF2C2C2B),
          const Color(0xFFF2F2F0),
          const Color(0xFFD6D6D3),
        ),
    };

    if (isDark) {
      return CadraPalette(
        bg: const Color(0xFF0B0B0B),
        surface: const Color(0xFF151515),
        raised: const Color(0xFF1C1C1C),
        glass: const Color(0x14FFFFFF),
        rim: const Color(0x1EFFFFFF),
        line: const Color(0x20FFFFFF),
        text: const Color(0xFFF2F2F0),
        muted: const Color(0xFFA8A8A5),
        faint: const Color(0xFF8A8A86),
        ink: const Color(0xFFF2F2F0),
        onInk: const Color(0xFF111111),
        accent: accentColor,
        onAccent: onAccentColor,
        iris: irisColor,
        good: const Color(0xFF5CC58B),
        warn: const Color(0xFFE2AD45),
        bad: const Color(0xFFEF7B87),
      );
    }

    return CadraPalette(
      bg: const Color(0xFFEFEFEC),
      surface: const Color(0xFFF8F8F6),
      raised: const Color(0xFFFCFCFB),
      glass: const Color(0xB3FFFFFF),
      rim: const Color(0xCCFFFFFF),
      line: const Color(0x1A111111),
      text: const Color(0xFF111111),
      muted: const Color(0xFF5C5C5A),
      faint: const Color(0xFF73736F),
      ink: const Color(0xFF111111),
      onInk: const Color(0xFFF7F7F5),
      accent: accentColor,
      onAccent: onAccentColor,
      iris: irisColor,
      good: const Color(0xFF237A48),
      warn: const Color(0xFF8F6000),
      bad: const Color(0xFFBF3644),
    );
  }

  static ThemeData build(Brightness brightness, CadraAccent accent) {
    final p = palette(brightness, accent);
    final baseText = GoogleFonts.urbanistTextTheme(
      brightness == Brightness.dark
          ? ThemeData.dark().textTheme
          : ThemeData.light().textTheme,
    ).apply(
      bodyColor: p.text,
      displayColor: p.text,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: p.bg,
      textTheme: baseText,
      colorScheme: ColorScheme(
        brightness: brightness,
        primary: p.ink,
        onPrimary: p.onInk,
        secondary: p.accent,
        onSecondary: p.onAccent,
        error: p.bad,
        onError: Colors.white,
        surface: p.surface,
        onSurface: p.text,
        outline: p.line,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: p.bg,
        foregroundColor: p.text,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: baseText.titleLarge?.copyWith(
          fontWeight: FontWeight.w700,
          color: p.text,
        ),
      ),
      cardTheme: CardThemeData(
        color: p.raised,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(rCard),
          side: BorderSide(color: p.line),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: p.raised,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: p.line),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: p.line),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: p.iris, width: 1.5),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: p.ink,
          foregroundColor: p.onInk,
          minimumSize: const Size(44, 48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(rCtl),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: p.text,
          minimumSize: const Size(44, 48),
          side: BorderSide(color: p.line),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(rCtl),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(rCtl),
        ),
        side: BorderSide(color: p.line),
      ),
    );
  }

  static const TextStyle tabularStyle = TextStyle(
    fontFeatures: [FontFeature.tabularFigures()],
  );
}
