export type RiskLevel = 'safe' | 'suspicious' | 'dangerous';
export type FlagSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface ThreatFlag {
  id: string;
  engine: 'heuristics' | 'dns' | 'ip' | 'urlhaus' | 'ssl';
  severity: FlagSeverity;
  title: string;
  description: string;
  evidence?: string;
  recommendation?: string;
}

export interface HeuristicAnalysis {
  isHomograph: boolean;
  homographDetails?: {
    original: string;
    decodedPunycode?: string;
    mixedScripts: string[];
    confusableChars: string[];
  };
  isTyposquatting: boolean;
  typosquattingDetails?: {
    targetBrand: string;
    canonicalDomain: string;
    distance: number;
    technique: string;
  };
  isSuspiciousTld: boolean;
  tldDetails?: {
    tld: string;
    riskScore: number;
    category: string;
  };
  hasExcessiveSubdomains: boolean;
  subdomainCount: number;
  hasDeceptiveKeywords: boolean;
  flaggedKeywords: string[];
  isRawIpHost: boolean;
  entropy: number;
  isHighEntropy: boolean;
  hasEmbeddedCredentials: boolean;
  hasAtSymbolRedirection: boolean;
  hasSuspiciousPort: boolean;
  port?: number;
  urlLength: number;
  hasDoubleExtension: boolean;
  doubleExtension?: string;
}

export interface DnsIntelligence {
  resolved: boolean;
  status: string; // 'NOERROR', 'NXDOMAIN', etc.
  records: {
    A: string[];
    AAAA: string[];
  };
  primaryIp?: string;
  ttl?: number;
  dnssec: boolean;
  provider: string;
}

export interface IpIntelligence {
  ip: string;
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  isp?: string;
  asn?: string;
  org?: string;
  isHostingOrCloud?: boolean;
  isKnownVpnOrProxy?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface UrlhausIntelligence {
  queried: boolean;
  foundInDatabase: boolean;
  threat?: string;
  urlStatus?: 'online' | 'offline' | 'unknown';
  reporter?: string;
  dateAdded?: string;
  tags?: string[];
  payload?: string;
  details?: string;
}

export interface SslIntelligence {
  isHttps: boolean;
  protocol: string;
  status: 'valid_encrypted' | 'unencrypted_insecure' | 'custom_port';
  notes: string;
}

export interface ScanResult {
  url: string;
  parsedUrl: {
    protocol: string;
    host: string;
    hostname: string;
    pathname: string;
    search: string;
    port: string;
    tld: string;
    domain: string;
    subdomain: string;
  };
  timestamp: string;
  score: number; // 0 - 100
  riskLevel: RiskLevel;
  verdictTitle: string;
  verdictDescription: string;
  flags: ThreatFlag[];
  heuristics: HeuristicAnalysis;
  dns: DnsIntelligence;
  ip?: IpIntelligence;
  urlhaus: UrlhausIntelligence;
  ssl: SslIntelligence;
  enginesRan: {
    heuristics: boolean;
    dns: boolean;
    ip: boolean;
    urlhaus: boolean;
  };
  scanDurationMs: number;
}

export interface EngineStatusItem {
  id: 'heuristics' | 'dns' | 'ip' | 'urlhaus';
  name: string;
  status: 'pending' | 'scanning' | 'completed' | 'error';
  findingsCount: number;
  message?: string;
}
