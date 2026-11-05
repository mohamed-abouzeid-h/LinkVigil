import { HeuristicAnalysis, ThreatFlag } from '../types/scanner';
import { TOP_TARGETED_BRANDS } from '../data/brandDictionary';
import { TLD_RISK_MAP } from '../data/tldRiskData';

// Map of common confusable Unicode characters used in homograph attacks
const CONFUSABLE_CHARS_MAP: Record<string, { latin: string; script: string }> = {
  // Cyrillic
  '\u0430': { latin: 'a', script: 'Cyrillic' },
  '\u0435': { latin: 'e', script: 'Cyrillic' },
  '\u043E': { latin: 'o', script: 'Cyrillic' },
  '\u0440': { latin: 'p', script: 'Cyrillic' },
  '\u0441': { latin: 'c', script: 'Cyrillic' },
  '\u0443': { latin: 'y', script: 'Cyrillic' },
  '\u0445': { latin: 'x', script: 'Cyrillic' },
  '\u0456': { latin: 'i', script: 'Cyrillic' },
  '\u0458': { latin: 'j', script: 'Cyrillic' },
  '\u0455': { latin: 's', script: 'Cyrillic' },
  '\u0406': { latin: 'I', script: 'Cyrillic' },
  '\u0410': { latin: 'A', script: 'Cyrillic' },
  '\u0412': { latin: 'B', script: 'Cyrillic' },
  '\u0415': { latin: 'E', script: 'Cyrillic' },
  '\u041A': { latin: 'K', script: 'Cyrillic' },
  '\u041C': { latin: 'M', script: 'Cyrillic' },
  '\u041D': { latin: 'H', script: 'Cyrillic' },
  '\u041E': { latin: 'O', script: 'Cyrillic' },
  '\u0420': { latin: 'P', script: 'Cyrillic' },
  '\u0421': { latin: 'C', script: 'Cyrillic' },
  '\u0422': { latin: 'T', script: 'Cyrillic' },
  '\u0425': { latin: 'X', script: 'Cyrillic' },
  // Greek
  '\u03BF': { latin: 'o', script: 'Greek' },
  '\u03BD': { latin: 'v', script: 'Greek' },
  '\u03C1': { latin: 'p', script: 'Greek' },
};

// Calculate Levenshtein Distance between two strings
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

// Shannon Entropy Calculation (detects random/algorithmic DGA domains)
export function calculateShannonEntropy(str: string): number {
  if (!str) return 0;
  const len = str.length;
  const frequencies: Record<string, number> = {};

  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }

  let entropy = 0;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  return parseFloat(entropy.toFixed(3));
}

// Check for homograph attack & punycode decoding
export function checkHomograph(hostname: string): {
  isHomograph: boolean;
  decodedPunycode?: string;
  mixedScripts: string[];
  confusableChars: string[];
} {
  const confusableChars: string[] = [];
  const mixedScripts = new Set<string>();
  let decoded = hostname;

  // Check punycode prefix
  if (hostname.toLowerCase().includes('xn--')) {
    try {
      // Decode punycode using native URL if supported or manual check
      // For browser/node, URL parser or URLSearchParams or Intl handles punycode
      decoded = new URL(`http://${hostname}`).hostname;
      if (decoded !== hostname) {
        mixedScripts.add('Punycode-Encoded (IDN)');
      }
    } catch {
      mixedScripts.add('Punycode-Encoded (IDN)');
    }
  }

  // Scan for confusable characters in hostname
  for (const char of decoded) {
    if (CONFUSABLE_CHARS_MAP[char]) {
      const info = CONFUSABLE_CHARS_MAP[char];
      confusableChars.push(`'${char}' (${info.script} -> lookalike of Latin '${info.latin}')`);
      mixedScripts.add(info.script);
    }
  }

  // Scan for invisible zero-width or directional override characters
  const hiddenRegex = /[\u200B-\u200D\uFEFF\u202A-\u202E]/;
  if (hiddenRegex.test(hostname)) {
    mixedScripts.add('Invisible / BiDi Override Characters');
    confusableChars.push('Zero-width or RTL override character detected');
  }

  const isHomograph = confusableChars.length > 0 || mixedScripts.size > 0;

  return {
    isHomograph,
    decodedPunycode: decoded !== hostname ? decoded : undefined,
    mixedScripts: Array.from(mixedScripts),
    confusableChars,
  };
}

// Check for brand typosquatting
export function checkTyposquatting(domainName: string, hostname: string): {
  isTyposquatting: boolean;
  details?: {
    targetBrand: string;
    canonicalDomain: string;
    distance: number;
    technique: string;
  };
} {
  // Strip TLD for core name comparison (e.g., 'paypa1.top' -> 'paypa1')
  const domainParts = domainName.toLowerCase().split('.');
  const coreDomain = domainParts.length > 1 ? domainParts[0] : domainName.toLowerCase();

  for (const brand of TOP_TARGETED_BRANDS) {
    const brandCanonical = brand.domain.split('.')[0];
    
    // If it is the exact legitimate domain, it's not typosquatting
    if (domainName.toLowerCase() === brand.domain.toLowerCase()) {
      continue;
    }

    // 1. Check if the domain contains brand keyword combined with phishing words (e.g., paypal-security, login-google)
    for (const kw of brand.keywords) {
      if (coreDomain.includes(kw) && coreDomain !== brandCanonical) {
        return {
          isTyposquatting: true,
          details: {
            targetBrand: brand.name,
            canonicalDomain: brand.domain,
            distance: 0,
            technique: `Domain combofixing: Brand keyword "${kw}" paired with deceptive prefix/suffix on unauthorized domain "${domainName}"`,
          },
        };
      }
    }

    // 2. Check if brand is in subdomain while actual domain is different
    // e.g., paypal.com.security-notice.info
    if (hostname.toLowerCase().includes(brandCanonical) && !hostname.toLowerCase().endsWith(`.${brand.domain}`)) {
      return {
        isTyposquatting: true,
        details: {
          targetBrand: brand.name,
          canonicalDomain: brand.domain,
          distance: 0,
          technique: `Subdomain deception: Prepending target brand "${brand.name}" as subdomain to deceive victims`,
        },
      };
    }

    // 3. Levenshtein edit distance check (1 or 2 edits away, e.g. 'paypa1', 'arnazon', 'gooogle')
    if (Math.abs(coreDomain.length - brandCanonical.length) <= 2) {
      const dist = levenshteinDistance(coreDomain, brandCanonical);
      if (dist === 1 || (dist === 2 && coreDomain.length > 5)) {
        return {
          isTyposquatting: true,
          details: {
            targetBrand: brand.name,
            canonicalDomain: brand.domain,
            distance: dist,
            technique: `Character substitution/edit distance ${dist} from "${brandCanonical}" (e.g. lookalike letters or typo lure)`,
          },
        };
      }
    }
  }

  return { isTyposquatting: false };
}

// Phishing and social engineering keywords
const DECEPTIVE_KEYWORDS = [
  'login', 'signin', 'verify', 'verification', 'authenticate', 'account-update',
  'billing-security', 'wallet-connect', 'claim-airdrop', 'security-alert', 're-verify',
  'banking-portal', 'unusual-activity', 'webscr', 'password-reset', 'confirm-identity',
  'free-gift', 'steam-trade', 'metamask-restore', 'seed-phrase', 'kyc-approval'
];

// Dangerous file extensions for drive-by malware
const DANGEROUS_EXTENSIONS = ['.exe', '.scr', '.vbs', '.bat', '.cmd', '.iso', '.apk', '.msi', '.ps1', '.hta'];

export function runLocalHeuristics(urlObj: URL, rawUrl: string): {
  analysis: HeuristicAnalysis;
  flags: ThreatFlag[];
} {
  const flags: ThreatFlag[] = [];
  const hostname = urlObj.hostname.toLowerCase();
  const pathname = urlObj.pathname.toLowerCase();
  const search = urlObj.search.toLowerCase();
  const fullPath = pathname + search;

  // 1. Raw IPv4 / IPv6 check
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const isRawIpHost = ipv4Regex.test(hostname) || hostname.startsWith('[') || hostname.endsWith(']');
  if (isRawIpHost) {
    flags.push({
      id: 'HEUR-RAW-IP',
      engine: 'heuristics',
      severity: 'high',
      title: 'Raw IP Address in URL Host',
      description: 'The URL uses a numeric IP address directly instead of a registered domain name. Threat actors frequently use raw IPs to bypass domain reputation checks and domain takedowns.',
      evidence: hostname,
      recommendation: 'Do not submit sensitive credentials or download files from raw IP addresses.',
    });
  }

  // 2. Homograph & Punycode analysis
  const homograph = checkHomograph(hostname);
  if (homograph.isHomograph) {
    flags.push({
      id: 'HEUR-HOMOGRAPH',
      engine: 'heuristics',
      severity: 'critical',
      title: 'IDN Homograph / Spoofed Character Attack',
      description: 'Detected deceptive lookalike Unicode characters (e.g., Cyrillic or Greek characters styled to resemble Latin letters) or Punycode encoding designed to visually mimic trusted brands.',
      evidence: homograph.confusableChars.join('; ') || homograph.mixedScripts.join(', '),
      recommendation: 'Extremely high risk of credential theft. Do not interact with this link.',
    });
  }

  // 3. Extract registered domain vs subdomains
  const hostParts = hostname.split('.');
  const tld = hostParts.length > 1 ? hostParts.slice(-1)[0] : '';
  const domain = hostParts.length >= 2 ? hostParts.slice(-2).join('.') : hostname;
  const subdomains = hostParts.length > 2 ? hostParts.slice(0, -2).join('.') : '';
  const subdomainCount = hostParts.length > 2 ? hostParts.length - 2 : 0;

  // 4. Typosquatting & Brand Impersonation
  const typosquat = checkTyposquatting(domain, hostname);
  if (typosquat.isTyposquatting && typosquat.details) {
    flags.push({
      id: 'HEUR-TYPOSQUAT',
      engine: 'heuristics',
      severity: 'critical',
      title: `Brand Impersonation (${typosquat.details.targetBrand})`,
      description: `Domain mimics legitimate entity "${typosquat.details.canonicalDomain}". Technique: ${typosquat.details.technique}`,
      evidence: `Target: ${typosquat.details.canonicalDomain} | Inspected: ${hostname}`,
      recommendation: `Navigate directly to the official website at https://${typosquat.details.canonicalDomain} instead.`,
    });
  }

  // 5. TLD Risk Evaluation
  let isSuspiciousTld = false;
  let tldDetails: HeuristicAnalysis['tldDetails'] = undefined;
  if (TLD_RISK_MAP[tld]) {
    const info = TLD_RISK_MAP[tld];
    isSuspiciousTld = true;
    tldDetails = {
      tld,
      riskScore: info.riskScore,
      category: info.category,
    };
    flags.push({
      id: 'HEUR-TLD-RISK',
      engine: 'heuristics',
      severity: info.riskScore >= 75 ? 'high' : 'medium',
      title: `High-Risk Top-Level Domain (.${tld})`,
      description: `The .${tld} TLD has an elevated abuse rate (${info.category}). ${info.reason}.`,
      evidence: `TLD: .${tld} (Abuse Score: ${info.riskScore}/100)`,
      recommendation: 'Exercise heightened vigilance on newly observed or low-reputation TLDs.',
    });
  }

  // 6. Excessive Subdomains (Deep nesting)
  const hasExcessiveSubdomains = subdomainCount >= 3;
  if (hasExcessiveSubdomains) {
    flags.push({
      id: 'HEUR-EXCESSIVE-SUBDOMAINS',
      engine: 'heuristics',
      severity: 'medium',
      title: 'Deeply Nested Subdomain Obfuscation',
      description: `Contains ${subdomainCount} subdomain layers ("${subdomains}"). Attackers nest brand names in subdomains to trick mobile or truncated browser address bars.`,
      evidence: subdomains,
      recommendation: 'Check the real root domain before entering any login information.',
    });
  }

  // 7. Deceptive / Phishing Keywords
  const flaggedKeywords: string[] = [];
  for (const kw of DECEPTIVE_KEYWORDS) {
    if (fullPath.includes(kw) || subdomains.includes(kw)) {
      flaggedKeywords.push(kw);
    }
  }
  const hasDeceptiveKeywords = flaggedKeywords.length > 0;
  if (hasDeceptiveKeywords && (isSuspiciousTld || typosquat.isTyposquatting || isRawIpHost || subdomainCount > 1)) {
    flags.push({
      id: 'HEUR-PHISH-KEYWORDS',
      engine: 'heuristics',
      severity: 'high',
      title: 'Suspicious Phishing Keywords in URL Path',
      description: `Contains credential harvesting and urgency lures: [${flaggedKeywords.join(', ')}]. Paired with suspicious domain attributes, this strongly signals a phishing lure.`,
      evidence: flaggedKeywords.join(', '),
      recommendation: 'Never provide authentication credentials, passcodes, or private keys.',
    });
  } else if (hasDeceptiveKeywords) {
    flags.push({
      id: 'HEUR-AUTH-KEYWORDS',
      engine: 'heuristics',
      severity: 'info',
      title: 'Authentication / Verification Keywords Present',
      description: `URL path contains security-related terms: [${flaggedKeywords.join(', ')}].`,
      evidence: flaggedKeywords.join(', '),
    });
  }

  // 8. Shannon Entropy (Random algorithmic DGA strings)
  const entropy = calculateShannonEntropy(subdomains ? `${subdomains}.${domain}` : domain);
  const isHighEntropy = entropy > 3.85 && hostname.length > 14;
  if (isHighEntropy) {
    flags.push({
      id: 'HEUR-HIGH-ENTROPY',
      engine: 'heuristics',
      severity: 'medium',
      title: 'High Shannon Entropy / Potential DGA Domain',
      description: `Domain character randomness score is ${entropy} bits/char (threshold 3.85). High entropy often characterizes automated Domain Generation Algorithms (DGA) used by malware command-and-control servers.`,
      evidence: `Entropy: ${entropy}`,
      recommendation: 'Verify whether this is a legitimate cloud-generated hash or disposable C2 endpoint.',
    });
  }

  // 9. Embedded Credentials / '@' Redirection Trick
  const hasEmbeddedCredentials = Boolean(urlObj.username || urlObj.password);
  const hasAtSymbolRedirection = rawUrl.includes('@');
  if (hasEmbeddedCredentials || hasAtSymbolRedirection) {
    flags.push({
      id: 'HEUR-AT-REDIRECTION',
      engine: 'heuristics',
      severity: 'critical',
      title: 'URL Redirection / Embedded Credentials Trick (@)',
      description: 'The URL includes an "@" symbol. Modern browsers treat text before "@" as basic authentication credentials and navigate to the domain after the "@", deceiving users who think they are visiting the first domain.',
      evidence: rawUrl,
      recommendation: 'Do not click: you will be directed to the host following the "@" sign.',
    });
  }

  // 10. Non-standard ports
  const hasSuspiciousPort = Boolean(urlObj.port && !['80', '443', ''].includes(urlObj.port));
  const portNum = urlObj.port ? parseInt(urlObj.port, 10) : undefined;
  if (hasSuspiciousPort && portNum) {
    flags.push({
      id: 'HEUR-SUSPICIOUS-PORT',
      engine: 'heuristics',
      severity: 'medium',
      title: `Non-Standard Web Port (:${portNum})`,
      description: `Service runs on non-standard web port ${portNum} instead of standard HTTPS (443) or HTTP (80). Malicious C2 panels and rogue proxies commonly utilize custom ports.`,
      evidence: `Port: ${portNum}`,
      recommendation: 'Confirm why the host is requesting communication on a non-standard port.',
    });
  }

  // 11. Drive-by malware executable / archive double extension
  let hasDoubleExtension = false;
  let doubleExtensionFound: string | undefined = undefined;
  for (const ext of DANGEROUS_EXTENSIONS) {
    if (pathname.endsWith(ext) || pathname.includes(`${ext}.`)) {
      hasDoubleExtension = true;
      doubleExtensionFound = ext;
      flags.push({
        id: 'HEUR-DANGEROUS-FILE',
        engine: 'heuristics',
        severity: 'critical',
        title: `Direct Executable / Malware Payload (${ext})`,
        description: `URL points directly to an executable binary or script file (${ext}). Visiting this link may initiate an involuntary drive-by file download.`,
        evidence: `File: ${pathname}`,
        recommendation: 'DO NOT download or execute files from this link.',
      });
      break;
    }
  }

  const analysis: HeuristicAnalysis = {
    isHomograph: homograph.isHomograph,
    homographDetails: homograph.isHomograph ? homograph : undefined,
    isTyposquatting: typosquat.isTyposquatting,
    typosquattingDetails: typosquat.details,
    isSuspiciousTld,
    tldDetails,
    hasExcessiveSubdomains,
    subdomainCount,
    hasDeceptiveKeywords,
    flaggedKeywords,
    isRawIpHost,
    entropy,
    isHighEntropy,
    hasEmbeddedCredentials,
    hasAtSymbolRedirection,
    hasSuspiciousPort,
    port: portNum,
    urlLength: rawUrl.length,
    hasDoubleExtension,
    doubleExtension: doubleExtensionFound,
  };

  return { analysis, flags };
}
