import React, { useState } from 'react';
import { 
  ChevronDown, ChevronUp, AlertCircle, ShieldAlert, AlertTriangle, 
  Info, ShieldCheck, CheckCircle2, Terminal 
} from 'lucide-react';
import { ThreatFlag, FlagSeverity } from '../types/scanner';

interface ThreatBreakdownProps {
  flags: ThreatFlag[];
}

export const ThreatBreakdown: React.FC<ThreatBreakdownProps> = ({ flags }) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() => {
    // Default expand all critical and high flags
    const initial: Record<string, boolean> = {};
    flags.forEach((f) => {
      if (f.severity === 'critical' || f.severity === 'high') {
        initial[f.id] = true;
      }
    });
    return initial;
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    flags.forEach((f) => { all[f.id] = true; });
    setExpandedIds(all);
  };

  const collapseAll = () => {
    setExpandedIds({});
  };

  const getSeverityBadge = (sev: FlagSeverity) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3" />
            <span>Critical</span>
          </span>
        );
      case 'high':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            <span>High Risk</span>
          </span>
        );
      case 'medium':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            <span>Medium</span>
          </span>
        );
      case 'low':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Info className="w-3 h-3" />
            <span>Low Risk</span>
          </span>
        );
      case 'info':
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700">
            <Info className="w-3 h-3" />
            <span>Telemetry</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl glass-panel p-6 sm:p-8 space-y-6 border border-slate-800 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <span>Why This Link Was Flagged</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
              {flags.length} {flags.length === 1 ? 'Finding' : 'Findings'}
            </span>
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Transparent breakdown of heuristic triggers, cryptographic signals, and reputation anomalies.
          </p>
        </div>

        {flags.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:underline px-2 py-1 rounded"
            >
              Expand All
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={collapseAll}
              className="text-xs font-mono text-slate-400 hover:text-slate-200 hover:underline px-2 py-1 rounded"
            >
              Collapse
            </button>
          </div>
        )}
      </div>

      {/* Flag List */}
      {flags.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 bg-emerald-950/20 rounded-2xl border border-emerald-500/20">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-emerald-300 font-mono">Clean Bill of Health</h4>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              No deceptive homographs, typosquatting lures, known malware payloads, or suspicious redirects were detected across any of the 4 scanning engines.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => {
            const isExpanded = Boolean(expandedIds[flag.id]);
            const isCritical = flag.severity === 'critical';
            const isHigh = flag.severity === 'high';

            let itemBorder = 'border-slate-800 hover:border-slate-700 bg-slate-900/40';
            if (isCritical) itemBorder = 'border-rose-500/40 bg-rose-950/20';
            else if (isHigh) itemBorder = 'border-rose-500/25 bg-slate-900/60';

            return (
              <div
                key={flag.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${itemBorder}`}
              >
                {/* Clickable Summary Row */}
                <button
                  type="button"
                  onClick={() => toggleExpand(flag.id)}
                  className="w-full p-4 flex items-center justify-between text-left gap-4 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    {getSeverityBadge(flag.severity)}
                    <span className="text-sm font-semibold font-mono text-slate-100">
                      {flag.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase text-slate-500 hidden md:inline">
                      Engine: {flag.engine}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-800/60 text-xs animate-fadeIn">
                    <p className="text-slate-300 leading-relaxed font-sans">
                      {flag.description}
                    </p>

                    {flag.evidence && (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-slate-300 flex items-start gap-2">
                        <Terminal className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div className="overflow-x-auto">
                          <span className="text-cyan-400 font-bold text-[10px] block uppercase">Extracted Evidence:</span>
                          <span className="text-slate-200">{flag.evidence}</span>
                        </div>
                      </div>
                    )}

                    {flag.recommendation && (
                      <div className="flex items-start gap-2 text-amber-300/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                        <span>
                          <strong className="font-semibold text-amber-300">Action: </strong>
                          {flag.recommendation}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
