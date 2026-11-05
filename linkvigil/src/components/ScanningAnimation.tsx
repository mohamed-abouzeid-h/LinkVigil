import React from 'react';
import { Cpu, Globe, Network, ShieldCheck, CheckCircle2, Loader2, Database } from 'lucide-react';
import { EngineStatusItem } from '../types/scanner';

interface ScanningAnimationProps {
  engines: EngineStatusItem[];
  targetUrl: string;
}

export const ScanningAnimation: React.FC<ScanningAnimationProps> = ({ engines, targetUrl }) => {
  return (
    <div className="w-full max-w-4xl mx-auto glass-panel-glow rounded-2xl p-6 sm:p-8 space-y-6 my-6 border border-cyan-500/30">
      {/* Top Banner with Radar Indicator */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 flex items-center justify-center rounded-xl bg-cyan-950/60 border border-cyan-500/40">
            {/* Spinning Radar Line */}
            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
              <div className="w-full h-full bg-gradient-to-tr from-cyan-500/30 via-transparent to-transparent animate-radar-sweep" />
            </div>
            <Cpu className="w-6 h-6 text-cyan-400 relative z-10 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
              <span>Active Multi-Engine Security Scan</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono truncate max-w-md">
              Target: <span className="text-cyan-300">{targetUrl}</span>
            </p>
          </div>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
          Querying 4 Engines in Parallel
        </div>
      </div>

      {/* Progress Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {engines.map((eng) => {
          const isScanning = eng.status === 'scanning';
          const isDone = eng.status === 'completed';

          let icon = <Cpu className="w-5 h-5 text-cyan-400" />;
          if (eng.id === 'dns') icon = <Globe className="w-5 h-5 text-emerald-400" />;
          if (eng.id === 'ip') icon = <Network className="w-5 h-5 text-blue-400" />;
          if (eng.id === 'urlhaus') icon = <Database className="w-5 h-5 text-purple-400" />;

          return (
            <div
              key={eng.id}
              className={`p-3.5 rounded-xl border transition-all duration-300 flex items-center justify-between ${
                isScanning
                  ? 'bg-cyan-950/40 border-cyan-400/50 shadow-neon-cyan'
                  : isDone
                  ? 'bg-slate-900/80 border-emerald-500/30'
                  : 'bg-slate-900/40 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                  {icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200 font-mono">
                    {eng.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {isScanning && <span className="text-cyan-400 animate-pulse">Inspecting telemetry...</span>}
                    {isDone && <span className="text-emerald-400">Analysis completed</span>}
                    {eng.status === 'pending' && <span className="text-slate-500">Queued</span>}
                  </div>
                </div>
              </div>

              <div>
                {isScanning && (
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                )}
                {isDone && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-fadeIn" />
                )}
                {eng.status === 'pending' && (
                  <div className="w-3 h-3 rounded-full border border-slate-700 bg-slate-800" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time telemetry log feed */}
      <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-xs text-slate-400 flex items-center gap-2 overflow-hidden">
        <span className="text-cyan-400 font-bold">$</span>
        <span className="text-emerald-400 animate-pulse">Running heuristic vector matrices:</span>
        <span className="text-slate-500 truncate">
          checking unicode homoglyphs, DGA Shannon entropy, DNS-over-HTTPS Cloudflare resolution, URLhaus malware payloads...
        </span>
      </div>
    </div>
  );
};
