import 'dart:async';
import 'package:flutter/foundation.dart' show kDebugMode, kReleaseMode;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/config/app_config.dart';
import '../../core/providers.dart';
import '../../core/theme/cadra_theme.dart';
import 'register_screen.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  bool _isPinMode = true;
  final _outletCodeCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  String _pin = '';
  String _currentApiUrl = '';
  bool _resendingVerify = false;
  String? _devVerifyUrl;
  int _lockoutSec = 0;
  Timer? _lockoutTimer;

  @override
  void initState() {
    super.initState();
    _loadSavedPrefs();
  }

  void _startLockoutCountdown(int seconds) {
    _lockoutTimer?.cancel();
    if (seconds <= 0) return;
    setState(() => _lockoutSec = seconds);
    _lockoutTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      if (_lockoutSec <= 1) {
        t.cancel();
        setState(() => _lockoutSec = 0);
      } else {
        setState(() => _lockoutSec--);
      }
    });
  }

  Future<void> _loadSavedPrefs() async {
    final storage = ref.read(tokenStorageProvider);
    final url = await storage.getApiBaseUrl();
    final outletCode = await storage.getLastOutletCode();
    if (!mounted) return;
    setState(() {
      _currentApiUrl = url;
      if (outletCode != null && outletCode.isNotEmpty) {
        _outletCodeCtrl.text = outletCode;
      }
    });
  }

  @override
  void dispose() {
    _lockoutTimer?.cancel();
    _outletCodeCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  void _pressDigit(String digit) {
    if (_pin.length >= 6 || _lockoutSec > 0) return;
    setState(() => _pin += digit);
  }

  Future<void> _submit() async {
    if (_lockoutSec > 0) return;
    final auth = ref.read(authControllerProvider.notifier);
    setState(() => _devVerifyUrl = null);
    if (_isPinMode) {
      if (_outletCodeCtrl.text.trim().isEmpty || _pin.length < 4) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Masukkan Kode Outlet dan PIN (4–6 digit)')),
        );
        return;
      }
      final ok = await auth.loginPin(
        outletCode: _outletCodeCtrl.text,
        pin: _pin,
      );
      if (!ok && mounted) {
        setState(() => _pin = '');
        final st = ref.read(authControllerProvider);
        if (st.errorCode == 'PIN_LOCKED' && (st.retryAfterSec ?? 0) > 0) {
          _startLockoutCountdown(st.retryAfterSec!);
        }
      }
    } else {
      if (_emailCtrl.text.trim().isEmpty || _passwordCtrl.text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Masukkan Email dan Password')),
        );
        return;
      }
      await auth.loginEmail(
        email: _emailCtrl.text,
        password: _passwordCtrl.text,
      );
    }
  }

  Future<void> _resendVerification() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty || _resendingVerify) return;
    setState(() => _resendingVerify = true);
    final res = await ref
        .read(authControllerProvider.notifier)
        .resendVerificationEmail(email);
    if (!mounted) return;
    setState(() {
      _resendingVerify = false;
      _devVerifyUrl = res.devVerifyUrl ?? _devVerifyUrl;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          res.error ?? res.message ?? 'Email konfirmasi telah dikirim ulang!',
        ),
      ),
    );
  }

  Future<void> _openApiUrlDialog() async {
    final ctrl = TextEditingController(text: _currentApiUrl);
    final saved = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Server API Tumpu POS'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Default Android Emulator: http://10.0.2.2:4000/api/v1\nProduksi: https://app-api.tumpu.biz.id/api/v1',
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: ctrl,
              decoration: const InputDecoration(
                labelText: 'API Base URL',
                hintText: 'http://10.0.2.2:4000/api/v1',
              ),
              keyboardType: TextInputType.url,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, ctrl.text),
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
    if (saved != null && saved.trim().isNotEmpty) {
      if (!AppConfig.isAllowedApiUrl(saved)) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                kReleaseMode
                    ? 'URL Server wajib menggunakan HTTPS (https://...) pada versi rilis.'
                    : 'Format URL server tidak valid.',
              ),
            ),
          );
        }
        return;
      }
      await ref.read(tokenStorageProvider).setApiBaseUrl(saved);
      await _loadSavedPrefs();
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final brightness = Theme.of(context).brightness;
    final accent = ref.watch(cadraAccentProvider);
    final p = CadraTheme.palette(brightness, accent);
    final isEmailUnverified = authState.errorCode == 'EMAIL_NOT_VERIFIED';

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(14),
                            child: Image.asset(
                              'assets/branding/tumpu-icon-dark.png',
                              width: 44,
                              height: 44,
                              fit: BoxFit.cover,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Tumpu POS',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                Text(
                                  'Kasir, Meja & KDS Mobile',
                                  style: TextStyle(fontSize: 13, color: p.muted),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            tooltip: 'Atur Server API',
                            onPressed: _openApiUrlDialog,
                            icon: const Icon(Icons.dns_outlined),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),
                      SegmentedButton<bool>(
                        segments: const [
                          ButtonSegment(
                            value: true,
                            label: Text('PIN Cepat'),
                            icon: Icon(Icons.dialpad_rounded, size: 18),
                          ),
                          ButtonSegment(
                            value: false,
                            label: Text('Email'),
                            icon: Icon(Icons.mail_outline_rounded, size: 18),
                          ),
                        ],
                        selected: {_isPinMode},
                        onSelectionChanged: (v) {
                          ref.read(authControllerProvider.notifier).clearError();
                          setState(() => _isPinMode = v.first);
                        },
                      ),
                      const SizedBox(height: 18),
                      if (_isPinMode) ...[
                        TextField(
                          controller: _outletCodeCtrl,
                          textCapitalization: TextCapitalization.characters,
                          decoration: const InputDecoration(
                            labelText: 'Kode Outlet',
                            hintText: 'Contoh: KSA-XXXX',
                            prefixIcon: Icon(Icons.storefront_outlined),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(6, (idx) {
                            final filled = _pin.length > idx;
                            return Container(
                              margin: const EdgeInsets.symmetric(horizontal: 6),
                              width: 14,
                              height: 14,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: filled ? p.ink : Colors.transparent,
                                border: Border.all(
                                  color: filled
                                      ? p.ink
                                      : (idx < 4 ? p.muted : p.line),
                                  width: 2,
                                ),
                              ),
                            );
                          }),
                        ),
                        const SizedBox(height: 16),
                        GridView.count(
                          crossAxisCount: 3,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          mainAxisSpacing: 8,
                          crossAxisSpacing: 8,
                          childAspectRatio: 2.0,
                          children: [
                            '1', '2', '3',
                            '4', '5', '6',
                            '7', '8', '9',
                            'C', '0', '⌫',
                          ].map((key) {
                            return OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              onPressed: (authState.isLoading || _lockoutSec > 0)
                                  ? null
                                  : () {
                                      if (key == 'C') {
                                        setState(() => _pin = '');
                                      } else if (key == '⌫') {
                                        if (_pin.isNotEmpty) {
                                          setState(() => _pin =
                                              _pin.substring(0, _pin.length - 1));
                                        }
                                      } else {
                                        _pressDigit(key);
                                      }
                                    },
                              child: Text(
                                key,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ] else ...[
                        TextField(
                          controller: _emailCtrl,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(
                            labelText: 'Email',
                            hintText: 'email@bisnisanda.id',
                            prefixIcon: Icon(Icons.alternate_email_rounded),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _passwordCtrl,
                          obscureText: true,
                          decoration: const InputDecoration(
                            labelText: 'Password',
                            prefixIcon: Icon(Icons.password_rounded),
                          ),
                          onSubmitted: (_) => _submit(),
                        ),
                      ],
                      if (authState.error != null) ...[
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: p.bad.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Column(
                            children: [
                              Text(
                                authState.error!,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: p.bad,
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              if (isEmailUnverified) ...[
                                const SizedBox(height: 10),
                                FilledButton.tonalIcon(
                                  onPressed: _resendingVerify
                                      ? null
                                      : _resendVerification,
                                  icon: const Icon(Icons.mail_outline_rounded,
                                      size: 16),
                                  label: Text(
                                    _resendingVerify
                                        ? 'Mengirim ulang...'
                                        : 'Kirim Ulang Email Konfirmasi',
                                  ),
                                ),
                                if (kDebugMode && _devVerifyUrl != null) ...[
                                  const SizedBox(height: 6),
                                  TextButton(
                                    onPressed: () async {
                                      final res = await ref
                                          .read(authControllerProvider.notifier)
                                          .verifyEmailToken(_devVerifyUrl!);
                                      if (!context.mounted) return;
                                      if (!res.ok) {
                                        ScaffoldMessenger.of(context)
                                            .showSnackBar(
                                          SnackBar(
                                            content: Text(
                                              res.error ?? 'Verifikasi gagal',
                                            ),
                                          ),
                                        );
                                      }
                                    },
                                    child: const Text(
                                      'Mode Dev: Konfirmasi Email Sekarang',
                                    ),
                                  ),
                                ],
                              ],
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 18),
                      FilledButton(
                        onPressed: authState.isLoading ||
                                (_isPinMode &&
                                    (_pin.length < 4 || _lockoutSec > 0))
                            ? null
                            : _submit,
                        child: authState.isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child:
                                    CircularProgressIndicator(strokeWidth: 2),
                              )
                            : Text(
                                _isPinMode
                                    ? (_lockoutSec > 0
                                        ? 'Terkunci (${_lockoutSec}d)'
                                        : 'Masuk dengan PIN (${_pin.length}/4–6 digit)')
                                    : 'Masuk ke Tumpu POS',
                              ),
                      ),
                      const SizedBox(height: 14),
                      Divider(color: p.line),
                      TextButton(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => const RegisterScreen(),
                            ),
                          );
                        },
                        child: const Text(
                          'Pemilik bisnis baru? Daftar Gratis (1 Outlet · 3 Akun)',
                          textAlign: TextAlign.center,
                        ),
                      ),
                      Text(
                        'Server: $_currentApiUrl',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 11, color: p.faint),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
