import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, ShieldCheck, Zap, Lock, Terminal, Cpu, 
  ExternalLink, Sparkles, Smartphone, AlertTriangle, 
  RefreshCw, CheckCircle2, ChevronRight, HelpCircle, Info, Share2, Copy, Check
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { UrlInputBar } from './components/UrlInputBar';
import { ScanningAnimation } from './components/ScanningAnimation';
import { ResultCard } from './components/ResultCard';
import { ThreatBreakdown } from './components/ThreatBreakdown';
import { DomainDetailsCard } from './components/DomainDetailsCard';
import { performFullScan } from './engines/scoringEngine';
import { ScanResult, EngineStatusItem } from './types/scanner';
import { SAMPLE_URLS, SampleUrlItem } from './data/sampleUrls';

export default function App() {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showPlayground, setShowPlayground] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  const [engines, setEngines] = useState<EngineStatusItem[]>([
    { id: 'heuristics', name: 'Heuristics & Homograph', status: 'pending', findingsCount: 0 },
    { id: 'dns', name: 'Cloudflare DoH & DNSSEC', status: 'pending', findingsCount: 0 },
    { id: 'ip', name: 'Autonomous System & IP Geo', status: 'pending', findingsCount: 0 },
    { id: 'urlhaus', name: 'abuse.ch URLhaus Threat DB', status: 'pending', findingsCount: 0 },
  ]);

  // Read URL from permalink query parameter ?url=... on initial mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (urlParam && urlParam.trim()) {
      setCurrentUrl(urlParam);
      handleTriggerScan(urlParam);
    }
  }, []);

  const handleTriggerScan = async (urlToScan?: string) => {
    const target = (urlToScan || currentUrl).trim();
    if (!target) return;

    setIsScanning(true);
    setScanError(null);
    setScanResult(null);

    // Reset engines
    setEngines([
      { id: 'heuristics', name: 'Heuristics & Homograph', status: 'scanning', findingsCount: 0 },
      { id: 'dns', name: 'Cloudflare DoH & DNSSEC', status: 'pending', findingsCount: 0 },
      { id: 'ip', name: 'Autonomous System & IP Geo', status: 'pending', findingsCount: 0 },
      { id: 'urlhaus', name: 'abuse.ch URLhaus Threat DB', status: 'pending', findingsCount: 0 },
    ]);

    try {
      // Progress callback hook
      const result = await performFullScan(target, (engineId, status) => {
        setEngines((prev) =>
          prev.map((e) => {
            if (e.id === engineId) {
              return { ...e, status };
            }
            return e;
          })
        );
      });

      // Small realistic pause for scanning visual feedback
      await new Promise((resolve) => setTimeout(resolve, 600));

      setEngines((prev) => prev.map((e) => ({ ...e, status: 'completed' })));
      setScanResult(result);

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setScanError(err.message || 'An unexpected scan error occurred.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleResetScan = () => {
    setScanResult(null);
    setCurrentUrl('');
    setScanError(null);
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleNativeShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?url=${encodeURIComponent(scanResult?.url || '')}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `LinkVigil Threat Report [Score: ${scanResult?.score}/100]`,
          text: `Threat scan verdict for ${scanResult?.url}: ${scanResult?.verdictTitle}`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(shareUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="min-h-screen cyber-bg text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation */}
      <Navbar 
        onSelectPlayground={() => setShowPlayground(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 w-full">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          {/* Status Capsule */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-xs font-mono text-cyan-300 shadow-neon-cyan">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-emerald-400 font-semibold">100% Free & Client-Side Scanner</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-mono text-white">
            Scan Suspicious Links <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Before You Click
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Real-time defense detecting Unicode homograph attacks, typosquatting traps, raw IP malware droppers, 
            and deceptive redirects — running locally with zero API tokens or registration.
          </p>

          {/* Engine Capability Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Punycode & Cyrillic Spoofs</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Shannon Entropy DGA</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Cloudflare DoH DNS</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>abuse.ch URLhaus DB</span>
            </div>
          </div>
        </div>

        {/* Hero URL Input Component */}
        <UrlInputBar
          currentUrl={currentUrl}
          onUrlChange={setCurrentUrl}
          onScan={handleTriggerScan}
          isScanning={isScanning}
        />

        {/* Scan Error State */}
        {scanError && (
          <div className="w-full max-w-4xl mx-auto p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span className="text-sm font-mono">{scanError}</span>
            </div>
            <button
              onClick={() => setScanError(null)}
              className="text-xs font-mono px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Live Scanning Animated State */}
        {isScanning && (
          <ScanningAnimation engines={engines} targetUrl={currentUrl} />
        )}

        {/* Results Dashboard Section */}
        {scanResult && !isScanning && (
          <div ref={resultsRef} className="space-y-8 animate-fadeIn pt-4">
            {/* Quick Actions Header */}
            <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                  Threat Report Dashboard
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-mono text-slate-400">
                  Target: <strong className="text-slate-200">{scanResult.parsedUrl.domain}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleNativeShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Share Report</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleResetScan}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scan Another Link</span>
                </button>
              </div>
            </div>

            {/* 1. Dynamic Risk Score Dial/Gauge & Verdict Banner */}
            <ResultCard result={scanResult} />

            {/* 2. Collapsible Threat Findings Checklist */}
            <ThreatBreakdown flags={scanResult.flags} />

            {/* 3. Domain & Infrastructure Telemetry Metadata Panel */}
            <DomainDetailsCard result={scanResult} />
          </div>
        )}

        {/* Feature Highlights Grid */}
        <div className="w-full max-w-5xl mx-auto pt-12 pb-6 border-t border-slate-800/80">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold font-mono text-white">
              Why LinkVigil is Built Different
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Zero telemetry leaks, zero subscriptions, complete client-side autonomy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl glass-panel border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-mono text-white">Zero-Token Privacy</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No third-party accounts or commercial API keys are required. Your browsed URLs and private tokens never get stored in any remote database.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-mono text-white">4 Defense Engines</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Combines Unicode IDN homograph checks, Levenshtein brand typosquatting, Shannon entropy calculation, and public Cloudflare DoH lookups.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-mono text-white">Mobile-Friendly Website</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Use LinkVigil in your phone's browser. Share scanned links with your device's share sheet where supported. Scanning requires an internet connection.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Cyber Security Attack Demos Modal */}
      {showPlayground && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl glass-panel-glow border border-cyan-500/40 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-mono text-white">Security Threat Scenarios</h3>
                  <p className="text-xs text-slate-400">Interactive live demonstrations of modern URL evasion vectors</p>
                </div>
              </div>
              <button
                onClick={() => setShowPlayground(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {SAMPLE_URLS.map((sample, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold font-mono text-white">{sample.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {sample.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono break-all bg-slate-950/60 p-2 rounded border border-slate-800/80">
                    {sample.url}
                  </p>
                  <p className="text-xs text-slate-400">{sample.description}</p>
                  <button
                    onClick={() => {
                      setShowPlayground(false);
                      setCurrentUrl(sample.url);
                      handleTriggerScan(sample.url);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    <span>Load & Run Scanner</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cyber Footer */}
      <footer className="border-t border-slate-900 bg-[#02050c] py-8 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-slate-200 font-semibold">LinkVigil</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Mohamed Abouzeid</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-center flex-wrap justify-center">
            <span>&copy; {new Date().getFullYear()} Mohamed Abouzeid. All rights reserved.</span>
            <span className="text-slate-600">•</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
