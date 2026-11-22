import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers.dart';
import '../../core/theme/cadra_theme.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  bool _isPinMode = true;
  final _outletCodeCtrl = TextEditingController();
  final _pinCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  String _currentApiUrl = '';

  @override
  void initState() {
    super.initState();
    _loadSavedPrefs();
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
    _outletCodeCtrl.dispose();
    _pinCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final auth = ref.read(authControllerProvider.notifier);
    if (_isPinMode) {
      if (_outletCodeCtrl.text.trim().isEmpty || _pinCtrl.text.trim().length < 4) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Masukkan Kode Outlet dan PIN (4–6 digit)')),
        );
        return;
      }
      await auth.loginPin(
        outletCode: _outletCodeCtrl.text,
        pin: _pinCtrl.text,
      );
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

  Future<void> _openApiUrlDialog() async {
    final ctrl = TextEditingController(text: _currentApiUrl);
    final saved = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Server API Kassa POS'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Default Android Emulator: http://10.0.2.2:4000/api/v1\nProduksi: https://app-api.kassa.biz.id/api/v1',
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

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
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
                              'assets/branding/kassa-icon-dark.png',
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
                                  'Kassa POS',
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
                      const SizedBox(height: 20),
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
                        onSelectionChanged: (v) =>
                            setState(() => _isPinMode = v.first),
                      ),
                      const SizedBox(height: 20),
                      if (_isPinMode) ...[
                        TextField(
                          controller: _outletCodeCtrl,
                          textCapitalization: TextCapitalization.characters,
                          decoration: const InputDecoration(
                            labelText: 'Kode Outlet',
                            hintText: 'Contoh: KSA-MAIN',
                            prefixIcon: Icon(Icons.storefront_outlined),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _pinCtrl,
                          obscureText: true,
                          keyboardType: TextInputType.number,
                          maxLength: 6,
                          decoration: const InputDecoration(
                            labelText: 'PIN Kasir / Staf (4–6 digit)',
                            prefixIcon: Icon(Icons.lock_outline_rounded),
                            counterText: '',
                          ),
                          onSubmitted: (_) => _submit(),
                        ),
                      ] else ...[
                        TextField(
                          controller: _emailCtrl,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(
                            labelText: 'Email',
                            hintText: 'owner@kassa.biz.id',
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
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            authState.error!,
                            style: TextStyle(
                              color: p.bad,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 20),
                      FilledButton(
                        onPressed: authState.isLoading ? null : _submit,
                        child: authState.isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Masuk ke Kassa POS'),
                      ),
                      const SizedBox(height: 14),
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
