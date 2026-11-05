import { ScanResult, ThreatFlag, RiskLevel, SslIntelligence } from '../types/scanner';
import { runLocalHeuristics } from './heuristics';
import { queryDns } from './dnsEngine';
import { queryIpReputation } from './ipEngine';
import { queryUrlhaus } from './urlhausEngine';

// Parse and normalize raw user input to a valid URL object
export function normalizeUrl(input: string): { urlObj: URL | null; rawUrl: string; error?: string } {
  let cleaned = input.trim();
  if (!cleaned) {
    return { urlObj: null, rawUrl: '', error: 'URL input is empty' };
  }

  // Prepend protocol if omitted
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = 'https://' + cleaned;
  }

  try {
    const urlObj = new URL(cleaned);
    return { urlObj, rawUrl: cleaned };
  } catch (err) {
    return { urlObj: null, rawUrl: input, error: 'Invalid URL syntax' };
  }
}

export async function performFullScan(
  inputUrl: string,
  onProgress?: (engineId: 'heuristics' | 'dns' | 'ip' | 'urlhaus', status: 'scanning' | 'completed') => void
): Promise<ScanResult> {
  const startTime = performance.now();
  const { urlObj, rawUrl, error } = normalizeUrl(inputUrl);

  if (!urlObj || error) {
    throw new Error(error || 'Failed to parse target URL.');
  }

  const hostname = urlObj.hostname.toLowerCase();
  const hostParts = hostname.split('.');
  const tld = hostParts.length > 1 ? hostParts.slice(-1)[0] : '';
  const domain = hostParts.length >= 2 ? hostParts.slice(-2).join('.') : hostname;
  const subdomain = hostParts.length > 2 ? hostParts.slice(0, -2).join('.') : '';

  const allFlags: ThreatFlag[] = [];

  // --- ENGINE 1: Local Heuristic Analysis ---
  onProgress?.('heuristics', 'scanning');
  const { analysis: heuristics, flags: heuristicFlags } = runLocalHeuristics(urlObj, rawUrl);
  allFlags.push(...heuristicFlags);
  onProgress?.('heuristics', 'completed');

  // --- ENGINE 2: DNS-over-HTTPS ---
  onProgress?.('dns', 'scanning');
  const { dns, flags: dnsFlags } = await queryDns(hostname);
  allFlags.push(...dnsFlags);
  onProgress?.('dns', 'completed');

  // --- ENGINE 3: IP Geolocation & Network Reputation ---
  onProgress?.('ip', 'scanning');
  const targetIp = dns.primaryIp || (heuristics.isRawIpHost ? hostname : undefined);
  let ipResult: any = undefined;
  if (targetIp) {
    const { ipInfo, flags: ipFlags } = await queryIpReputation(targetIp);
    ipResult = ipInfo;
    allFlags.push(...ipFlags);
  }
  onProgress?.('ip', 'completed');

  // --- ENGINE 4: URLhaus Threat Intelligence ---
  onProgress?.('urlhaus', 'scanning');
  const { urlhaus, flags: urlhausFlags } = await queryUrlhaus(rawUrl, hostname);
  allFlags.push(...urlhausFlags);
  onProgress?.('urlhaus', 'completed');

  // --- ENGINE 5: SSL & Protocol Posture ---
  const isHttps = urlObj.protocol === 'https:';
  const ssl: SslIntelligence = {
    isHttps,
    protocol: urlObj.protocol.replace(':', '').toUpperCase(),
    status: isHttps ? 'valid_encrypted' : 'unencrypted_insecure',
    notes: isHttps
      ? 'Transport encrypted via HTTPS protocol'
      : 'Insecure unencrypted HTTP connection. Passwords, tokens, or personal data transmitted here can be intercepted via Wi-Fi or Man-in-the-Middle attacks.',
  };

  if (!isHttps) {
    allFlags.push({
      id: 'SSL-HTTP-INSECURE',
      engine: 'ssl',
      severity: heuristics.hasDeceptiveKeywords ? 'high' : 'medium',
      title: 'Unencrypted HTTP Connection (No SSL/TLS)',
      description: 'The link utilizes plain HTTP. All traffic, session cookies, and login inputs are sent in cleartext without cryptographic encryption.',
      evidence: `Protocol: ${urlObj.protocol}`,
      recommendation: 'Do not enter credentials or confidential data on unencrypted HTTP pages.',
    });
  }

  // --- RISK SCORING ALGORITHM ---
  let score = 0;

  for (const flag of allFlags) {
    switch (flag.severity) {
      case 'critical':
        score += 45;
        break;
      case 'high':
        score += 25;
        break;
      case 'medium':
        score += 15;
        break;
      case 'low':
        score += 5;
        break;
      case 'info':
        // Informational, does not increment risk score
        break;
    }
  }

  // Cap score between 0 and 100
  score = Math.min(100, Math.max(0, score));

  // Determine Risk Level & Badges
  let riskLevel: RiskLevel = 'safe';
  let verdictTitle = 'SAFE: No Malicious Signatures Detected';
  let verdictDescription = 'The destination passed all heuristic, DNS reputation, and known threat database verifications. Low probability of malicious threat.';

  if (score >= 60) {
    riskLevel = 'dangerous';
    if (urlhaus.foundInDatabase) {
      verdictTitle = 'DANGEROUS: Confirmed Active Malware Delivery';
      verdictDescription = 'Matched positive threat entries in the abuse.ch URLhaus database. Highly active malware or phishing threat.';
    } else if (heuristics.isHomograph) {
      verdictTitle = 'DANGEROUS: Deceptive Homograph Spoof Attack';
      verdictDescription = 'Target link exploits lookalike unicode characters to masquerade as an authentic service and harvest user credentials.';
    } else if (heuristics.isTyposquatting) {
      verdictTitle = `DANGEROUS: Brand Impersonation (${heuristics.typosquattingDetails?.targetBrand || 'Phishing'})`;
      verdictDescription = 'Domain intentionally mimics a high-value brand to facilitate credential harvesting or financial fraud.';
    } else if (heuristics.isRawIpHost && heuristics.hasDoubleExtension) {
      verdictTitle = 'DANGEROUS: Direct IP Malware Executable Dropper';
      verdictDescription = 'Numeric IP address serving direct binary payload or executable script without verified domain registration.';
    } else {
      verdictTitle = 'DANGEROUS: High-Confidence Malicious Threat Detected';
      verdictDescription = 'Multiple critical indicators observed including obfuscation, high-risk infrastructure, or deceptive parameters.';
    }
  } else if (score >= 20) {
    riskLevel = 'suspicious';
    if (!isHttps && heuristics.hasDeceptiveKeywords) {
      verdictTitle = 'SUSPICIOUS: Insecure Authentication Page';
      verdictDescription = 'Authentication or sensitive keywords detected across an unencrypted HTTP connection.';
    } else if (heuristics.isSuspiciousTld) {
      verdictTitle = `SUSPICIOUS: Elevated Risk Top-Level Domain (.${tld})`;
      verdictDescription = `The domain uses .${tld}, a TLD with statistically elevated abuse rates and disposable registrations.`;
    } else {
      verdictTitle = 'SUSPICIOUS: Potential Risk Indicators Detected';
      verdictDescription = 'Observed anomalous patterns, low TTL, or elevated entropy requiring heightened caution before proceeding.';
    }
  }

  const durationMs = Math.round(performance.now() - startTime);

  return {
    url: rawUrl,
    parsedUrl: {
      protocol: urlObj.protocol.replace(':', ''),
      host: urlObj.host,
      hostname,
      pathname: urlObj.pathname,
      search: urlObj.search,
      port: urlObj.port || (isHttps ? '443' : '80'),
      tld,
      domain,
      subdomain,
    },
    timestamp: new Date().toISOString(),
    score,
    riskLevel,
    verdictTitle,
    verdictDescription,
    flags: allFlags,
    heuristics,
    dns,
    ip: ipResult,
    urlhaus,
    ssl,
    enginesRan: {
      heuristics: true,
      dns: true,
      ip: Boolean(targetIp),
      urlhaus: true,
    },
    scanDurationMs: durationMs,
  };
}
