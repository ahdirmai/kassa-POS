import 'dart:async';
import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers.dart';
import '../../core/theme/cadra_theme.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _businessCtrl = TextEditingController();
  final _outletCtrl = TextEditingController();
  final _ownerCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _tokenCtrl = TextEditingController();

  bool _loading = false;
  bool _resending = false;
  bool _verifying = false;
  String? _error;
  RegisterResult? _pendingVerify;
  int _cooldown = 0;
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    _businessCtrl.dispose();
    _outletCtrl.dispose();
    _ownerCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _tokenCtrl.dispose();
    super.dispose();
  }

  void _startCooldown() {
    _timer?.cancel();
    setState(() => _cooldown = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      if (_cooldown <= 1) {
        t.cancel();
        setState(() => _cooldown = 0);
      } else {
        setState(() => _cooldown--);
      }
    });
  }

  Future<void> _submitRegister() async {
    if (_businessCtrl.text.trim().isEmpty ||
        _ownerCtrl.text.trim().isEmpty ||
        _emailCtrl.text.trim().isEmpty ||
        _passwordCtrl.text.length < 6) {
      setState(() => _error = 'Lengkapi semua kolom wajib (password min 6 karakter)');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    final res = await ref.read(authControllerProvider.notifier).registerOwner(
          businessName: _businessCtrl.text,
          outletName: _outletCtrl.text,
          ownerName: _ownerCtrl.text,
          email: _emailCtrl.text,
          password: _passwordCtrl.text,
        );
    if (!mounted) return;
    setState(() => _loading = false);
    if (res.error != null) {
      setState(() => _error = res.error);
      return;
    }
    setState(() => _pendingVerify = res.result);
    _startCooldown();
  }

  Future<void> _resend() async {
    final pending = _pendingVerify;
    if (pending == null || _resending || _cooldown > 0) return;
    setState(() => _resending = true);
    final res = await ref
        .read(authControllerProvider.notifier)
        .resendVerificationEmail(pending.email);
    if (!mounted) return;
    setState(() => _resending = false);
    if (res.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res.error!)),
      );
      return;
    }
    if (res.devVerifyUrl != null) {
      setState(() {
        _pendingVerify = RegisterResult(
          email: pending.email,
          message: pending.message,
          outletCode: pending.outletCode,
          devVerifyUrl: res.devVerifyUrl,
        );
      });
    }
    _startCooldown();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(res.message ?? 'Email konfirmasi dikirim ulang!')),
    );
  }

  Future<void> _verifyWithToken(String raw) async {
    setState(() => _verifying = true);
    final res =
        await ref.read(authControllerProvider.notifier).verifyEmailToken(raw);
    if (!mounted) return;
    setState(() => _verifying = false);
    if (res.ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Email terkonfirmasi! Selamat datang di Tumpu POS.'),
        ),
      );
      Navigator.of(context).popUntil((route) => route.isFirst);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res.error ?? 'Verifikasi gagal')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = CadraTheme.palette(
      Theme.of(context).brightness,
      ref.watch(cadraAccentProvider),
    );

    if (_pendingVerify != null) {
      final pending = _pendingVerify!;
      return Scaffold(
        appBar: AppBar(title: const Text('Konfirmasi Email')),
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
                        CircleAvatar(
                          radius: 28,
                          backgroundColor: p.accent,
                          child: Icon(Icons.mail_outline_rounded,
                              size: 28, color: p.onAccent),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Cek Kotak Masuk Email Anda',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Kami telah mengirimkan tautan konfirmasi ke ${pending.email}. Klik tautan di email tersebut untuk mengaktifkan akun Anda.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 13, color: p.muted),
                        ),
                        if (pending.outletCode != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: p.surface,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              'Kode Outlet Anda: ${pending.outletCode}',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                        if (kDebugMode && pending.devVerifyUrl != null) ...[
                          const SizedBox(height: 14),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: p.warn.withValues(alpha: 0.14),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Text(
                                  'Mode Dev Lokal (Console Mailer)',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 12.5,
                                    color: p.warn,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                FilledButton.tonal(
                                  onPressed: _verifying
                                      ? null
                                      : () =>
                                          _verifyWithToken(pending.devVerifyUrl!),
                                  child: Text(_verifying
                                      ? 'Memverifikasi...'
                                      : 'Konfirmasi Email Sekarang'),
                                ),
                              ],
                            ),
                          ),
                        ],
                        const SizedBox(height: 16),
                        TextField(
                          controller: _tokenCtrl,
                          decoration: const InputDecoration(
                            labelText: 'Atau tempel tautan/token verifikasi',
                            hintText: 'Tempel link dari email di sini...',
                            isDense: true,
                          ),
                        ),
                        const SizedBox(height: 8),
                        OutlinedButton(
                          onPressed: _verifying || _tokenCtrl.text.trim().isEmpty
                              ? null
                              : () => _verifyWithToken(_tokenCtrl.text),
                          child: Text(
                              _verifying ? 'Memverifikasi...' : 'Verifikasi Token'),
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          onPressed:
                              _resending || _cooldown > 0 ? null : _resend,
                          icon: const Icon(Icons.refresh_rounded, size: 18),
                          label: Text(
                            _resending
                                ? 'Mengirim ulang...'
                                : _cooldown > 0
                                    ? 'Kirim Ulang Email (${_cooldown}d)'
                                    : 'Kirim Ulang Email Konfirmasi',
                          ),
                        ),
                        const SizedBox(height: 8),
                        FilledButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('Ke Halaman Login'),
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

    return Scaffold(
      appBar: AppBar(title: const Text('Daftar Tumpu Gratis')),
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
                              width: 42,
                              height: 42,
                              fit: BoxFit.cover,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Daftar Tumpu Gratis',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                Text(
                                  'Paket Free: 1 Outlet · 3 Akun · Kasir POS',
                                  style: TextStyle(fontSize: 12, color: p.muted),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),
                      TextField(
                        controller: _businessCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Nama Bisnis / Brand *',
                          hintText: 'Contoh: Kopi Pagi Nusantara',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _outletCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Nama Outlet Pertama (Opsional)',
                          hintText: 'Contoh: Cabang Kemang',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _ownerCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Nama Owner *',
                          hintText: 'Nama lengkap',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'Email Owner *',
                          hintText: 'owner@bisnisanda.id',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _passwordCtrl,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Password (min 6 karakter) *',
                        ),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: p.bad.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            _error!,
                            style: TextStyle(
                              color: p.bad,
                              fontSize: 12.5,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 18),
                      FilledButton(
                        onPressed: _loading ? null : _submitRegister,
                        child: _loading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child:
                                    CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Buat Akun & Kirim Email Konfirmasi'),
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
