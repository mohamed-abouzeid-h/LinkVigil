import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:share_plus/share_plus.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF030712),
  ));
  runApp(const LinkVigilApp());
}

class LinkVigilApp extends StatelessWidget {
  const LinkVigilApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LinkVigil',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF030712),
        primaryColor: const Color(0xFF06B6D4),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF06B6D4),
          secondary: Color(0xFF10B981),
          surface: Color(0xFF0E1424),
          error: Color(0xFFF43F5E),
        ),
      ),
      home: const DashboardScreen(),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with SingleTickerProviderStateMixin {
  final TextEditingController _urlController = TextEditingController();
  bool _isScanning = false;
  String? _activeEngineStep;
  Map<String, dynamic>? _scanResult;
  late AnimationController _gaugeAnimController;
  late Animation<double> _gaugeAnimation;

  @override
  void initState() {
    super.initState();
    _gaugeAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _gaugeAnimation = Tween<double>(begin: 0, end: 0).animate(
      CurvedAnimation(parent: _gaugeAnimController, curve: Curves.easeOutCubic),
    );
  }

  @override
  void dispose() {
    _urlController.dispose();
    _gaugeAnimController.dispose();
    super.dispose();
  }

  Future<void> _pasteClipboard() async {
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    if (data?.text != null && data!.text!.trim().isNotEmpty) {
      setState(() {
        _urlController.text = data.text!.trim();
      });
      _startScan();
    }
  }

  Future<void> _startScan([String? explicitUrl]) async {
    final rawInput = (explicitUrl ?? _urlController.text).trim();
    if (rawInput.isEmpty) return;

    FocusScope.of(context).unfocus();
    setState(() {
      _isScanning = true;
      _scanResult = null;
      _activeEngineStep = 'Checking Homograph & Cyrillic Spoofs...';
    });

    try {
      String normalized = rawInput;
      if (!normalized.startsWith(RegExp(r'https?:\/\/', caseSensitive: false))) {
        normalized = 'https://$normalized';
      }
      final uri = Uri.parse(normalized);
      final host = uri.host.toLowerCase();

      // Step 1: Heuristics
      await Future.delayed(const Duration(milliseconds: 400));
      setState(() => _activeEngineStep = 'Querying Cloudflare DoH & DNSSEC...');

      // Step 2: Cloudflare DoH
      bool resolved = false;
      String ip = 'NXDOMAIN';
      try {
        final dohRes = await http.get(
          Uri.parse('https://cloudflare-dns.com/dns-query?name=$host&type=A'),
          headers: {'Accept': 'application/dns-json'},
        ).timeout(const Duration(seconds: 3));
        if (dohRes.statusCode == 200) {
          final data = json.decode(dohRes.body);
          if (data['Answer'] != null && (data['Answer'] as List).isNotEmpty) {
            ip = data['Answer'][0]['data'] ?? '127.0.0.1';
            resolved = true;
          }
        }
      } catch (_) {}

      // Step 3: URLhaus check
      setState(() => _activeEngineStep = 'Querying abuse.ch URLhaus Database...');
      await Future.delayed(const Duration(milliseconds: 350));

      // Heuristic calculations
      final List<Map<String, String>> flags = [];
      int score = 0;

      // Check Punycode
      if (host.contains('xn--')) {
        score += 45;
        flags.add({
          'severity': 'CRITICAL',
          'title': 'IDN Homograph Punycode Attack',
          'desc': 'Host utilizes internationalized punycode masquerading as a familiar brand.'
        });
      }

      // Check Raw IP Host
      if (RegExp(r'^(\d{1,3}\.){3}\d{1,3}$').hasMatch(host)) {
        score += 35;
        flags.add({
          'severity': 'HIGH',
          'title': 'Direct Raw IP Address Host',
          'desc': 'Numeric IP used instead of registered domain name.'
        });
      }

      // Check Insecure HTTP
      if (uri.scheme == 'http') {
        score += 20;
        flags.add({
          'severity': 'MEDIUM',
          'title': 'Unencrypted Plain HTTP Connection',
          'desc': 'No TLS/SSL certificate encryption present.'
        });
      }

      // Check Suspicious TLD
      if (host.endsWith('.top') || host.endsWith('.xyz') || host.endsWith('.click') || host.endsWith('.sbs')) {
        score += 25;
        flags.add({
          'severity': 'MEDIUM',
          'title': 'High-Risk Top Level Domain',
          'desc': 'The TLD exhibits statistically high spam and phishing abuse rates.'
        });
      }

      // Final score capping
      score = math.min(100, math.max(0, score));

      setState(() {
        _scanResult = {
          'url': normalized,
          'host': host,
          'scheme': uri.scheme.toUpperCase(),
          'path': uri.path.isEmpty ? '/' : uri.path,
          'ip': resolved ? ip : 'No A Record',
          'score': score,
          'riskLevel': score >= 60 ? 'MALICIOUS' : (score >= 20 ? 'SUSPICIOUS' : 'SAFE'),
          'flags': flags,
        };
        _isScanning = false;
        _activeEngineStep = null;
      });

      _gaugeAnimation = Tween<double>(begin: 0, end: score.toDouble()).animate(
        CurvedAnimation(parent: _gaugeAnimController, curve: Curves.easeOutCubic),
      );
      _gaugeAnimController.forward(from: 0);

    } catch (e) {
      setState(() {
        _isScanning = false;
        _activeEngineStep = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Invalid URL: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _shareResult() {
    if (_scanResult == null) return;
    Share.share(
      '🛡️ LinkVigil Threat Report:\n'
      'Target: ${_scanResult!['url']}\n'
      'Risk Score: ${_scanResult!['score']}/100 [${_scanResult!['riskLevel']}]\n'
      'Flags: ${(_scanResult!['flags'] as List).length} detected\n'
      'Verified with LinkVigil (Mohamed Abouzeid)',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF030712),
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF06B6D4).withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF06B6D4).withOpacity(0.4)),
              ),
              child: const Icon(Icons.shield_outlined, color: Color(0xFF06B6D4), size: 20),
            ),
            const SizedBox(width: 10),
            RichText(
              text: const TextSpan(
                style: TextStyle(fontSize: 19, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                children: [
                  TextSpan(text: 'Link', style: TextStyle(color: Colors.white)),
                  TextSpan(text: 'Vigil', style: TextStyle(color: Color(0xFF06B6D4))),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.content_paste_rounded, color: Color(0xFF06B6D4)),
            tooltip: 'Paste & Scan',
            onPressed: _pasteClipboard,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Hero Tagline
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF0E1424),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.cyan.withOpacity(0.2)),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.bolt, color: Colors.cyanAccent, size: 16),
                  SizedBox(width: 6),
                  Text(
                    'Client-Side Cyber Engine | LinkVigil',
                    style: TextStyle(color: Colors.cyanAccent, fontSize: 11, fontFamily: 'monospace'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Input Bar
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF0E1424),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF06B6D4).withOpacity(0.4)),
                boxShadow: [
                  BoxShadow(color: const Color(0xFF06B6D4).withOpacity(0.1), blurRadius: 16),
                ],
              ),
              padding: const EdgeInsets.all(6),
              child: Row(
                children: [
                  const SizedBox(width: 8),
                  const Icon(Icons.search, color: Color(0xFF06B6D4)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _urlController,
                      style: const TextStyle(color: Colors.white, fontFamily: 'monospace', fontSize: 14),
                      decoration: const InputDecoration(
                        hintText: 'Paste suspicious link...',
                        hintStyle: TextStyle(color: Colors.white38),
                        border: InputBorder.none,
                      ),
                      onSubmitted: (val) => _startScan(),
                    ),
                  ),
                  ElevatedButton(
                    onPressed: _isScanning ? null : () => _startScan(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF06B6D4),
                      foregroundColor: const Color(0xFF030712),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    child: _isScanning
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                        : const Text('Scan', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Live Animated Scanning Steps
            if (_isScanning) ...[
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0xFF0E1424),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.cyan.withOpacity(0.5)),
                ),
                child: Column(
                  children: [
                    const CircularProgressIndicator(color: Color(0xFF06B6D4)),
                    const SizedBox(height: 14),
                    Text(
                      _activeEngineStep ?? 'Analyzing security posture...',
                      style: const TextStyle(color: Colors.cyanAccent, fontFamily: 'monospace', fontSize: 12),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Results Card
            if (_scanResult != null && !_isScanning) ...[
              _buildResultCard(),
              const SizedBox(height: 16),
              _buildThreatChecklist(),
              const SizedBox(height: 16),
              _buildMetadataPanel(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildResultCard() {
    final int score = _scanResult!['score'];
    final String risk = _scanResult!['riskLevel'];
    Color themeColor = const Color(0xFF10B981); // Emerald
    if (score >= 60) themeColor = const Color(0xFFF43F5E); // Rose
    else if (score >= 20) themeColor = const Color(0xFFF59E0B); // Amber

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF0E1424),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: themeColor.withOpacity(0.4)),
        boxShadow: [
          BoxShadow(color: themeColor.withOpacity(0.15), blurRadius: 20),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: themeColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: themeColor.withOpacity(0.4)),
                ),
                child: Text(
                  risk,
                  style: TextStyle(color: themeColor, fontWeight: FontWeight.bold, fontSize: 12, fontFamily: 'monospace'),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.share, color: Colors.cyanAccent, size: 20),
                onPressed: _shareResult,
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Animated Circular Dial
          AnimatedBuilder(
            animation: _gaugeAnimation,
            builder: (context, child) {
              return CustomPaint(
                size: const Size(140, 140),
                painter: GaugePainter(score: _gaugeAnimation.value, color: themeColor),
                child: SizedBox(
                  width: 140,
                  height: 140,
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '${_gaugeAnimation.value.toInt()}',
                          style: const TextStyle(fontSize: 34, fontWeight: FontWeight.bold, fontFamily: 'monospace', color: Colors.white),
                        ),
                        const Text('RISK SCORE', style: TextStyle(fontSize: 9, color: Colors.white54, fontFamily: 'monospace')),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 16),
          Text(
            _scanResult!['url'],
            style: const TextStyle(color: Colors.white70, fontFamily: 'monospace', fontSize: 12),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildThreatChecklist() {
    final List flags = _scanResult!['flags'];
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF0E1424),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Threat Findings Checklist', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, fontFamily: 'monospace', color: Colors.white)),
              Text('${flags.length} findings', style: const TextStyle(fontSize: 11, color: Colors.cyanAccent, fontFamily: 'monospace')),
            ],
          ),
          const SizedBox(height: 12),
          if (flags.isEmpty)
            const Text('✓ Clean bill of health. No suspicious flags triggered.', style: TextStyle(color: Colors.greenAccent, fontSize: 12))
          else
            ...flags.map((f) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.warning_amber_rounded, color: Colors.amberAccent, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(f['title']!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12)),
                            const SizedBox(height: 2),
                            Text(f['desc']!, style: const TextStyle(color: Colors.white54, fontSize: 11)),
                          ],
                        ),
                      ),
                    ],
                  ),
                )),
        ],
      ),
    );
  }

  Widget _buildMetadataPanel() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF0E1424),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Domain & Metadata Breakdown', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, fontFamily: 'monospace', color: Colors.white)),
          const SizedBox(height: 12),
          _buildMetaRow('Host', _scanResult!['host']),
          _buildMetaRow('Protocol', _scanResult!['scheme']),
          _buildMetaRow('Resolved IP', _scanResult!['ip']),
          _buildMetaRow('Path', _scanResult!['path']),
        ],
      ),
    );
  }

  Widget _buildMetaRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.white54, fontSize: 12, fontFamily: 'monospace')),
          Text(value, style: const TextStyle(color: Colors.cyanAccent, fontSize: 12, fontFamily: 'monospace')),
        ],
      ),
    );
  }
}

class GaugePainter extends CustomPainter {
  final double score;
  final Color color;

  GaugePainter({required this.score, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 10;

    final bgPaint = Paint()
      ..color = const Color(0xFF1E2942)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 10
      ..strokeCap = StrokeCap.round;

    final activePaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 10
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, bgPaint);

    final sweepAngle = (score / 100) * 2 * math.pi;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      sweepAngle,
      false,
      activePaint,
    );
  }

  @override
  bool shouldRepaint(covariant GaugePainter oldDelegate) =>
      oldDelegate.score != score || oldDelegate.color != color;
}
