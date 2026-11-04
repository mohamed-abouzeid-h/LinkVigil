import React, { useState } from 'react';
import { 
  Network, Globe, Lock, Unlock, Database, Cpu, Copy, Check, Server, 
  MapPin, AlertCircle, ShieldCheck, Zap, Activity 
} from 'lucide-react';
import { ScanResult } from '../types/scanner';

interface DomainDetailsCardProps {
  result: ScanResult;
}

export const DomainDetailsCard: React.FC<DomainDetailsCardProps> = ({ result }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const { parsedUrl, dns, ip, ssl, heuristics } = result;

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl glass-panel p-6 sm:p-8 space-y-6 border border-slate-800 shadow-xl">
      {/* Title */}
      <div className="pb-4 border-b border-slate-800">
        <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
          <Server className="w-5 h-5 text-cyan-400" />
          <span>Domain & Infrastructure Telemetry</span>
        </h3>
        <p className="text-xs text-slate-400 font-sans mt-0.5">
          Zero-token cryptographic and network resolution intelligence obtained client-side.
        </p>
      </div>

      {/* Grid of Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Resolved IP Address */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold uppercase text-[11px]">
              <Network className="w-3.5 h-3.5" />
              Resolved IP
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${dns.resolved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
              {dns.status}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold font-mono text-white truncate">
              {dns.primaryIp || (heuristics.isRawIpHost ? parsedUrl.hostname : 'No Record / NXDOMAIN')}
            </span>
            {dns.primaryIp && (
              <button
                onClick={() => handleCopy(dns.primaryIp!, 'ip')}
                className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Copy IP Address"
              >
                {copiedField === 'ip' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            DNSSEC: <span className={dns.dnssec ? 'text-emerald-400 font-bold' : 'text-slate-500'}>{dns.dnssec ? 'Validated (AD)' : 'Disabled'}</span>
            <span className="mx-2">•</span>
            TTL: <span className="text-slate-300">{dns.ttl ? `${dns.ttl}s` : 'N/A'}</span>
          </div>
        </div>

        {/* Card 2: Geolocation & Country */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold uppercase text-[11px]">
              <MapPin className="w-3.5 h-3.5" />
              Geolocation
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {ip?.countryCode || 'UN'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold font-mono text-white truncate">
              {ip?.country || 'Lookup Standby'}
            </span>
            {ip?.city && (
              <span className="text-xs text-slate-400 font-sans">
                ({ip.city})
              </span>
            )}
          </div>

          <div className="text-[11px] font-mono text-slate-400 truncate">
            ASN: <span className="text-slate-300">{ip?.asn || 'Global Autonomous System'}</span>
          </div>
        </div>

        {/* Card 3: Autonomous System & ISP */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-blue-400 font-semibold uppercase text-[11px]">
              <Activity className="w-3.5 h-3.5" />
              Hosting / ISP
            </span>
            <span className="text-[10px] font-mono text-slate-500">Infrastructure</span>
          </div>

          <div className="text-sm font-bold font-mono text-white truncate">
            {ip?.isp || ip?.org || 'Public Backbone'}
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Provider Type: <span className="text-slate-300">{ip?.isHostingOrCloud ? 'Cloud VPS' : 'Internet Host'}</span>
          </div>
        </div>

        {/* Card 4: Top-Level Domain Risk */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-purple-400 font-semibold uppercase text-[11px]">
              <Globe className="w-3.5 h-3.5" />
              TLD Reputation
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${heuristics.isSuspiciousTld ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {heuristics.isSuspiciousTld ? 'ELEVATED RISK' : 'LOW RISK'}
            </span>
          </div>

          <div className="text-sm font-bold font-mono text-white">
            .{parsedUrl.tld || 'none'}
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Abuse Rating: <span className={heuristics.isSuspiciousTld ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
              {heuristics.tldDetails ? `${heuristics.tldDetails.riskScore}/100 (${heuristics.tldDetails.category})` : 'Standard Baseline (<15%)'}
            </span>
          </div>
        </div>

        {/* Card 5: SSL & Protocol Security */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-teal-400 font-semibold uppercase text-[11px]">
              {ssl.isHttps ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-rose-400" />}
              Protocol Posture
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ssl.isHttps ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {ssl.protocol}
            </span>
          </div>

          <div className={`text-sm font-bold font-mono ${ssl.isHttps ? 'text-emerald-400' : 'text-rose-400'}`}>
            {ssl.isHttps ? 'TLS/SSL Encrypted (Port 443)' : 'Plaintext HTTP (Port 80)'}
          </div>

          <div className="text-[11px] font-mono text-slate-400 truncate">
            {ssl.notes}
          </div>
        </div>

        {/* Card 6: Shannon Entropy & DGA Check */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-yellow-400 font-semibold uppercase text-[11px]">
              <Cpu className="w-3.5 h-3.5" />
              Shannon Entropy
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${heuristics.isHighEntropy ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {heuristics.isHighEntropy ? 'DGA SUSPECT' : 'NORMAL'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold font-mono text-white">
              {heuristics.entropy}
            </span>
            <span className="text-[10px] font-mono text-slate-500">bits/char (DGA threshold: 3.85)</span>
          </div>

          {/* Mini progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full ${heuristics.isHighEntropy ? 'bg-rose-500' : 'bg-cyan-500'}`}
              style={{ width: `${Math.min(100, (heuristics.entropy / 5) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
