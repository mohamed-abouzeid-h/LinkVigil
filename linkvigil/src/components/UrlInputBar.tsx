import React, { useState, useEffect } from 'react';
import { Search, Clipboard, X, ArrowRight, ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { SAMPLE_URLS, SampleUrlItem } from '../data/sampleUrls';

interface UrlInputBarProps {
  currentUrl: string;
  onUrlChange: (url: string) => void;
  onScan: (urlToScan?: string) => void;
  isScanning: boolean;
}

export const UrlInputBar: React.FC<UrlInputBarProps> = ({
  currentUrl,
  onUrlChange,
  onScan,
  isScanning,
}) => {
  const [urlParts, setUrlParts] = useState<{
    protocol: string;
    subdomain: string;
    domain: string;
    tld: string;
    path: string;
  } | null>(null);

  // Live URL breakdown parsing
  useEffect(() => {
    if (!currentUrl.trim()) {
      setUrlParts(null);
      return;
    }

    try {
      let prepended = currentUrl.trim();
      if (!/^https?:\/\//i.test(prepended)) {
        prepended = 'https://' + prepended;
      }
      const u = new URL(prepended);
      const hostParts = u.hostname.split('.');
      const tld = hostParts.length > 1 ? hostParts.slice(-1)[0] : '';
      const domain = hostParts.length >= 2 ? hostParts.slice(-2).join('.') : u.hostname;
      const subdomain = hostParts.length > 2 ? hostParts.slice(0, -2).join('.') : '';

      setUrlParts({
        protocol: u.protocol.replace(':', ''),
        subdomain,
        domain,
        tld,
        path: u.pathname + u.search,
      });
    } catch {
      setUrlParts(null);
    }
  }, [currentUrl]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isScanning && currentUrl.trim()) {
      onScan();
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onUrlChange(text);
        onScan(text);
      }
    } catch {
      // Fallback if clipboard permissions blocked
    }
  };

  const handleSampleClick = (sample: SampleUrlItem) => {
    onUrlChange(sample.url);
    onScan(sample.url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Central Input Box */}
      <div className="relative group">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/25 via-blue-500/15 to-emerald-500/25 opacity-70 blur-lg group-hover:opacity-100 transition duration-500 group-focus-within:opacity-100" />
        
        <div className="relative flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-[#090e1a]/95 border border-cyan-500/30 shadow-2xl backdrop-blur-xl">
          {/* Search Icon */}
          <div className="hidden sm:flex items-center pl-3 text-cyan-400">
            <Search className="w-5 h-5 opacity-80" />
          </div>

          {/* Text Input */}
          <input
            type="text"
            value={currentUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste any link to analyze (e.g., https://paypal-security-check.top or xn--...)"
            disabled={isScanning}
            className="w-full px-3 py-3.5 bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 font-mono focus:outline-none disabled:opacity-50"
            autoFocus
          />

          {/* Action buttons inside bar */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end pr-1 pb-1 sm:pb-0">
            {currentUrl && (
              <button
                type="button"
                onClick={() => onUrlChange('')}
                disabled={isScanning}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handlePasteClipboard}
              disabled={isScanning}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-cyan-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
              title="Paste from clipboard and scan"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Paste</span>
            </button>

            {/* Scan Button */}
            <button
              type="button"
              onClick={() => onScan()}
              disabled={isScanning || !currentUrl.trim()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-neon-cyan active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <span>Scan Link</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live Dissected URL Breakdown (Helpful cyber inspection) */}
      {urlParts && (
        <div className="px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs font-mono text-slate-400 flex flex-wrap items-center gap-2 animate-fadeIn">
          <span className="text-slate-500 uppercase text-[10px] tracking-wider font-semibold">Anatomy:</span>
          
          <span className={`px-2 py-0.5 rounded ${urlParts.protocol === 'https' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            {urlParts.protocol}://
          </span>

          {urlParts.subdomain && (
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20" title="Subdomain prefix">
              {urlParts.subdomain}.
            </span>
          )}

          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold" title="Registered Domain">
            {urlParts.domain}
          </span>

          {urlParts.tld && (
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700" title="Top Level Domain">
              .{urlParts.tld}
            </span>
          )}

          {urlParts.path && urlParts.path !== '/' && (
            <span className="px-2 py-0.5 rounded bg-slate-800/70 text-slate-400 truncate max-w-xs" title="Path & Query Parameters">
              {urlParts.path}
            </span>
          )}
        </div>
      )}

      {/* Quick Test Samples Pills */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium text-slate-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Quick Test Threat Scenarios:
          </span>
          <span className="hidden sm:inline text-slate-500">Click to instantly load and test engines</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {SAMPLE_URLS.map((sample, idx) => {
            const isDanger = sample.category === 'phishing' || sample.category === 'malware' || sample.category === 'homograph';
            const isWarning = sample.category === 'typosquatting' || sample.category === 'obfuscated';
            
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSampleClick(sample)}
                disabled={isScanning}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono bg-slate-900/60 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all duration-200"
              >
                {isDanger ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                ) : isWarning ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{sample.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 group-hover:text-cyan-300">
                  {sample.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
