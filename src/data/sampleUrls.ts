export interface SampleUrlItem {
  name: string;
  url: string;
  category: 'safe' | 'typosquatting' | 'homograph' | 'phishing' | 'malware' | 'obfuscated';
  badge: string;
  expectedScoreRange: string;
  description: string;
}

export const SAMPLE_URLS: SampleUrlItem[] = [
  {
    name: 'Official Google',
    url: 'https://www.google.com',
    category: 'safe',
    badge: 'Legitimate',
    expectedScoreRange: '0 - 5 (Safe)',
    description: 'Standard benign search engine with clean DNS, high reputation, and strict HTTPS.'
  },
  {
    name: 'Apple Homograph Spoof',
    url: 'https://xn--pple-43d.com/login-verification',
    category: 'homograph',
    badge: 'IDN Homograph Trap',
    expectedScoreRange: '80 - 95 (Dangerous)',
    description: 'Uses Cyrillic "а" (U+0430) disguised as Latin "a" to impersonate Apple ID login.'
  },
  {
    name: 'PayPal Typosquat Phishing',
    url: 'http://paypal-security-account-update.top/webscr/login',
    category: 'typosquatting',
    badge: 'Typosquatting & Unencrypted',
    expectedScoreRange: '85 - 100 (Dangerous)',
    description: 'Impersonates PayPal on a high-risk .top TLD over unencrypted HTTP with credential harvesting keywords.'
  },
  {
    name: 'Raw IP C2 Dropper',
    url: 'http://185.220.101.4:8080/payload.exe',
    category: 'malware',
    badge: 'Raw IP / Executable',
    expectedScoreRange: '90 - 100 (Dangerous)',
    description: 'Direct raw IPv4 address hosting an executable binary on a non-standard port with no domain name.'
  },
  {
    name: 'Microsoft 365 Subdomain Trap',
    url: 'https://login.microsoftonline.com.account-verify-portal.click/auth',
    category: 'phishing',
    badge: 'Subdomain Deception',
    expectedScoreRange: '75 - 90 (Dangerous)',
    description: 'Places "login.microsoftonline.com" as subdomains while the actual registrar domain is "account-verify-portal.click".'
  },
  {
    name: 'Coinbase High-Entropy DGA',
    url: 'https://c0inbase-vx99qa8z71.sbs/wallet-connect?claim=true',
    category: 'obfuscated',
    badge: 'DGA / Crypto Drainer',
    expectedScoreRange: '75 - 95 (Dangerous)',
    description: 'Combines zero-number replacement (c0inbase), algorithmic high-entropy subdomain, and suspicious crypto lures.'
  },
  {
    name: 'Official GitHub',
    url: 'https://github.com/torvalds/linux',
    category: 'safe',
    badge: 'Verified Repo',
    expectedScoreRange: '0 - 10 (Safe)',
    description: 'Legitimate software repository with trusted SSL, reputable ASN, and clean heuristics.'
  }
];
