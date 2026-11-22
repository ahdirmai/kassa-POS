import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/providers.dart';
import 'core/theme/cadra_theme.dart';
import 'features/auth/login_screen.dart';
import 'features/home/home_shell.dart';

class KassaPosApp extends ConsumerWidget {
  const KassaPosApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final accent = ref.watch(cadraAccentProvider);
    final authState = ref.watch(authControllerProvider);

    return MaterialApp(
      title: 'Kassa POS',
      debugShowCheckedModeBanner: false,
      themeMode: themeMode,
      theme: CadraTheme.build(Brightness.light, accent),
      darkTheme: CadraTheme.build(Brightness.dark, accent),
      home: !authState.isInitialized
          ? Scaffold(
              body: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(18),
                      child: Image.asset(
                        'assets/branding/kassa-icon-dark.png',
                        width: 72,
                        height: 72,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2.5),
                    ),
                  ],
                ),
              ),
            )
          : authState.isAuthenticated
              ? const HomeShell()
              : const LoginScreen(),
    );
  }
}
